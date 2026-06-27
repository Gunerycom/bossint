"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { 
  Search, 
  Sparkles, 
  Play, 
  Plus, 
  ArrowRight, 
  ChevronDown,
  ArrowDown,
  Calendar,
  Bell,
  Mic,
  Check
} from "lucide-react";
import * as Icons from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORIES, AgentTemplate } from "../lib/templateData";
import TemplateCard from "./TemplateCard";

// Define the 6 featured character-style agents
interface FeaturedAgent {
  id: string;
  title: string;
  description: string;
  schedule: string;
  area: string;
  coverImage: string;
  template: AgentTemplate;
}

const FEATURED_AGENTS: FeaturedAgent[] = [
  {
    id: "watchdog",
    title: "The Watchdog",
    description: "Rival updates. Price cuts. Marketing shifts. Know first.",
    schedule: "RUNS EVERY 6 HOURS",
    area: "Competitive Intel",
    coverImage: "/cover-watchdog.png",
    template: {
      id: "competitive-competitor-changes",
      categoryId: "competitive",
      subcategoryId: "competitor-monitor",
      title: "Competitor Watchdog",
      description: "Detect updates on landing pages, product catalogs, and pricing of competitors.",
      prompt: "Crawl target competitor websites (e.g. landing page, pricing page) and compile a diff report highlighting new copy, CTAs, or design tweaks.",
      schedule: "daily",
      taskType: "crawl",
      tags: ["competitor", "web-scraping", "positioning"],
    }
  },
  {
    id: "analyst",
    title: "The Analyst",
    description: "Altcoin moves. Narrative spikes. Custom watchlists. Clean data.",
    schedule: "RUNS DAILY",
    area: "Finance & Markets",
    coverImage: "/cover-analyst.png",
    template: {
      id: "finance-cryptocurrency-watchlist",
      categoryId: "finance",
      subcategoryId: "cryptocurrency",
      title: "Altcoin Watchlist",
      description: "Monitor top 20 altcoin price action, daily gainers, and losers.",
      prompt: "Scrape the top 20 cryptocurrencies on CoinMarketCap. Summarize the biggest 24h gainers and losers, and extract any recurring narrative tags associated with them.",
      schedule: "daily",
      taskType: "track",
      tags: ["crypto", "altcoins", "watchlist"],
    }
  },
  {
    id: "scout",
    title: "The Scout",
    description: "Wall Street EPS. Tech stock reports. Pre-market trends.",
    schedule: "RUNS WEEKLY",
    area: "Finance & Markets",
    coverImage: "/cover-scout.png",
    template: {
      id: "finance-stocks-earnings",
      categoryId: "finance",
      subcategoryId: "stocks",
      title: "Earnings Calendar Monitor",
      description: "Track tech earnings reports, estimated vs actual EPS, and market reactions.",
      prompt: "Extract the list of major tech earnings reports scheduled for this week from Yahoo Finance. List estimated EPS, revenue targets, and actual reports post-release.",
      schedule: "weekly",
      taskType: "track",
      tags: ["stocks", "earnings", "tech"],
    }
  },
  {
    id: "hunter",
    title: "The Hunter",
    description: "Large volume transfers. Track smart crypto whales instantly.",
    schedule: "RUNS DAILY",
    area: "Finance & Markets",
    coverImage: "/cover-hunter.png",
    template: {
      id: "finance-cryptocurrency-whale",
      categoryId: "finance",
      subcategoryId: "cryptocurrency",
      title: "Crypto Whale Alerts",
      description: "Detect blockchain transactions >$1M on BTC, ETH, and Stablecoins.",
      prompt: "Identify on-chain large volume transactions (whales) exceeding $1M in value for BTC, ETH, and stablecoins. Map out destination exchange addresses.",
      schedule: "daily",
      taskType: "monitor",
      tags: ["crypto", "whale", "onchain"],
    }
  },
  {
    id: "sentinel",
    title: "The Sentinel",
    description: "Active exploit feeds. CVE registry scanners. High severity warnings.",
    schedule: "RUNS EVERY 6 HOURS",
    area: "Cybersecurity",
    coverImage: "/cover-sentinel.png",
    template: {
      id: "cybersecurity-threat-intel",
      categoryId: "cybersecurity",
      subcategoryId: "threat-intel",
      title: "Zero-Day Exploit Watch",
      description: "Scan CVE registries and security blogs for active threats and zero-days.",
      prompt: "Scan security blogs, CVE registries, and cybersecurity forums for newly disclosed zero-day vulnerabilities, active exploits, and patching advisories.",
      schedule: "every 6 hours",
      taskType: "monitor",
      tags: ["cybersecurity", "threat-intel", "vulnerability"],
    }
  }
];

