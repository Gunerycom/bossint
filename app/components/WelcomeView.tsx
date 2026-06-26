"use client";

import { useMemo, useEffect, useState } from "react";
import { useTaskStore } from "./TaskStore";
import { TEMPLATES, TEMPLATE_CATEGORIES, AgentTemplate } from "../lib/templateData";
import Dialog from "./Dialog";
import * as Icons from "lucide-react";
import { 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Activity, 
  PlusCircle, 
  LayoutDashboard, 
  MessageSquarePlus, 
  Compass,
  AlertTriangle,
  Clock,
  CircleDollarSign,
  Newspaper,
  Shield,
  Search,
  Settings,
  Eye,
  Globe,
  Award,
  Plus,
  Terminal,
  Volume2,
  Pause,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Trash,
  CheckSquare,
  Square,
  Sparkles,
  Edit2,
  Check,
  X,
  Download
} from "lucide-react";
import type { Task, TaskStatus } from "../lib/taskTypes";

interface WelcomeViewProps {
  onPromptFill: (text: string) => void;
  onPromptSubmit: (text: string) => void;
  onDeployClick: (template: AgentTemplate) => void;
}

interface TrendingAgent {
  id: string;
  title: string;
  creator: string;
  category: string;
  description: string;
  gradient: string;
  iconName: string;
  coverImage: string;
  prompt: string;
  schedule: string;
  taskType: "track" | "crawl" | "monitor" | "custom";
}



const TRENDING_AGENTS: TrendingAgent[] = [
  {
    id: "finance-cryptocurrency-bitcoin",
    title: "Bitcoin Price Tracker",
    creator: "Bossint Crypton",
    category: "Finance",
    description: "Track BTC/USD price movements, funding rates, and volume spikes.",
    gradient: "from-amber-500 via-orange-600 to-yellow-500",
    iconName: "Coins",
    coverImage: "/bitcoin-price-cover.png",
    prompt: "Analyze Bitcoin market metrics on CoinGecko including current price, 24h volume, and order book depth. Highlight any rapid fluctuations greater than 2% in the last 4 hours.",
    schedule: "every 6 hours",
    taskType: "track"
  },
  {
    id: "finance-cryptocurrency-watchlist",
    title: "Altcoin Watchlist",
    creator: "Bossint Crypton",
    category: "Finance",
    description: "Monitor top 20 altcoin price action, daily gainers, and losers.",
    gradient: "from-cyan-500 via-blue-600 to-indigo-700",
    iconName: "TrendingUp",
    coverImage: "/altcoin-watchlist-cover.png",
    prompt: "Scrape the top 20 cryptocurrencies on CoinMarketCap. Summarize the biggest 24h gainers and losers, and extract any recurring narrative tags associated with them.",
    schedule: "daily",
    taskType: "track"
  },
  {
    id: "competitive-competitor-changes",
    title: "Competitor Watchdog",
    creator: "Bossint Intel",
    category: "Competitive",
    description: "Detect updates on landing pages, product catalogs, and pricing of competitors.",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    iconName: "Eye",
    coverImage: "/competitor-watchdog-cover.png",
    prompt: "Crawl target competitor websites (e.g. landing page, pricing page) and compile a diff report highlighting new copy, CTAs, or design tweaks.",
    schedule: "daily",
    taskType: "crawl"
  },
  {
    id: "news-breaking-headlines",
    title: "Global Headlines Digest",
    creator: "Bossint Media",
    category: "News & Media",
    description: "Consolidate breaking news from Reuters, AP, and Bloomberg feeds.",
    gradient: "from-red-500 via-rose-600 to-pink-700",
    iconName: "Globe",
    coverImage: "/global-headlines-cover.png",
    prompt: "Scrape frontpage headlines from Reuters and AP News. Summarize key developments in international relations, regional events, and economy.",
    schedule: "every 6 hours",
    taskType: "crawl"
  },
  {
    id: "finance-stocks-earnings",
    title: "Earnings Calendar Monitor",
    creator: "Bossint Equity",
    category: "Finance",
    description: "Track tech earnings reports, estimated vs actual EPS, and market reactions.",
    gradient: "from-violet-600 via-indigo-700 to-purple-800",
    iconName: "Calendar",
    coverImage: "/earnings-monitor-cover.png",
    prompt: "Extract the list of major tech earnings reports scheduled for this week from Yahoo Finance. List estimated EPS, revenue targets, and actual reports post-release.",
    schedule: "weekly",
    taskType: "track"
  },
  {
    id: "finance-cryptocurrency-whale",
    title: "Crypto Whale Alerts",
    creator: "Bossint Crypton",
    category: "Finance",
    description: "Detect blockchain transactions >$1M on BTC/ETH/Stablecoins.",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    iconName: "Anchor",
    coverImage: "/crypto-whale-cover.png",
    prompt: "Identify on-chain large volume transactions (whales) exceeding $1M in value for BTC, ETH, and stablecoins. Map out destination exchange addresses.",
    schedule: "daily",
    taskType: "monitor"
  },
  {
    id: "competitive-strategic-ma",
    title: "M&A Deal Tracker",
    creator: "Bossint Corporate",
    category: "Competitive",
    description: "Track venture deals, acquisitions, mergers and tech buyouts.",
    gradient: "from-pink-500 via-purple-600 to-indigo-750",
    iconName: "DollarSign",
    coverImage: "/ma-deal-cover.png",
    prompt: "Monitor deal registries and venture funding newsletters for acquisitions, mergers, or buyouts in our market. Report valuations.",
    schedule: "weekly",
    taskType: "monitor"
  },
  {
    id: "cybersecurity-threat-intel",
    title: "Zero-Day Exploit Watch",
    creator: "Bossint Sec",
    category: "Cybersecurity",
    description: "Scan threat databases and security blogs for active exploits.",
    gradient: "from-fuchsia-600 via-pink-700 to-rose-800",
    iconName: "ShieldAlert",
    coverImage: "/zeroday-exploit-cover.png",
    prompt: "Scan security blogs, CVE registries, and cybersecurity forums for newly disclosed zero-day vulnerabilities, active exploits, and patching advisories.",
    schedule: "every 6 hours",
    taskType: "monitor"
  },
  {
    id: "geopolitics-risk-tracker",
    title: "Geopolitical Risk Radar",
    creator: "Bossint OSINT",
    category: "Geopolitics",
    description: "Monitor state conflicts, global sanctions, and public record updates.",
    gradient: "from-green-600 via-emerald-700 to-teal-800",
    iconName: "Compass",
    coverImage: "/geopolitical-risk-cover.png",
    prompt: "Identify and track geopolitical conflicts, sanctions updates, and state-level declarations. Scan public indices and defense reports.",
    schedule: "daily",
    taskType: "monitor"
  },
  {
    id: "brand-reputation-tracker",
    title: "Brand Sentiment Watch",
    creator: "Bossint PR",
    category: "Brand & PR",
    description: "Track public sentiment and brand mentions across social blogs.",
    gradient: "from-yellow-400 via-amber-500 to-orange-600",
    iconName: "Heart",
    coverImage: "/brand-sentiment-cover.png",
    prompt: "Query news indices for brand and executive mentions. Record the sentiment context (positive/negative/neutral) and domain authority.",
    schedule: "daily",
    taskType: "monitor"
  }
];

