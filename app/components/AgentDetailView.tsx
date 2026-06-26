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
  Link2,
  Search,
  Share2,
  Bookmark,
  Coins,
  Cpu,
  ExternalLink
} from "lucide-react";
import type { Task, TaskStatus } from "../lib/taskTypes";
import { useRouter } from "next/navigation";
import { generateUniqueReport } from "../lib/reportGenerator";

export default function AgentDetailView() {
  const {
    tasks,
    selectedAgentId,
    setView,
    runTask,
    stopTask,
    setTaskStatus,
    deleteTask,
    updateTaskDetails,
    deleteHistoryEntry,
  } = useTaskStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"output" | "analytics" | "config" | "history">("output");
  const [latestReport, setLatestReport] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [agentStats, setAgentStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

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

  // Retrieve token statistics for the agent
  useEffect(() => {
    if (!task || activeTab !== "analytics") return;

    let active = true;
    setIsLoadingStats(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("bossint_user_token") : null;
    if (token) {
      fetch(`/api/agents/${task.id}/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data) => {
          if (active && data) {
            setAgentStats(data);
          }
        })
        .catch((err) => console.error("Error fetching agent stats:", err))
        .finally(() => {
          if (active) setIsLoadingStats(false);
        });
    } else {
      setIsLoadingStats(false);
    }

    return () => {
      active = false;
    };
  }, [task, activeTab]);

  const points = useMemo(() => {
    if (!agentStats || !agentStats.daily || agentStats.daily.length === 0) {
      return "M 0 25 L 20 20 L 40 28 L 60 12 L 80 18 L 100 8";
    }
    const daily = [...agentStats.daily].reverse(); // Oldest first
    const max = Math.max(...daily.map(d => d.total), 100);
    const segments = daily.length - 1 || 1;
    return daily.map((d, index) => {
      const x = (index / segments) * 100;
      const y = 30 - (d.total / max) * 25; // 25px max height inside 30px view
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  }, [agentStats]);

  const pointCircles = useMemo(() => {
    if (!agentStats || !agentStats.daily || agentStats.daily.length === 0) {
      return (
        <>
          <circle cx="20" cy="20" r="1.5" className="fill-[var(--accent)]" />
          <circle cx="40" cy="28" r="1.5" className="fill-[var(--accent)]" />
          <circle cx="60" cy="12" r="1.5" className="fill-[var(--accent)]" />
          <circle cx="80" cy="18" r="1.5" className="fill-[var(--accent)]" />
          <circle cx="100" cy="8" r="1.5" className="fill-[var(--accent)]" />
        </>
      );
    }
    const daily = [...agentStats.daily].reverse();
    const max = Math.max(...daily.map(d => d.total), 100);
    const segments = daily.length - 1 || 1;
    return daily.map((d, index) => {
      const x = (index / segments) * 100;
      const y = 30 - (d.total / max) * 25;
      return <circle key={index} cx={x} cy={y} r="1.5" className="fill-[var(--accent)]" />;
    });
  }, [agentStats]);

  const { inputPercent, outputPercent } = useMemo(() => {
    if (!agentStats || agentStats.total_tokens === 0) {
      return { inputPercent: 40, outputPercent: 60 };
    }
    const inp = Math.round((agentStats.total_input_tokens / agentStats.total_tokens) * 100);
    const out = 100 - inp;
    return { inputPercent: inp, outputPercent: out };
  }, [agentStats]);

  const reportText = useMemo(() => {
    return task ? generateUniqueReport(task, latestReport) : "";
  }, [task, latestReport]);

  const sections = useMemo(() => {
    return getSectionsFromMarkdown(reportText);
  }, [reportText]);

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

    const token = typeof window !== "undefined" ? localStorage.getItem("bossint_user_token") : null;
    if (token) {
      fetch(`/api/agents/${task.id}/all`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              console.warn("Unauthorized access on agent details.");
            }
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          
          if (data) {
            // Set latest report
            if (data.latest_data) {
              if (typeof data.latest_data === "string") {
                setLatestReport(data.latest_data);
              } else {
                setLatestReport("### Latest Extracted Data\n\n```json\n" + JSON.stringify(data.latest_data, null, 2) + "\n```");
              }
            } else {
              setLatestReport(null);
            }

            // Sync history to TaskStore
            if (Array.isArray(data.history)) {
              const mappedHistory = data.history.map((h: any) => ({
                id: h.id,
                timestamp: h.run_at ? new Date(h.run_at).getTime() : Date.now(),
                summary: h.data 
                  ? (typeof h.data === "string" ? h.data : JSON.stringify(h.data, null, 2))
                  : "Scan completed successfully."
              }));
              updateTaskDetails(task.id, {
                data: mappedHistory,
                runCount: data.history.length
              });
            }
          } else {
            setLatestReport("Agent not found or has no reports.");
          }
        })
        .catch((err) => {
          console.error("Error fetching agent report via REST:", err);
          if (active) setLatestReport("Failed to load report from REST API.");
        })
        .finally(() => {
          if (active) setIsLoadingReport(false);
        });
    } else {
      if (active) {
        setLatestReport("Authentication token is missing. Cannot fetch report.");
        setIsLoadingReport(false);
      }
    }

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
          onClick={() => router.push("/dashboard")}
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
      router.push("/dashboard");
    }
  };

  const getStatusIndicator = () => {
    switch (task.status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
            Agent Active
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
            Agent Paused
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
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        <span>Back to My Agents</span>
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

          {task.status === "running" && (
            <button
              onClick={() => stopTask(task.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 text-xs font-semibold cursor-pointer transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          )}

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
                  In This Report
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
                <div className="min-h-[360px]">
                  {isLoadingReport ? (
                    <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-6 flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)] text-xs gap-3 shadow-sm animate-pulse">
                      <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent)]" />
                      <span>Retrieving analysis details...</span>
                    </div>
                  ) : reportText ? (
                    <IntelligenceReportView reportText={reportText} />
                  ) : (
                    <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-6 flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)] text-xs text-center space-y-2 shadow-sm">
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
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Total Token Usage</p>
                  <p className="text-xl font-bold text-[var(--text-primary)] mt-1">
                    {isLoadingStats ? "..." : (agentStats ? agentStats.total_tokens.toLocaleString() : "12,500")}
                  </p>
                  <span className="text-[9px] text-[var(--text-tertiary)]">cumulative tokens consumed</span>
                </div>
                <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Input Tokens</p>
                  <p className="text-xl font-bold text-indigo-500 mt-1">
                    {isLoadingStats ? "..." : (agentStats ? agentStats.total_input_tokens.toLocaleString() : "5,000")}
                  </p>
                  <span className="text-[9px] text-[var(--text-tertiary)]">prompt processing volume</span>
                </div>
                <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Output Tokens</p>
                  <p className="text-xl font-bold text-emerald-500 mt-1">
                    {isLoadingStats ? "..." : (agentStats ? agentStats.total_output_tokens.toLocaleString() : "7,500")}
                  </p>
                  <span className="text-[9px] text-[var(--text-tertiary)]">response generation volume</span>
                </div>
              </div>

              {/* Charts Mock Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-xl shadow-sm space-y-4">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Daily Token Consumption</p>
                  <svg className="w-full h-32 text-indigo-500" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d={points} fill="none" stroke="currentColor" strokeWidth="2" />
                    {pointCircles}
                  </svg>
                </div>
                <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-xl shadow-sm space-y-4">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Token Distribution</p>
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
                        className="text-indigo-500"
                        strokeDasharray={`${outputPercent}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-indigo-500" /> Output ({outputPercent}%)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-zinc-200 dark:bg-zinc-800" /> Input ({inputPercent}%)</div>
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
                        <div className="flex items-center gap-2">
                          <span>{formatRelativeTime(log.timestamp)}</span>
                          <button
                            onClick={() => deleteHistoryEntry(task.id, log.id)}
                            className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete this history entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
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
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            {activeTab === "output" ? (
              <>
                <FileText className="w-4 h-4 text-[var(--accent)]" />
                <span>Sections</span>
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4 text-[var(--accent)]" />
                <span>Agent Console Summary</span>
              </>
            )}
          </h3>

          {activeTab === "output" ? (
            <InThisReportSidebar sections={sections} />
          ) : (
            <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-5 space-y-4 shadow-sm text-xs animate-fade-in">
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


            </div>
          )}
        </div>

      </div>

    </div>
  );
}

interface ParsedItem {
  title: string;
  description: string;
  highlight: string;
  growthText?: string;
  statusTag?: string;
  url?: string;
  tags: string[];
}

interface ParsedSection {
  id: string;
  title: string;
  emoji: string;
  items: ParsedItem[];
}

interface ReportSectionHeader {
  id: string;
  title: string;
  emoji: string;
}

function parseReport(reportText: string): { sections: ParsedSection[] } | null {
  if (!reportText) return null;
  
  const lines = reportText.split("\n");
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let index = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let title = "";
    
    // Check if it's a standard markdown header
    const mdHeaderMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (mdHeaderMatch) {
      title = mdHeaderMatch[2].replace(/\*\*|_/g, "").trim();
    } else {
      // Check if it's a bold line that looks like a header
      const boldHeaderMatch = trimmed.match(/^\*\*(Market Overview|Key Players|Market Segments|Recent Developments|Buyer Dynamics|Trends & Outlook|Competitive Dynamics|Next Steps|Funding Deals|Product Releases|Top News|Announcements|Latest Updates|Latest Crawled Data|News|Current Tasks)\*\*$/i);
      if (boldHeaderMatch) {
        title = boldHeaderMatch[1].trim();
      }
    }

    if (title) {
      // Determine emoji
      let emoji = "📋";
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("market overview") || lowerTitle.includes("overview")) emoji = "📊";
      else if (lowerTitle.includes("key players") || lowerTitle.includes("player")) emoji = "👥";
      else if (lowerTitle.includes("segments") || lowerTitle.includes("segment")) emoji = "🧩";
      else if (lowerTitle.includes("developments") || lowerTitle.includes("development")) emoji = "📰";
      else if (lowerTitle.includes("buyer")) emoji = "🛍️";
      else if (lowerTitle.includes("trends") || lowerTitle.includes("outlook")) emoji = "📈";
      else if (lowerTitle.includes("competitive")) emoji = "⚔️";
      else if (lowerTitle.includes("next steps") || lowerTitle.includes("next")) emoji = "🚀";
      else if (lowerTitle.includes("funding")) emoji = "💰";
      else if (lowerTitle.includes("product") || lowerTitle.includes("release")) emoji = "🚀";
      else if (lowerTitle.includes("news")) emoji = "📰";

      currentSection = {
        id: `section-${index}`,
        title,
        emoji,
        items: []
      };
      sections.push(currentSection);
      index++;
      continue;
    }

    // Bullet point match (e.g., "- **Groq** confirmed a...")
    const bulletMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (bulletMatch && currentSection) {
      const content = bulletMatch[1].trim();
      
      let itemTitle = "";
      let desc = content;
      
      const boldMatch = content.match(/^\*\*([^*]+)\*\*(.*)$/);
      if (boldMatch) {
        itemTitle = boldMatch[1].trim();
        desc = boldMatch[2].trim();
      } else {
        const words = content.split(" ");
        itemTitle = words.slice(0, 2).join(" ");
        desc = words.slice(2).join(" ");
      }

      let cleanDesc = desc.trim();
      if (cleanDesc.startsWith(":") || cleanDesc.startsWith("-") || cleanDesc.startsWith(",")) {
        cleanDesc = cleanDesc.substring(1).trim();
      }
      if (cleanDesc.startsWith(",")) {
        cleanDesc = cleanDesc.substring(1).trim();
      }
      
      // Extract highlights
      let highlight = "";
      const moneyMatch = content.match(/(\$\d+(?:\.\d+)?\s*(?:million|billion|trillion|M|B|K)?|\$\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i);
      const usdMatch = content.match(/(?:USD|\$)\s*\d+(?:\.\d+)?\s*(?:billion|million|trillion|M|B)?/i);
      if (usdMatch) {
        highlight = usdMatch[0];
      } else if (moneyMatch) {
        highlight = moneyMatch[0];
      } else {
        const quoteMatch = content.match(/['"“]([^'”"]+)['"”]/);
        if (quoteMatch) {
          highlight = quoteMatch[1];
        } else {
          const productMatch = content.match(/(GPT-\d+[\w]*|Vision Pro\s*\d*|RTX\s*[\w\d]+)/i);
          if (productMatch) {
            highlight = productMatch[1];
          }
        }
      }

      // Extract status/tag inside brackets like [Expanding]
      let statusTag = "";
      const statusMatch = content.match(/\[([^\]]+)\]/);
      if (statusMatch) {
        statusTag = statusMatch[1].trim();
      }

      // Extract Growth text
      let growthText = "";
      const growthMatch = content.match(/Growth:\s*([^.]+)\.?/i);
      if (growthMatch) {
        growthText = growthMatch[1].trim();
      }

      // Extract URLs
      let url = "";
      const urlMatch = content.match(/(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);
      if (urlMatch) {
        url = urlMatch[0].trim();
      }

      // Clean description
      let finalDescription = cleanDesc;
      if (growthMatch) {
        finalDescription = finalDescription.replace(growthMatch[0], "");
      }
      if (statusMatch) {
        finalDescription = finalDescription.replace(statusMatch[0], "");
      }
      if (urlMatch) {
        finalDescription = finalDescription.replace(urlMatch[0], "");
      }
      finalDescription = finalDescription.replace(/Sources?:?\s*/gi, "").trim();
      if (finalDescription.startsWith(":") || finalDescription.startsWith("-") || finalDescription.startsWith(",")) {
        finalDescription = finalDescription.substring(1).trim();
      }
      if (finalDescription.length > 0) {
        finalDescription = finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1);
      }

      // Generate tags
      const tags: string[] = [];
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes("ai") || lowerContent.includes("gpt") || lowerContent.includes("llm")) {
        tags.push("AI");
      }
      if (lowerContent.includes("chip") || lowerContent.includes("semiconductor") || lowerContent.includes("nvidia")) {
        tags.push("Hardware");
      }
      if (lowerContent.includes("fund") || lowerContent.includes("raise") || lowerContent.includes("valuation") || lowerContent.includes("million") || lowerContent.includes("billion")) {
        tags.push("Funding");
      }
      if (lowerContent.includes("launch") || lowerContent.includes("release") || lowerContent.includes("unveil")) {
        tags.push("Launch");
      }
      if (lowerContent.includes("apple") || lowerContent.includes("vision")) {
        tags.push("Spatial");
      }
      if (statusTag && !tags.includes(statusTag)) {
        tags.push(statusTag);
      }

      currentSection.items.push({
        title: itemTitle,
        description: finalDescription,
        highlight,
        growthText,
        statusTag,
        url,
        tags
      });
    }
  }

  if (sections.length === 0 || sections.every(s => s.items.length === 0)) {
    return null;
  }

  return { sections };
}

function IntelligenceReportView({ reportText }: { reportText: string }) {
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const parsedData = useMemo(() => {
    return parseReport(reportText);
  }, [reportText]);

  const finalViewMode = parsedData ? viewMode : "raw";

  const allTags = useMemo(() => {
    if (!parsedData) return [];
    const tags = new Set<string>();
    parsedData.sections.forEach((s) => {
      s.items.forEach((item) => {
        item.tags.forEach((t) => tags.add(t));
      });
    });
    return ["All", ...Array.from(tags)];
  }, [parsedData]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!parsedData) {
    return (
      <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-6 min-h-[360px] shadow-sm">
        <div className="markdown-content text-sm space-y-4 font-sans">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportText}</ReactMarkdown>
        </div>
      </div>
    );
  }

  const sectionsList = parsedData.sections.map((s) => ({
    id: s.id,
    title: s.title,
    emoji: s.emoji
  }));

  return (
    <div className="space-y-5 font-sans">
      {/* Visual Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
        {/* Toggle Switch */}
        <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-color)] text-xs font-semibold w-fit self-start sm:self-center select-none">
          <button
            type="button"
            onClick={() => setViewMode("visual")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              finalViewMode === "visual"
                ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm border border-[var(--border-color)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Board</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              finalViewMode === "raw"
                ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm border border-[var(--border-color)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Raw Report</span>
          </button>
        </div>

        {finalViewMode === "visual" && (
          <div className="flex items-center gap-2 flex-1 sm:justify-end max-w-md w-full">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search board..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {finalViewMode === "raw" ? (
        <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-6 min-h-[360px] shadow-sm">
          <div className="markdown-content text-sm space-y-4 font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => {
                  const text = String(children || "");
                  const id = getHeadingId(text, sectionsList);
                  return <h1 id={id} className="text-xl font-bold mt-6 mb-3 scroll-mt-24">{children}</h1>;
                },
                h2: ({ children }) => {
                  const text = String(children || "");
                  const id = getHeadingId(text, sectionsList);
                  return <h2 id={id} className="text-lg font-bold mt-5 mb-2 scroll-mt-24">{children}</h2>;
                },
                h3: ({ children }) => {
                  const text = String(children || "");
                  const id = getHeadingId(text, sectionsList);
                  return <h3 id={id} className="text-base font-bold mt-4 mb-2 scroll-mt-24">{children}</h3>;
                },
              }}
            >
              {reportText}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tag Filter Pills */}
          {allTags.length > 2 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedTag === tag
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                      : "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  {tag === "All" ? "📍 All Topics" : `#${tag}`}
                </button>
              ))}
            </div>
          )}

          {parsedData.sections.map((section, secIdx) => {
            const filteredItems = section.items.filter((item) => {
              const matchesSearch =
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTag = selectedTag === "All" || item.tags.includes(selectedTag);
              return matchesSearch && matchesTag;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={secIdx} id={section.id} className="space-y-4 animate-fade-in-up scroll-mt-24">
                {/* Section Header */}
                <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                  <span className="w-1.5 h-4 bg-[var(--accent)] rounded-full"></span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    {section.emoji} {section.title}
                  </h4>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                    {filteredItems.length}
                  </span>
                </div>

                {/* Grid Layout of Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map((item, itemIdx) => {
                    const itemId = `${secIdx}-${itemIdx}`;
                    const isBookmarked = !!bookmarkedIds[itemId];
                    const isCopied = copiedId === itemId;

                    // Configure colors depending on type
                    let borderClass = "border-l-4 border-l-purple-500 hover:border-purple-500/40";
                    let badgeClass = "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
                    
                    if (section.title.toLowerCase().includes("market overview") || section.title.toLowerCase().includes("overview") || section.title.toLowerCase().includes("funding")) {
                      borderClass = "border-l-4 border-l-blue-500 hover:border-blue-500/40";
                      badgeClass = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
                    } else if (section.title.toLowerCase().includes("key players") || section.title.toLowerCase().includes("player") || section.title.toLowerCase().includes("product") || section.title.toLowerCase().includes("release")) {
                      borderClass = "border-l-4 border-l-emerald-500 hover:border-emerald-500/40";
                      badgeClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
                    } else if (section.title.toLowerCase().includes("segments") || section.title.toLowerCase().includes("segment")) {
                      borderClass = "border-l-4 border-l-amber-500 hover:border-amber-500/40";
                      badgeClass = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
                    }

                    return (
                      <div
                        key={itemId}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 ${borderClass} bg-white dark:bg-[var(--bg-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
                      >
                        {/* Glowing accent border on hover */}
                        <div
                          className={`absolute inset-x-0 top-0 h-1 transition-all group-hover:h-1.5 bg-[var(--accent)]`}
                        ></div>

                        {/* Top Row: Entity Title and Badge Highlight */}
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-[var(--text-primary)] text-sm tracking-tight">
                              {item.title}
                            </h5>
                          </div>

                          {item.highlight && (
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${badgeClass}`}
                            >
                              {item.highlight}
                            </span>
                          )}
                        </div>

                        {/* Growth Details */}
                        {item.growthText && (
                          <div className="text-xs text-[var(--text-secondary)] font-medium mb-2 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                            <span className="text-[var(--text-tertiary)] font-bold">Growth:</span> {item.growthText}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1 mb-4">
                          {item.description}
                        </p>

                        {/* Bottom Row: Tags & Interactions */}
                        <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-3 mt-auto">
                          {/* Tags / Status */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.statusTag && (
                              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
                                {item.statusTag}
                              </span>
                            )}
                            {item.tags.slice(0, 2).map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setSelectedTag(tag)}
                                className="text-[9px] font-semibold bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>

                          {/* Action icons / sources */}
                          <div className="flex items-center gap-2">
                            {item.url && (
                              <a
                                href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-blue-500 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5 animate-fade-in"
                              >
                                {item.url}
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopy(itemId, `[${item.title}] ${item.highlight ? `(${item.highlight}) ` : ""}${item.growthText ? `[Growth: ${item.growthText}] ` : ""}${item.description}`)}
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                              title="Copy to clipboard"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleBookmark(itemId)}
                              className={`p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer ${
                                isBookmarked ? "text-amber-500 fill-amber-500" : "text-[var(--text-tertiary)] hover:text-amber-500"
                              }`}
                              title="Bookmark item"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InThisReportSidebar({ sections }: { sections: ReportSectionHeader[] }) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSectionId(id);
    }
  };

  return (
    <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-5 space-y-4 shadow-sm text-xs animate-fade-in font-sans">
      <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
        <h4 className="font-extrabold text-[var(--text-primary)] text-sm tracking-tight">Sections</h4>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
          {sections.length}/{sections.length}
        </span>
      </div>

      <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
        {sections.length === 0 ? (
          <div className="text-[11px] text-[var(--text-tertiary)] text-center py-6 animate-pulse">
            Analyzing report layout...
          </div>
        ) : (
          sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left font-semibold transition-all cursor-pointer ${
                activeSectionId === sec.id
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/10"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm flex-shrink-0">{sec.emoji}</span>
                <span className="truncate text-xs">{sec.title}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" strokeWidth={2.5} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function getSectionsFromMarkdown(text: string): ReportSectionHeader[] {
  if (!text) return [];
  const lines = text.split("\n");
  const headers: ReportSectionHeader[] = [];
  let index = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let title = "";
    
    // Check if it's a standard markdown header
    const mdHeaderMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (mdHeaderMatch) {
      title = mdHeaderMatch[2].replace(/\*\*|_/g, "").trim();
    } else {
      // Check if it's a bold line that looks like a header
      const boldHeaderMatch = trimmed.match(/^\*\*(Market Overview|Key Players|Market Segments|Recent Developments|Buyer Dynamics|Trends & Outlook|Competitive Dynamics|Next Steps|Funding Deals|Product Releases|Top News|Announcements|Latest Updates|Latest Crawled Data|News|Current Tasks)\*\*$/i);
      if (boldHeaderMatch) {
        title = boldHeaderMatch[1].trim();
      }
    }

    if (title) {
      // Determine emoji
      let emoji = "📋";
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("market overview") || lowerTitle.includes("overview")) emoji = "📊";
      else if (lowerTitle.includes("key players") || lowerTitle.includes("player")) emoji = "👥";
      else if (lowerTitle.includes("segments") || lowerTitle.includes("segment")) emoji = "🧩";
      else if (lowerTitle.includes("developments") || lowerTitle.includes("development")) emoji = "📰";
      else if (lowerTitle.includes("buyer")) emoji = "🛍️";
      else if (lowerTitle.includes("trends") || lowerTitle.includes("outlook")) emoji = "📈";
      else if (lowerTitle.includes("competitive")) emoji = "⚔️";
      else if (lowerTitle.includes("next steps") || lowerTitle.includes("next")) emoji = "🚀";
      else if (lowerTitle.includes("funding")) emoji = "💰";
      else if (lowerTitle.includes("product") || lowerTitle.includes("release")) emoji = "🚀";
      else if (lowerTitle.includes("news")) emoji = "📰";

      // Prevent duplicate headers
      if (!headers.some(h => h.title.toLowerCase() === title.toLowerCase())) {
        headers.push({
          id: `section-${index}`,
          title,
          emoji
        });
        index++;
      }
    }
  }
  return headers;
}

function getHeadingId(title: string, sections: ReportSectionHeader[]): string | undefined {
  const cleanTitle = title.replace(/\*\*|_/g, "").trim().toLowerCase();
  const found = sections.find(s => s.title.toLowerCase() === cleanTitle);
  return found?.id;
}
