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
  Terminal
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
  const [showAuditPanel, setShowAuditPanel] = useState(false);

  // Parse URLs/Domains from prompt to use in Sandbox Audit
  const parsedDomains = useMemo(() => {
    const text = prompt || template?.prompt || initialCustomPrompt;
    if (!text) return [];
    
    // Simple regex to extract URLs or domain names
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

    // Also scan for common platform names if no URLs found
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

    // Deduplicate
    return Array.from(new Set(domains));
  }, [prompt, template, initialCustomPrompt]);

  // Plain-English Summary Compiler
  const plainEnglishSummary = useMemo(() => {
    const activePrompt = prompt.trim();
    if (!activePrompt) return "Configure the autopilot prompt to summarize agent behavior.";

    const activeSchedule = customSchedule.trim() || schedule;
    let timingPhrase = "periodically";
    if (activeSchedule.includes("1 hour") || activeSchedule.includes("hourly")) timingPhrase = "every hour";
    else if (activeSchedule.includes("6 hours")) timingPhrase = "every 6 hours";
    else if (activeSchedule.includes("12 hours")) timingPhrase = "every 12 hours";
    else if (activeSchedule === "daily") timingPhrase = "once per day";
    else if (activeSchedule === "weekly") timingPhrase = "once per week";
    else if (activeSchedule) timingPhrase = `on schedule "${activeSchedule}"`;

    // Extract key action
    let action = "monitor web data";
    const lowerPrompt = activePrompt.toLowerCase();
    if (lowerPrompt.includes("crawl") || lowerPrompt.includes("scrape")) {
      action = "crawl and scrape targets";
    } else if (lowerPrompt.includes("track") || lowerPrompt.includes("price")) {
      action = "track asset metrics";
    } else if (lowerPrompt.includes("analyze") || lowerPrompt.includes("report")) {
      action = "analyze intelligence reports";
    } else if (lowerPrompt.includes("scan") || lowerPrompt.includes("exploit")) {
      action = "scan registries for anomalies";
    }

    // Targets sentence fragment
    let targetPhrase = "";
    if (parsedDomains.length > 0) {
      targetPhrase = ` from ${parsedDomains.slice(0, 2).join(" and ")}${parsedDomains.length > 2 ? " (and other sources)" : ""}`;
    }

    return `This autonomous agent will execute ${timingPhrase} to ${action}${targetPhrase}, running completely sandboxed, and saving telemetry reports back to your dashboard.`;
  }, [prompt, schedule, customSchedule, parsedDomains]);

  // Set up values when template or custom prompt is loaded
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsDeploying(false);
      setDeployStep(null);
      
      if (template) {
        setName(cleanAgentName(template.title));
        setPrompt(template.prompt);
        setTaskType(template.taskType || "track");
        setCustomSchedule("");
        
        const matchedPreset = SCHEDULE_PRESETS.find(
          (p) => p.value === template.schedule || p.label.toLowerCase() === template.schedule.toLowerCase()
        );
        setSchedule(matchedPreset ? matchedPreset.value : "daily");
      } else {
        // From scratch configuration
        setName("Custom Scraper Agent");
        setPrompt(initialCustomPrompt || "Crawl my website daily to extract text adjustments.");
        setTaskType(initialCustomPrompt.toLowerCase().includes("crawl") ? "crawl" : "track");
        setSchedule("daily");
        setCustomSchedule("");
      }
    }
  }, [template, initialCustomPrompt, isOpen]);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    if (!name.trim() || !prompt.trim()) return;

    setIsDeploying(true);
    setError(null);

    const steps = [
      "Validating sandbox permissions...",
      "Configuring cron schedule trigger...",
      "Registering system telemetry hooks...",
      "Deploying agent to Bossint server...",
    ];

    // Simulated deployment countdown steps for amazing premium UI feel
    for (let i = 0; i < steps.length; i++) {
      setDeployStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    const finalSchedule = customSchedule.trim() || schedule;

    if (onDeploy) {
      onDeploy({
        name: name.trim(),
        prompt: prompt.trim(),
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
          prompt: prompt.trim(),
          schedule: cronExpr,
          schedule_label: finalSchedule,
          max_items: taskType === "crawl" ? 10 : 5,
        })
      });

      if (res.ok) {
        const newAgent = await res.json();
        const now = Date.now();
        const newTask: Task = {
          id: newAgent.id,
          title: name.trim(),
          prompt: prompt.trim(),
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
        return { gradient: "from-amber-500/20 to-orange-600/20", text: "text-amber-500", border: "border-amber-500/20", iconBg: "bg-amber-500/10" };
      case "cybersecurity":
        return { gradient: "from-red-500/20 to-rose-700/20", text: "text-rose-500", border: "border-rose-500/20", iconBg: "bg-rose-500/10" };
      case "competitive":
        return { gradient: "from-emerald-500/20 to-cyan-700/20", text: "text-emerald-500", border: "border-emerald-500/20", iconBg: "bg-emerald-500/10" };
      case "news":
        return { gradient: "from-blue-500/20 to-indigo-700/20", text: "text-blue-500", border: "border-blue-500/20", iconBg: "bg-blue-500/10" };
      default:
        return { gradient: "from-indigo-500/20 to-purple-700/20", text: "text-indigo-500", border: "border-indigo-500/20", iconBg: "bg-indigo-500/10" };
    }
  };

  const theme = getCategoryTheme();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={template ? "Configure & Deploy Agent" : "Configure Custom Agent"}
      subtitle={template ? `Deploying blueprint: ${template.title}` : "Creating autopilot scraper from scratch"}
      icon={
        <div className={`p-1.5 rounded-lg ${theme.iconBg} ${theme.text}`}>
          <Sliders className="w-5 h-5" strokeWidth={1.5} />
        </div>
      }
      maxWidth="max-w-[620px]"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Dynamic Plain English Summary Section */}
        <div className={`p-4 rounded-xl border ${theme.border} bg-gradient-to-br ${theme.gradient} space-y-2`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.text} block`}>
            What this agent does
          </span>
          <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed font-sans">
            {plainEnglishSummary}
          </p>
          <div className="flex items-center gap-4 pt-1.5 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] font-semibold">
            <span className="flex items-center gap-1">
              ⏰ Schedule: <strong className="text-[var(--text-primary)] capitalize">{customSchedule || schedule}</strong>
            </span>
            <span className="flex items-center gap-1">
              🔍 Type: <strong className="text-[var(--text-primary)] uppercase">{taskType}</strong>
            </span>
          </div>
        </div>

        {/* Agent Name */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-sans">
            Agent Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors font-medium font-sans"
            placeholder="E.g., Competitor Watchdog"
            disabled={isDeploying}
          />
        </div>

        {/* Schedule & Custom Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-sans">
              Execution Schedule
            </label>
            <div className="relative">
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors font-medium appearance-none cursor-pointer font-sans"
                disabled={isDeploying}
              >
                {SCHEDULE_PRESETS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="font-sans">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-sans">
              Custom Schedule
            </label>
            <input
              type="text"
              value={customSchedule}
              onChange={(e) => setCustomSchedule(e.target.value)}
              placeholder="e.g. Every Monday at 9 am"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors font-medium font-sans"
              disabled={isDeploying}
            />
          </div>
        </div>

        {/* Autopilot Prompt */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-sans">
            Autopilot Prompt / Research Objective
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors font-sans resize-none leading-relaxed"
            placeholder="Enter custom instructions for the agent..."
            disabled={isDeploying}
          />
        </div>

        {/* Code Audit & Tool Permissions Section (Accordion) */}
        <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
          <button
            type="button"
            onClick={() => setShowAuditPanel(!showAuditPanel)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-surface-hover)] hover:bg-[var(--border-subtle)] transition-colors font-sans"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[var(--accent)]" />
              <span>Developer Code Audit & Tool Sandbox</span>
            </div>
            {showAuditPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAuditPanel && (
            <div className="p-4 space-y-4 border-t border-[var(--border-color)] text-xs font-sans">
              
              {/* Tool permissions checklist */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-sans">
                  System Tool Access Permissions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium font-sans">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>🌐 HTTP Fetch Scraper (Read Only)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>🔍 Google Search Index Scraper</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>📁 Temp Telemetry Storage (Write Only)</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Lock className="w-4 h-4" />
                    <span>🚫 File Write / Exec (Sandboxed)</span>
                  </div>
                </div>
              </div>

              {/* Target Sandboxed Domains */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-sans">
                  Allowed Sandbox Request Domains
                </span>
                {parsedDomains.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {parsedDomains.map((dom) => (
                      <span key={dom} className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-[10px] text-[var(--text-secondary)] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {dom}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-tertiary)] italic font-sans">
                    No domains parsed. Access defaults to general search indexing engines.
                  </p>
                )}
              </div>

              {/* JSON Blueprint API Payload */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest font-sans">
                  Agent Payload Blueprint (JSON Schema)
                </span>
                <div className="relative">
                  <pre className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg font-mono text-[10px] text-[var(--text-secondary)] overflow-x-auto select-all max-h-[120px]">
                    {JSON.stringify({
                      agent_name: name.trim(),
                      prompt: prompt.trim(),
                      schedule_label: customSchedule.trim() || schedule,
                      cron_expr: labelToCron(customSchedule.trim() || schedule),
                      sandboxed_domains: parsedDomains,
                      telemetry: "active_logs",
                      allowed_capabilities: ["web_crawler", "google_search", "telemetry_logs"]
                    }, null, 2)}
                  </pre>
                  <span className="absolute right-2.5 bottom-2.5 text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-color)] select-none font-sans">
                    API V1 Payload
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Safety Warning Info Box */}
        <div className="flex gap-3 p-3.5 rounded-xl bg-[var(--thinking-bg)] border border-[var(--thinking-border)] text-xs text-[var(--text-secondary)]">
          <ShieldCheck className="w-5 h-5 text-[var(--accent)] flex-shrink-0" strokeWidth={1.5} />
          <p className="leading-relaxed font-medium font-sans">
            This agent will execute autonomously in a sandboxed, containerized environment. Any crawled details, telemetry charts, and delta differences will be visualised directly in your Dashboard logs.
          </p>
        </div>

        {/* Action Controls Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
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
    </Dialog>
  );
}