export default function WelcomeView({ onPromptFill, onPromptSubmit, onDeployClick }: WelcomeViewProps) {
  const { 
    tasks, 
    setView, 
    createConversation, 
    setSelectedAgentId, 
    runTask, 
    setActiveConversationId,
    setTaskStatus,
    deleteTask,
    updateTaskDetails,
    userProfile
  } = useTaskStore();

  const [greeting, setGreeting] = useState("Good morning");

  const userName = useMemo(() => {
    if (userProfile && userProfile.email) {
      const parts = userProfile.email.split("@");
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return "Gökhan";
  }, [userProfile]);

  // Search Chat Bot input
  const [chatbotInput, setChatbotInput] = useState("");

  // Explore presets dialog states
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const LEFT_CATEGORIES = useMemo(() => {
    return TEMPLATE_CATEGORIES.filter((_, idx) => idx % 3 === 0);
  }, []);

  const RIGHT_CATEGORIES = useMemo(() => {
    return TEMPLATE_CATEGORIES.filter((_, idx) => idx % 3 === 1);
  }, []);

  const BOTTOM_CATEGORIES = useMemo(() => {
    return TEMPLATE_CATEGORIES.filter((_, idx) => idx % 3 === 2);
  }, []);

  // Category counts for pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TEMPLATES.forEach((t) => {
      counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
    });
    return counts;
  }, []);

  const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
    return <IconComponent className={className} strokeWidth={1.5} />;
  };


  // My Agents states
  const [dbSearchQuery, setDbSearchQuery] = useState("");
  const [dbStatusFilter, setDbStatusFilter] = useState<"all" | "active" | "paused" | "error">("all");
  const [dbCategoryFilter, setDbCategoryFilter] = useState<string>("all");
  const [dbSortBy, setDbSortBy] = useState<"title" | "status" | "runCount" | "lastRunAt">("title");
  const [dbSortOrder, setDbSortOrder] = useState<"asc" | "desc">("asc");
  const [dbSelectedIds, setDbSelectedIds] = useState<Set<string>>(new Set());
  const [dbCollapsedCategories, setDbCollapsedCategories] = useState<Set<string>>(new Set());
  const [dbEditingId, setDbEditingId] = useState<string | null>(null);
  const [dbEditTitle, setDbEditTitle] = useState("");

  // Determine time-of-day greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // System Health calculations
  const dbTotalAgents = tasks.length;
  const dbActiveAgents = tasks.filter((t) => t.status === "active").length;
  const dbRunningAgents = tasks.filter((t) => t.status === "running").length;
  const dbPausedAgents = tasks.filter((t) => t.status === "paused").length;
  const dbErrorAgents = tasks.filter((t) => t.status === "error").length;
  const dbTotalRuns = tasks.reduce((sum, t) => sum + (t.runCount || 0), 0);
  
  const healthPercentage = useMemo(() => {
    if (dbTotalAgents === 0) return 100;
    return Math.round(((dbTotalAgents - dbErrorAgents) / dbTotalAgents) * 100);
  }, [dbTotalAgents, dbErrorAgents]);

  const systemStatus = useMemo(() => {
    if (dbErrorAgents > 0) return "issues";
    if (dbActiveAgents + dbRunningAgents === 0) return "idle";
    return "healthy";
  }, [dbActiveAgents, dbRunningAgents, dbErrorAgents]);

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
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-450 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Active
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 animate-pulse">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500 animate-pulse"></span>
            </span>
            Running
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-450 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Paused
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-405 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 bg-zinc-500/10 px-2.5 py-0.5 rounded-full border border-zinc-500/20">
            Completed
          </span>
        );
    }
  };

  // Toggle category collapse
  const toggleCategoryCollapse = (cat: string) => {
    setDbCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Inline rename hooks
  const startDbEditing = (task: Task) => {
    setDbEditingId(task.id);
    setDbEditTitle(task.title);
  };

  const saveDbRename = (id: string) => {
    if (dbEditTitle.trim()) {
      updateTaskDetails(id, { title: dbEditTitle.trim() });
    }
    setDbEditingId(null);
  };

  // Selection checkbox logic
  const toggleDbSelectAll = (filteredTasks: Task[]) => {
    if (dbSelectedIds.size === filteredTasks.length) {
      setDbSelectedIds(new Set());
    } else {
      setDbSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const toggleDbSelectOne = (id: string) => {
    setDbSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk actions
  const bulkDbPause = () => {
    dbSelectedIds.forEach((id) => setTaskStatus(id, "paused"));
    setDbSelectedIds(new Set());
  };

  const bulkDbResume = () => {
    dbSelectedIds.forEach((id) => setTaskStatus(id, "active"));
    setDbSelectedIds(new Set());
  };

  const bulkDbDelete = () => {
    if (confirm(`Are you sure you want to delete ${dbSelectedIds.size} agents?`)) {
      dbSelectedIds.forEach((id) => deleteTask(id));
      setDbSelectedIds(new Set());
    }
  };

  // Heatmap generation: 7 rows (Mon-Sun), 24 columns (hours of day)
  const dbHeatmapGrid = useMemo(() => {
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

  // Filters and sorts the task list
  const filteredAndSortedDbTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchSearch =
          t.title.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
          t.prompt.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
          (t.target && t.target.toLowerCase().includes(dbSearchQuery.toLowerCase()));

        const matchStatus =
          dbStatusFilter === "all" ||
          (dbStatusFilter === "active" && (t.status === "active" || t.status === "running")) ||
          t.status === dbStatusFilter;

        const matchCategory = dbCategoryFilter === "all" || t.category === dbCategoryFilter;

        return matchSearch && matchStatus && matchCategory;
      })
      .sort((a, b) => {
        let valA: any = a[dbSortBy] ?? "";
        let valB: any = b[dbSortBy] ?? "";

        if (dbSortBy === "title") {
          valA = (a.title || "").toLowerCase();
          valB = (b.title || "").toLowerCase();
        } else if (dbSortBy === "lastRunAt") {
          valA = a.lastRunAt || 0;
          valB = b.lastRunAt || 0;
        }

        if (valA < valB) return dbSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return dbSortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [tasks, dbSearchQuery, dbStatusFilter, dbCategoryFilter, dbSortBy, dbSortOrder]);

  // Group filtered tasks by Category
  const groupedDbTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    filteredAndSortedDbTasks.forEach((t) => {
      const cat = t.category || "research";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return groups;
  }, [filteredAndSortedDbTasks]);

  const handleExportCSV = () => {
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

  // Filter templates list for preset explorer popup
  const filteredTemplates = useMemo(() => {
    if (!selectedCategoryFilter) return [];
    return TEMPLATES.filter((t) => {
      const matchesCategory = selectedCategoryFilter === "all" || t.categoryId === selectedCategoryFilter;
      const matchesSearch = t.title.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                            t.tags.some((tag) => tag.toLowerCase().includes(modalSearchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategoryFilter, modalSearchQuery]);

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

  const handlePillClick = (categoryId: string) => {
    setSelectedCategoryFilter(categoryId);
    setModalSearchQuery("");
    setIsExploreOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatbotInput.trim()) return;
    onPromptSubmit(chatbotInput.trim());
  };

  const handleTrendingDeploy = (agent: TrendingAgent) => {
    const template: AgentTemplate = {
      id: agent.id,
      categoryId: agent.category.toLowerCase().split(" ")[0], // e.g. "finance"
      subcategoryId: agent.id.split("-")[1] || "default",
      title: agent.title,
      description: agent.description,
      prompt: agent.prompt,
      schedule: agent.schedule,
      taskType: agent.taskType,
      tags: [agent.category.toLowerCase()],
    };
    onDeployClick(template);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10 animate-fade-in text-[var(--text-primary)]">
      
      {/* 1. Header AI Chat Bot Search Centered Layout */}
      <div className="relative max-w-7xl mx-auto py-6 px-2 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 animate-fade-in">
        
        {/* Left Column of Category Constellation (Desktop only) */}
        <div className="hidden lg:flex flex-col items-end gap-3 w-64 shrink-0 pr-2">
          {LEFT_CATEGORIES.map((cat, idx) => {
            const count = categoryCounts[cat.id] || 0;
            const offsets = ["lg:mr-8", "lg:mr-2", "lg:mr-10", "lg:mr-4", "lg:mr-12", "lg:mr-6", "lg:mr-1"];
            const offsetClass = offsets[idx % offsets.length];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handlePillClick(cat.id)}
                className={`px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95 group/pill cursor-pointer ${offsetClass}`}
                title={cat.description}
              >
                <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover/pill:text-[var(--accent)] transition-colors" />
                <span>{cat.title}</span>
                <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-[var(--border-color)] px-1.5 py-0.2 rounded-full font-medium group-hover/pill:text-[var(--accent)] group-hover/pill:border-[var(--accent)]/30 transition-all">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center Chat Box Container */}
        <div className="w-full max-w-2xl sm:max-w-3xl flex flex-col items-center gap-6 text-center">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] font-sans">
              Hey {userName}.
            </h2>
          </div>

          {/* AI Input Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full group text-left">
            <div className="w-full rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/10 shadow-xl p-4 sm:px-5 sm:py-4 transition-all duration-200">
              {/* 1st Row: Textarea */}
              <textarea
                value={chatbotInput}
                onChange={(e) => setChatbotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSearchSubmit(e);
                  }
                }}
                placeholder="How can I help you today?"
                className="w-full bg-transparent text-[var(--text-primary)] text-base sm:text-lg outline-none resize-none placeholder:text-[var(--text-tertiary)] min-h-[40px] focus:outline-none"
                rows={1}
              />

              {/* 2nd Row: Actions Toolbar */}
              <div className="flex items-center justify-between mt-2">
                {/* Left Side */}
                <button
                  type="button"
                  className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Add attachment"
                >
                  <Plus className="w-5.5 h-5.5" />
                </button>

                {/* Right Side */}
                <div className="flex items-center gap-5 text-[var(--text-secondary)]">
                  {/* Voice Input Icon */}
                  <button
                    type="button"
                    className="w-9 h-9 flex items-center justify-center hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Voice input"
                  >
                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3v-6a3 3 0 00-6 0v6a3 3 0 003 3z" />
                    </svg>
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!chatbotInput.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-30 disabled:hover:bg-[var(--accent)] transition-all cursor-pointer shadow-sm"
                    title="Ask AI"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Bottom & Responsive Categories Layout */}
          <div className="space-y-4 w-full">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Explore {TEMPLATES.length} pre-configured agent templates in 20 categories
            </p>

            {/* Desktop Bottom Cluster (Visible only on desktop lg: viewport) */}
            <div className="hidden lg:flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              {BOTTOM_CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handlePillClick(cat.id)}
                    className="px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95 group/pill cursor-pointer"
                    title={cat.description}
                  >
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover/pill:text-[var(--accent)] transition-colors" />
                    <span>{cat.title}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-[var(--border-color)] px-1.5 py-0.2 rounded-full font-medium group-hover/pill:text-[var(--accent)] group-hover/pill:border-[var(--accent)]/30 transition-all">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Unified Layout (Visible only on viewports below lg:) */}
            <div className="flex lg:hidden flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handlePillClick(cat.id)}
                    className="px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95 group/pill cursor-pointer"
                    title={cat.description}
                  >
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover/pill:text-[var(--accent)] transition-colors" />
                    <span>{cat.title}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-[var(--border-color)] px-1.5 py-0.2 rounded-full font-medium group-hover/pill:text-[var(--accent)] group-hover/pill:border-[var(--accent)]/30 transition-all">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column of Category Constellation (Desktop only) */}
        <div className="hidden lg:flex flex-col items-start gap-3 w-64 shrink-0 pl-2">
          {RIGHT_CATEGORIES.map((cat, idx) => {
            const count = categoryCounts[cat.id] || 0;
            const offsets = ["lg:ml-6", "lg:ml-12", "lg:ml-2", "lg:ml-10", "lg:ml-4", "lg:ml-8", "lg:ml-1"];
            const offsetClass = offsets[idx % offsets.length];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handlePillClick(cat.id)}
                className={`px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95 group/pill cursor-pointer ${offsetClass}`}
                title={cat.description}
              >
                <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover/pill:text-[var(--accent)] transition-colors" />
                <span>{cat.title}</span>
                <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-[var(--border-color)] px-1.5 py-0.2 rounded-full font-medium group-hover/pill:text-[var(--accent)] group-hover/pill:border-[var(--accent)]/30 transition-all">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* SECTION 1: My Agents */}
      <div className="space-y-6 pt-6 border-t border-zinc-800/80">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5 font-sans">
              <Cpu className="w-5.5 h-5.5 text-[var(--accent)]" />
              My Agents
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Monitor and coordinate your running AI intelligence fleet.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 hover:border-zinc-700 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setView("explore")}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98]"
            >
              <span>Deploy Agent</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Agents */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950/60 border border-zinc-800/80 hover:border-indigo-500/30 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 rounded-[20px] p-5 flex items-center justify-between group">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Agents</p>
              <p className="text-3xl font-bold tracking-tight font-sans text-zinc-100">{dbTotalAgents}</p>
            </div>
            <svg className="w-14 h-8 text-zinc-550 shrink-0 overflow-visible" viewBox="0 0 100 30">
              <defs>
                <linearGradient id="totalAgentsGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818CF8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d="M 0 25 L 20 22 L 40 18 L 60 14 L 80 8 L 100 4" fill="none" stroke="url(#totalAgentsGrad)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Active Fleet */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950/60 border border-zinc-800/80 hover:border-emerald-500/30 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 rounded-[20px] p-5 flex items-center justify-between group">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Fleet</p>
              <p className="text-3xl font-bold tracking-tight font-sans text-emerald-400">{dbActiveAgents + dbRunningAgents}</p>
            </div>
            <svg className="w-14 h-8 text-emerald-500 shrink-0 overflow-visible" viewBox="0 0 100 30">
              <defs>
                <linearGradient id="activeFleetGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34D399" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#34D399" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d="M 0 15 Q 25 5, 50 15 T 100 15" fill="none" stroke="url(#activeFleetGrad)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Paused */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950/60 border border-zinc-800/80 hover:border-amber-500/30 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 rounded-[20px] p-5 flex items-center justify-between group">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Paused</p>
              <p className="text-3xl font-bold tracking-tight font-sans text-amber-400">{dbPausedAgents}</p>
            </div>
            <svg className="w-14 h-8 text-amber-500 shrink-0 overflow-visible" viewBox="0 0 100 30">
              <defs>
                <linearGradient id="pausedGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FBBF24" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d="M 0 20 L 50 20 L 100 20" fill="none" stroke="url(#pausedGrad)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Active Alerts */}
          <div className={`bg-gradient-to-br from-zinc-900 to-zinc-950/60 border shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 rounded-[20px] p-5 flex items-center justify-between group ${
            dbErrorAgents > 0 ? "border-red-500 bg-red-950/10" : "border-zinc-800/80 hover:border-red-500/30"
          }`}>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Alerts</p>
              <p className={`text-3xl font-bold tracking-tight font-sans ${dbErrorAgents > 0 ? "text-red-400 animate-pulse" : "text-zinc-100"}`}>{dbErrorAgents}</p>
            </div>
            <svg className="w-14 h-8 shrink-0 overflow-visible text-red-500" viewBox="0 0 100 30">
              <defs>
                <linearGradient id="alertsGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                </linearGradient>
              </defs>
              {dbErrorAgents > 0 ? (
                <path d="M 0 25 L 70 25 L 80 5 L 90 25 L 100 25" fill="none" stroke="url(#alertsGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M 0 25 L 100 25" fill="none" stroke="url(#alertsGrad)" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </svg>
          </div>

          {/* Total Scans */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950/60 border border-zinc-800/80 hover:border-indigo-500/30 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 rounded-[20px] p-5 flex items-center justify-between group">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Scans</p>
              <p className="text-3xl font-bold tracking-tight font-sans text-indigo-400">{dbTotalRuns}</p>
            </div>
            <svg className="w-14 h-8 text-indigo-400 shrink-0 overflow-visible" viewBox="0 0 100 30">
              <defs>
                <linearGradient id="scansGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818CF8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d="M 0 25 L 15 10 L 30 22 L 45 5 L 60 18 L 75 12 L 90 28 L 100 15" fill="none" stroke="url(#scansGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Layout containing Table & System Status (Live Feed deleted) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operations Fleet Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters panel */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <div className="relative w-full sm:max-w-xs font-medium">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={dbSearchQuery}
                  onChange={(e) => setDbSearchQuery(e.target.value)}
                  placeholder="Search agent title, prompt..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto font-medium">
                <select
                  value={dbStatusFilter}
                  onChange={(e: any) => setDbStatusFilter(e.target.value)}
                  className="px-3 py-2.5 text-xs rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer transition-colors"
                >
                  <option value="all" className="bg-zinc-900">All Statuses</option>
                  <option value="active" className="bg-zinc-900">Active/Running</option>
                  <option value="paused" className="bg-zinc-900">Paused</option>
                  <option value="error" className="bg-zinc-900">Error</option>
                </select>

                <select
                  value={dbCategoryFilter}
                  onChange={(e) => setDbCategoryFilter(e.target.value)}
                  className="px-3 py-2.5 text-xs rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer transition-colors"
                >
                  <option value="all" className="bg-zinc-900">All Categories</option>
                  <option value="finance" className="bg-zinc-900">Finance</option>
                  <option value="news" className="bg-zinc-900">News</option>
                  <option value="cybersecurity" className="bg-zinc-900">Cybersecurity</option>
                  <option value="competitive" className="bg-zinc-900">Competitive Intel</option>
                  <option value="research" className="bg-zinc-900">Academic/Research</option>
                </select>
              </div>
            </div>

            {/* Bulk Action Toolbar */}
            {dbSelectedIds.size > 0 && (
              <div className="flex items-center justify-between p-3.5 px-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-200 animate-fade-in-up shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 cursor-pointer text-indigo-400" onClick={() => setDbSelectedIds(new Set())} />
                  <span className="text-xs font-semibold">{dbSelectedIds.size} agents selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={bulkDbResume}
                    className="px-3 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                  >
                    Resume
                  </button>
                  <button
                    onClick={bulkDbPause}
                    className="px-3 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                  >
                    Pause
                  </button>
                  <button
                    onClick={bulkDbDelete}
                    className="px-3 py-1 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/25 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Agent Table */}
            <div className="border border-zinc-850 bg-zinc-900/30 rounded-[20px] shadow-lg overflow-hidden">
              {Object.keys(groupedDbTasks).length === 0 ? (
                <div className="text-center py-20 text-xs text-zinc-500 font-medium">
                  {dbTotalAgents === 0 ? "No agents deployed yet. Configure one below to start your fleet." : "No agents match the current filter query."}
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80">
                  {Object.entries(groupedDbTasks).map(([cat, catTasks]) => {
                    const meta = getCategoryMeta(cat);
                    const CatIcon = meta.icon;
                    const isCollapsed = dbCollapsedCategories.has(cat);
                    
                    // Match left border to category accent color
                    let borderLeftClass = "border-l-[4px] border-l-indigo-500/80";
                    if (cat === "finance") borderLeftClass = "border-l-[4px] border-l-amber-500/80";
                    else if (cat === "news") borderLeftClass = "border-l-[4px] border-l-blue-500/80";
                    else if (cat === "cybersecurity") borderLeftClass = "border-l-[4px] border-l-red-500/80";
                    else if (cat === "competitive") borderLeftClass = "border-l-[4px] border-l-emerald-500/80";

                    return (
                      <div key={cat} className="space-y-0.5">
                        {/* Collapsible Group Header */}
                        <div 
                          onClick={() => toggleCategoryCollapse(cat)}
                          className={`flex items-center justify-between px-4 py-3 bg-zinc-900/40 hover:bg-zinc-900/80 cursor-pointer transition-all duration-200 ${borderLeftClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-xl ${meta.colorClass} border border-current/10`}>
                              <CatIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-100">{meta.title}</span>
                            <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-800">
                              {catTasks.length}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`} />
                        </div>

                        {/* Group Table Rows */}
                        {!isCollapsed && (
                          <div className="p-4 bg-zinc-950/20 border-t border-zinc-800/40 space-y-3">
                            {/* Card Selection Toolbar */}
                            <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold">
                              <button
                                onClick={() => toggleDbSelectAll(catTasks)}
                                className="text-zinc-500 hover:text-zinc-300 cursor-pointer select-none transition-colors flex items-center gap-1.5"
                              >
                                {dbSelectedIds.size === catTasks.length ? (
                                  <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                                <span>Select All ({catTasks.length})</span>
                              </button>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                              {catTasks.map((task) => {
                                const isSelected = dbSelectedIds.has(task.id);
                                const isEditing = dbEditingId === task.id;

                                // Custom glow shadows matching status
                                let statusShadow = "hover:shadow-indigo-500/5";
                                if (task.status === "active" || task.status === "running") statusShadow = "hover:shadow-emerald-500/5";
                                else if (task.status === "paused") statusShadow = "hover:shadow-amber-500/5";
                                else if (task.status === "error") statusShadow = "hover:shadow-red-500/5";

                                return (
                                  <div
                                    key={task.id}
                                    className={`bg-zinc-900/90 border rounded-2xl p-4 flex flex-col justify-between min-h-[195px] transition-all duration-300 group relative hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg ${statusShadow} ${
                                      isSelected 
                                        ? "border-[var(--accent)] bg-[var(--accent-subtle)]/15 shadow-sm" 
                                        : "border-zinc-850 hover:border-zinc-700"
                                    }`}
                                  >
                                    {/* Top Row: Checkbox, Name, Status */}
                                    <div className="space-y-2.5">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          {/* Checkbox */}
                                          <button 
                                            onClick={() => toggleDbSelectOne(task.id)}
                                            className="text-zinc-500 hover:text-zinc-300 cursor-pointer shrink-0 transition-colors"
                                          >
                                            {isSelected ? (
                                              <CheckSquare className="w-4.5 h-4.5 text-[var(--accent)]" />
                                            ) : (
                                              <Square className="w-4.5 h-4.5 opacity-60 group-hover:opacity-100" />
                                            )}
                                          </button>
                                          
                                          {/* Title / Rename */}
                                          {isEditing ? (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <input
                                                type="text"
                                                value={dbEditTitle}
                                                onChange={(e) => setDbEditTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") saveDbRename(task.id);
                                                  else if (e.key === "Escape") setDbEditingId(null);
                                                }}
                                                className="px-2 py-0.5 text-xs rounded border border-[var(--accent)] bg-zinc-950 text-zinc-105 focus:outline-none w-full max-w-[150px]"
                                                autoFocus
                                              />
                                              <button onClick={() => saveDbRename(task.id)} className="p-1 text-emerald-450 hover:bg-emerald-500/10 rounded cursor-pointer shrink-0">
                                                <Check className="w-3.5 h-3.5" />
                                              </button>
                                              <button onClick={() => setDbEditingId(null)} className="p-1 text-red-405 hover:bg-red-500/10 rounded cursor-pointer shrink-0">
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1 min-w-0 group/title">
                                              <button
                                                onClick={() => {
                                                  setSelectedAgentId(task.id);
                                                  setView("agent-detail");
                                                }}
                                                className="font-semibold text-[13px] text-zinc-100 hover:text-indigo-400 text-left cursor-pointer line-clamp-1 min-w-0 transition-colors tracking-wide"
                                                title={task.title}
                                              >
                                                {task.title}
                                              </button>
                                              <button 
                                                onClick={() => startDbEditing(task)}
                                                className="opacity-0 group-hover/title:opacity-100 p-0.5 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer transition-opacity"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Status Badge */}
                                        <div className="shrink-0">
                                          {getStatusBadge(task.status)}
                                        </div>
                                      </div>

                                      {/* Prompt/Target Preview */}
                                      <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors line-clamp-2 leading-relaxed min-h-[36px] pl-7 font-normal">
                                        {task.prompt || task.target || "No search prompt defined."}
                                      </p>
                                    </div>

                                    {/* Bottom Row: Stats & Action buttons */}
                                    <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
                                      {/* Execution Stats */}
                                      <div className="flex flex-col gap-1 text-[10px] text-zinc-500 font-medium tracking-wide">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2} />
                                          <span className="uppercase text-[9px] font-semibold text-zinc-400 bg-zinc-800/50 px-1.5 py-0.2 rounded border border-zinc-850">{task.schedule.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Activity className="w-3.5 h-3.5 text-indigo-400" strokeWidth={2} />
                                          <span>{task.runCount || 0} runs · {task.lastRunAt ? formatRelativeTime(task.lastRunAt) : "Never"}</span>
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center gap-0.5">
                                        {/* Run Now */}
                                        <button
                                          onClick={() => runTask(task.id)}
                                          className="p-1.5 rounded-lg text-zinc-450 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer inline-flex transition-colors"
                                          title="Run Scan Now"
                                          disabled={task.status === "running"}
                                        >
                                          <Play className={`w-3.5 h-3.5 ${task.status === "running" ? "text-zinc-650 opacity-30" : "fill-current"}`} />
                                        </button>

                                        {/* Pause / Resume */}
                                        {task.status === "paused" ? (
                                          <button
                                            onClick={() => setTaskStatus(task.id, "active")}
                                            className="p-1.5 rounded-lg text-zinc-450 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer inline-flex transition-colors"
                                            title="Resume Agent"
                                          >
                                            <Play className="w-3.5 h-3.5" />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => setTaskStatus(task.id, "paused")}
                                            className="p-1.5 rounded-lg text-zinc-450 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer inline-flex transition-colors"
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
                                          className="p-1.5 rounded-lg text-zinc-450 hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer inline-flex transition-colors"
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
                                          className="p-1.5 rounded-lg text-zinc-450 hover:text-red-405 hover:bg-red-500/10 cursor-pointer inline-flex transition-colors"
                                          title="Delete Agent"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: System Health (1/3) */}
          <div className="space-y-6">
            {/* System Status details */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950/60 border border-zinc-800/80 rounded-[20px] p-5 shadow-lg flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
              {/* Soft colorful blur glow in upper right corner */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[50px] opacity-10 -mr-10 -mt-10 transition-colors duration-500 ${
                systemStatus === "healthy" ? "bg-emerald-500" :
                systemStatus === "issues" ? "bg-red-500" : "bg-amber-500"
              }`} />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-3">
                  <span className="relative flex h-3 w-3 mt-1.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      systemStatus === "healthy" ? "bg-emerald-400" :
                      systemStatus === "issues" ? "bg-red-400" : "bg-amber-400"
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      systemStatus === "healthy" ? "bg-emerald-500" :
                      systemStatus === "issues" ? "bg-red-500" : "bg-amber-500"
                    }`}></span>
                  </span>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-100">
                      {systemStatus === "healthy" ? "ALL AUTOPILOTS OPERATIONAL" :
                       systemStatus === "issues" ? `${dbErrorAgents} SCAN ISSUES ACTIVE` : "SYSTEM STANDBY - READY TO DEPLOY"}
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                      {dbTotalAgents} agents configured · {dbActiveAgents} active scans · {dbTotalRuns} total scans completed
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-zinc-800/80 relative z-10">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-450 font-sans tracking-wide">
                  <span>Fleet Health</span>
                  <span className="text-zinc-100">{healthPercentage}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800/50 p-[1px]">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)] ${
                      systemStatus === "healthy" ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                      systemStatus === "issues" ? "bg-gradient-to-r from-red-500 to-orange-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : 
                      "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    }`}
                    style={{ width: `${healthPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* SECTION 3: Trending Autopilot Agents */}
      <div className="space-y-4 pt-6 border-t border-[var(--border-color)]">
        <div className="flex justify-between items-center pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            Trending Autopilot Agents
          </h3>
        </div>

        {/* Horizontal scrollable carousel */}
        <div className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
          {TRENDING_AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="w-[220px] shrink-0 group cursor-pointer snap-start"
              onClick={() => handleTrendingDeploy(agent)}
            >
              {/* Spotify-style Square Artwork Cover */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-md bg-neutral-900 border border-[var(--border-color)] transition-all duration-300 transform group-hover:scale-[1.01] group-hover:shadow-lg">
                <img
                  src={agent.coverImage}
                  alt={agent.title}
                  className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                
                {/* Hover Play/Deploy Button overlay */}
                <div className="absolute bottom-3 right-3 bg-white hover:bg-neutral-100 text-black w-9 h-9 rounded-full flex items-center justify-center shadow-md transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <Play className="w-4 h-4 fill-current ml-0.5 text-black" />
                </div>
              </div>

              {/* Info below card */}
              <div className="mt-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">{agent.category}</span>
                  <span className="text-[9px] text-[var(--text-tertiary)] flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {agent.schedule}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 font-sans">
                  {agent.title}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed min-h-[32px] font-medium">
                  {agent.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Scan Execution Density (Last 7 Days) */}
      <div className="border border-zinc-800/80 bg-zinc-900/40 rounded-[20px] p-6 shadow-md hover:shadow-lg transition-all duration-300 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-800/60 pb-3.5 gap-3">
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 font-sans">
              <SlidersHorizontal className="w-4 h-4 text-[var(--accent)]" />
              Scan Execution Density (Last 7 Days)
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Visual representation of background agent polling intervals and runs.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-semibold tracking-wide">
            <span>Fewer</span>
            <span className="w-3 h-3 bg-zinc-950/60 border border-zinc-800/40 rounded-sm" />
            <span className="w-3 h-3 bg-[var(--accent)]/15 border border-[var(--accent)]/10 rounded-sm" />
            <span className="w-3 h-3 bg-[var(--accent)]/40 border border-[var(--accent)]/20 rounded-sm" />
            <span className="w-3 h-3 bg-[var(--accent)]/70 border border-[var(--accent)]/35 rounded-sm" />
            <span className="w-3 h-3 bg-[var(--accent)] border border-[var(--accent)]/50 rounded-sm shadow-[0_0_6px_rgba(129,140,248,0.3)]" />
            <span>More</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {dbHeatmapGrid.map((row) => (
            <div key={row.label} className="flex items-center gap-3.5 group">
              <span className="w-8 text-[11px] font-bold text-zinc-500 text-right uppercase tracking-wider">{row.label}</span>
              <div className="grid grid-cols-24 gap-1 w-full">
                {row.hours.map((count, hour) => {
                  let shadeClass = "bg-zinc-950/60 border border-zinc-800/40 hover:border-zinc-700/60";
                  if (count > 0 && count <= 1) shadeClass = "bg-[var(--accent)]/15 border border-[var(--accent)]/10 shadow-[0_0_4px_rgba(129,140,248,0.05)]";
                  else if (count > 1 && count <= 3) shadeClass = "bg-[var(--accent)]/40 border border-[var(--accent)]/20 shadow-[0_0_6px_rgba(129,140,248,0.15)]";
                  else if (count > 3 && count <= 5) shadeClass = "bg-[var(--accent)]/70 border border-[var(--accent)]/35 shadow-[0_0_8px_rgba(129,140,248,0.25)]";
                  else if (count > 5) shadeClass = "bg-[var(--accent)] border border-[var(--accent)]/50 shadow-[0_0_12px_rgba(129,140,248,0.5)]";

                  return (
                    <div
                      key={hour}
                      className={`h-3.5 rounded-[3px] transition-all relative group/hour cursor-pointer ${shadeClass}`}
                      title={`${row.dateStr} at ${hour}:00: ${count} executions`}
                    >
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 text-[9px] font-bold text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl pointer-events-none opacity-0 group-hover/hour:opacity-100 transition-all scale-95 group-hover/hour:scale-100 whitespace-nowrap z-20 font-sans">
                        {hour}:00 · {count} runs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div className="flex justify-between items-center pl-12 text-[9px] font-bold text-zinc-550 pt-2 border-t border-zinc-800/60 tracking-wider">
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

      {/* Explore presets dialog (keeps compatibility with Category pills clicks) */}
      <Dialog
        isOpen={isExploreOpen}
        onClose={() => {
          setIsExploreOpen(false);
          setSelectedCategoryFilter(null);
        }}
        title="Explore Agent Library"
        subtitle="Search and discover ready-to-deploy blueprints across 20+ industries."
        icon={<Globe className="w-5 h-5" strokeWidth={1.5} />}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 font-sans text-[var(--text-primary)]">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search templates by title, description or tag..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors"
            />
          </div>

          {/* Categories Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryFilter("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategoryFilter === "all"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              All Categories
            </button>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Preset templates list */}
          <div className="max-h-[380px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-200"
                >
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">{template.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)] pt-1">
                      <span>Interval: {template.schedule}</span>
                      {template.tags.length > 0 && (
                        <div className="flex gap-1">
                          {template.tags.slice(0, 3).map((t) => (
                            <span key={t} className="bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded text-[9px] text-[var(--text-secondary)] border border-[var(--border-color)]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsExploreOpen(false);
                      onDeployClick(template);
                    }}
                    className="text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer self-start sm:self-center shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Deploy</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[var(--text-tertiary)] text-xs font-medium">
                No preset blueprints match your search criteria.
              </div>
            )}
          </div>
        </div>
      </Dialog>

    </div>
  );
}
