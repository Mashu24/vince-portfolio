import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd


SOURCE = Path(r"C:\Users\user\Desktop\IT TEAM DAILY-WEEKLY TASKS AND PROJECTS REPORT.xlsx")
OUT = Path("app/work-records.json")


def clean_value(value):
    if pd.isna(value):
        return ""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value).strip()


def normalize_header(value, fallback):
    text = clean_value(value)
    if not text:
        return fallback
    text = re.sub(r"\s+", " ", text)
    return text


def find_header_row(raw):
    best_idx = 0
    best_score = -1
    for idx, row in raw.head(15).iterrows():
        values = [clean_value(v).lower() for v in row.tolist()]
        score = sum(
            1
            for value in values
            if any(token in value for token in ["date", "task", "project", "status", "remarks", "category", "department"])
        )
        non_empty = sum(1 for value in values if value)
        score += min(non_empty, 8) * 0.1
        if score > best_score:
            best_score = score
            best_idx = idx
    return int(best_idx)


def read_sheet(sheet_name):
    raw = pd.read_excel(SOURCE, sheet_name=sheet_name, header=None)
    header_idx = find_header_row(raw)
    headers = [normalize_header(value, f"Column {i + 1}") for i, value in enumerate(raw.iloc[header_idx].tolist())]
    data = raw.iloc[header_idx + 1 :].copy()
    data.columns = headers
    data = data.dropna(how="all")
    records = []
    for _, row in data.iterrows():
        record = {key: clean_value(row[key]) for key in data.columns}
        if any(record.values()):
            records.append(record)
    return records


def pick(record, candidates):
    lowered = {key.lower(): key for key in record}
    for candidate in candidates:
        for low, original in lowered.items():
            if candidate in low:
                return record.get(original, "")
    return ""


def classify_task(text):
    text_low = text.lower()
    if any(re.search(pattern, text_low) for pattern in [r"\bprinter\b", r"\bcable\b", r"\bram\b", r"\bssd\b", r"\bpc\b", r"\blaptop\b", r"\bmonitor\b", r"\bkeyboard\b", r"\bmouse\b", r"\bhardware\b"]):
        return "HARDWARE"
    if any(word in text_low for word in ["power automate", "workflow", "automation", "power apps", "sharepoint", "teams", "flow"]):
        return "AUTOMATION"
    if any(word in text_low for word in ["program", "xml", "macro", "converter", "website", "wordpress", "code"]):
        return "PROGRAM"
    if any(word in text_low for word in ["excel", "onedrive", "pdf", "software", "office", "install", "driver", "email", "outlook"]):
        return "SOFTWARE"
    return "TROUBLESHOOT"


def complexity(text):
    text_low = text.lower()
    score = 1
    if any(word in text_low for word in ["automation", "workflow", "integration", "converter", "macro", "sharepoint", "sage"]):
        score += 2
    if any(word in text_low for word in ["troubleshoot", "repair", "issue", "error", "not responding", "fix"]):
        score += 1
    if len(text) > 90:
        score += 1
    if score >= 4:
        return "Advanced"
    if score >= 3:
        return "Intermediate"
    return "Basic"


def compact_task(record, index):
    reason = pick(record, ["reason"])
    remarks = pick(record, ["remarks"])
    task_type = pick(record, ["type"])
    employee = pick(record, ["employee"])
    text = " ".join(v for v in [reason, remarks, task_type, employee] if v)
    title = remarks or reason or text[:80]
    date = pick(record, ["date", "day"])
    status = pick(record, ["status", "progress"]) or "Completed"
    category = task_type.upper() if task_type.upper() in {"TROUBLESHOOT", "HARDWARE", "SOFTWARE", "PROGRAM", "AUTOMATION"} else classify_task(text)
    raw_complexity = pick(record, ["complexity"])
    normalized_complexity = raw_complexity if raw_complexity in {"Basic", "Intermediate", "Advanced"} else complexity(text)
    return {
        "id": f"TASK-{index + 1:03d}",
        "date": date,
        "title": title[:120],
        "detail": text[:260],
        "category": category,
        "complexity": normalized_complexity,
        "status": status,
        "assignee": employee,
    }


def compact_project(record, index):
    text = " ".join(str(v) for v in record.values() if v)
    name = pick(record, ["project", "system", "title", "task"]) or text[:80]
    department = pick(record, ["department", "dept", "team", "section"]) or "Operations"
    status = pick(record, ["status", "progress"]) or "ONLINE"
    timeline = pick(record, ["date", "timeline", "target", "deadline"]) or "Deployed"
    tech_text = text.lower()
    techs = []
    for label, terms in {
        "Power Apps": ["power apps"],
        "Power Automate": ["power automate", "workflow", "flow"],
        "SharePoint": ["sharepoint"],
        "Teams": ["teams"],
        "Excel Macro": ["macro", "excel"],
        "CSV": ["csv"],
        "Sage": ["sage"],
        "WordPress": ["wordpress", "website"],
        "XML": ["xml"],
    }.items():
        if any(term in tech_text for term in terms):
            techs.append(label)
    if not techs:
        techs = ["Workflow", "Operations", "Support"]
    return {
        "id": f"SYS-{index + 1:03d}",
        "name": name[:90],
        "department": department[:60],
        "status": "ONLINE" if "offline" not in status.lower() else "OFFLINE",
        "rawStatus": status[:80],
        "timeline": timeline[:80],
        "detail": text[:300],
        "tech": techs,
        "progress": 100 if "done" in status.lower() or "complete" in status.lower() or status == "ONLINE" else 78,
    }


def main():
    sheets = pd.ExcelFile(SOURCE).sheet_names
    task_sheet = next((sheet for sheet in sheets if sheet.strip().lower() == "vince task"), None)
    project_sheet = next((sheet for sheet in sheets if sheet.strip().lower() == "vince projects"), None)
    if not task_sheet or not project_sheet:
        raise SystemExit(f"Required sheets not found. Available sheets: {sheets}")

    task_records = [compact_task(record, index) for index, record in enumerate(read_sheet(task_sheet))]
    project_records = [compact_project(record, index) for index, record in enumerate(read_sheet(project_sheet))]

    task_records = [task for task in task_records if task["title"]]
    project_records = [project for project in project_records if project["name"]]

    category_counts = Counter(task["category"] for task in task_records)
    complexity_counts = Counter(task["complexity"] for task in task_records)
    date_counts = defaultdict(int)
    for task in task_records:
        date_counts[task["date"] or "Unscheduled"] += 1

    payload = {
        "source": SOURCE.name,
        "sheetNames": {"tasks": task_sheet, "projects": project_sheet},
        "tasks": task_records,
        "projects": project_records,
        "analytics": {
            "categoryCounts": dict(category_counts),
            "complexityCounts": dict(complexity_counts),
            "dateCounts": dict(sorted(date_counts.items())[-24:]),
            "totalTasks": len(task_records),
            "totalProjects": len(project_records),
        },
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"sheets": sheets, "tasks": len(task_records), "projects": len(project_records)}, indent=2))


if __name__ == "__main__":
    main()
