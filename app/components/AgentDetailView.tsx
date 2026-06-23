"use client";

import { useState, useEffect } from "react";
import { useTaskStore } from "./TaskStore";
import { formatRelativeTime } from "../lib/taskParser";
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
  AlertCircle,
  FileCode,
  Sparkles,
} from "lucide-react";

export default function AgentDetailView() {
  const {
    tasks,
    selectedAgentId,
    setView,
    runTask,
    setTaskStatus,
    deleteTask,
    clearTaskData,
  } = useTaskStore();

  const [latestReport, setLatestReport] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const task = tasks.find((t) => t.id === selectedAgentId);

  useEffect(() => {
    if (!task) return;

    let active = true;
    setIsLoadingReport(true);
    setLatestReport(null);

    // Retrieve full detailed output from autopilot backend
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
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" strokeWidth={1.5} />
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
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-500 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/25">
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
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25">
            <Pause className="w-3.5 h-3.5" strokeWidth={2} />
            Cron Paused
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/25">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
            Operational Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6 animate-fade-in">
      {/* Breadcrumb Back Button */}
      <button
        onClick={() => setView("dashboard")}
        className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        <span>Back to Dashboard</span>
      </button>

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{task.title}</h2>
            {getStatusIndicator()}
          </div>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl font-mono leading-relaxed bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-color)]">
            Objective: {task.prompt}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Force Run */}
          <button
            onClick={() => runTask(task.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] text-xs font-semibold transition-colors cursor-pointer"
            title="Execute agent task right now"
            disabled={task.status === "running"}
          >
            <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
            <span>Run Now</span>
          </button>

          {/* Pause / Resume */}
          {task.status === "paused" ? (
            <button
              onClick={() => setTaskStatus(task.id, "active")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={() => setTaskStatus(task.id, "paused")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Pause</span>
            </button>
          )}

          {/* Clear reports */}
          <button
            onClick={() => clearTaskData(task.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] text-red-500 border border-red-500/10 hover:bg-red-500/5 text-xs font-semibold transition-colors cursor-pointer"
            title="Clear execution log metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Clear Logs</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
            title="Delete Agent"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side: Detailed Run reports markdown output */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            Latest Intelligence Output
          </h3>

          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-6 min-h-[300px]">
            {isLoadingReport ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)] text-xs gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent)]" strokeWidth={1.5} />
                <span>Fetching data snapshot from Autopilot...</span>
              </div>
            ) : latestReport ? (
              <div className="markdown-content text-sm space-y-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{latestReport}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)] text-xs text-center space-y-2">
                <FileCode className="w-10 h-10 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                <p className="font-semibold text-[var(--text-primary)]">No Intelligence Snapshot Generated Yet</p>
                <p className="max-w-xs leading-normal">
                  The scheduler is awaiting trigger or the backend does not have cached outputs. Click &quot;Run Now&quot; to fetch details.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Execution history checklist */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            Execution Logs Feed
          </h3>

          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-5 space-y-4 max-h-[480px] overflow-y-auto">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider pb-2 border-b border-[var(--border-subtle)]">
              <span>Time / Action</span>
              <span>Runs: {task.runCount || 0}</span>
            </div>

            {task.data.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-tertiary)] text-xs">
                No logs generated for this agent.
              </div>
            ) : (
              <div className="relative border-l border-[var(--border-color)] ml-3 pl-4 space-y-5 py-2">
                {task.data.map((log) => (
                  <div key={log.id} className="relative group text-xs">
                    {/* Circle marker */}
                    <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-surface)]" />
                    
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-[var(--text-tertiary)]">
                        {new Date(log.timestamp).toLocaleDateString()} &bull; {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[9px] text-[var(--text-tertiary)]">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed italic pr-2">
                      {log.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
