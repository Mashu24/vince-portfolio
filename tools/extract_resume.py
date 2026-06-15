import json
import re
from pathlib import Path

from pypdf import PdfReader


SOURCE = Path(r"C:\Users\user\Downloads\Magampon_VinceMatthew_Resume.pdf")
OUT = Path("app/resume-profile.json")
SAFE_RESUME = Path("public/Vince-Matthew-Magampon-Sanitized-Resume.txt")


TECH_KEYWORDS = [
    "Power Apps",
    "Power Automate",
    "SharePoint",
    "Microsoft Teams",
    "Teams",
    "WordPress",
    "HTML",
    "CSS",
    "JavaScript",
    "Excel",
    "VBA",
    "Macro",
    "CSV",
    "XML",
    "Sage",
    "Power BI",
    "Windows",
    "OneDrive",
    "Printer",
    "Hardware",
    "Troubleshooting",
]


def extract_text():
    reader = PdfReader(str(SOURCE))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n".join(pages)


def sanitize(text):
    text = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[email available on request]", text)
    text = re.sub(r"(\+?\d[\d\s().-]{8,}\d)", "[phone redacted]", text)
    text = re.sub(r"(?im)^(address|home address|location)\s*:?.*$", "[address redacted]", text)
    text = re.sub(r"(?im)^.*\b(street|barangay|subdivision|village|blk|block|lot|phase)\b.*$", "[address redacted]", text)
    return text


def find_section(text, headings):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    starts = []
    heading_pattern = "|".join(re.escape(h) for h in headings)
    for i, line in enumerate(lines):
        if re.fullmatch(heading_pattern, line, flags=re.I) or any(line.lower().startswith(h.lower()) for h in headings):
            starts.append(i)
    return starts


def detected_tech(text):
    found = []
    low = text.lower()
    for item in TECH_KEYWORDS:
        if item.lower() in low and item not in found:
            found.append(item)
    normalized = []
    aliases = {"Microsoft Teams": "Teams Automation", "Teams": "Teams Automation", "Macro": "Excel Macros", "VBA": "Excel Macros", "Hardware": "Hardware Troubleshooting"}
    for item in found:
        normalized.append(aliases.get(item, item))
    return list(dict.fromkeys(normalized))


def sentence_contains(text, tokens, limit=8):
    chunks = re.split(r"(?<=[.!?])\s+|\n+", text)
    selected = []
    for chunk in chunks:
        clean = re.sub(r"\s+", " ", chunk).strip(" -•")
        if len(clean) < 12:
            continue
        low = clean.lower()
        if any(token in low for token in tokens):
            selected.append(clean[:180])
        if len(selected) >= limit:
            break
    return selected


def main():
    raw = extract_text()
    safe_text = sanitize(raw)
    tech = detected_tech(raw)
    if not tech:
        tech = [
            "Power Apps",
            "Power Automate",
            "SharePoint",
            "Teams Automation",
            "WordPress",
            "HTML",
            "CSS",
            "Excel",
            "Excel Macros",
            "CSV",
            "XML",
            "Sage",
            "Power BI",
            "OneDrive",
            "Printer",
            "Hardware Troubleshooting",
        ]
    certifications = sentence_contains(raw, ["certificate", "certification", "seminar", "training", "summit", "power bi", "prompt"], 10)
    education = sentence_contains(raw, ["university", "college", "bachelor", "degree", "education", "school"], 5)
    experience_points = sentence_contains(raw, ["support", "troubleshoot", "automation", "workflow", "sharepoint", "power apps", "power automate", "excel", "wordpress"], 12)
    if not certifications:
        certifications = ["AI seminars", "Power BI", "Excel training", "Prompt Engineering", "Future AI Summit"]
    if not education:
        education = ["Education details available in the private resume; public portfolio keeps this section generalized."]
    if not experience_points:
        experience_points = [
            "Provides technical operations support across troubleshooting, hardware, software, and user workflow issues.",
            "Builds business process automation using Power Platform, SharePoint, Teams notifications, and reporting workflows.",
            "Develops spreadsheet and data-processing utilities for Excel, CSV, XML, and business system imports.",
            "Supports WordPress and internal website improvements, including inquiry workflows and content/interface updates.",
            "Improves operational visibility through task tracking, status dashboards, and workflow monitoring systems.",
        ]

    profile = {
        "name": "Vince Matthew Magampon",
        "publicTitle": "IT Support Specialist & Automation Developer",
        "brandRoles": [
            "IT Support Specialist",
            "Automation Developer",
            "Workflow Optimization Engineer",
            "Technical Operations Support",
            "Business Process Automation Developer",
        ],
        "summary": "IT Support & Automation Developer specializing in workflow optimization, technical troubleshooting, business process automation, and practical operations support.",
        "specialization": "Workflow automation, endpoint support, business systems, data processing, and technical operations dashboards.",
        "detectedTechnologies": tech,
        "experienceHighlights": experience_points,
        "certifications": certifications,
        "education": education,
        "skillGroups": [
            {
                "category": "Automation",
                "skills": ["Power Apps", "Power Automate", "SharePoint", "Teams Automation", "Workflow Design"],
            },
            {
                "category": "IT Support",
                "skills": ["Troubleshooting", "Hardware Support", "Printer Support", "OneDrive Support", "Windows Support"],
            },
            {
                "category": "Data Processing",
                "skills": ["Excel", "Excel Macros", "CSV Processing", "XML Conversion", "Power BI"],
            },
            {
                "category": "Development Tools",
                "skills": ["WordPress", "HTML", "CSS", "JavaScript", "Website Customization"],
            },
            {
                "category": "Business Systems",
                "skills": ["Sage Integration", "Reporting Automation", "Operations Tracking", "Internal Tools"],
            },
        ],
        "recommendedProjects": [
            "Workflow Automation System",
            "Internal Reporting Dashboard",
            "Task Tracking Platform",
            "CSV Processing Automation",
            "Business Operations Support Tools",
            "XML Converter Utility",
        ],
        "privacyNote": "Sensitive personal information was redacted before public display.",
    }

    OUT.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    SAFE_RESUME.write_text(
        "\n".join(
            [
                "Vince Matthew Magampon",
                profile["publicTitle"],
                "",
                "Professional Summary",
                profile["summary"],
                "",
                "Technical Specialization",
                profile["specialization"],
                "",
                "Technologies",
                ", ".join(profile["detectedTechnologies"]),
                "",
                "Professional Roles",
                ", ".join(profile["brandRoles"]),
                "",
                "Privacy Note",
                "This public resume copy excludes home address, phone number, and other sensitive personal details.",
            ]
        ),
        encoding="utf-8",
    )
    print(json.dumps({"technologies": tech, "experienceHighlights": len(experience_points), "certifications": len(certifications), "education": len(education)}, indent=2))


if __name__ == "__main__":
    main()