interface CreateAgentViewProps {
  onPromptFill: (text: string) => void;
  onPromptSubmit: (text: string) => void;
  onDeployClick: (template: AgentTemplate) => void;
}

export default function CreateAgentView({ 
  onPromptFill, 
  onPromptSubmit, 
  onDeployClick 
}: CreateAgentViewProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Dynamic Lucide icon helper
  const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
    return <IconComponent className={className} strokeWidth={1.5} />;
  };

  // Category counts for categories index grid
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TEMPLATES.forEach((t) => {
      counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
    });
    return counts;
  }, []);

  // Prompt input state
  const [customPrompt, setCustomPrompt] = useState("");

  // Intro animation state (runs exactly once on mount, starting after 2 seconds delay, to highlight the console)
  const [isIntroAnimating, setIsIntroAnimating] = useState(false);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    // Start the border animation after 2 seconds of page load
    const startTimer = setTimeout(() => {
      if (!hasInteractedRef.current) {
        setIsIntroAnimating(true);
      }
    }, 2000);

    // End the animation after it completes (10 seconds animation duration)
    const endTimer = setTimeout(() => {
      setIsIntroAnimating(false);
    }, 12000); // 2000ms delay + 10000ms animation duration

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, []);

  const handleInteraction = () => {
    hasInteractedRef.current = true;
    setIsIntroAnimating(false);
  };

  // Schedule and Delivery states
  const [activePanel, setActivePanel] = useState<"schedule" | "delivery" | null>(null);
  const [schedulePreset, setSchedulePreset] = useState("daily");
  const [customSchedule, setCustomSchedule] = useState("Every Monday at 9 am");
  
  // Delivery channel states
  const [deliveryChannels, setDeliveryChannels] = useState<{ [key: string]: boolean }>({
    dashboard: true,
    email: false,
    telegram: false,
    webhook: false,
  });

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceStatus("");
      return;
    }
    
    setIsRecording(true);
    setVoiceStatus("Listening...");
    
    // Simulate audio typing/speech-to-text
    setTimeout(() => {
      setIsRecording(false);
      setVoiceStatus("Transcribed!");
      setCustomPrompt("Track competitor pricing adjustments and daily updates, then alert via email.");
      setTimeout(() => setVoiceStatus(""), 2000);
    }, 2500);
  };

  const handleDeliveryToggle = (key: string) => {
    setDeliveryChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const togglePanel = (panel: "schedule" | "delivery") => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  // Filter templates for search/explore more section
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((template) => {
      const matchesSearch = 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = 
        selectedCategory === "all" || template.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handlePromptSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onPromptSubmit(customPrompt.trim());
    setCustomPrompt("");
  };



  return (
    <div className="min-h-full bg-[var(--bg-primary)] text-[var(--text-primary)] select-none relative overflow-y-auto">
      <style>{`
        @keyframes intro-border-fade {
          0% {
            border-color: var(--accent) !important;
            box-shadow: 0 0 0 4px var(--accent-subtle), var(--shadow-md) !important;
          }
          100% {
            border-color: var(--border-color) !important;
            box-shadow: var(--shadow-md) !important;
          }
        }

        .animate-intro-fade {
          animation: intro-border-fade 10s cubic-bezier(0.16, 1, 0.3, 1) 1 forwards !important;
          transition: none !important;
        }
      `}</style>
      
      {/* 1. Main Dashboard Viewport Section */}
      <div className="min-h-[calc(100vh-65px)] flex flex-col justify-between py-6 px-8 max-w-6xl mx-auto gap-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5 pt-2">
          <h1 className="text-xl sm:text-2xl font-normal text-[var(--text-tertiary)] leading-snug font-sans">
            Create your agent or deploy ready agents.
          </h1>
          <p className="text-xl sm:text-2xl font-normal text-[var(--text-tertiary)] leading-snug font-sans">
            Take sample prompt from them, or create from scratch.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="flex gap-6 items-stretch">
          {/* Vertical rotated text label on the left */}
          <div className="flex items-center justify-center shrink-0 select-none pr-1.5 border-r border-[var(--border-subtle)]/50 mr-1.5">
            <span 
              className="text-[10px] font-bold tracking-[0.25em] text-[var(--text-tertiary)] dark:text-zinc-500 uppercase whitespace-nowrap" 
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Top 5 Agents &mdash; Last 24h
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 flex-1">
          {FEATURED_AGENTS.map((agent) => (
            <div
              key={agent.id}
              onClick={() => onDeployClick(agent.template)}
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--text-tertiary)] rounded-[20px] p-4 flex flex-col justify-between gap-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer text-left"
            >
              <div className="flex items-start gap-3.5">
                {/* Left: Avatar artwork */}
                <div className="w-[68px] h-[68px] rounded-[14px] overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)] shrink-0 flex items-center justify-center">
                  <img
                    src={agent.coverImage}
                    alt={agent.title}
                    className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                
                {/* Right: Text layout */}
                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-[var(--text-primary)] tracking-wide truncate group-hover:text-[var(--accent)] transition-colors">
                    {agent.title}
                  </h3>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {agent.description}
                  </p>
                </div>
              </div>

              {/* Bottom Row inside card: minimal outline CTA */}
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2.5 mt-0.5">
                <span className="text-[9px] text-[var(--text-tertiary)] font-bold tracking-widest uppercase flex items-center gap-1">
                  ⏰ {agent.schedule.replace("RUNS ", "")}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeployClick(agent.template);
                  }}
                  className="px-4 py-1.5 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] hover:!text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer"
                >
                  Run Agent
                </button>
              </div>
            </div>
          ))}

          {/* 6th Card: View All Agents CTA - horizontal layout, no icon, responsive light cream / dark gray background, minimal static style */}
          <div
            onClick={() => {
              document.getElementById("ready-agents-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-[#EAE8E4] dark:bg-zinc-900 border border-[#D4D1CA] dark:border-[var(--border-color)] hover:border-zinc-400 dark:hover:border-[var(--text-tertiary)] rounded-[20px] p-5 flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer text-left relative overflow-hidden"
          >
            {/* Left side: Bigger text with subtext, no icon */}
            <div className="flex flex-col gap-1 min-w-0 pr-4 relative z-10 select-none pointer-events-none">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide leading-tight">
                View All Agents
              </h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-normal font-medium">
                Deploy the ones you want, or get inspiration.
              </p>
            </div>

            {/* Right side: Explore button CTA */}
            <div
              className="px-5 py-2.5 rounded-xl bg-transparent text-zinc-900 dark:text-white border border-zinc-400 dark:border-zinc-700 group-hover:border-zinc-900 dark:group-hover:border-white text-xs font-bold shrink-0 relative z-10 select-none pointer-events-none transition-all duration-200"
            >
              Explore
            </div>
          </div>
        </div>
      </div>

        {/* 3. Input Console Area */}
        <div className="space-y-4">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handlePromptSubmitForm} className="relative w-full text-left">
              <div 
                className={`w-full rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-surface)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/10 shadow-lg p-3.5 transition-all duration-350 ${
                  isIntroAnimating ? "animate-intro-fade" : ""
                }`}
                onFocus={handleInteraction}
                onClick={handleInteraction}
              >
                {/* Prompt input */}
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePromptSubmitForm(e);
                    }
                  }}
                  placeholder="Describe your agent..."
                  className="w-full bg-transparent text-[var(--text-primary)] text-sm outline-none resize-none placeholder:text-[var(--text-tertiary)] min-h-[48px] focus:outline-none"
                  rows={2}
                />

                {/* Bottom Actions Row inside Input Console */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  {/* Left Actions: Plus icon & Schedule / Delivery buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer shrink-0"
                      title="Attach file"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePanel("schedule")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                        activePanel === "schedule"
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                          : "bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[var(--text-tertiary)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Schedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePanel("delivery")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                        activePanel === "delivery"
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                          : "bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[var(--text-tertiary)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      <span>Delivery</span>
                    </button>
                  </div>

                  {/* Right Actions: Mic & send button */}
                  <div className="flex items-center gap-2.5">
                    {/* Voice Status Text */}
                    {voiceStatus && (
                      <span className="text-[10px] text-[var(--error-text)] font-semibold animate-pulse mr-1">
                        {voiceStatus}
                      </span>
                    )}

                    {/* Microphone Button */}
                    <button
                      type="button"
                      onClick={handleVoiceRecord}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isRecording 
                          ? "bg-[var(--error-text)] text-white animate-pulse" 
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                      }`}
                      title={isRecording ? "Stop recording" : "Record voice message"}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={!customPrompt.trim() && !isRecording}
                      className="w-7 h-7 rounded-full bg-[var(--accent)] disabled:opacity-20 text-white hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center cursor-pointer shadow"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Extended Configuration Panel inside the AI Box (Slide down accordion effect) */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    activePanel 
                      ? "max-h-[300px] border-t border-[var(--border-subtle)] mt-3 pt-3 opacity-100" 
                      : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  {activePanel === "schedule" && (
                    <div className="space-y-3 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                            Execution Schedule
                          </label>
                          <div className="relative">
                            <select
                              value={schedulePreset}
                              onChange={(e) => setSchedulePreset(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent)] cursor-pointer appearance-none animate-none"
                            >
                              <option value="hourly">Every hour</option>
                              <option value="every-6">Every 6 hours</option>
                              <option value="every-12">Every 12 hours</option>
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="custom">Custom Schedule</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)] absolute right-2.5 top-2 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                            Custom Schedule Details
                          </label>
                          <input
                            type="text"
                            value={customSchedule}
                            onChange={(e) => setCustomSchedule(e.target.value)}
                            disabled={schedulePreset !== "custom"}
                            placeholder="e.g. Every Monday at 9 am"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-40"
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span>
                          Your agent will execute:{" "}
                          <strong className="text-[var(--text-primary)]">
                            {schedulePreset === "custom" 
                              ? customSchedule 
                              : schedulePreset === "hourly" 
                              ? "Every hour" 
                              : schedulePreset === "every-6" 
                              ? "Every 6 hours" 
                              : schedulePreset === "every-12" 
                              ? "Every 12 hours" 
                              : schedulePreset === "daily" 
                              ? "Daily" 
                              : "Weekly"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {activePanel === "delivery" && (
                    <div className="space-y-2.5 text-left">
                      <span className="block text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
                        Output Delivery Channels
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: "dashboard", label: "In-App Dashboard", desc: "View execution reports & logs" },
                          { id: "email", label: "Email Digests", desc: "Receive automated email summaries" },
                          { id: "telegram", label: "Telegram Push Alerts", desc: "Instant mobile notifications" },
                          { id: "webhook", label: "Custom Webhook Endpoint", desc: "Send JSON payload to API URL" }
                        ].map((channel) => (
                          <label
                            key={channel.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                              deliveryChannels[channel.id]
                                ? "bg-[var(--bg-surface-hover)] border-[var(--text-tertiary)]"
                                : "bg-[var(--bg-primary)] border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                            }`}
                          >
                            <div className="mt-0.5 relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={deliveryChannels[channel.id]}
                                onChange={() => handleDeliveryToggle(channel.id)}
                                className="sr-only"
                              />
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                deliveryChannels[channel.id] 
                                  ? "bg-[var(--accent)] border-[var(--accent)] text-white" 
                                  : "border-[var(--text-tertiary)] bg-transparent"
                              }`}>
                                {deliveryChannels[channel.id] && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                            <div>
                              <span className="block text-[11px] font-semibold text-[var(--text-primary)]">{channel.label}</span>
                              <span className="block text-[9px] text-[var(--text-secondary)]">{channel.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

        </div>

        {/* 4. Disclaimer Note at the bottom */}
        <div className="flex justify-between items-center text-[10px] text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-color)]">
          <span>Bossint can make mistakes, so double check it.</span>
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>

      {/* 5. Minimal Search Bar and Scroll down section for more */}
      <div id="ready-agents-section" className="max-w-4xl mx-auto pt-16 border-t border-[var(--border-color)] space-y-6">
        
        {/* Scroll Indicator & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-semibold">
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>Scroll down for more blueprints</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Ready Agents
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            Deploy or copy pre-configured research and OSINT agents
          </p>
        </div>

        {/* Search Input and Categories Pill Container */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-8 rounded-2xl space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search templates by title, description or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] text-xs transition-all"
            />
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                selectedCategory === "all"
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)]"
              }`}
            >
              All Categories
            </button>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                  selectedCategory === cat.id
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-primary)]"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Categories / Blueprints Grid */}
        {selectedCategory === "all" && !searchQuery.trim() ? (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">
              All Agent Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex flex-col text-left border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:shadow-sm rounded-xl p-5 transition-all duration-150 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3 w-full">
                      <div className="w-9 h-9 rounded-lg bg-[var(--bg-primary)] group-hover:bg-[var(--accent-subtle)] group-hover:text-[var(--accent)] text-[var(--text-secondary)] transition-colors flex items-center justify-center">
                        <CategoryIcon name={cat.icon} className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-2 py-0.5 rounded">
                        {count}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors uppercase tracking-wider">
                      {cat.title}
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-normal line-clamp-2 mb-3">
                      {cat.description}
                    </p>

                    <div className="flex items-center gap-1 text-[10px] font-semibold text-[var(--accent)] mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Explore templates</span>
                      <ArrowRight className="w-3 h-3" strokeWidth={2} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Scrolling blueprints grid list */
          filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
              {filteredTemplates.map((blueprint) => (
                <TemplateCard
                  key={blueprint.id}
                  template={blueprint}
                  onDeploy={onDeployClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">
              No matching blueprints found.
            </div>
          )
        )}
      </div>

    </div>
  );
}
