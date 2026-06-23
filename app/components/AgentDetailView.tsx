"use client";

import { useState, useEffect, useMemo } from "react";
import { useTaskStore } from "./TaskStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Clock,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles,
  BarChart3,
  Settings,
  History,
  FileText,
  Save,
  Check,
  Globe,
  Bell,
  Mail,
  Send,
  Link2
} from "lucide-react";
import type { Task, TaskStatus } from "../lib/taskTypes";

export default function AgentDetailView() {
  const {
    tasks,
    selectedAgentId,
    setView,
    runTask,
    setTaskStatus,
    deleteTask,
    clearTaskData,
    updateTaskDetails,
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState<"output" | "analytics" | "config" | "history">("output");
  const [latestReport, setLatestReport] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Configuration Form State
  const [configTitle, setConfigTitle] = useState("");
  const [configPrompt, setConfigPrompt] = useState("");
  const [configTarget, setConfigTarget] = useState("");
  const [configInterval, setConfigInterval] = useState("daily");
  const [channels, setChannels] = useState({
    dashboard: true,
    email: false,
    telegram: false,
    webhook: false,
  });
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const task = tasks.find((t) => t.id === selectedAgentId);

  // Sync config state when task changes or config tab is selected
  useEffect(() => {
    if (task) {
      setConfigTitle(task.title);
      setConfigPrompt(task.prompt);
      setConfigTarget(task.target || "");
      setConfigInterval(task.schedule.label.toLowerCase());
    }
  }, [task, activeTab]);

  // Retrieve full detailed output from backend
  useEffect(() => {
    if (!task) return;

    let active = true;
    setIsLoadingReport(true);
    setLatestReport(null);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `show task ${task.id}`, stream: false }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (active && data && data.answer) {
          setLatestReport(data.answer);
        }
      })
      .catch((err) => {
        console.error("Error fetching agent report:", err);
      })
      .finally(() => {
        if (active) setIsLoadingReport(false);
      });

    return () => {
      active = false;
    };
  }, [task?.id, task?.runCount]);

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" strokeWidth={1.5} />
        <h3 className="text-base font-bold">Agent Not Found</h3>
        <button
          onClick={() => setView("dashboard")}
          className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this agent and all its reports?")) {
      deleteTask(task.id);
      setView("dashboard");
    }
  };

  const getStatusIndicator = () => {
    switch (task.status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
            Cron Active
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/25 animate-pulse">
            <Activity className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            Retrieving Live
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Pause className="w-3.5 h-3.5" strokeWidth={2} />
            Cron Paused
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
            Operational Error
          </span>
        );
      default:
        return null;
    }
  };

  // Save changes to task config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configTitle.trim() || !configPrompt.trim()) return;

    let intervalMs = 24 * 60 * 60 * 1000;
    let label = "Daily";
    if (configInterval.includes("hour")) {
      intervalMs = 60 * 60 * 1000;
      label = "Hourly";
    } else if (configInterval.includes("6 hours")) {
      intervalMs = 6 * 60 * 60 * 1000;
      label = "Every 6 hours";
    } else if (configInterval.includes("12 hours")) {
      intervalMs = 12 * 60 * 60 * 1000;
      label = "Every 12 hours";
    } else if (configInterval === "weekly") {
      intervalMs = 7 * 24 * 60 * 60 * 1000;
      label = "Weekly";
    }

    updateTaskDetails(task.id, {
      title: configTitle.trim(),
      prompt: configPrompt.trim(),
      target: configTarget.trim(),
      schedule: {
        label,
        intervalMs,
      },
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Format relative time helper
  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6 animate-fade-in text-[var(--text-primary)]">
      
      {/* Breadcrumbs */}
      <button
        onClick={() => setView("dashboard")}
        className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        <span>Back to Command Center</span>
      </button>

      {/* Hero Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{task.title}</h2>
            {getStatusIndicator()}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Interval: {task.schedule.label}
            </span>
            {task.target && (
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Target: {task.target}
              </span>
            )}
          </div>
        </div>

        {/* Persistent Action Bar */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <button
            onClick={() => runTask(task.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            disabled={task.status === "running"}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Execute Now</span>
          </button>

          {task.status === "paused" ? (
            <button
              onClick={() => setTaskStatus(task.id, "active")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold cursor-pointer transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={() => setTaskStatus(task.id, "paused")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold cursor-pointer transition-all"
              disabled={task.status === "running"}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={() => clearTaskData(task.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-500/10 text-red-500 hover:bg-red-500/5 text-xs font-semibold cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-xl border border-red-500/10 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete Agent"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-[var(--border-color)] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("output")}
          className={`pb-3 relative cursor-pointer flex items-center gap-1.5 transition-colors ${
            activeTab === "output" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Intelligence Output</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 relative cursor-pointer flex items-center gap-1.5 transition-colors ${
            activeTab === "analytics" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 relative cursor-pointer flex items-center gap-1.5 transition-colors ${
            activeTab === "config" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 relative cursor-pointer flex items-center gap-1.5 transition-colors ${
            activeTab === "history" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Full History ({task.data.length})</span>
        </button>
      </div>

      {/* Active Tab Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (Left 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          
          {activeTab === "output" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  Latest Intelligence Briefing
                </h3>
                {latestReport && (
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      showDiff 
                        ? "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/30" 
                        : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {showDiff ? "Hide Changes" : "Show Changes since last run"}
                  </button>
                )}
              </div>

              {/* Show Diff simulation or regular view */}
              {showDiff ? (
                <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-6 font-mono text-xs space-y-3 overflow-x-auto shadow-sm">
                  <div className="flex items-center gap-2 text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] pb-2 mb-2 font-sans font-semibold">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>Change Detection Log • Comparison with run from {task.lastRunAt ? new Date(task.lastRunAt - 3600*1000).toLocaleTimeString() : "previous"}</span>
                  </div>
                  <div className="text-red-500 bg-red-500/5 p-1 rounded font-semibold">- [old_price]: $66,810</div>
                  <div className="text-emerald-500 bg-emerald-500/5 p-1 rounded font-semibold">+ [new_price]: $68,420</div>
                  <div className="text-zinc-500">&nbsp;&nbsp;[target_url]: https://api.coingecko.com/v3/coins/bitcoin</div>
                  <div className="text-zinc-500">&nbsp;&nbsp;[scan_status]: 200 OK</div>
                  <div className="text-red-500 bg-red-500/5 p-1 rounded font-semibold">- [timestamp]: 1719122400 (Old Scan)</div>
                  <div className="text-emerald-500 bg-emerald-500/5 p-1 rounded font-semibold">+ [timestamp]: 1719126000 (Latest Scan)</div>
                  <div className="text-zinc-500">&nbsp;&nbsp;[change_magnitude]: +2.3%</div>
                </div>
              ) : (
                <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-6 min-h-[360px] shadow-sm">
                  {isLoadingReport ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)] text-xs gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent)]" />
                      <span>Retrieving analysis details...</span>
                    </div>
                  ) : latestReport ? (
                    <div className="markdown-content text-sm space-y-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{latestReport}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)] text-xs text-center space-y-2">
                      <FileCode className="w-10 h-10 text-[var(--text-tertiary)]" />
                      <p className="font-semibold text-[var(--text-primary)]">No scans executed yet</p>
                      <p className="max-w-xs leading-normal">
                        Click "Execute Now" to fetch live data and compile your first report.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                Performance Metrics &amp; Analytics
              </h3>

              {/* Stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Average Latency</p>
                  <p className="text-xl font-bold text-[var(--text-primary)] mt-1">4.2s</p>
                  <span className="text-[9px] text-[var(--status-healthy)] font-semibold">▲ within normal limits</span>
                </div>
                <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Data Volume Scanned</p>
                  <p className="text-xl font-bold text-indigo-500 mt-1">12.4 KB</p>
                  <span className="text-[9px] text-[var(--text-tertiary)]">total payload processed</span>
                </div>
                <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Reliability Score</p>
                  <p className="text-xl font-bold text-emerald-500 mt-1">100%</p>
                  <span className="text-[9px] text-[var(--status-healthy)] font-semibold">No failed execution runs</span>
                </div>
              </div>

              {/* Charts Mock Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-xl shadow-sm space-y-4">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Scan Speed Over Time (s)</p>
                  <svg className="w-full h-32 text-indigo-500" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M 0 25 L 20 20 L 40 28 L 60 12 L 80 18 L 100 8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="20" cy="20" r="1.5" className="fill-[var(--accent)]" />
                    <circle cx="40" cy="28" r="1.5" className="fill-[var(--accent)]" />
                    <circle cx="60" cy="12" r="1.5" className="fill-[var(--accent)]" />
                    <circle cx="80" cy="18" r="1.5" className="fill-[var(--accent)]" />
                    <circle cx="100" cy="8" r="1.5" className="fill-[var(--accent)]" />
                  </svg>
                </div>
                <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-xl shadow-sm space-y-4">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Reliability Ratio</p>
                  <div className="flex items-center justify-center gap-6">
                    <svg className="w-24 h-24" viewBox="0 0 36 36">
                      <path
                        className="text-zinc-100 dark:text-zinc-800"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeDasharray="100, 100"
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500" /> Success (100%)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-red-500" /> Errors (0%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-[var(--accent)]" />
                Configure Autopilot Pipeline
              </h3>

              <div className="space-y-4 border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 rounded-2xl shadow-sm">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Agent Name</label>
                  <input
                    type="text"
                    value={configTitle}
                    onChange={(e) => setConfigTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    placeholder="Enter agent name..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Target URL / Subject</label>
                  <input
                    type="text"
                    value={configTarget}
                    onChange={(e) => setConfigTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    placeholder="Enter target url (optional)..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Schedule Interval</label>
                  <select
                    value={configInterval}
                    onChange={(e) => setConfigInterval(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="every 1 hour">Hourly</option>
                    <option value="every 6 hours">Every 6 hours</option>
                    <option value="every 12 hours">Every 12 hours</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Prompt Instructions</label>
                  <textarea
                    value={configPrompt}
                    onChange={(e) => setConfigPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    required
                  />
                </div>

                {/* Delivery Channels */}
                <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
                  <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[var(--accent)]" />
                    Delivery Channels
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]/20">
                      <input type="checkbox" checked={channels.dashboard} disabled className="accent-[var(--accent)]" />
                      <span className="font-semibold">In-App Dashboard</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]">
                      <input 
                        type="checkbox" 
                        checked={channels.email} 
                        onChange={(e) => setChannels({...channels, email: e.target.checked})} 
                        className="accent-[var(--accent)]" 
                      />
                      <span className="font-semibold flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email Digests</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]">
                      <input 
                        type="checkbox" 
                        checked={channels.telegram} 
                        onChange={(e) => setChannels({...channels, telegram: e.target.checked})} 
                        className="accent-[var(--accent)]" 
                      />
                      <span className="font-semibold flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Telegram Push Alerts</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]">
                      <input 
                        type="checkbox" 
                        checked={channels.webhook} 
                        onChange={(e) => setChannels({...channels, webhook: e.target.checked})} 
                        className="accent-[var(--accent)]" 
                      />
                      <span className="font-semibold flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Custom Webhook Endpoint</span>
                    </label>
                  </div>

                  {channels.webhook && (
                    <div className="space-y-1 pt-2 animate-fade-in-up">
                      <label className="text-[10px] font-bold text-[var(--text-tertiary)]">Webhook URL Endpoint</label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://api.yourdomain.com/v1/bossint-receiver"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  )}

                </div>

                {/* Save controls */}
                <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Configuration</span>
                  </button>
                  
                  {saveSuccess && (
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 animate-fade-in">
                      <Check className="w-4 h-4 animate-bounce" />
                      Changes saved successfully!
                    </span>
                  )}
                </div>

              </div>
            </form>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--accent)]" />
                Historical Scans &amp; Outputs
              </h3>

              {task.data.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl text-xs text-[var(--text-tertiary)]">
                  No historical logs recorded. Click "Execute Now" to fetch details.
                </div>
              ) : (
                <div className="space-y-3">
                  {task.data.map((log) => (
                    <div key={log.id} className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-xl p-4 space-y-2.5 shadow-sm">
                      <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2 text-[10px] text-[var(--text-tertiary)] font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span>{formatRelativeTime(log.timestamp)}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                        {log.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar Info Area (Right 1/3) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--accent)]" />
            Agent Console Summary
          </h3>

          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-5 space-y-4 shadow-sm text-xs">
            <div className="space-y-2">
              <h4 className="font-bold text-[var(--text-primary)]">Autopilot Pipeline details</h4>
              <div className="divide-y divide-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                <div className="py-2 flex justify-between">
                  <span>Type</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{task.type.toUpperCase()}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Status</span>
                  <span>{getStatusIndicator()}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Schedule</span>
                  <span className="font-bold text-[var(--text-primary)]">{task.schedule.label}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Runs Executed</span>
                  <span className="font-bold text-indigo-500">{task.runCount}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Created At</span>
                  <span className="font-bold text-[var(--text-primary)]">{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
              <h4 className="font-bold text-[var(--text-primary)]">System Diagnostics</h4>
              <div className="p-3 bg-[var(--bg-primary)]/40 rounded-xl border border-[var(--border-color)] font-mono text-[10px] text-[var(--text-secondary)] space-y-1">
                <div>[SYSTEM] PID: {Math.floor(Math.random() * 8000) + 1000}</div>
                <div>[SYSTEM] THREADS: AUTOPILOT-4</div>
                <div>[SYSTEM] STATUS: OPERATIONAL</div>
                <div>[SYSTEM] ALL CLEAR: TRUE</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
