"use client";

import { useTaskStore } from "./TaskStore";
import { formatRelativeTime } from "../lib/taskParser";
import {
  Play,
  Pause,
  Trash2,
  FileText,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function DashboardView() {
  const {
    tasks,
    runTask,
    setTaskStatus,
    deleteTask,
    setView,
    setSelectedAgentId,
  } = useTaskStore();

  const totalAgents = tasks.length;
  const activeAgents = tasks.filter((t) => t.status === "active").length;
  const runningAgents = tasks.filter((t) => t.status === "running").length;
  const pausedAgents = tasks.filter((t) => t.status === "paused").length;
  const errorAgents = tasks.filter((t) => t.status === "error").length;
  const totalRuns = tasks.reduce((sum, t) => sum + (t.runCount || 0), 0);

  // Aggregate all run logs from all tasks to show in the Recent Activity feed
  const recentActivity = tasks
    .flatMap((t) =>
      t.data.map((entry) => ({
        ...entry,
        taskTitle: t.title,
        taskId: t.id,
      }))
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  const handleViewDetail = (id: string) => {
    setSelectedAgentId(id);
    setView("agent-detail");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            <CheckCircle className="w-3 h-3" strokeWidth={2} />
            Active
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 animate-pulse">
            <Activity className="w-3 h-3 animate-spin" strokeWidth={2} />
            Running
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Pause className="w-3 h-3" strokeWidth={2} />
            Paused
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <AlertCircle className="w-3 h-3" strokeWidth={2} />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
            Completed
          </span>
        );
    }
  };

  if (totalAgents === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-color)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
          <Activity className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Active Agents Deployed</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            You haven&apos;t scheduled any research agents yet. Head over to the template catalog to deploy your first agent with one click.
          </p>
        </div>
        <button
          onClick={() => setView("explore")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4" strokeWidth={1.5} />
          <span>Explore Blueprints</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Total Agents</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalAgents}</p>
        </div>
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Active Crons</p>
          <p className="text-2xl font-bold text-sky-500">{activeAgents + runningAgents}</p>
        </div>
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Total Runs</p>
          <p className="text-2xl font-bold text-indigo-500">{totalRuns}</p>
        </div>
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Error States</p>
          <p className="text-2xl font-bold text-red-500">{errorAgents}</p>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Operations table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Agent Registries
            </h3>
            <button
              onClick={() => setView("explore")}
              className="text-xs text-[var(--accent)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Deploy New</span>
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>

          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 text-[var(--text-tertiary)] font-semibold">
                    <th className="p-4">Agent Name</th>
                    <th className="p-4">Schedule</th>
                    <th className="p-4">Runs</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[var(--bg-surface-hover)]/30 transition-colors">
                      <td className="p-4 font-semibold text-[var(--text-primary)] min-w-[150px]">
                        <button
                          onClick={() => handleViewDetail(task.id)}
                          className="hover:text-[var(--accent)] text-left cursor-pointer truncate max-w-[200px]"
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                          {task.schedule.label}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium">
                        {task.runCount || 0}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="p-4 text-right space-x-1.5 min-w-[160px]">
                        {/* Run once trigger */}
                        <button
                          onClick={() => runTask(task.id)}
                          className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer inline-flex"
                          title="Run Agent Now"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                        </button>

                        {/* Toggle pause */}
                        {task.status === "paused" ? (
                          <button
                            onClick={() => setTaskStatus(task.id, "active")}
                            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-emerald-500 transition-colors cursor-pointer inline-flex"
                            title="Resume Schedule"
                          >
                            <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setTaskStatus(task.id, "paused")}
                            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-amber-500 transition-colors cursor-pointer inline-flex"
                            title="Pause Schedule"
                          >
                            <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}

                        {/* Detail logs */}
                        <button
                          onClick={() => handleViewDetail(task.id)}
                          className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer inline-flex"
                          title="View Log Reports"
                        >
                          <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer inline-flex"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            Live Run Logs
          </h3>

          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-5 space-y-4 max-h-[480px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-tertiary)] text-xs">
                No activity records yet. Wait for a scheduled agent to run or trigger &quot;Run Agent Now&quot;.
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="text-xs space-y-1.5 pb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-2">
                      <button
                        onClick={() => handleViewDetail(activity.taskId)}
                        className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] text-left cursor-pointer truncate max-w-[150px]"
                      >
                        {activity.taskTitle}
                      </button>
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 font-medium">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed italic pl-2 border-l border-[var(--border-color)]">
                      {activity.summary}
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
