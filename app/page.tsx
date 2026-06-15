"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import workRecords from "./work-records.json";
import resumeProfile from "./resume-profile.json";
import FixTheSystemGame from "@/components/VirusArcade";
import {
  Activity,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Cpu,
  DatabaseZap,
  Download,
  Gamepad2,
  Github,
  Mail,
  Moon,
  Network,
  Play,
  Power,
  RadioTower,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  TerminalSquare,
  Wrench,
  Zap
} from "lucide-react";

const bootLines = [
  "Initializing VinceOS...",
  "Loading automation systems...",
  "Mounting support knowledge base...",
  "Deploying workflows...",
  "Scanning endpoint telemetry...",
  "Access Granted."
];

const sections = [
  "about",
  "experience",
  "tasks",
  "skills",
  "tech",
  "map",
  "timeline",
  "terminal",
  "certifications",
  "game",
  "contact"
];

const experiences = [
  {
    name: "HR Automation Workflow",
    type: "Power Platform",
    uptime: "99.9%",
    detail: "Automated approvals, notifications, and employee request routing."
  },
  {
    name: "Sage CSV Integration",
    type: "Data Pipeline",
    uptime: "98.7%",
    detail: "Prepared and validated CSV imports for smoother accounting workflows."
  },
  {
    name: "WordPress Inquiry System",
    type: "Web Support",
    uptime: "99.1%",
    detail: "Improved inquiry capture, support handoff, and admin visibility."
  }
];

const skills = [
  { name: "Power Apps", category: "Automation", level: 88, detail: "Builds custom business apps for approvals, tracking, and internal workflows." },
  { name: "Power Automate", category: "Automation", level: 90, detail: "Creates automated flows for routing, alerts, synchronization, and reminders." },
  { name: "SharePoint", category: "Automation", level: 84, detail: "Designs lists and team data hubs for collaborative operations." },
  { name: "Teams Automation", category: "Automation", level: 80, detail: "Connects chat-based updates with workflow events and support operations." },
  { name: "WordPress", category: "Development", level: 78, detail: "Customizes site content, forms, styling, plugins, and support workflows." },
  { name: "HTML/CSS", category: "Development", level: 82, detail: "Builds responsive interfaces with polished layouts and reusable styling." },
  { name: "Excel Macros", category: "Data Processing", level: 76, detail: "Automates repetitive spreadsheet tasks and operational reporting." },
  { name: "CSV Integration", category: "Data Processing", level: 86, detail: "Cleans, maps, validates, and imports structured data between systems." },
  { name: "Pivot Tables", category: "Data Processing", level: 82, detail: "Turns operational data into readable summaries and decision dashboards." },
  { name: "Hardware Troubleshooting", category: "IT Support", level: 88, detail: "Diagnoses device, peripheral, and endpoint issues with practical fixes." },
  { name: "RAM/SSD Upgrades", category: "IT Support", level: 84, detail: "Improves workstation performance through memory and storage upgrades." },
  { name: "Sage Integration", category: "Troubleshooting", level: 74, detail: "Supports accounting workflows through import preparation and issue isolation." }
];

const projects = [
  {
    title: "Workflow Automation",
    category: "Power Platform Solutions",
    status: "ONLINE",
    detail: "Approval flows, notification routing, and task orchestration for business teams.",
    signal: [42, 64, 52, 76, 70, 92, 84]
  },
  {
    title: "IT Support Systems",
    category: "IT Support Systems",
    status: "ONLINE",
    detail: "Ticket triage dashboards and repeatable troubleshooting playbooks.",
    signal: [32, 44, 63, 58, 79, 74, 88]
  },
  {
    title: "WordPress Customization",
    category: "WordPress Customization",
    status: "ONLINE",
    detail: "Inquiry systems, form improvements, admin workflows, and UI refinements.",
    signal: [55, 49, 70, 68, 82, 76, 90]
  },
  {
    title: "Excel Automation",
    category: "Excel Automation",
    status: "ONLINE",
    detail: "Macro-assisted reports, pivot dashboards, and CSV preparation utilities.",
    signal: [38, 67, 61, 77, 86, 80, 95]
  }
];

const certifications = resumeProfile.certifications;

type GameStage = "intro" | "cable" | "virus" | "workflow" | "ticket" | "done";

type WorkTask = {
  id: string;
  date: string;
  title: string;
  detail: string;
  category: string;
  complexity: string;
  status: string;
  assignee?: string;
};

type WorkProject = {
  id: string;
  name: string;
  department: string;
  status: string;
  rawStatus: string;
  timeline: string;
  detail: string;
  tech: string[];
  progress: number;
};

const records = workRecords as {
  tasks: WorkTask[];
  projects: WorkProject[];
  analytics: {
    categoryCounts: Record<string, number>;
    complexityCounts: Record<string, number>;
    dateCounts: Record<string, number>;
    totalTasks: number;
    totalProjects: number;
  };
};

const resume = resumeProfile as {
  name: string;
  publicTitle: string;
  brandRoles: string[];
  summary: string;
  specialization: string;
  detectedTechnologies: string[];
  experienceHighlights: string[];
  certifications: string[];
  education: string[];
  skillGroups: { category: string; skills: string[] }[];
  recommendedProjects: string[];
  privacyNote: string;
};

const chartColors = ["#27f4ff", "#69ff8f", "#f5d76e", "#ff5ef1", "#7aa7ff"];
const operationsTasks = records.tasks;
const operationsProjects = records.projects;
const categoryData = Object.entries(records.analytics.categoryCounts).map(([name, value]) => ({ name, value }));
const complexityData = Object.entries(records.analytics.complexityCounts).map(([name, value]) => ({ name, value }));
const activityData = Object.entries(records.analytics.dateCounts).map(([date, value]) => ({
  date: formatDate(date),
  value
}));
const recentOperations = operationsTasks.slice(-8).reverse();
const resumeDownloadHref = "/Magampon_VinceMatthew_Resume.pdf";

const operationsShowcase = [
  {
    name: "Power Automate Automation",
    department: "Workflow Systems",
    progress: 96,
    detail: "Built an automation that uses one required input, such as a job number, to find matching row details from an Excel source and place the needed information into another sheet."
  },
  {
    name: "Excel Macro Implementation",
    department: "Excel Automation",
    progress: 94,
    detail: "Implemented Excel macro and formula workflows that populate needed business details automatically and prepare records for printing or processing."
  },
  {
    name: "WordPress Website Support",
    department: "Web Operations",
    progress: 90,
    detail: "Supported WordPress dashboard configuration, inquiry flow improvements, layout updates, and operational website maintenance."
  }
];

