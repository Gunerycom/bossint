"use client";

import { useMemo, useEffect, useState } from "react";
import { useTaskStore } from "./TaskStore";
import { TEMPLATES, TEMPLATE_CATEGORIES, AgentTemplate } from "../lib/templateData";
import Dialog from "./Dialog";
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
  Volume2
} from "lucide-react";
import type { Task } from "../lib/taskTypes";

interface WelcomeViewProps {
  onPromptFill: (text: string) => void;
  onPromptSubmit: (text: string) => void;
  onDeployClick: (template: AgentTemplate) => void;
}

const CATEGORY_PILLS = [
  { id: "finance", label: "Finance", icon: CircleDollarSign },
  { id: "news", label: "News & Media", icon: Newspaper },
  { id: "cybersecurity", label: "Cybersecurity", icon: Shield },
  { id: "competitive", label: "Competitive Intel", icon: Eye },
  { id: "geopolitics", label: "OSINT & Geopolitics", icon: Globe },
  { id: "brand", label: "Brand Reputation", icon: Award },
  { id: "research", label: "Academic Research", icon: Compass },
];

export default function WelcomeView({ onPromptFill, onPromptSubmit, onDeployClick }: WelcomeViewProps) {
  const { tasks, setView, createConversation, setSelectedAgentId, runTask, setActiveConversationId } = useTaskStore();
  const [greeting, setGreeting] = useState("Good morning");
  const [userName, setUserName] = useState("Gökhan");

  // Search Chat Bot input
  const [chatbotInput, setChatbotInput] = useState("");

  // Explore presets dialog states
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // Determine time-of-day greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // System Health calculations
  const totalAgents = tasks.length;
  const activeAgents = tasks.filter((t) => t.status === "active" || t.status === "running").length;
  const errorAgents = tasks.filter((t) => t.status === "error").length;
  const totalRuns = tasks.reduce((acc, t) => acc + (t.runCount || 0), 0);
  
  const healthPercentage = useMemo(() => {
    if (totalAgents === 0) return 100;
    return Math.round(((totalAgents - errorAgents) / totalAgents) * 100);
  }, [totalAgents, errorAgents]);

  const systemStatus = useMemo(() => {
    if (errorAgents > 0) return "issues";
    if (activeAgents === 0) return "idle";
    return "healthy";
  }, [activeAgents, errorAgents]);

  // Extract recent runs from all agents for the Activity Timeline
  const activityTimeline = useMemo(() => {
    interface TimelineItem {
      taskId: string;
      agentName: string;
      timestamp: number;
      summary: string;
      status: "success" | "error";
    }

    const items: TimelineItem[] = [];
    tasks.forEach((t) => {
      t.data.forEach((entry) => {
        items.push({
          taskId: t.id,
          agentName: t.title,
          timestamp: entry.timestamp,
          summary: entry.summary,
          status: t.status === "error" ? "error" : "success",
        });
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [tasks]);

  // Filter templates list for preset explorer popup
  const filteredTemplates = useMemo(() => {
    if (!selectedCategoryFilter) return [];
    return TEMPLATES.filter((t) => {
      const matchesCategory = selectedCategoryFilter === "all" || t.categoryId === selectedCategoryFilter;
      const matchesSearch = t.title.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(modalSearchQuery.toLowerCase());
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

  // Get Spotify-style cover art based on category and task id keywords
  const getCategoryCover = (category?: string, id?: string) => {
    const cid = id?.toLowerCase() || "";
    switch (category) {
      case "finance":
        if (cid.includes("btc") || cid.includes("bitcoin")) return "/bitcoin-price-cover.png";
        if (cid.includes("whale")) return "/crypto-whale-cover.png";
        if (cid.includes("earnings")) return "/earnings-monitor-cover.png";
        return "/altcoin-watchlist-cover.png";
      case "cybersecurity":
        return "/zeroday-exploit-cover.png";
      case "competitive":
        return "/competitor-watchdog-cover.png";
      case "news":
        return "/global-headlines-cover.png";
      case "brand":
        return "/brand-sentiment-cover.png";
      case "geopolitics":
        return "/geopolitical-risk-cover.png";
      default:
        return "/ma-deal-cover.png";
    }
  };

  const handleCardClick = (taskId: string) => {
    setSelectedAgentId(taskId);
    setView("agent-detail");
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-fade-in text-[var(--text-primary)]">
      
      {/* 1. Header AI Chat Bot Search Centered Layout */}
      <div className="text-center space-y-8 py-10 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] font-sans">
            Hey {userName}.
          </h2>
        </div>

        {/* AI Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl sm:max-w-3xl mx-auto w-full group text-left">
          <div className="w-full rounded-[28px] border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/10 shadow-xl p-6 sm:p-7 transition-all duration-200">
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
              className="w-full bg-transparent text-[var(--text-primary)] text-base sm:text-lg outline-none resize-none placeholder:text-[var(--text-tertiary)] min-h-[70px] focus:outline-none"
              rows={2}
            />

            {/* 2nd Row: Actions Toolbar */}
            <div className="flex items-center justify-between mt-4">
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

        {/* Category Capsule Pills (Image 2 style) */}
        <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto pt-2">
          {CATEGORY_PILLS.map((pill) => {
            const PillIcon = pill.icon;
            return (
              <button
                key={pill.id}
                onClick={() => handlePillClick(pill.id)}
                className="px-3.5 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <PillIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* 3. Grid: Deployed Agents (Left 2/3) & Timeline Feed (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Deployed Agents Grid with Spotify Cover Layout */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--border-color)] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--accent)]" />
              My Deployed Agents ({tasks.length})
            </h3>
            
            {/* Minimalist Capsule Quick Actions */}
            <div className="flex gap-2 text-[10px] font-bold">
              <button 
                onClick={() => setView("explore")} 
                className="px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] cursor-pointer flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3 text-indigo-500" />
                <span>Deploy Preset</span>
              </button>
              <button 
                onClick={() => setView("dashboard")} 
                className="px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] cursor-pointer flex items-center gap-1 transition-all"
              >
                <LayoutDashboard className="w-3 h-3 text-emerald-500" />
                <span>Command Center</span>
              </button>
              <button 
                onClick={() => {
                  setActiveConversationId(null);
                  setView("chat");
                }} 
                className="px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] cursor-pointer flex items-center gap-1 transition-all"
              >
                <MessageSquarePlus className="w-3 h-3 text-blue-500" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl space-y-4">
              <Cpu className="w-8 h-8 text-[var(--text-tertiary)] mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">No active agents deployed</p>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Pick a blueprint template capsule above or write instructions to configure your first agent.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {tasks.map((task) => {
                const latestEntry = task.data[0];
                return (
                  <div
                    key={task.id}
                    className="group cursor-pointer flex flex-col"
                    onClick={() => handleCardClick(task.id)}
                  >
                    {/* Spotify-style Square Artwork Box */}
                    <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-md bg-neutral-900 border border-[var(--border-color)] transition-all duration-300 transform group-hover:scale-[1.01] group-hover:shadow-lg">
                      <img
                        src={getCategoryCover(task.category, task.id)}
                        alt={task.title}
                        className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-65 group-hover:opacity-40 transition-opacity duration-300" />
                      
                      {/* Play hover overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runTask(task.id);
                        }}
                        className="absolute bottom-3 right-3 bg-white hover:bg-neutral-100 text-black w-8 h-8 rounded-full flex items-center justify-center shadow-md transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 cursor-pointer"
                        title="Run scan now"
                        disabled={task.status === "running"}
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-black" />
                      </button>

                      {/* Top status indicator dot */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`inline-block w-2 h-2 rounded-full border border-white shadow-sm ${
                          task.status === "active" ? "bg-[var(--status-healthy)]" :
                          task.status === "running" ? "bg-[var(--status-running)] animate-pulse" :
                          task.status === "error" ? "bg-[var(--status-critical)]" :
                          "bg-[var(--status-warning)]"
                        }`} />
                      </div>
                    </div>

                    {/* Metadata below the cover image */}
                    <div className="mt-2.5 space-y-1">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed min-h-[32px]">
                        {latestEntry ? latestEntry.summary : "Waiting for first scheduled execution cycle..."}
                      </p>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)] mt-1.5 text-[9px] text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {task.lastRunAt ? formatRelativeTime(task.lastRunAt) : "never run"}
                        </span>
                        <span className="font-semibold flex items-center gap-0.5 group-hover:underline text-[var(--accent)]">
                          <span>Details</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right System Status Column */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            System Status
          </h3>

          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-6 min-h-[220px] flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <span className={`inline-block w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                  systemStatus === "healthy" ? "bg-[var(--status-healthy)] animate-pulse-health" :
                  systemStatus === "issues" ? "bg-[var(--status-critical)]" : "bg-[var(--status-warning)]"
                }`} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    {systemStatus === "healthy" ? "ALL AUTOPILOTS OPERATIONAL" :
                     systemStatus === "issues" ? `${errorAgents} SCAN ISSUES ACTIVE` : "SYSTEM STANDBY - READY TO DEPLOY"}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {totalAgents} agents configured · {activeAgents} active scans · {totalRuns} total scans completed
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[var(--border-color)] mb-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                <span>Fleet Health</span>
                <span className="text-[var(--text-primary)]">{healthPercentage}%</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div 
                  className={`h-full transition-all duration-500 ${
                    systemStatus === "healthy" ? "bg-[var(--status-healthy)]" :
                    systemStatus === "issues" ? "bg-[var(--status-critical)]" : "bg-[var(--status-warning)]"
                  }`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
            </div>
            
            <button 
              onClick={() => setView("dashboard")} 
              className="w-full mt-2 py-2 border border-[var(--border-color)] rounded-xl text-center text-xs font-semibold hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
            >
              Go to Command Center
            </button>
          </div>
        </div>

      </div>

      {/* 4. Capsule Category pop-up explore dialogues */}
      <Dialog
        isOpen={isExploreOpen}
        onClose={() => {
          setIsExploreOpen(false);
          setSelectedCategoryFilter(null);
        }}
        title={`Explore Presets: ${
          selectedCategoryFilter === "all" ? "All Categories" : 
          TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategoryFilter)?.title || ""
        }`}
        subtitle="Search and deploy pre-configured blueprints with a single click."
        icon={<Globe className="w-5 h-5" strokeWidth={1.5} />}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-[var(--text-primary)]">
          {/* Search bar inside popup */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search blueprints by title, description..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Preset templates list */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all duration-200"
                >
                  <div className="space-y-1 flex-1">
                    <h4 className="text-xs font-bold">{template.title}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex gap-2 pt-1.5 text-[9px] text-[var(--text-tertiary)]">
                      <span>Interval: {template.schedule}</span>
                      {template.tags.slice(0, 3).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsExploreOpen(false);
                      onDeployClick(template);
                    }}
                    className="px-3.5 py-1.5 text-[11px] font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Deploy
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-[var(--text-tertiary)]">
                No preset blueprints match your search criteria.
              </div>
            )}
          </div>
        </div>
      </Dialog>

    </div>
  );
}
