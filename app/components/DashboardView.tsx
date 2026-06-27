import { useState, useMemo } from "react";
import { useTaskStore } from "./TaskStore";
import type { Task, TaskStatus } from "../lib/taskTypes";
import { useRouter } from "next/navigation";
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
  Download,
  Zap,
  Eye,
  MoreVertical,
  Radio,
  Target,
  Globe,
  TrendingUp,
  BarChart3,
  Layers,
  StopCircle,
  RotateCcw,
  ExternalLink,
  Settings2,
  Bot,
  Cpu,
  Workflow,
  Scale,
  BookOpen,
  Briefcase,
  ShoppingCart,
  Leaf
} from "lucide-react";

export default function DashboardView() {
  const {
    tasks,
    runTask,
    stopTask,
    stopAllAgents,
    setTaskStatus,
    deleteTask,
    setView,
    setSelectedAgentId,
    updateTaskDetails,
  } = useTaskStore();
  const router = useRouter();

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

  // Card action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Stat Metrics
  const totalAgents = tasks.length;
  const activeAgents = tasks.filter((t) => t.status === "active").length;
  const runningAgents = tasks.filter((t) => t.status === "running").length;
  const pausedAgents = tasks.filter((t) => t.status === "paused").length;
  const errorAgents = tasks.filter((t) => t.status === "error").length;
  const totalRuns = tasks.reduce((sum, t) => sum + (t.runCount || 0), 0);

  // Category info helpers
  const categoryDetails: Record<string, { title: string; icon: any; colorClass: string; accentHex: string; gradient: string; headerBg: string; headerBgDark: string; headerText: string }> = {
    finance: { title: "Finance & Markets", icon: CircleDollarSign, colorClass: "text-amber-400", accentHex: "#FBBF24", gradient: "from-amber-500/20 via-orange-500/10 to-transparent", headerBg: "#FEF3C7", headerBgDark: "rgba(251,191,36,0.15)", headerText: "text-amber-800 dark:text-amber-300" },
    news: { title: "News & Media", icon: Newspaper, colorClass: "text-sky-400", accentHex: "#38BDF8", gradient: "from-sky-500/20 via-blue-500/10 to-transparent", headerBg: "#DBEAFE", headerBgDark: "rgba(56,189,248,0.15)", headerText: "text-sky-800 dark:text-sky-300" },
    cybersecurity: { title: "Cybersecurity Threats", icon: Shield, colorClass: "text-rose-400", accentHex: "#FB7185", gradient: "from-rose-500/20 via-red-500/10 to-transparent", headerBg: "#FFE4E6", headerBgDark: "rgba(251,113,133,0.15)", headerText: "text-rose-800 dark:text-rose-300" },
    competitive: { title: "Competitive Intel", icon: Target, colorClass: "text-emerald-400", accentHex: "#34D399", gradient: "from-emerald-500/20 via-green-500/10 to-transparent", headerBg: "#D1FAE5", headerBgDark: "rgba(52,211,153,0.15)", headerText: "text-emerald-800 dark:text-emerald-300" },
    research: { title: "Research & Studies", icon: BookOpen, colorClass: "text-violet-400", accentHex: "#A78BFA", gradient: "from-violet-500/20 via-purple-500/10 to-transparent", headerBg: "#EDE9FE", headerBgDark: "rgba(167,139,250,0.15)", headerText: "text-violet-800 dark:text-violet-300" },
    brand: { title: "Brand & Reputation", icon: Sparkles, colorClass: "text-pink-400", accentHex: "#F472B6", gradient: "from-pink-500/20 via-fuchsia-500/10 to-transparent", headerBg: "#FCE7F3", headerBgDark: "rgba(244,114,182,0.15)", headerText: "text-pink-800 dark:text-pink-300" },
    legal: { title: "Legal & Compliance", icon: Scale, colorClass: "text-slate-400", accentHex: "#94A3B8", gradient: "from-slate-500/20 via-gray-500/10 to-transparent", headerBg: "#F1F5F9", headerBgDark: "rgba(148,163,184,0.15)", headerText: "text-slate-700 dark:text-slate-300" },
    geopolitics: { title: "Geopolitics & OSINT", icon: Globe, colorClass: "text-cyan-400", accentHex: "#22D3EE", gradient: "from-cyan-500/20 via-teal-500/10 to-transparent", headerBg: "#CFFAFE", headerBgDark: "rgba(34,211,238,0.15)", headerText: "text-cyan-800 dark:text-cyan-300" },
    esg: { title: "ESG & Sustainability", icon: Leaf, colorClass: "text-lime-400", accentHex: "#A3E635", gradient: "from-lime-500/20 via-green-500/10 to-transparent", headerBg: "#ECFCCB", headerBgDark: "rgba(163,230,53,0.15)", headerText: "text-lime-800 dark:text-lime-300" },
    ecommerce: { title: "E-Commerce & Retail", icon: ShoppingCart, colorClass: "text-orange-400", accentHex: "#FB923C", gradient: "from-orange-500/20 via-amber-500/10 to-transparent", headerBg: "#FFEDD5", headerBgDark: "rgba(251,146,60,0.15)", headerText: "text-orange-800 dark:text-orange-300" },
  };

  const getCategoryMeta = (cat?: string) => {
    return categoryDetails[cat || "research"] || { title: "Other Research", icon: Compass, colorClass: "text-zinc-400", accentHex: "#A1A1AA", gradient: "from-zinc-500/20 via-gray-500/10 to-transparent", headerBg: "#F4F4F5", headerBgDark: "rgba(161,161,170,0.15)", headerText: "text-zinc-700 dark:text-zinc-300" };
  };

  // Helper for status badge rendering — premium glassmorphic badges
  const getStatusBadge = (status: TaskStatus) => {
    const configs: Record<string, { label: string; dotClass: string; badgeClass: string; animate?: boolean }> = {
      active: {
        label: "Active",
        dotClass: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
        badgeClass: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      },
      running: {
        label: "Running",
        dotClass: "bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]",
        badgeClass: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
        animate: true,
      },
      paused: {
        label: "Paused",
        dotClass: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
        badgeClass: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      },
      error: {
        label: "Error",
        dotClass: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
        badgeClass: "text-red-400 bg-red-400/10 border-red-400/20",
      },
      completed: {
        label: "Done",
        dotClass: "bg-zinc-400",
        badgeClass: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
      },
    };
    const cfg = configs[status] || configs.completed;
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full border backdrop-blur-sm ${cfg.badgeClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass} ${cfg.animate ? "animate-pulse" : ""}`} />
        {cfg.label}
      </span>
    );
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

  // Get category-colored icon component for agent type
  const getAgentTypeIcon = (task: Task) => {
    const meta = getCategoryMeta(task.category);
    const Icon = meta.icon;
    return <Icon className={`w-4 h-4 ${meta.colorClass}`} strokeWidth={2} />;
  };

  if (totalAgents === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-8 animate-fade-in">
        {/* Empty state hero */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-48 h-48 rounded-full bg-[var(--accent)] blur-[80px]" />
          </div>
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/20 flex items-center justify-center mx-auto shadow-lg">
            <Bot className="w-10 h-10 text-[var(--accent)]" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No Agents Deployed Yet</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Your command center is ready. Deploy autonomous intelligence agents from the blueprint library to start monitoring.
          </p>
        </div>
        <button
          onClick={() => router.push("/explore")}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white text-sm font-bold hover:shadow-lg hover:shadow-[var(--accent)]/25 transition-all duration-300 cursor-pointer group"
        >
          <Compass className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform duration-300" strokeWidth={2} />
          <span>Explore Blueprints</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6 animate-fade-in text-[var(--text-primary)]">
      
      {/* ═══════════════ COMMAND CENTER HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/15">
              <Cpu className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Agent Control Panel</h2>
              <p className="text-xs text-[var(--text-tertiary)] font-medium">
                {totalAgents} agent{totalAgents !== 1 ? "s" : ""} deployed · {activeAgents + runningAgents} operational · {totalRuns} total scans
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {runningAgents > 0 && (
            <button
              onClick={stopAllAgents}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/15 cursor-pointer transition-all duration-200"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Kill All</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => router.push("/explore")}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white hover:shadow-lg hover:shadow-[var(--accent)]/20 cursor-pointer transition-all duration-300 group"
          >
            <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Deploy Agent</span>
          </button>
        </div>
      </div>

      {/* ═══════════════ LIVE METRICS STRIP ═══════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Fleet", value: totalAgents, color: "text-[var(--text-primary)]", iconColor: "text-[var(--accent)]", Icon: Layers, sparkPath: "M 0 20 Q 25 10, 50 18 T 100 12", sparkColor: "var(--accent)" },
          { label: "Operational", value: activeAgents + runningAgents, color: "text-emerald-400", iconColor: "text-emerald-400", Icon: Radio, sparkPath: "M 0 22 Q 20 8, 40 15 T 80 6 L 100 10", sparkColor: "#34D399" },
          { label: "Paused", value: pausedAgents, color: "text-amber-400", iconColor: "text-amber-400", Icon: Pause, sparkPath: "M 0 15 L 50 15 L 100 15", sparkColor: "#FBBF24" },
          { label: "Alerts", value: errorAgents, color: errorAgents > 0 ? "text-red-400" : "text-[var(--text-tertiary)]", iconColor: errorAgents > 0 ? "text-red-400" : "text-zinc-500", Icon: AlertTriangle, sparkPath: errorAgents > 0 ? "M 0 20 L 70 20 L 80 4 L 90 20 L 100 20" : "M 0 22 L 100 22", sparkColor: errorAgents > 0 ? "#F87171" : "#71717A" },
          { label: "Total Scans", value: totalRuns, color: "text-indigo-400", iconColor: "text-indigo-400", Icon: BarChart3, sparkPath: "M 0 22 L 12 8 L 28 18 L 42 4 L 58 14 L 74 10 L 88 24 L 100 12", sparkColor: "#818CF8" },
        ].map((metric) => (
          <div
            key={metric.label}
            className="group relative overflow-hidden p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--text-tertiary)]/30 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <metric.Icon className={`w-3.5 h-3.5 ${metric.iconColor} opacity-70`} />
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{metric.label}</p>
                </div>
                <p className={`text-2xl font-black tabular-nums ${metric.color}`}>{metric.value}</p>
              </div>
              <svg className="w-16 h-8 opacity-40 group-hover:opacity-70 transition-opacity shrink-0 mt-1" viewBox="0 0 100 30">
                <path d={metric.sparkPath} fill="none" stroke={metric.sparkColor} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════ MAIN CONTENT GRID ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ═══ FLEET OPERATIONS (LEFT COLUMN — 8/12) ═══ */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* ─── Search & Filter Bar ─── */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents by name, prompt, or target..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active / Running</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="finance">Finance</option>
                <option value="news">News</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="competitive">Competitive Intel</option>
                <option value="research">Research</option>
                <option value="brand">Brand</option>
                <option value="legal">Legal</option>
                <option value="geopolitics">Geopolitics</option>
                <option value="esg">ESG</option>
                <option value="ecommerce">E-Commerce</option>
              </select>
            </div>
          </div>

          {/* ─── Bulk Action Toolbar ─── */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 backdrop-blur-sm animate-fade-in-up">
              <div className="flex items-center gap-2.5">
                <button onClick={() => setSelectedIds(new Set())} className="p-1 rounded-lg hover:bg-[var(--accent)]/10 cursor-pointer transition-colors">
                  <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                </button>
                <span className="text-xs font-bold text-[var(--accent)]">{selectedIds.size} agents selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={bulkResume}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer transition-colors"
                >
                  <Play className="w-3 h-3" /> Resume
                </button>
                <button
                  onClick={bulkPause}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer transition-colors"
                >
                  <Pause className="w-3 h-3" /> Pause
                </button>
                <button
                  onClick={bulkDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          )}

          {/* ═══ Category Groups with Agent Cards ═══ */}
          <div className="space-y-4">
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl text-center">
                <Search className="w-8 h-8 text-[var(--text-tertiary)] mb-3 opacity-40" />
                <p className="text-sm font-semibold text-[var(--text-secondary)]">No agents match your filters</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              Object.entries(groupedTasks).map(([cat, catTasks]) => {
                const meta = getCategoryMeta(cat);
                const CatIcon = meta.icon;
                const isCollapsed = collapsedCategories.has(cat);

                return (
                  <div key={cat} className="border border-[var(--border-color)] rounded-2xl overflow-hidden bg-[var(--bg-surface)] shadow-sm">
                    {/* ─── Category Header ─── */}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${meta.gradient} border border-[var(--border-color)]`}>
                          <CatIcon className={`w-4 h-4 ${meta.colorClass}`} />
                        </div>
                        <span className="text-sm font-bold tracking-tight">{meta.title}</span>
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-full border border-[var(--border-color)]">
                          {catTasks.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Select all toggle */}
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleSelectAll(catTasks); }}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-[var(--bg-primary)]"
                        >
                          {selectedIds.size === catTasks.length && catTasks.every(t => selectedIds.has(t.id)) ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                          <span>All</span>
                        </div>
                        <div className="w-px h-4 bg-[var(--border-color)]" />
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                    </button>

                    {/* ─── Agent Cards Grid ─── */}
                    {!isCollapsed && (
                      <div className="p-4 pt-3 border-t border-[var(--border-color)]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {catTasks.map((task) => {
                            const isSelected = selectedIds.has(task.id);
                            const isEditing = editingId === task.id;
                            const cardMeta = getCategoryMeta(task.category);
                            const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

                            return (
                              <div
                                key={task.id}
                                onClick={() => router.push(`/agents/${task.id}`)}
                                className={`
                                  group relative rounded-2xl overflow-hidden cursor-pointer
                                  flex flex-col
                                  border transition-all duration-300 ease-out
                                  hover:-translate-y-1.5 hover:shadow-xl
                                  ${isSelected 
                                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-lg" 
                                    : "border-[var(--border-color)] shadow-sm hover:border-[var(--text-tertiary)]/30"
                                  }
                                `}
                              >
                                {/* ══ COLORED HEADER BAND ══ */}
                                <div 
                                  className="px-4 py-3 space-y-2.5"
                                  style={{ backgroundColor: isDark ? cardMeta.headerBgDark : cardMeta.headerBg }}
                                >
                                  {/* Row 1: Checkbox + Status Badge */}
                                  <div className="flex items-center justify-between">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); toggleSelectOne(task.id); }}
                                      className="text-[var(--text-tertiary)] hover:text-[var(--accent)] cursor-pointer shrink-0 transition-colors"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                                      ) : (
                                        <Square className="w-4 h-4 opacity-40 group-hover:opacity-80 transition-opacity" />
                                      )}
                                    </button>
                                    {getStatusBadge(task.status)}
                                  </div>

                                  {/* Row 2: Icon + Full Title */}
                                  <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-lg shrink-0 bg-white/50 dark:bg-white/10 backdrop-blur-sm">
                                      {getAgentTypeIcon(task)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      {isEditing ? (
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") saveRename(task.id);
                                              else if (e.key === "Escape") cancelRename();
                                            }}
                                            maxLength={60}
                                            className="px-2 py-1 text-sm font-bold rounded-lg border border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none w-full"
                                            autoFocus
                                          />
                                          <button onClick={(e) => { e.stopPropagation(); saveRename(task.id); }} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg cursor-pointer">
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); cancelRename(); }} className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="group/title">
                                          <div className="flex items-start gap-1.5">
                                            <h4 className="text-[13px] font-bold text-[var(--text-primary)] leading-snug line-clamp-2">
                                              {task.title.length > 60 ? task.title.slice(0, 60) + '…' : task.title}
                                            </h4>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); startEditing(task); }}
                                              className="opacity-0 group-hover/title:opacity-100 p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer transition-all mt-0.5 shrink-0"
                                            >
                                              <Edit2 className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* ══ CARD BODY ══ */}
                                <div className="flex-1 bg-[var(--bg-surface)] px-4 py-4 flex flex-col justify-between gap-4">
                                  {/* Agent description — single sentence from prompt */}
                                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 font-medium">
                                    {(() => {
                                      const text = task.prompt || task.target || "No description available.";
                                      // Extract first sentence or truncate
                                      const firstSentence = text.match(/^[^.!?]*[.!?]/) ? text.match(/^[^.!?]*[.!?]/)![0] : text;
                                      return firstSentence.length > 120 ? firstSentence.slice(0, 120) + '…' : firstSentence;
                                    })()}
                                  </p>

                                  {/* Meta row: schedule + runs + last run */}
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{task.schedule.label}</span>
                                    </div>
                                    <div className="w-px h-3 bg-[var(--border-color)]" />
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                                      <Activity className="w-2.5 h-2.5 text-indigo-400" />
                                      <span>{task.runCount || 0} runs</span>
                                    </div>
                                    {task.lastRunAt && (
                                      <>
                                        <div className="w-px h-3 bg-[var(--border-color)]" />
                                        <span className="text-[9px] font-medium text-[var(--text-tertiary)]">
                                          {formatRelativeTime(task.lastRunAt)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* ══ ACTION BAR — Run / Pause / Delete only ══ */}
                                <div className="px-4 py-2.5 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5">
                                    {/* Run */}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); runTask(task.id); }}
                                      disabled={task.status === "running"}
                                      className={`
                                        inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold rounded-xl cursor-pointer transition-all duration-200
                                        ${task.status === "running" 
                                          ? "bg-[var(--bg-primary)] text-[var(--text-tertiary)] opacity-40 cursor-not-allowed" 
                                          : "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-sm active:scale-95"
                                        }
                                      `}
                                      title="Run Scan Now"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>Run</span>
                                    </button>

                                    {/* Pause / Resume / Stop */}
                                    {task.status === "paused" ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setTaskStatus(task.id, "active"); }}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 cursor-pointer transition-all active:scale-95"
                                        title="Resume Agent"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Resume</span>
                                      </button>
                                    ) : task.status === "running" ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); stopTask(task.id); }}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold rounded-xl bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 cursor-pointer transition-all active:scale-95"
                                        title="Stop Agent"
                                      >
                                        <StopCircle className="w-3 h-3" />
                                        <span>Stop</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setTaskStatus(task.id, "paused"); }}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer transition-all active:scale-95"
                                        title="Pause Agent"
                                      >
                                        <Pause className="w-3 h-3" />
                                        <span>Pause</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Delete */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Delete agent "${task.title}"?`)) {
                                        deleteTask(task.id);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-400/10 cursor-pointer transition-all active:scale-95"
                                    title="Delete Agent"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══ INTELLIGENCE FEED (RIGHT COLUMN — 4/12) ═══ */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* ─── Live Activity Feed ─── */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Radio className="w-4 h-4 text-[var(--accent)]" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Live Feed</h3>
              </div>
              <span className="text-[9px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                {recentActivityLogs.length} events
              </span>
            </div>

            <div className="max-h-[480px] overflow-y-auto">
              {recentActivityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5 text-[var(--text-tertiary)] opacity-40" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">No activity yet</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1 max-w-[180px] leading-relaxed">
                    Trigger "Run" on an agent to generate intelligence logs.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {recentActivityLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => router.push(`/agents/${log.taskId}`)}
                      className="p-3.5 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors duration-150 relative group"
                    >
                      {/* Severity accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                        log.severity === "alert" ? "bg-red-400" :
                        log.severity === "warning" ? "bg-amber-400" :
                        "bg-[var(--accent)]/40"
                      }`} />
                      
                      <div className="pl-2.5 space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] line-clamp-1 transition-colors">
                            {log.taskTitle}
                          </span>
                          <span className="text-[9px] text-[var(--text-tertiary)] shrink-0 font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatRelativeTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                          {log.summary}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Quick Fleet Overview ─── */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
              Fleet Health
            </h3>
            
            {/* Status breakdown bar */}
            <div className="space-y-2">
              {totalAgents > 0 && (
                <div className="flex rounded-full overflow-hidden h-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  {(activeAgents + runningAgents) > 0 && (
                    <div 
                      className="bg-emerald-400 transition-all duration-500" 
                      style={{ width: `${((activeAgents + runningAgents) / totalAgents) * 100}%` }}
                      title={`${activeAgents + runningAgents} active`}
                    />
                  )}
                  {pausedAgents > 0 && (
                    <div 
                      className="bg-amber-400 transition-all duration-500" 
                      style={{ width: `${(pausedAgents / totalAgents) * 100}%` }}
                      title={`${pausedAgents} paused`}
                    />
                  )}
                  {errorAgents > 0 && (
                    <div 
                      className="bg-red-400 transition-all duration-500" 
                      style={{ width: `${(errorAgents / totalAgents) * 100}%` }}
                      title={`${errorAgents} errors`}
                    />
                  )}
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[var(--text-tertiary)]">Active ({activeAgents + runningAgents})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[var(--text-tertiary)]">Paused ({pausedAgents})</span>
                </div>
                {errorAgents > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-[var(--text-tertiary)]">Error ({errorAgents})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ EXECUTION HEATMAP ═══════════════ */}
      <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent)]/15 to-transparent border border-[var(--accent)]/10">
              <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-tight">Scan Execution Density</h3>
              <p className="text-[10px] text-[var(--text-tertiary)]">Agent polling activity across the last 7 days</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-tertiary)] font-medium">
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