const publicTaskCards = [
  { title: "Printer setup and troubleshooting", detail: "Configured printer sharing, installed drivers, and resolved common printing issues for users.", category: "HARDWARE", complexity: "Basic" },
  { title: "OneDrive and storage support", detail: "Assisted with OneDrive syncing, storage cleanup, file availability, and workspace continuity issues.", category: "SOFTWARE", complexity: "Basic" },
  { title: "Server and LAN cable setup", detail: "Coordinated and supported network cable setup for workstations and office connectivity.", category: "HARDWARE", complexity: "Basic" },
  { title: "Excel file troubleshooting", detail: "Helped resolve Excel file issues, missing data concerns, version history recovery, and file responsiveness problems.", category: "PROGRAM", complexity: "Intermediate" },
  { title: "PDF and document conversion", detail: "Converted and edited document formats to support daily office processing requirements.", category: "PROGRAM", complexity: "Basic" },
  { title: "Device connection fixes", detail: "Resolved user device connection issues involving peripherals, workstations, and office equipment.", category: "HARDWARE", complexity: "Basic" },
  { title: "Workflow and automation updates", detail: "Updated workflow logic, task routing, notifications, and operational automation behavior.", category: "AUTOMATION", complexity: "Advanced" },
  { title: "WordPress dashboard support", detail: "Handled website dashboard settings, content support, plugin-related configuration, and page behavior updates.", category: "PROGRAM", complexity: "Intermediate" },
  { title: "CSV and business data processing", detail: "Prepared structured files and validated data needed for business system processing.", category: "PROGRAM", complexity: "Intermediate" },
  { title: "XML converter update support", detail: "Added or adjusted converter options and upload-related workflow behavior for XML processing.", category: "PROGRAM", complexity: "Advanced" },
  { title: "Task tracker support", detail: "Supported task tracking systems connected to SharePoint lists for monitoring task status and duration.", category: "AUTOMATION", complexity: "Advanced" },
  { title: "General technical troubleshooting", detail: "Diagnosed everyday user support issues and applied practical fixes to keep operations moving.", category: "TROUBLESHOOT", complexity: "Basic" }
];

const timelineProjects = [
  {
    id: "power-automate-excel",
    name: "Power Automate Excel Detail Transfer",
    timeline: "Workflow automation",
    department: "Automation",
    detail: "Power Automate flow that uses one primary input, such as a job number, to find matching row details from an Excel sheet and place the required details into another sheet."
  },
  {
    id: "work-status-tracker",
    name: "Work Status Tracker",
    timeline: "Task tracking system",
    department: "Power Apps / SharePoint",
    detail: "Task tracker for viewing task start time, end time, status, and task details through SharePoint-connected records."
  },
  {
    id: "status-update-processors",
    name: "Status Update App for Processors",
    timeline: "Processor task monitoring",
    department: "Power Apps / SharePoint",
    detail: "Tracking app for processor task start time and end time, duration completed, task details, and SharePoint-connected monitoring of in-progress, pending, and completed tasks."
  },
  {
    id: "po-form-print",
    name: "Logistics Purchase Order Form for Print",
    timeline: "Excel macro implementation",
    department: "Excel Automation",
    detail: "Excel macro and formula tool that gets required details when a job number is pasted, then automatically fills the needed information ready for purchase order printing."
  },
  {
    id: "xml-converter-update",
    name: "XML Converter App Update",
    timeline: "Converter update",
    department: "Data Processing",
    detail: "Updated an existing XML Converter app by adding an option to upload the converted XML file to eKonek."
  },
  {
    id: "website-support",
    name: "Company Website System Support",
    timeline: "WordPress support",
    department: "WordPress",
    detail: "Supported WordPress website dashboard settings, inquiry flow improvements, layout adjustments, content updates, and operational website maintenance."
  }
];

const generalTaskDetails: Record<string, { title: string; detail: string }> = {
  TROUBLESHOOT: {
    title: "Technical troubleshooting operation",
    detail: "Diagnosed a user or system issue, isolated the likely cause, and applied a practical support resolution."
  },
  HARDWARE: {
    title: "Hardware support operation",
    detail: "Handled workstation, peripheral, cabling, printer, or device setup support for daily business operations."
  },
  SOFTWARE: {
    title: "Software support operation",
    detail: "Resolved an application, file, driver, Office, OneDrive, or operating-system workflow issue."
  },
  PROGRAM: {
    title: "Program and data workflow task",
    detail: "Improved a spreadsheet, document, website, converter, script, or business-processing workflow."
  },
  AUTOMATION: {
    title: "Automation workflow update",
    detail: "Built or improved an automated workflow, notification path, data process, or internal operations system."
  }
};

