"use client";

import { useState, useMemo } from "react";
import { useTaskStore } from "./TaskStore";
import type { Task, TaskStatus } from "../lib/taskTypes";
import { 
  Play, 
  Pause, 
  Trash2, 
  FileText, 
  Activity, 
  Clock, 
  Compass, 
  ArrowRight, 
  ChevronDown, 
  ChevronRight,
  Search,
  Filter,
  SlidersHorizontal,
  CircleDollarSign,
  Newspaper,
  Shield,
  Trash,
  CheckSquare,
  Square,
  Sparkles,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Download
} from "lucide-react";

export default function DashboardView() {
  const {
    tasks,
    runTask,
    setTaskStatus,
    deleteTask,
    setView,
    setSelectedAgentId,
    updateTaskDetails,
  } = useTaskStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "error">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"title" | "status" | "runCount" | "lastRunAt">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Collapse states for categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Stat Metrics
  const totalAgents = tasks.length;
  const activeAgents = tasks.filter((t) => t.status === "active").length;
  const runningAgents = tasks.filter((t) => t.status === "running").length;
  const pausedAgents = tasks.filter((t) => t.status === "paused").length;
  const errorAgents = tasks.filter((t) => t.status === "error").length;
  const totalRuns = tasks.reduce((sum, t) => sum + (t.runCount || 0), 0);

  // Category info helpers
  const categoryDetails: Record<string, { title: string; icon: any; colorClass: string }> = {
    finance: { title: "Finance & Markets", icon: CircleDollarSign, colorClass: "text-amber-500 bg-amber-500/10" },
    news: { title: "News & Media", icon: Newspaper, colorClass: "text-blue-500 bg-blue-500/10" },
    cybersecurity: { title: "Cybersecurity Threats", icon: Shield, colorClass: "text-red-500 bg-red-500/10" },
    competitive: { title: "Competitive Intel", icon: Activity, colorClass: "text-emerald-500 bg-emerald-500/10" },
    research: { title: "Research & Studies", icon: Compass, colorClass: "text-indigo-500 bg-indigo-500/10" },
  };

  const getCategoryMeta = (cat?: string) => {
    return categoryDetails[cat || "research"] || { title: "Other Research", icon: Compass, colorClass: "text-zinc-500 bg-zinc-500/10" };
  };

  // Helper for status badge rendering
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/8 px-2 py-0.5 rounded-full border border-emerald-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-indigo-500 bg-indigo-500/8 px-2 py-0.5 rounded-full border border-indigo-500/15 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            Running
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-500 bg-amber-500/8 px-2 py-0.5 rounded-full border border-amber-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Paused
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-500 bg-red-500/8 px-2 py-0.5 rounded-full border border-red-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 bg-zinc-500/8 px-2 py-0.5 rounded-full border border-zinc-500/15">
            Completed
          </span>
        );
    }
  };

  // Toggle category collapse
  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Inline rename hooks
  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      updateTaskDetails(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  // Selection checkbox logic
  const toggleSelectAll = (filteredTasks: Task[]) => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk actions
  const bulkPause = () => {
    selectedIds.forEach((id) => setTaskStatus(id, "paused"));
    setSelectedIds(new Set());
  };

  const bulkResume = () => {
    selectedIds.forEach((id) => setTaskStatus(id, "active"));
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} agents?`)) {
      selectedIds.forEach((id) => deleteTask(id));
      setSelectedIds(new Set());
    }
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

  // Filters and sorts the task list
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Search filter
        const matchSearch =
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.target && t.target.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status filter
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && (t.status === "active" || t.status === "running")) ||
          t.status === statusFilter;

        // Category filter
        const matchCategory = categoryFilter === "all" || t.category === categoryFilter;

        return matchSearch && matchStatus && matchCategory;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy] ?? "";
        let valB: any = b[sortBy] ?? "";

        if (sortBy === "title") {
          valA = (a.title || "").toLowerCase();
          valB = (b.title || "").toLowerCase();
        } else if (sortBy === "lastRunAt") {
          valA = a.lastRunAt || 0;
          valB = b.lastRunAt || 0;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [tasks, searchQuery, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Group filtered tasks by Category
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    filteredAndSortedTasks.forEach((t) => {
      const cat = t.category || "research";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return groups;
  }, [filteredAndSortedTasks]);

  // Recent activity aggregated logs with severity classifications
  const recentActivityLogs = useMemo(() => {
    interface LogItem {
      id: string;
      taskId: string;
      taskTitle: string;
      timestamp: number;
      summary: string;
      severity: "info" | "warning" | "alert";
    }

    const logs: LogItem[] = [];
    tasks.forEach((t) => {
      t.data.forEach((entry) => {
        let severity: "info" | "warning" | "alert" = "info";
        const sumLower = entry.summary.toLowerCase();
        
        if (t.status === "error" || sumLower.includes("error") || sumLower.includes("fail") || sumLower.includes("timeout")) {
          severity = "alert";
        } else if (sumLower.includes("change") || sumLower.includes("alteration") || sumLower.includes("update") || sumLower.includes("warning")) {
          severity = "warning";
        }

        logs.push({
          id: entry.id,
          taskId: t.id,
          taskTitle: t.title,
          timestamp: entry.timestamp,
          summary: entry.summary,
          severity,
        });
      });
    });

    return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
  }, [tasks]);

  // Heatmap generation: 7 rows (Mon-Sun), 24 columns (hours of day)
  const heatmapGrid = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    
    return Array.from({ length: 7 }, (_, dIndex) => {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - (6 - dIndex));
      const dayLabel = days[targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1];
      
      const hours = Array.from({ length: 24 }, (_, hour) => {
        let count = 0;
        tasks.forEach((t) => {
          t.data.forEach((entry) => {
            const entryDate = new Date(entry.timestamp);
            if (
              entryDate.getDate() === targetDate.getDate() &&
              entryDate.getMonth() === targetDate.getMonth() &&
              entryDate.getFullYear() === targetDate.getFullYear() &&
              entryDate.getHours() === hour
            ) {
              count++;
            }
          });
        });
        return count;
      });

      return {
        label: dayLabel,
        hours,
        dateStr: targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      };
    });
  }, [tasks]);

  const handleExportCSV = () => {
    // Generate CSV contents
    const headers = ["Agent ID", "Title", "Category", "Schedule", "Status", "Total Scans", "Last Executed", "Target"];
    const rows = tasks.map((t) => [
      t.id,
      t.title,
      t.category || "research",
      t.schedule.label,
      t.status,
      t.runCount,
      t.lastRunAt ? new Date(t.lastRunAt).toISOString() : "Never",
      t.target,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bossint_fleet_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (totalAgents === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-color)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
          <Activity className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Active Agents Deployed</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            You haven't scheduled any autonomous intelligence agents yet. Deploy standard presets from the templates library or build pipelines in chat.
          </p>
        </div>
        <button
          onClick={() => setView("explore")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors cursor-pointer shadow-sm"
        >
          <Compass className="w-4 h-4" strokeWidth={1.5} />
          <span>Explore Blueprints</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in text-[var(--text-primary)]">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Command Center</h2>
          <p className="text-xs text-[var(--text-secondary)]">Monitor and coordinate your running AI intelligence fleet.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setView("explore")}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] cursor-pointer shadow-sm transition-all"
          >
            <span>Deploy Agent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Bar with Trend SVGs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Agents */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Total Agents</p>
            <p className="text-2xl font-bold">{totalAgents}</p>
          </div>
          <svg className="w-12 h-6 text-zinc-400 shrink-0" viewBox="0 0 100 30">
            <path d="M 0 25 L 20 22 L 40 18 L 60 14 L 80 8 L 100 4" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Active Agents */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Active Fleet</p>
            <p className="text-2xl font-bold text-emerald-500">{activeAgents + runningAgents}</p>
          </div>
          <svg className="w-12 h-6 text-emerald-500 shrink-0" viewBox="0 0 100 30">
            <path d="M 0 15 Q 25 5, 50 15 T 100 15" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Paused */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Paused</p>
            <p className="text-2xl font-bold text-amber-500">{pausedAgents}</p>
          </div>
          <svg className="w-12 h-6 text-amber-500 shrink-0" viewBox="0 0 100 30">
            <path d="M 0 20 L 50 20 L 100 20" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Errors / Alerts */}
        <div className={`p-4 bg-[var(--bg-surface)] border rounded-2xl flex items-center justify-between shadow-sm transition-colors ${
          errorAgents > 0 ? "border-red-500/25 bg-red-500/5 animate-pulse-health" : "border-[var(--border-color)]"
        }`}>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Active Alerts</p>
            <p className={`text-2xl font-bold ${errorAgents > 0 ? "text-red-500" : "text-[var(--text-primary)]"}`}>{errorAgents}</p>
          </div>
          <svg className={`w-12 h-6 shrink-0 ${errorAgents > 0 ? "text-red-500" : "text-zinc-300"}`} viewBox="0 0 100 30">
            {errorAgents > 0 ? (
              <path d="M 0 25 L 70 25 L 80 5 L 90 25 L 100 25" fill="none" stroke="currentColor" strokeWidth="2" />
            ) : (
              <path d="M 0 25 L 100 25" fill="none" stroke="currentColor" strokeWidth="2" />
            )}
          </svg>
        </div>

        {/* Total Scans */}
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Total Scans</p>
            <p className="text-2xl font-bold text-indigo-500">{totalRuns}</p>
          </div>
          <svg className="w-12 h-6 text-indigo-500 shrink-0" viewBox="0 0 100 30">
            <path d="M 0 25 L 15 10 L 30 22 L 45 5 L 60 18 L 75 12 L 90 28 L 100 15" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Main Split Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Operations Fleet Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Action Filters Panel */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agent title, prompt..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active/Running</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="finance">Finance</option>
                <option value="news">News</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="competitive">Competitive Intel</option>
                <option value="research">Academic/Research</option>
              </select>
            </div>

          </div>

          {/* Bulk Action Toolbar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--accent)]/15 bg-[var(--accent-subtle)] text-[var(--accent)] animate-fade-in-up">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 cursor-pointer" onClick={() => setSelectedIds(new Set())} />
                <span className="text-xs font-semibold">{selectedIds.size} agents selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={bulkResume}
                  className="px-2.5 py-1 text-xs font-bold bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
                >
                  Resume
                </button>
                <button
                  onClick={bulkPause}
                  className="px-2.5 py-1 text-xs font-bold bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
                >
                  Pause
                </button>
                <button
                  onClick={bulkDelete}
                  className="px-2.5 py-1 text-xs font-bold bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/20 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Category-Grouped Agent Table */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl shadow-sm overflow-hidden">
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">
                No agents match the current filter query.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {Object.entries(groupedTasks).map(([cat, catTasks]) => {
                  const meta = getCategoryMeta(cat);
                  const CatIcon = meta.icon;
                  const isCollapsed = collapsedCategories.has(cat);

                  return (
                    <div key={cat} className="space-y-0.5">
                      {/* Collapsible Group Header */}
                      <div 
                        onClick={() => toggleCategory(cat)}
                        className="flex items-center justify-between p-3.5 bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary)]/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${meta.colorClass}`}>
                            <CatIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider">{meta.title}</span>
                          <span className="text-[10px] font-semibold text-[var(--text-tertiary)] px-2 py-0.5 rounded-full bg-[var(--bg-surface-hover)]">
                            {catTasks.length}
                          </span>
                        </div>
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />}
                      </div>

                      {/* Group Table Rows */}
                      {!isCollapsed && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-[var(--border-color)] text-[var(--text-tertiary)] font-bold bg-[var(--bg-surface)]">
                                <th className="p-3 w-8">
                                  <button
                                    onClick={() => toggleSelectAll(catTasks)}
                                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                                  >
                                    {selectedIds.size === catTasks.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                  </button>
                                </th>
                                <th className="p-3">Agent Name</th>
                                <th className="p-3">Schedule</th>
                                <th className="p-3">Run Count</th>
                                <th className="p-3">Last Active</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                              {catTasks.map((task) => {
                                const isSelected = selectedIds.has(task.id);
                                const isEditing = editingId === task.id;

                                return (
                                  <tr 
                                    key={task.id} 
                                    className={`hover:bg-[var(--bg-surface-hover)]/30 transition-colors ${
                                      isSelected ? "bg-[var(--accent-subtle)]/40" : ""
                                    }`}
                                  >
                                    {/* Checkbox */}
                                    <td className="p-3">
                                      <button 
                                        onClick={() => toggleSelectOne(task.id)}
                                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                                      >
                                        {isSelected ? <CheckSquare className="w-4 h-4 text-[var(--accent)]" /> : <Square className="w-4 h-4" />}
                                      </button>
                                    </td>

                                    {/* Title / Rename */}
                                    <td className="p-3 font-semibold text-[var(--text-primary)]">
                                      {isEditing ? (
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") saveRename(task.id);
                                              else if (e.key === "Escape") cancelRename();
                                            }}
                                            className="px-2 py-1 text-xs rounded border border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none max-w-[150px]"
                                            autoFocus
                                          />
                                          <button onClick={() => saveRename(task.id)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer">
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={cancelRename} className="p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 group/title">
                                          <button
                                            onClick={() => {
                                              setSelectedAgentId(task.id);
                                              setView("agent-detail");
                                            }}
                                            className="hover:text-[var(--accent)] text-left cursor-pointer truncate max-w-[180px]"
                                          >
                                            {task.title}
                                          </button>
                                          <button 
                                            onClick={() => startEditing(task)}
                                            className="opacity-0 group-hover/title:opacity-100 p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer transition-opacity"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </td>

                                    {/* Schedule */}
                                    <td className="p-3 text-[var(--text-secondary)]">
                                      <span className="inline-flex items-center gap-1 text-[11px]">
                                        <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                                        {task.schedule.label}
                                      </span>
                                    </td>

                                    {/* Run Count */}
                                    <td className="p-3 font-medium text-[var(--text-secondary)] text-center w-20">
                                      {task.runCount || 0}
                                    </td>

                                    {/* Last Active */}
                                    <td className="p-3 text-[var(--text-secondary)] text-[11px]">
                                      {task.lastRunAt ? formatRelativeTime(task.lastRunAt) : "Never"}
                                    </td>

                                    {/* Status Badge */}
                                    <td className="p-3">
                                      {getStatusBadge(task.status)}
                                    </td>

                                    {/* Quick Actions */}
                                    <td className="p-3 text-right space-x-1 min-w-[140px]">
                                      {/* Run Now */}
                                      <button
                                        onClick={() => runTask(task.id)}
                                        className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer inline-flex"
                                        title="Run Scan Now"
                                        disabled={task.status === "running"}
                                      >
                                        <Play className={`w-3.5 h-3.5 ${task.status === "running" ? "text-zinc-300" : "fill-current"}`} />
                                      </button>

                                      {/* Pause / Resume */}
                                      {task.status === "paused" ? (
                                        <button
                                          onClick={() => setTaskStatus(task.id, "active")}
                                          className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-emerald-500 cursor-pointer inline-flex"
                                          title="Resume Agent"
                                        >
                                          <Play className="w-3.5 h-3.5" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => setTaskStatus(task.id, "paused")}
                                          className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-amber-500 cursor-pointer inline-flex"
                                          title="Pause Agent"
                                          disabled={task.status === "running"}
                                        >
                                          <Pause className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {/* View detail */}
                                      <button
                                        onClick={() => {
                                          setSelectedAgentId(task.id);
                                          setView("agent-detail");
                                        }}
                                        className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer inline-flex"
                                        title="View Reports & History"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Delete */}
                                      <button
                                        onClick={() => {
                                          if (confirm(`Delete agent "${task.title}"?`)) {
                                            deleteTask(task.id);
                                          }
                                        }}
                                        className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 cursor-pointer inline-flex"
                                        title="Delete Agent"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Live Feed Column Right (1/3) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent)] animate-pulse" />
            Live Operations Feed
          </h3>

          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-4 space-y-4 max-h-[520px] overflow-y-auto shadow-sm">
            {recentActivityLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">
                No activity scans recorded yet. Trigger "Run Scan Now" to generate logs.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivityLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => {
                      setSelectedAgentId(log.taskId);
                      setView("agent-detail");
                    }}
                    className="p-3 text-[11px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/20 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-all duration-150 relative overflow-hidden group"
                  >
                    {/* Severity highlight border */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      log.severity === "alert" ? "bg-[var(--status-critical)]" :
                      log.severity === "warning" ? "bg-[var(--status-warning)]" :
                      "bg-[var(--status-info)]"
                    }`} />
                    
                    <div className="flex justify-between items-start gap-2 pl-1.5">
                      <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] line-clamp-1 transition-colors">
                        {log.taskTitle}
                      </span>
                      <span className="text-[9px] text-[var(--text-tertiary)] shrink-0 font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>

                    <p className="text-[var(--text-secondary)] leading-relaxed mt-1.5 pl-1.5 italic line-clamp-2">
                      {log.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Execution Heatmap Block (Bottom) */}
      <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--accent)]" />
              Scan Execution Density (Last 7 Days)
            </h3>
            <p className="text-[10px] text-[var(--text-tertiary)]">Visual representation of background agent polling intervals and runs.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-tertiary)]">
            <span>Fewer</span>
            <span className="w-2.5 h-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-sm" />
            <span className="w-2.5 h-2.5 bg-[var(--accent)]/10 rounded-sm" />
            <span className="w-2.5 h-2.5 bg-[var(--accent)]/40 rounded-sm" />
            <span className="w-2.5 h-2.5 bg-[var(--accent)]/70 rounded-sm" />
            <span className="w-2.5 h-2.5 bg-[var(--accent)] rounded-sm" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-2">
          {heatmapGrid.map((row) => (
            <div key={row.label} className="flex items-center gap-2 group">
              <span className="w-8 text-[10px] font-semibold text-[var(--text-tertiary)] text-right">{row.label}</span>
              <div className="grid grid-cols-24 gap-1 w-full">
                {row.hours.map((count, hour) => {
                  // Determine shade based on count
                  let shadeClass = "bg-[var(--bg-primary)] border border-[var(--border-color)]/60";
                  if (count > 0 && count <= 1) shadeClass = "bg-[var(--accent)]/20";
                  else if (count > 1 && count <= 3) shadeClass = "bg-[var(--accent)]/45";
                  else if (count > 3 && count <= 5) shadeClass = "bg-[var(--accent)]/70";
                  else if (count > 5) shadeClass = "bg-[var(--accent)]";

                  return (
                    <div
                      key={hour}
                      className={`h-3.5 rounded-sm transition-all relative group/hour ${shadeClass}`}
                      title={`${row.dateStr} at ${hour}:00: ${count} executions`}
                    >
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2 py-1 text-[9px] font-semibold text-white bg-zinc-900 rounded shadow-md pointer-events-none opacity-0 group-hover/hour:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {hour}:00: {count} runs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Timeline axis hours */}
          <div className="flex justify-between items-center pl-10 text-[9px] text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)]">
            <span>12:00 AM</span>
            <span>4:00 AM</span>
            <span>8:00 AM</span>
            <span>12:00 PM</span>
            <span>4:00 PM</span>
            <span>8:00 PM</span>
            <span>11:00 PM</span>
          </div>
        </div>
      </div>

    </div>
  );
}
