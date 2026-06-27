"use client";

import { useState, useEffect, useMemo } from "react";
import Dialog, { DialogButton } from "./Dialog";
import { useTaskStore, labelToCron } from "./TaskStore";
import { AgentTemplate } from "../lib/templateData";
import { generateTaskId, cleanAgentName } from "../lib/taskParser";
import type { Task } from "../lib/taskTypes";
import {
  Calendar,
  Play,
  Settings2,
  ShieldCheck,
  Code2,
  Globe,
  Sliders,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Cpu,
  Mail,
  MessageSquare,
  Webhook,
  Terminal,
  Bot,
  Clock,
  Zap,
  Target,
  Bell,
  Check,
  Pencil,
  Send
} from "lucide-react";

interface AgentDeployManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: AgentTemplate | null;
  initialCustomPrompt?: string; // If creating from scratch
  onDeploy?: (configuredDetails: {
    name: string;
    prompt: string;
    taskType: Task["type"];
    schedule: string;
  }) => void;
}

const SCHEDULE_PRESETS = [
  { label: "Every hour", value: "every 1 hour" },
  { label: "Every 6 hours", value: "every 6 hours" },
  { label: "Every 12 hours", value: "every 12 hours" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
];

// Map categoryId to cover image and agent persona
const AGENT_PERSONA: Record<string, { avatar: string; persona: string; color: string }> = {
  "competitive": { 
    avatar: "/cover-watchdog.png", 
    persona: "The Watchdog",
    color: "emerald"
  },
  "finance": { 
    avatar: "/cover-analyst.png", 
    persona: "The Analyst",
    color: "amber"
  },
  "cybersecurity": { 
    avatar: "/cover-sentinel.png", 
    persona: "The Sentinel",
    color: "rose"
  },
  "news": { 
    avatar: "/cover-scout.png", 
    persona: "The Scout",
    color: "blue"
  },
  "research": { 
    avatar: "/cover-analyst.png", 
    persona: "The Researcher",
    color: "violet"
  },
  "legal": { 
    avatar: "/cover-sentinel.png", 
    persona: "The Enforcer",
    color: "slate"
  },
  "default": { 
    avatar: "/cover-hunter.png", 
    persona: "Custom Agent",
    color: "indigo"
  },
};

function getDomainsFromText(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  
  const domains = matches.map(url => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace("www.", "");
    } catch {
      return "";
    }
  }).filter(d => d !== "");

  if (domains.length === 0) {
    const lower = text.toLowerCase();
    if (lower.includes("coingecko")) domains.push("coingecko.com");
    if (lower.includes("coinmarketcap")) domains.push("coinmarketcap.com");
    if (lower.includes("yahoo finance") || lower.includes("yahoofinance")) domains.push("finance.yahoo.com");
    if (lower.includes("reuters")) domains.push("reuters.com");
    if (lower.includes("ap news") || lower.includes("apnews")) domains.push("apnews.com");
    if (lower.includes("hackernews") || lower.includes("hacker news") || lower.includes("ycombinator")) domains.push("news.ycombinator.com");
    if (lower.includes("sec.gov") || lower.includes("edgar")) domains.push("sec.gov");
    if (lower.includes("github")) domains.push("github.com");
  }
  return Array.from(new Set(domains));
}