function formatDate(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function publicTaskSummary(task: WorkTask) {
  return generalTaskDetails[task.category] ?? generalTaskDetails.TROUBLESHOOT;
}

function publicProjectSummary(project: WorkProject) {
  const tech = project.tech.join(", ");
  return `${project.name} supports ${project.department || "business operations"} through ${tech || "workflow tooling"}. The system improves tracking, validation, reporting, notifications, or process visibility while keeping company-specific details private.`;
}

export default function Home() {
  const [booting, setBooting] = useState(false);
  const [bootIndex, setBootIndex] = useState(0);
  const [particlesReady, setParticlesReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [light, setLight] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(skills[0]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "VinceOS terminal ready. Type 'help' to list commands."
  ]);
  const [mouse, setMouse] = useState({ x: -200, y: -200 });
  const [resumeOpen, setResumeOpen] = useState(false);

  useEffect(() => {
    const hasBooted = window.sessionStorage.getItem("vinceos-boot-complete") === "true";
    setBooting(!hasBooted);
    if (hasBooted) {
      setBootIndex(bootLines.length - 1);
    }
  }, []);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  useEffect(() => {
    if (!booting) return;
    const timer = window.setInterval(() => {
      setBootIndex((current) => {
        if (current >= bootLines.length - 1) {
          window.clearInterval(timer);
          window.setTimeout(() => {
            window.sessionStorage.setItem("vinceos-boot-complete", "true");
            setBooting(false);
          }, 700);
          return current;
        }
        return current + 1;
      });
    }, 620);
    return () => window.clearInterval(timer);
  }, [booting]);

  useEffect(() => {
    const move = (event: MouseEvent) => setMouse({ x: event.clientX, y: event.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const runCommand = useCallback(
    (raw: string) => {
      const command = raw.trim().toLowerCase();
      const responses: Record<string, string> = {
        help: "Commands: about, tasks, analytics, operations, systems, automations, projects, deployments, skills, experience, contact, resume, game, clear, matrix",
        about: "Vince builds automation systems, solves technical issues, and improves workflows.",
        projects: `Systems shown: ${timelineProjects.slice(0, 4).map((project) => project.name).join(", ")}.`,
        skills: "Core stack: Power Apps, Power Automate, SharePoint, WordPress, Excel, CSV, hardware support.",
        experience: `Operational record: ${records.analytics.totalTasks} logged tasks and ${records.analytics.totalProjects} real project systems.`,
        tasks: `Task types shown: ${publicTaskCards.slice(0, 4).map((task) => task.title).join(" | ")}.`,
        analytics: `Task mix: ${categoryData.map((item) => `${item.name} ${item.value}`).join(", ")}.`,
        operations: "Operations center tracking troubleshooting, hardware, software, program, and automation work records.",
        systems: `Systems monitored: ${timelineProjects.map((project) => project.name).slice(0, 4).join(" | ")}.`,
        automations: "Automation paths include Power Apps -> SharePoint -> Teams and Excel Macro -> CSV -> Sage/System imports.",
        deployments: `${operationsProjects.filter((project) => project.status === "ONLINE").length} enterprise systems marked ONLINE from project records.`,
        contact: "Email: magamponvince@gmail.com | Phone: 09625265298",
        resume: "Opening sanitized resume preview. Public copy excludes address, phone, and sensitive identifiers.",
        game: "Launching Fix The System. Scroll to the mission simulator.",
        matrix: "Easter egg unlocked: workflow velocity boosted by 42%.",
        clear: ""
      };
      if (command === "clear") {
        setTerminalLines([]);
        return;
      }
      setTerminalLines((lines) => [
        ...lines,
        `> ${raw}`,
        responses[command] ?? `Unknown command '${raw}'. Type 'help'.`
      ]);
    },
    []
  );

  const particlesOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        number: { value: 55, density: { enable: true } },
        color: { value: ["#27f4ff", "#69ff8f", "#ffffff"] },
        links: { enable: true, color: "#27f4ff", opacity: 0.18, distance: 145 },
        move: { enable: true, speed: 0.7, direction: "none" as const, outModes: { default: "bounce" as const } },
        opacity: { value: 0.35 },
        size: { value: { min: 1, max: 3 } }
      },
      detectRetina: true
    }),
    []
  );

  return (
    <main className={light ? "theme-light min-h-screen" : "min-h-screen"}>
      <AnimatePresence>{booting && <BootSequence index={bootIndex} sound={sound} setSound={setSound} />}</AnimatePresence>

      <div
        className="pointer-events-none fixed z-50 hidden h-40 w-40 rounded-full blur-3xl md:block"
        style={{
          left: mouse.x - 80,
          top: mouse.y - 80,
          background: "radial-gradient(circle, rgba(39,244,255,.22), rgba(105,255,143,.08), transparent 70%)"
        }}
      />

      <div className="fixed inset-0 -z-10 bg-void transition-colors duration-500 theme-light:bg-slate-100" />
      <div className="fixed inset-0 -z-10 bg-grid bg-[length:48px_48px] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      {particlesReady && (
        <Particles id="particles" className="fixed inset-0 -z-10" options={particlesOptions} />
      )}

      <Header light={light} setLight={setLight} sound={sound} setSound={setSound} />
      <Hero onPreviewResume={() => setResumeOpen(true)} />
      <ResumePreview open={resumeOpen} onClose={() => setResumeOpen(false)} />
      <About />
      <ExperienceDashboard />
      <DailyTaskDashboard />
      <SkillsTree selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} />
      <TechnologyStack />
      <ProjectMap />
      <ExperienceTimeline />
      <TerminalPanel
        input={terminalInput}
        setInput={setTerminalInput}
        lines={terminalLines}
        runCommand={runCommand}
      />
      <Certifications />
      <FixTheSystemGame />
      <Contact />
    </main>
  );
}