export default function AgentDeployManagementModal({
  isOpen,
  onClose,
  template,
  initialCustomPrompt = "",
  onDeploy,
}: AgentDeployManagementModalProps) {
  const { addTask, setSelectedAgentId, syncTasks, runTask } = useTaskStore();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [taskType, setTaskType] = useState<Task["type"]>("track");
  const [schedule, setSchedule] = useState("daily");
  const [customSchedule, setCustomSchedule] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJsonSchema, setShowJsonSchema] = useState(false);

  // Target details
  const [targetDomains, setTargetDomains] = useState("");
  const [targetCompanies, setTargetCompanies] = useState("");
  const [isDomainsEditedByUser, setIsDomainsEditedByUser] = useState(false);

  // Delivery channel states
  const [deliveryChannels, setDeliveryChannels] = useState<{ [key: string]: boolean }>({
    email: false,
    telegram: false,
    whatsapp: false,
  });

  const handleDeliveryToggle = (key: string) => {
    setDeliveryChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const missionSummaryText = useMemo(() => {
    const cat = template?.categoryId || "default";
    const companies = targetCompanies.trim() ? targetCompanies.trim() : "target brands and products";
    const sources = targetDomains.trim() ? targetDomains.trim() : "global web and social channels";

    const schedPresetLabel = SCHEDULE_PRESETS.find(p => p.value === schedule)?.label || schedule;
    const schedText = customSchedule.trim() || schedPresetLabel;
    const frequency = schedText.toLowerCase();

    // Delivery channels config
    const activeChannels = Object.keys(deliveryChannels).filter(k => deliveryChannels[k]);
    let channelPhrase = "your dashboard";
    if (activeChannels.length > 0) {
      const channelLabels = activeChannels.map(c => c === "email" ? "Email" : c === "telegram" ? "Telegram" : "WhatsApp");
      channelPhrase = `${channelLabels.join(" & ")} and dashboard`;
    }

    let coreMission = "";
    if (cat === "news") {
      coreMission = `Monitors ${sources} to track media presence, sentiment, and risk signals for ${companies}.`;
    } else if (cat === "finance") {
      coreMission = `Tracks market data and financial announcements for ${companies} across ${sources} to forecast movements.`;
    } else if (cat === "competitive") {
      coreMission = `Crawls ${sources} to monitor competitor updates, catalog changes, and positioning shifts for ${companies}.`;
    } else if (cat === "cybersecurity") {
      coreMission = `Scans registries and threat databases on ${sources} to identify exploits and vulnerabilities affecting ${companies}.`;
    } else if (cat === "legal") {
      coreMission = `Audits regulatory updates and legal filings across ${sources} to trace compliance risks for ${companies}.`;
    } else {
      coreMission = `Autonomously crawls ${sources} to extract structural intelligence and trends for ${companies}.`;
    }

    return `${coreMission} Running ${frequency}, it routes alert logs and next-step forecasts to ${channelPhrase}.`;
  }, [template, schedule, customSchedule, targetDomains, targetCompanies, deliveryChannels]);

  // Sync auto-extracted domains from the active prompt if user has not manually edited them
  useEffect(() => {
    if (isOpen && !isDomainsEditedByUser) {
      const domains = getDomainsFromText(prompt);
      setTargetDomains(domains.join(", "));
    }
  }, [prompt, isOpen, isDomainsEditedByUser]);

  // Set up values when template or custom prompt is loaded
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsDeploying(false);
      setDeployStep(null);
      setIsDomainsEditedByUser(false);
      setTargetCompanies("");
      
      if (template) {
        setName(cleanAgentName(template.title));
        setPrompt(template.prompt);
        setTaskType(template.taskType || "track");
        setCustomSchedule("");
        
        const matchedPreset = SCHEDULE_PRESETS.find(
          (p) => p.value === template.schedule || p.label.toLowerCase() === template.schedule.toLowerCase()
        );
        setSchedule(matchedPreset ? matchedPreset.value : "daily");
        
        const domains = getDomainsFromText(template.prompt);
        setTargetDomains(domains.join(", "));
      } else {
        // From scratch configuration
        setName("Custom Scraper Agent");
        const defaultPrompt = initialCustomPrompt || "Crawl my website daily to extract text adjustments.";
        setPrompt(defaultPrompt);
        setTaskType(defaultPrompt.toLowerCase().includes("crawl") ? "crawl" : "track");
        setSchedule("daily");
        setCustomSchedule("");
        
        const domains = getDomainsFromText(defaultPrompt);
        setTargetDomains(domains.join(", "));
      }
    }
  }, [template, initialCustomPrompt, isOpen]);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    if (!name.trim() || !prompt.trim()) return;

    setIsDeploying(true);
    setError(null);

    const steps = [
      "Configuring agent target scope...",
      "Configuring cron schedule trigger...",
      "Registering deployment logs...",
      "Deploying agent to Bossint server...",
    ];

    // Simulated deployment countdown steps for amazing premium UI feel
    for (let i = 0; i < steps.length; i++) {
      setDeployStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    const finalSchedule = customSchedule.trim() || schedule;

    // Parse target lists
    const domainsList = targetDomains.split(",").map(d => d.trim()).filter(Boolean);
    const companiesList = targetCompanies.split(",").map(c => c.trim()).filter(Boolean);

    // Build the final enriched prompt that will work to create the last prompt for the API
    let finalPrompt = prompt.trim();
    if (domainsList.length > 0 || companiesList.length > 0) {
      finalPrompt += "\n\nTarget Scope:";
      if (domainsList.length > 0) {
        finalPrompt += `\n- Target Domain(s): ${domainsList.join(", ")}`;
      }
      if (companiesList.length > 0) {
        finalPrompt += `\n- Target Company/ies: ${companiesList.join(", ")}`;
      }
    }

    if (onDeploy) {
      onDeploy({
        name: name.trim(),
        prompt: finalPrompt,
        taskType,
        schedule: finalSchedule,
      });
      setIsDeploying(false);
      setDeployStep(null);
      return;
    }

    // Server-side Task Store integration
    let intervalMs = 24 * 60 * 60 * 1000;
    if (finalSchedule.includes("1 hour")) intervalMs = 60 * 60 * 1000;
    else if (finalSchedule.includes("6 hours")) intervalMs = 6 * 60 * 60 * 1000;
    else if (finalSchedule.includes("12 hours")) intervalMs = 12 * 60 * 60 * 1000;
    else if (finalSchedule === "weekly") intervalMs = 7 * 24 * 60 * 60 * 1000;

    const token = typeof window !== "undefined" ? localStorage.getItem("bossint_user_token") : null;
    if (!token) {
      setError("Authentication token is missing. Please sign in again.");
      setIsDeploying(false);
      setDeployStep(null);
      return;
    }

    try {
      const cronExpr = labelToCron(finalSchedule);
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          schedule: cronExpr,
          schedule_label: finalSchedule,
          max_items: taskType === "crawl" ? 10 : 5,
          target_domains: domainsList,
          target_companies: companiesList,
          delivery_channels: Object.keys(deliveryChannels).filter(k => deliveryChannels[k])
        })
      });

      if (res.ok) {
        const newAgent = await res.json();
        const now = Date.now();
        const newTask: Task = {
          id: newAgent.id,
          title: name.trim(),
          prompt: finalPrompt,
          type: taskType,
          status: "active",
          schedule: {
            label: SCHEDULE_PRESETS.find((p) => p.value === finalSchedule)?.label || finalSchedule,
            intervalMs,
          },
          target: name.trim(),
          createdAt: now,
          nextRunAt: now + intervalMs,
          runCount: 0,
          data: [],
        };
        addTask(newTask);
        runTask(newAgent.id);
        syncTasks();
        setIsDeploying(false);
        setDeployStep(null);
        setSelectedAgentId(newAgent.id);
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || "Failed to deploy agent. Upstream server returned an error.");
        setIsDeploying(false);
        setDeployStep(null);
      }
    } catch (err) {
      console.error("Direct API deploy failed:", err);
      setError("Network error. Failed to connect to agent management server.");
      setIsDeploying(false);
      setDeployStep(null);
    }
  };

  // Categories helper for color gradient
  const getCategoryTheme = () => {
    const cat = template?.categoryId || (prompt.toLowerCase().includes("crypto") ? "finance" : "research");
    switch (cat) {
      case "finance":
        return { gradient: "from-amber-500/20 to-orange-600/20", text: "text-amber-500", border: "border-amber-500/20", iconBg: "bg-amber-500/10", accent: "#f59e0b" };
      case "cybersecurity":
        return { gradient: "from-red-500/20 to-rose-700/20", text: "text-rose-500", border: "border-rose-500/20", iconBg: "bg-rose-500/10", accent: "#f43f5e" };
      case "competitive":
        return { gradient: "from-emerald-500/20 to-cyan-700/20", text: "text-emerald-500", border: "border-emerald-500/20", iconBg: "bg-emerald-500/10", accent: "#10b981" };
      case "news":
        return { gradient: "from-blue-500/20 to-indigo-700/20", text: "text-blue-500", border: "border-blue-500/20", iconBg: "bg-blue-500/10", accent: "#3b82f6" };
      default:
        return { gradient: "from-indigo-500/20 to-purple-700/20", text: "text-indigo-500", border: "border-indigo-500/20", iconBg: "bg-indigo-500/10", accent: "#6366f1" };
    }
  };

  const theme = getCategoryTheme();
  const catId = template?.categoryId || "default";
  const persona = AGENT_PERSONA[catId] || AGENT_PERSONA["default"];
  const scheduleLabel = SCHEDULE_PRESETS.find(p => p.value === schedule)?.label || schedule;

  // Delivery channels config
  const deliveryOptions = [
    { id: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    { id: "telegram", label: "Telegram", icon: <Send className="w-4 h-4" /> },
    { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="font-extrabold tracking-wider uppercase bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--text-primary)]">
          AGENT MANAGER
        </span>
      }
      subtitle={template ? `Deploying blueprint: ${template.title}` : "Creating autopilot scraper from scratch"}
      icon={
        <div className={`p-1.5 rounded-lg ${theme.iconBg} ${theme.text}`}>
          <Sliders className="w-5 h-5" strokeWidth={1.5} />
        </div>
      }
      maxWidth="max-w-[960px]"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* ===== TWO COLUMN LAYOUT ===== */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ========== LEFT COLUMN: Agent Profile ========== */}
          <div className="lg:w-[340px] shrink-0 space-y-4">

            {/* Agent Identity Card */}
            <div className={`rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.gradient} p-5 space-y-4 relative overflow-hidden`}>
              {/* Decorative grid dots */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04]" style={{
                backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }} />

              {/* Avatar + Title */}
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 shadow-lg">
                  <img
                    src={persona.avatar}
                    alt={persona.persona}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.text} mb-0.5`}>
                    Agent Persona
                  </p>
                  <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight truncate">
                    {persona.persona}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">
                    {template?.title || name}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-primary)]/60 backdrop-blur-sm border border-[var(--border-subtle)]">
                  <Clock className={`w-3.5 h-3.5 ${theme.text} shrink-0`} />
                  <div>
                    <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Schedule</p>
                    <p className="text-[11px] text-[var(--text-primary)] font-semibold capitalize">{customSchedule || scheduleLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-primary)]/60 backdrop-blur-sm border border-[var(--border-subtle)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Status</p>
                    <p className="text-[11px] text-[var(--text-primary)] font-semibold capitalize">Ready</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Mission */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-[var(--border-subtle)]">
                <Zap className={`w-3.5 h-3.5 ${theme.text}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                  Agent Mission
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-primary)] font-medium">
                {missionSummaryText}
              </p>
            </div>

            {/* JSON Schema Toggle (dev tool) */}
            <button
              type="button"
              onClick={() => setShowJsonSchema(!showJsonSchema)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[11px] font-bold text-[var(--text-secondary)] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>API Payload Schema</span>
              </div>
              {showJsonSchema ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showJsonSchema && (
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden">
                <pre className="p-3 font-mono text-[10px] text-[var(--text-secondary)] overflow-x-auto select-all max-h-[180px]">
                  {JSON.stringify({
                    agent_name: name.trim(),
                    prompt: prompt.trim() + (
                      (targetDomains.trim() || targetCompanies.trim()) 
                        ? `\n\nTarget Scope:${targetDomains.trim() ? `\n- Target Domain(s): ${targetDomains}` : ''}${targetCompanies.trim() ? `\n- Target Company/ies: ${targetCompanies}` : ''}`
                        : ''
                    ),
                    schedule_label: customSchedule.trim() || schedule,
                    cron_expr: labelToCron(customSchedule.trim() || schedule),
                    target_domains: targetDomains.split(",").map(d => d.trim()).filter(Boolean),
                    target_companies: targetCompanies.split(",").map(c => c.trim()).filter(Boolean),
                    delivery_channels: Object.keys(deliveryChannels).filter(k => deliveryChannels[k])
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* ========== RIGHT COLUMN: Configure & Customize ========== */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Agent Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                <Pencil className="w-3 h-3" />
                Agent Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 text-sm transition-all font-medium font-sans"
                placeholder="E.g., Competitor Watchdog"
                disabled={isDeploying}
              />
            </div>

            {/* Research Objective / Prompt */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                <Bot className="w-3 h-3" />
                Autopilot Prompt / Research Objective
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 text-sm transition-all font-sans resize-none leading-relaxed"
                placeholder="Describe what this agent should do..."
                disabled={isDeploying}
              />
            </div>

            {/* Schedule Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  Execution Schedule
                </label>
                <div className="relative">
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm font-medium appearance-none cursor-not-allowed font-sans transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isDeploying || !!customSchedule.trim()}
                  >
                    {SCHEDULE_PRESETS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="font-sans">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-tertiary)] absolute right-3.5 top-3 pointer-events-none transition-opacity ${!!customSchedule.trim() ? "opacity-30" : ""}`} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                  <Settings2 className="w-3 h-3" />
                  Custom Schedule
                </label>
                <input
                  type="text"
                  value={customSchedule}
                  onChange={(e) => setCustomSchedule(e.target.value)}
                  placeholder="e.g. Every Monday at 9 am"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 text-sm font-medium font-sans transition-all"
                  disabled={isDeploying}
                />
              </div>
            </div>

            {/* Target Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                  <Globe className="w-3 h-3 text-[var(--text-tertiary)]" />
                  Target Domain/s
                </label>
                <input
                  type="text"
                  value={targetDomains}
                  onChange={(e) => {
                    setTargetDomains(e.target.value);
                    setIsDomainsEditedByUser(true);
                  }}
                  placeholder="e.g. finance.yahoo.com, reuters.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 text-sm font-medium font-sans transition-all"
                  disabled={isDeploying}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                  <Target className="w-3 h-3 text-[var(--text-tertiary)]" />
                  Target Company/ies
                </label>
                <input
                  type="text"
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                  placeholder="e.g. Nvidia, Microsoft"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 text-sm font-medium font-sans transition-all"
                  disabled={isDeploying}
                />
              </div>
            </div>

            {/* Delivery Channels */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                <Bell className="w-3 h-3" />
                Output Delivery
              </label>
              <div className="flex items-center gap-5">
                {deliveryOptions.map((ch) => (
                  <label
                    key={ch.id}
                    className="flex items-center gap-2 cursor-pointer select-none group"
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => handleDeliveryToggle(ch.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                        deliveryChannels[ch.id]
                          ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                          : "border-[var(--text-tertiary)] bg-transparent group-hover:border-[var(--accent)]"
                      }`}
                    >
                      {deliveryChannels[ch.id] && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    {/* Icon + Label */}
                    <span className={`transition-colors ${deliveryChannels[ch.id] ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                      {ch.icon}
                    </span>
                    <span className={`text-xs font-medium transition-colors ${deliveryChannels[ch.id] ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                      {ch.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <DialogButton onClick={onClose} variant="ghost" disabled={isDeploying}>
                Cancel
              </DialogButton>
              <DialogButton
                onClick={handleDeploy}
                variant="primary"
                disabled={isDeploying || !name.trim() || !prompt.trim()}
                icon={isDeploying ? null : <Play className="w-4 h-4 fill-current" strokeWidth={1.5} />}
              >
                {isDeploying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{deployStep}</span>
                  </span>
                ) : (
                  "Deploy Agent"
                )}
              </DialogButton>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