function BootSequence({
  index,
  sound,
  setSound
}: {
  index: number;
  sound: boolean;
  setSound: (value: boolean) => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#02040a]"
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.7 }}
    >
      <div className="absolute inset-0 bg-grid bg-[length:42px_42px] opacity-30" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-[min(720px,90vw)] border border-cyanCore/40 bg-black/70 p-5 shadow-glow backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyanCore">
            <TerminalSquare size={18} /> VinceOS Boot
          </div>
          <button
            onClick={() => setSound(!sound)}
            className="rounded border border-greenCore/40 px-3 py-1 text-xs text-greenCore transition hover:bg-greenCore/10"
          >
            Sound {sound ? "ON" : "OFF"}
          </button>
        </div>
        <div className="space-y-3 font-mono text-sm text-ink">
          {bootLines.slice(0, index + 1).map((line) => (
            <motion.div key={line} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <span className="text-greenCore">SYS</span> / {line}
            </motion.div>
          ))}
          <span className="inline-block h-4 w-2 animate-pulse bg-cyanCore" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Header({
  light,
  setLight,
  sound,
  setSound
}: {
  light: boolean;
  setLight: (value: boolean) => void;
  sound: boolean;
  setSound: (value: boolean) => void;
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-void/70 backdrop-blur-xl theme-light:bg-white/70">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-ink theme-light:text-slate-900">
        <a href="#home" className="flex items-center gap-2 font-semibold">
          <Cpu className="text-cyanCore" /> VinceOS
        </a>
        <div className="hidden items-center gap-4 text-xs uppercase tracking-widest text-white/70 lg:flex theme-light:text-slate-600">
          {sections.map((section) => (
            <a key={section} href={`#${section}`} className="transition hover:text-cyanCore">
              {section}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <IconToggle label="Toggle sound" active={sound} onClick={() => setSound(!sound)} icon={<RadioTower size={17} />} />
          <IconToggle label="Toggle theme" active={light} onClick={() => setLight(!light)} icon={light ? <Sun size={17} /> : <Moon size={17} />} />
        </div>
      </nav>
    </header>
  );
}

function IconToggle({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center border transition ${
        active ? "border-greenCore text-greenCore shadow-greenGlow" : "border-white/15 text-white/75 hover:border-cyanCore hover:text-cyanCore theme-light:text-slate-700"
      }`}
    >
      {icon}
    </button>
  );
}

function Section({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-4 py-20 text-ink theme-light:text-slate-950 ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-9">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-greenCore">
        <Sparkles size={16} /> {eyebrow}
      </div>
      <h2 className="text-3xl font-bold md:text-5xl">{title}</h2>
    </div>
  );
}

function Hero({ onPreviewResume }: { onPreviewResume: () => void }) {
  const icons = [Bot, Wrench, Network, DatabaseZap, ShieldCheck, BrainCircuit];
  return (
    <section id="home" className="relative mx-auto grid min-h-screen max-w-7xl place-items-center px-4 pb-20 pt-28 text-ink theme-light:text-slate-950">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="mb-4 inline-flex items-center gap-2 border border-greenCore/40 bg-greenCore/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-greenCore">
            <Activity size={16} /> Command Center Online
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.96] md:text-7xl lg:text-8xl">
            Vince Matthew <span className="text-cyanCore drop-shadow-[0_0_24px_rgba(39,244,255,.65)]">Magampon</span>
          </h1>
          <p className="mt-5 text-xl font-semibold text-greenCore md:text-2xl">{resume.publicTitle}</p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/70 theme-light:text-slate-650">
            {resume.summary}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-cyanCore/80">{resume.specialization}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CTA href="#timeline" icon={<BriefcaseBusiness size={18} />} label="View Systems" />
            <CTA href={resumeDownloadHref} icon={<Download size={18} />} label="Download Resume" />
            <button onClick={onPreviewResume} className="group inline-flex items-center gap-2 border border-greenCore/40 bg-greenCore/10 px-4 py-3 text-sm font-semibold text-greenCore shadow-greenGlow transition hover:-translate-y-1 hover:bg-greenCore hover:text-black">
              <TerminalSquare size={18} /> Preview Resume
            </button>
            <CTA href="#game" icon={<Gamepad2 size={18} />} label="Play Mini Game" />
            <CTA href="#contact" icon={<Mail size={18} />} label="Contact Me" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="relative aspect-square min-h-[320px]"
        >
          <div className="absolute inset-8 rounded-full border border-cyanCore/30 shadow-glow" />
          <div className="absolute inset-16 rounded-full border border-greenCore/30 shadow-greenGlow" />
          <div className="absolute inset-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 border border-white/15 bg-panel p-6 backdrop-blur-xl">
            <Power className="h-full w-full text-greenCore" />
          </div>
          {icons.map((Icon, index) => {
            const angle = (index / icons.length) * Math.PI * 2;
            return (
              <motion.div
                key={index}
                className="absolute grid h-16 w-16 place-items-center border border-cyanCore/30 bg-black/40 text-cyanCore shadow-glow backdrop-blur"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * 38}% - 32px)`,
                  top: `calc(50% + ${Math.sin(angle) * 38}% - 32px)`
                }}
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3 + index * 0.2, repeat: Infinity }}
              >
                <Icon />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function ResumePreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.96 }} className="max-h-[86vh] w-[min(760px,96vw)] overflow-y-auto border border-cyanCore/40 bg-[#07101f]/95 p-6 text-ink shadow-glow">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-greenCore">Sanitized Resume Preview</div>
                <h2 className="mt-2 text-3xl font-black">{resume.name}</h2>
                <p className="mt-1 text-cyanCore">{resume.publicTitle}</p>
              </div>
              <button onClick={onClose} className="border border-white/15 px-3 py-2 text-sm text-white/70 hover:border-cyanCore hover:text-cyanCore">Close</button>
            </div>
            <p className="leading-7 text-white/75">{resume.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {resume.brandRoles.map((role) => (
                <div key={role} className="border border-greenCore/25 bg-greenCore/10 p-3 text-sm text-greenCore">{role}</div>
              ))}
            </div>
            <h3 className="mt-6 text-xl font-bold">Technical Expertise</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {resume.detectedTechnologies.map((tech) => (
                <span key={tech} className="border border-cyanCore/30 px-3 py-2 text-sm text-cyanCore">{tech}</span>
              ))}
            </div>
            <h3 className="mt-6 text-xl font-bold">Experience Summary</h3>
            <div className="mt-3 space-y-3">
              {resume.experienceHighlights.map((item) => (
                <div key={item} className="border border-white/10 bg-black/25 p-3 text-sm leading-6 text-white/70">{item}</div>
              ))}
            </div>
            <div className="mt-6 border border-yellow-300/30 bg-yellow-300/10 p-3 text-sm text-yellow-100">
              {resume.privacyNote} This preview stays sanitized; the download opens the PDF file you placed in the public folder.
            </div>
            <a href={resumeDownloadHref} className="mt-5 inline-flex items-center gap-2 border border-greenCore px-4 py-3 font-semibold text-greenCore hover:bg-greenCore hover:text-black">
              <Download size={17} /> Download Resume PDF
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CTA({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 border border-cyanCore/40 bg-cyanCore/10 px-4 py-3 text-sm font-semibold text-cyanCore shadow-glow transition hover:-translate-y-1 hover:bg-cyanCore hover:text-black"
    >
      {icon}
      {label}
      <ChevronRight size={16} className="transition group-hover:translate-x-1" />
    </a>
  );
}

function About() {
  const timeline = resume.experienceHighlights;
  return (
    <Section id="about">
      <SectionTitle eyebrow="Profile Sync" title="About Me" />
      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <GlassPanel>
          <p className="text-lg leading-8 text-white/75 theme-light:text-slate-700">
            {resume.name} works at the intersection of IT support, workflow optimization, and automation development. The public portfolio uses sanitized resume details and real work-record analytics to show practical technical operations experience without exposing private information.
          </p>
        </GlassPanel>
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="flex gap-4 border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center border border-greenCore/40 text-greenCore">{index + 1}</div>
              <p className="text-white/75 theme-light:text-slate-700">{item}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ExperienceDashboard() {
  return (
    <Section id="experience">
      <SectionTitle eyebrow="Live Systems" title="IT Operations Control Center" />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Logged Work Records" value={records.analytics.totalTasks.toLocaleString()} detail="Vince TASK sheet operations" />
        <MetricCard label="Project Systems" value={records.analytics.totalProjects.toString()} detail="Vince Projects sheet deployments" />
        <MetricCard label="Workflow Stability" value="ONLINE" detail="Real support and automation history" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {operationsShowcase.map((project) => (
          <motion.div key={project.name} whileHover={{ y: -6 }} className="group border border-white/10 bg-panel p-5 shadow-glow backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-greenCore">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-greenCore shadow-greenGlow" /> [ONLINE]
              </span>
              <span className="text-xs text-white/50 theme-light:text-slate-600">{project.department}</span>
            </div>
            <h3 className="text-xl font-bold">{project.name}</h3>
            <p className="mt-3 min-h-20 text-sm leading-6 text-white/65 theme-light:text-slate-700">{project.detail}</p>
            <div className="mt-5 h-2 overflow-hidden bg-white/10">
              <motion.div className="h-full bg-greenCore" initial={{ width: 0 }} whileInView={{ width: `${project.progress}%` }} viewport={{ once: true }} />
            </div>
            <div className="mt-2 text-xs text-cyanCore">Deployment {project.progress}%</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-cyanCore/20 bg-black/30 p-5 shadow-glow backdrop-blur-xl">
      <div className="text-xs uppercase tracking-[0.28em] text-cyanCore">{label}</div>
      <div className="mt-3 text-4xl font-black text-greenCore">{value}</div>
      <div className="mt-2 text-sm text-white/60 theme-light:text-slate-700">{detail}</div>
    </div>
  );
}

function DailyTaskDashboard() {
  const [category, setCategory] = useState("ALL");
  const [complexity, setComplexity] = useState("ALL");
  const [query, setQuery] = useState("");
  const categories = ["ALL", "TROUBLESHOOT", "HARDWARE", "SOFTWARE", "PROGRAM", "AUTOMATION"];
  const complexities = ["ALL", "Basic", "Intermediate", "Advanced"];
  const filtered = publicTaskCards.filter((task) => {
    const matchesCategory = category === "ALL" || task.category === category;
    const matchesComplexity = complexity === "ALL" || task.complexity === complexity;
    const matchesQuery = `${task.title} ${task.detail} ${task.category} ${task.complexity}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesComplexity && matchesQuery;
  });

  return (
    <Section id="tasks">
      <SectionTitle eyebrow="Daily Ops" title="Daily Task Activity Dashboard" />
      <GlassPanel>
          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-cyanCore"
              placeholder="Search task history..."
            />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="border border-white/10 bg-black/70 px-3 py-3 text-ink outline-none">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={complexity} onChange={(event) => setComplexity(event.target.value)} className="border border-white/10 bg-black/70 px-3 py-3 text-ink outline-none">
              {complexities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <span className="border border-greenCore/30 px-3 py-2 text-greenCore">{filtered.length} unique task types</span>
            <span className="border border-cyanCore/30 px-3 py-2 text-cyanCore">Generalized and privacy-safe</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((task, index) => (
              <motion.article
                key={task.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.02 }}
                className="group border border-white/10 bg-black/25 p-4 transition hover:border-cyanCore/60 hover:shadow-glow"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-greenCore">[COMPLETED]</span>
                  <span className="text-xs text-white/50">{task.complexity}</span>
                </div>
                <h3 className="line-clamp-2 font-bold">{task.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/60 theme-light:text-slate-700">{task.detail}</p>
                <div className="mt-4 inline-flex border border-cyanCore/30 px-2 py-1 text-xs text-cyanCore">{task.category}</div>
              </motion.article>
            ))}
          </div>
      </GlassPanel>
    </Section>
  );
}

function TaskAnalytics() {
  const [chartsReady, setChartsReady] = useState(false);
  useEffect(() => setChartsReady(true), []);
  return (
    <Section id="analytics">
      <SectionTitle eyebrow="Task Analytics" title="Technical Operations Visualization" />
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassPanel>
          <h3 className="mb-4 text-xl font-bold">Task Type Distribution</h3>
          <div className="h-80 min-w-0">
            {chartsReady && (
            <ResponsiveContainer minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={110} paddingAngle={4}>
                  {categoryData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#07101f", border: "1px solid rgba(39,244,255,.35)", color: "#d7fbff" }} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>
        <GlassPanel>
          <h3 className="mb-4 text-xl font-bold">Complexity Distribution</h3>
          <div className="h-80 min-w-0">
            {chartsReady && (
            <ResponsiveContainer minWidth={1} minHeight={1}>
              <BarChart data={complexityData}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="name" stroke="#d7fbff" />
                <YAxis stroke="#d7fbff" />
                <Tooltip contentStyle={{ background: "#07101f", border: "1px solid rgba(105,255,143,.35)", color: "#d7fbff" }} />
                <Bar dataKey="value" fill="#69ff8f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>
        <GlassPanel>
          <h3 className="mb-4 text-xl font-bold">Daily Activity Pulse</h3>
          <div className="h-80 min-w-0">
            {chartsReady && (
            <ResponsiveContainer minWidth={1} minHeight={1}>
              <BarChart data={activityData}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="date" stroke="#d7fbff" interval={2} />
                <YAxis stroke="#d7fbff" />
                <Tooltip contentStyle={{ background: "#07101f", border: "1px solid rgba(39,244,255,.35)", color: "#d7fbff" }} />
                <Bar dataKey="value" fill="#27f4ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>
        <GlassPanel>
          <h3 className="mb-4 text-xl font-bold">Automation Efficiency</h3>
          <div className="space-y-5">
            {[
              { label: "System Performance", value: 92 },
              { label: "Automation Efficiency", value: 88 },
              { label: "Workflow Stability", value: 95 },
              { label: "Technical Operations", value: 91 }
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-greenCore">{value}%</span></div>
                <div className="h-3 bg-white/10"><motion.div className="h-full bg-gradient-to-r from-cyanCore to-greenCore" initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} /></div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </Section>
  );
}

function SkillsTree({
  selectedSkill,
  setSelectedSkill
}: {
  selectedSkill: (typeof skills)[number];
  setSelectedSkill: (skill: (typeof skills)[number]) => void;
}) {
  const categories = Array.from(new Set(skills.map((skill) => skill.category)));
  return (
    <Section id="skills">
      <SectionTitle eyebrow="RPG Skill Tree" title="Interactive Skills Tree" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <GlassPanel>
          <div className="space-y-7">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-cyanCore">{category}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {skills.filter((skill) => skill.category === category).map((skill) => (
                    <button
                      key={skill.name}
                      onClick={() => setSelectedSkill(skill)}
                      className={`min-h-24 border p-3 text-left transition hover:-translate-y-1 ${
                        selectedSkill.name === skill.name
                          ? "border-greenCore bg-greenCore/15 shadow-greenGlow"
                          : "border-white/10 bg-black/20 hover:border-cyanCore/60"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{skill.name}</span>
                        <Zap size={15} className="text-greenCore" />
                      </div>
                      <div className="h-1 bg-white/10">
                        <div className="h-full bg-cyanCore" style={{ width: `${skill.level}%` }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel>
          <div className="text-xs uppercase tracking-[0.26em] text-greenCore">Selected Node</div>
          <h3 className="mt-3 text-3xl font-black">{selectedSkill.name}</h3>
          <p className="mt-4 leading-7 text-white/70 theme-light:text-slate-700">{selectedSkill.detail}</p>
          <div className="mt-7">
            <div className="mb-2 flex justify-between text-sm">
              <span>Proficiency</span>
              <span className="text-cyanCore">{selectedSkill.level}%</span>
            </div>
            <div className="h-4 border border-cyanCore/30 bg-black/30 p-1">
              <motion.div
                key={selectedSkill.name}
                className="h-full bg-gradient-to-r from-cyanCore to-greenCore"
                initial={{ width: 0 }}
                animate={{ width: `${selectedSkill.level}%` }}
              />
            </div>
          </div>
        </GlassPanel>
      </div>
    </Section>
  );
}

function TechnologyStack() {
  return (
    <Section id="tech">
      <SectionTitle eyebrow="Resume Scan" title="Technology Stack Display" />
      <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <GlassPanel>
          <h3 className="text-2xl font-bold">Professional Identity</h3>
          <div className="mt-5 space-y-3">
            {resume.brandRoles.map((role) => (
              <div key={role} className="border border-greenCore/25 bg-greenCore/10 p-3 text-greenCore">{role}</div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resume.detectedTechnologies.map((tech, index) => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.025 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="border border-cyanCore/25 bg-cyanCore/10 p-4 shadow-glow"
              >
                <Cpu className="mb-3 text-cyanCore" />
                <div className="font-bold">{tech}</div>
                <div className="mt-2 h-1 bg-white/10">
                  <motion.div className="h-full bg-greenCore" initial={{ width: 0 }} whileInView={{ width: `${70 + (index % 5) * 5}%` }} viewport={{ once: true }} />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </Section>
  );
}

function Projects() {
  const [activeProject, setActiveProject] = useState<WorkProject | null>(operationsProjects[0] ?? null);
  return (
    <Section id="projects">
      <SectionTitle eyebrow="Project Ops" title="Project Operations Center" />
      <div className="grid gap-6 xl:grid-cols-[1fr_.75fr]">
        <div className="grid gap-5 md:grid-cols-2">
        {operationsProjects.map((project) => (
          <motion.article key={project.id} onClick={() => setActiveProject(project)} whileHover={{ y: -6 }} className="cursor-pointer border border-white/10 bg-panel p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-greenCore">[{project.status}]</span>
              <span className="text-xs text-white/50 theme-light:text-slate-600">{project.department}</span>
            </div>
            <h3 className="text-2xl font-bold">{project.name}</h3>
            <p className="mt-3 text-sm leading-6 text-white/65 theme-light:text-slate-700">{publicProjectSummary(project)}</p>
            <div className="mt-5 flex h-24 items-end gap-2 border border-white/10 bg-black/20 p-3">
              {[42, 58, 74, project.progress, 87, 94, 100].map((height, index) => (
                <motion.div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-greenCore to-cyanCore"
                  animate={{ height: [`${height * 0.65}%`, `${height}%`, `${height * 0.8}%`] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.08 }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tech.map((tech) => <span key={tech} className="border border-greenCore/25 px-2 py-1 text-xs text-greenCore">{tech}</span>)}
            </div>
            <div className="mt-5 border border-cyanCore/20 bg-cyanCore/10 p-3 text-sm leading-6 text-cyanCore">
              Role: workflow design, troubleshooting, automation updates, data handling, validation, and user support.
            </div>
          </motion.article>
        ))}
        </div>
        <GlassPanel>
          <div className="text-xs uppercase tracking-[0.28em] text-greenCore">Expandable System Overview</div>
          {activeProject && (
            <motion.div key={activeProject.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="mt-4 text-3xl font-black">{activeProject.name}</h3>
              <p className="mt-3 text-sm text-cyanCore">{activeProject.department} / {activeProject.rawStatus}</p>
              <p className="mt-5 leading-7 text-white/70 theme-light:text-slate-700">{publicProjectSummary(activeProject)}</p>
              <div className="mt-6 border border-white/10 bg-black/25 p-4">
                <div className="mb-3 text-sm text-greenCore">Simulated Live Monitoring</div>
                {["Deployment health", "Data flow", "User handoff"].map((label, index) => (
                  <div key={label} className="mb-4">
                    <div className="mb-1 flex justify-between text-xs"><span>{label}</span><span>{96 - index * 4}%</span></div>
                    <div className="h-2 bg-white/10"><div className="h-full bg-cyanCore" style={{ width: `${96 - index * 4}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3">
                {activeProject.tech.map((tech, index) => (
                  <div key={tech} className="flex items-center gap-3 border border-white/10 p-3">
                    <span className="grid h-8 w-8 place-items-center border border-cyanCore/40 text-cyanCore">{index + 1}</span>
                    {tech}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          <div className="mt-7 border-t border-white/10 pt-5">
            <h3 className="text-xl font-bold">Recommended Portfolio Builds</h3>
            <div className="mt-3 grid gap-2">
              {resume.recommendedProjects.map((project) => (
                <div key={project} className="border border-cyanCore/20 bg-cyanCore/10 p-3 text-sm text-cyanCore">{project}</div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </Section>
  );
}

function ProjectMap() {
  const paths = [
    ["Power Apps", "SharePoint", "Teams Notifications", "Reporting Dashboard"],
    ["Excel Macro", "CSV", "Sage System", "Operations Records"],
    ["WordPress", "Inquiry Database", "Email Routing", "Website System"]
  ];
  return (
    <Section id="map">
      <SectionTitle eyebrow="Network Map" title="Interactive Project Map" />
      <div className="grid gap-5 lg:grid-cols-3">
        {paths.map((path) => (
          <GlassPanel key={path.join("-")}>
            <div className="space-y-3">
              {path.map((node, index) => (
                <div key={node}>
                  <motion.div whileHover={{ scale: 1.02 }} className="border border-cyanCore/30 bg-cyanCore/10 p-4 text-center font-semibold text-cyanCore shadow-glow">
                    {node}
                  </motion.div>
                  {index < path.length - 1 && <div className="mx-auto h-8 w-px bg-gradient-to-b from-cyanCore to-greenCore shadow-greenGlow" />}
                </div>
              ))}
            </div>
          </GlassPanel>
        ))}
      </div>
    </Section>
  );
}

function ExperienceTimeline() {
  const timeline = timelineProjects;
  return (
    <Section id="timeline">
      <SectionTitle eyebrow="Record Timeline" title="Experience Timeline" />
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        {resume.experienceHighlights.map((item) => (
          <div key={item} className="border border-cyanCore/20 bg-cyanCore/10 p-4 text-sm leading-6 text-white/75 theme-light:text-slate-700">
            {item}
          </div>
        ))}
      </div>
      <div className="relative space-y-4 border-l border-cyanCore/30 pl-6">
        {timeline.map((project, index) => (
          <motion.div key={project.id} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="relative border border-white/10 bg-panel p-5 backdrop-blur-xl">
            <span className="absolute -left-[31px] top-6 h-3 w-3 rounded-full bg-greenCore shadow-greenGlow" />
            <div className="text-xs uppercase tracking-[0.25em] text-cyanCore">{project.timeline}</div>
            <h3 className="mt-2 text-xl font-bold">{project.name}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65 theme-light:text-slate-700">{project.detail}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function TerminalPanel({
  input,
  setInput,
  lines,
  runCommand
}: {
  input: string;
  setInput: (value: string) => void;
  lines: string[];
  runCommand: (value: string) => void;
}) {
  return (
    <Section id="terminal">
      <SectionTitle eyebrow="Command Line" title="Interactive Terminal" />
      <GlassPanel>
        <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-sm text-cyanCore">
          <TerminalSquare size={18} /> visitor@vinceos:~
        </div>
        <div className="h-72 overflow-y-auto font-mono text-sm leading-7 text-greenCore">
          {lines.map((line, index) => (
            <div key={`${line}-${index}`}>{line}</div>
          ))}
        </div>
        <form
          className="mt-4 flex items-center gap-2 border border-white/10 bg-black/30 px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim()) return;
            runCommand(input);
            setInput("");
          }}
        >
          <span className="text-cyanCore">&gt;</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-w-0 flex-1 bg-transparent font-mono text-ink outline-none theme-light:text-slate-950"
            placeholder="type help"
          />
          <span className="h-5 w-2 animate-pulse bg-greenCore" />
        </form>
      </GlassPanel>
    </Section>
  );
}

function Certifications() {
  return (
    <Section id="certifications">
      <SectionTitle eyebrow="Learning Logs" title="Certifications & Seminars" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {certifications.map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-xl transition hover:border-greenCore/50 hover:shadow-greenGlow"
          >
            <BrainCircuit className="mx-auto mb-4 text-cyanCore" />
            <h3 className="font-semibold">{item}</h3>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function LegacyFixTheSystemGame() {
  const [stage, setStage] = useState<GameStage>("intro");
  const [progress, setProgress] = useState(0);
  const [viruses, setViruses] = useState([true, true, true, true]);
  const [workflow, setWorkflow] = useState<string[]>([]);
  const [message, setMessage] = useState("Welcome Technician! Fix company systems inspired by Vince's real support records.");
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (stage !== "intro" && stage !== "done" && timer.current === null) {
      timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    }
    if (stage === "done" && timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    return () => {
      if (timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [stage]);

  const advance = (next: GameStage, nextProgress: number, nextMessage: string) => {
    setProgress(nextProgress);
    setMessage(nextMessage);
    setStage(next);
  };

  return (
    <Section id="game">
      <SectionTitle eyebrow="Mini Game" title="Fix The System" />
      <GlassPanel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-greenCore">Mission Simulator</div>
            <p className="mt-2 text-white/70 theme-light:text-slate-700">{message}</p>
          </div>
          <div className="border border-cyanCore/30 px-3 py-2 font-mono text-cyanCore">{seconds}s</div>
        </div>
        <div className="mb-6 h-3 border border-white/10 bg-black/30 p-0.5">
          <motion.div className="h-full bg-gradient-to-r from-cyanCore to-greenCore" animate={{ width: `${progress}%` }} />
        </div>

        {stage === "intro" && (
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="border border-greenCore/30 bg-greenCore/10 p-5">
              <h3 className="text-2xl font-bold">Welcome Technician!</h3>
              <p className="mt-3 text-white/70 theme-light:text-slate-700">Fix real-world incidents inspired by Vince TASK records: printer setup, server cables, Excel issues, workflow errors, and XML converter updates.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => advance("cable", 10, "Task 1: connect the server LAN cable for a workstation setup.")} className="border border-greenCore px-4 py-3 text-greenCore hover:bg-greenCore hover:text-black">
                Start Mission
              </button>
              <button onClick={() => advance("ticket", 75, "Task 4: solve the support ticket.")} className="border border-white/15 px-4 py-3 text-white/70 hover:border-cyanCore hover:text-cyanCore theme-light:text-slate-700">
                Skip Tutorial
              </button>
            </div>
          </div>
        )}

        {stage === "cable" && (
          <div className="grid gap-5 md:grid-cols-2">
            <DraggableCable onDone={() => advance("virus", 35, "Task 2: clear workflow errors and endpoint alerts.")} />
          </div>
        )}

        {stage === "virus" && (
          <div className="relative min-h-72 border border-white/10 bg-black/20 p-5">
            <div className="mb-4 text-sm text-cyanCore">Endpoint scan: threats detected</div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {viruses.map((alive, index) => (
                <button
                  key={index}
                  disabled={!alive}
                  onClick={() => {
                    const next = viruses.map((virus, virusIndex) => (virusIndex === index ? false : virus));
                    setViruses(next);
                    if (next.every((virus) => !virus)) advance("workflow", 60, "Task 3: connect Power Apps, SharePoint, and Teams in order.");
                  }}
                  className={`grid aspect-square place-items-center border text-4xl transition ${
                    alive ? "border-red-400/60 bg-red-500/10 text-red-300 hover:scale-95" : "border-greenCore/50 bg-greenCore/10 text-greenCore"
                  }`}
                >
                  {alive ? "!" : <Check />}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "workflow" && (
          <div className="grid gap-4 md:grid-cols-3">
            {["Power Apps", "SharePoint", "Teams"].map((node) => (
              <button
                key={node}
                onClick={() => {
                  const expected = ["Power Apps", "SharePoint", "Teams"][workflow.length];
                  if (node !== expected) {
                    setMessage(`Hint: connect ${expected} next.`);
                    return;
                  }
                  const next = [...workflow, node];
                  setWorkflow(next);
                  if (next.length === 3) advance("ticket", 80, "Task 4: solve the support ticket.");
                }}
                className={`min-h-32 border p-5 text-left transition ${
                  workflow.includes(node) ? "border-greenCore bg-greenCore/10 shadow-greenGlow" : "border-cyanCore/30 hover:bg-cyanCore/10"
                }`}
              >
                <Network className="mb-4 text-cyanCore" />
                <div className="text-xl font-bold">{node}</div>
                <div className="mt-2 text-sm text-white/60 theme-light:text-slate-700">Tap in guided order</div>
              </button>
            ))}
          </div>
        )}

        {stage === "ticket" && (
          <div className="border border-white/10 bg-black/20 p-5">
            <h3 className="text-2xl font-bold">Support Ticket: Excel record file not responding</h3>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {["Restart PC", "Clear Office cache", "Remove monitor cable"].map((choice) => (
                <button
                  key={choice}
                  onClick={() => {
                    if (choice === "Clear Office cache") advance("done", 100, "Systems Stabilized ✓");
                    else setMessage("That might not target the root cause. Try the Office-specific fix.");
                  }}
                  className="border border-white/10 p-4 text-left transition hover:border-cyanCore hover:bg-cyanCore/10"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="border border-greenCore/50 bg-greenCore/10 p-8 text-center shadow-greenGlow">
            <Check className="mx-auto mb-4 h-16 w-16 text-greenCore" />
            <h3 className="text-4xl font-black text-greenCore">Systems Stabilized ✓</h3>
            <p className="mt-4 text-xl">Built by Vince Matthew Magampon</p>
            <p className="mt-2 text-cyanCore">IT Support & Automation Developer</p>
          </motion.div>
        )}
      </GlassPanel>
    </Section>
  );
}

function DraggableCable({ onDone }: { onDone: () => void }) {
  const [connected, setConnected] = useState(false);
  return (
    <>
      <div className="relative min-h-72 border border-white/10 bg-black/20 p-5">
        <div className="mb-4 text-sm text-cyanCore">Mission: connect server cable for workstation setup</div>
        <motion.button
          drag
          dragConstraints={{ left: -10, right: 260, top: -20, bottom: 120 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 130) {
              setConnected(true);
              window.setTimeout(onDone, 550);
            }
          }}
          className={`absolute left-8 top-28 h-16 w-32 border text-sm font-bold ${
            connected ? "border-greenCore bg-greenCore/20 text-greenCore" : "border-cyanCore bg-cyanCore/10 text-cyanCore"
          }`}
        >
          {connected ? "Server linked" : "LAN Cable"}
        </motion.button>
      </div>
      <div className="relative min-h-72 border border-greenCore/40 bg-greenCore/10 p-5 shadow-greenGlow">
        <div className="absolute left-1/2 top-8 -translate-x-1/2 animate-bounce text-greenCore">↓</div>
        <div className="grid h-full place-items-center">
          <div className="grid h-28 w-36 place-items-center border-2 border-greenCore text-greenCore">SERVER PORT</div>
        </div>
      </div>
    </>
  );
}

function Contact() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendingContact(true);
    setContactStatus("Transmitting message...");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Message failed.");
      }
      setContactStatus("Message sent to magamponvince@gmail.com.");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (error) {
      setContactStatus(error instanceof Error ? error.message : "Message failed.");
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <Section id="contact" className="pb-28">
      <SectionTitle eyebrow="Contact Node" title="Contact Me" />
      <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <GlassPanel>
          <form className="space-y-4" onSubmit={submitContact}>
            <TerminalInput label="name" placeholder="Recruiter / Client" value={contactName} onChange={setContactName} />
            <TerminalInput label="email" placeholder="you@example.com" value={contactEmail} onChange={setContactEmail} />
            <label className="block">
              <span className="mb-2 block font-mono text-sm text-greenCore">message</span>
              <textarea value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} className="min-h-36 w-full border border-white/10 bg-black/30 p-3 outline-none transition focus:border-cyanCore" placeholder="Tell Vince about the system, workflow, or role..." />
            </label>
            <button type="submit" disabled={sendingContact} className="inline-flex items-center gap-2 border border-greenCore px-5 py-3 font-semibold text-greenCore transition hover:bg-greenCore hover:text-black disabled:cursor-not-allowed disabled:opacity-60">
              <Send size={17} /> {sendingContact ? "Transmitting..." : "Transmit Message"}
            </button>
            {contactStatus && <p className="font-mono text-sm text-cyanCore">{contactStatus}</p>}
          </form>
        </GlassPanel>
        <GlassPanel>
          <h3 className="text-2xl font-bold">Direct Channels</h3>
          <div className="mt-5 space-y-3">
            <a href="mailto:magamponvince@gmail.com" className="flex items-center gap-3 border border-white/10 p-4 transition hover:border-cyanCore hover:text-cyanCore">
              <Mail /> magamponvince@gmail.com
            </a>
            <a href="tel:09625265298" className="flex items-center gap-3 border border-white/10 p-4 transition hover:border-cyanCore hover:text-cyanCore">
              <RadioTower /> 09625265298
            </a>
            <a href="#terminal" className="flex items-center gap-3 border border-white/10 p-4 transition hover:border-greenCore hover:text-greenCore">
              <TerminalSquare /> Terminal Contact
            </a>
          </div>
        </GlassPanel>
      </div>
    </Section>
  );
}

function TerminalInput({ label, placeholder, value, onChange }: { label: string; placeholder: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-sm text-greenCore">{label}</span>
      <input value={value} onChange={(event) => onChange?.(event.target.value)} className="w-full border border-white/10 bg-black/30 p-3 outline-none transition focus:border-cyanCore" placeholder={placeholder} />
    </label>
  );
}

function GlassPanel({ children }: { children: React.ReactNode }) {
  return <div className="border border-white/10 bg-panel p-5 shadow-glow backdrop-blur-xl theme-light:bg-white/70">{children}</div>;
}
