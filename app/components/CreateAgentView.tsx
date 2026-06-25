"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Sparkles, 
  Play, 
  Plus, 
  ArrowRight, 
  SlidersHorizontal, 
  Upload, 
  FolderPlus, 
  ChevronDown,
  ArrowDown
} from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORIES, AgentTemplate } from "../lib/templateData";

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
  },
  {
    id: "chronicler",
    title: "The Chronicler",
    description: "Condensed wire news. Reuters & Bloomberg. Global market summaries.",
    schedule: "RUNS EVERY 6 HOURS",
    area: "News & Media",
    coverImage: "/cover-chronicler.png",
    template: {
      id: "news-breaking-headlines",
      categoryId: "news",
      subcategoryId: "breaking",
      title: "Global Headlines Digest",
      description: "Consolidate breaking global news from Reuters, AP, and Bloomberg feeds.",
      prompt: "Scrape frontpage headlines from Reuters and AP News. Summarize key developments in international relations, regional events, and economy.",
      schedule: "every 6 hours",
      taskType: "crawl",
      tags: ["news", "global", "headlines"],
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

  // Prompt input state
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Bossint-v2");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // List of models matching theme styling
  const MODELS = ["Bossint-v2", "Gemini 3.5 Flash", "Nano Banana 2", "GPT-4o Mini"];

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
    <div className="min-h-full bg-black text-white py-12 px-6 space-y-12 select-none relative overflow-y-auto">
      
      {/* 1. Centered Header - same size and gray color for both lines */}
      <div className="text-center max-w-4xl mx-auto space-y-1.5 pt-4">
        <h1 className="text-xl sm:text-2xl font-normal text-[#8e8e93] leading-snug font-sans">
          Create your agent or deploy ready agents.
        </h1>
        <p className="text-xl sm:text-2xl font-normal text-[#8e8e93] leading-snug">
          Take sample prompt from them, or create from scratch.
        </p>
      </div>

      {/* 2. Grid of 6 Character-style cards with optimized look */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURED_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="bg-[#121213] border border-[#222] hover:border-neutral-600 rounded-[24px] p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group"
          >
            <div className="flex items-start gap-4">
              {/* Left: Avatar artwork in rounded square frame */}
              <div className="w-[84px] h-[84px] rounded-[18px] overflow-hidden bg-neutral-900 border border-[#2d2d30] shrink-0 flex items-center justify-center">
                <img
                  src={agent.coverImage}
                  alt={agent.title}
                  className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              {/* Right: Text layout */}
              <div className="flex-1 space-y-1 min-w-0">
                <span className="text-[10px] font-bold text-[#8e8e93] tracking-wider uppercase truncate block">
                  {agent.area}
                </span>
                <h3 className="text-base font-bold text-white tracking-wide truncate group-hover:text-[var(--accent)] transition-colors">
                  {agent.title}
                </h3>
                <p className="text-[12px] text-neutral-400 leading-relaxed min-h-[36px] line-clamp-2">
                  {agent.description}
                </p>
              </div>
            </div>

            {/* Bottom Row inside card */}
            <div className="flex items-center justify-between border-t border-[#1e1e20] pt-3 mt-1">
              <span className="text-[9px] text-neutral-500 font-bold tracking-widest uppercase flex items-center gap-1">
                ⏰ {agent.schedule}
              </span>
              <button
                onClick={() => onDeployClick(agent.template)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-[11px] font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                Deploy Agent
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Styled Input Console matching bottom of reference layout */}
      <div className="max-w-2xl mx-auto space-y-5 pt-2">
        <form onSubmit={handlePromptSubmitForm} className="relative w-full text-left">
          <div className="w-full rounded-[24px] border border-[#2a2a2a] bg-[#151515] focus-within:border-neutral-600 shadow-xl p-4 transition-all duration-200">
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
              className="w-full bg-transparent text-white text-sm sm:text-base outline-none resize-none placeholder:text-neutral-650 min-h-[50px] focus:outline-none"
              rows={2}
            />

            {/* Bottom Actions Row inside Input Console */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#222]">
              {/* Left Actions: Plus & Format icons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800/40 transition-all cursor-pointer"
                  title="Attach file"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg border border-[#2a2a2a] text-[10px] font-bold text-neutral-450 hover:text-white hover:bg-neutral-800/40 transition-all flex items-center gap-1 cursor-pointer"
                  title="Format prompt"
                >
                  <SlidersHorizontal className="w-3 h-3 text-neutral-500" />
                  <span>Format</span>
                </button>
              </div>

              {/* Right Actions: Model selector pill + send button */}
              <div className="flex items-center gap-3">
                {/* Model Selector dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="px-3 py-1.5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] hover:bg-neutral-800 text-xs font-semibold text-neutral-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🍌 {selectedModel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  {isModelDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                      <div className="absolute right-0 bottom-full mb-2 w-44 bg-[#151515] border border-[#2a2a2a] rounded-xl shadow-xl py-1 z-20">
                        {MODELS.map((model) => (
                          <button
                            key={model}
                            type="button"
                            onClick={() => {
                              setSelectedModel(model);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#1a1a1a] transition-all cursor-pointer ${
                              selectedModel === model ? "text-[var(--accent)] font-bold" : "text-neutral-300"
                            }`}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!customPrompt.trim()}
                  className="w-8 h-8 rounded-full bg-neutral-800 disabled:opacity-20 text-white hover:bg-[var(--accent)] transition-all flex items-center justify-center cursor-pointer shadow"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Buttons underneath prompt area */}
        <div className="flex items-center justify-center gap-4 text-neutral-400 font-sans">
          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#151515] border border-[#2a2a2a] hover:bg-neutral-900 text-xs font-bold transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-neutral-500" />
            <span>Upload</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#151515] border border-[#2a2a2a] hover:bg-neutral-900 text-xs font-bold transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-neutral-500" />
            <span>Add from Project</span>
          </button>
        </div>
      </div>

      {/* 4. Minimal Search Bar and Scroll down section for more */}
      <div className="max-w-4xl mx-auto pt-16 border-t border-[#1f1f1f] space-y-6">
        
        {/* Scroll Indicator & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500 uppercase tracking-widest font-semibold">
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>Scroll down for more blueprints</span>
          </div>
          <h2 className="text-lg font-bold text-neutral-200">
            Explore All Ready Agents
          </h2>
        </div>

        {/* Search Input and Categories Pill Container */}
        <div className="bg-[#121212] border border-[#1f1f1f] p-5 rounded-2xl space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-neutral-600" />
            <input
              type="text"
              placeholder="Search templates by title, description or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#222] bg-[#0c0c0c] text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 text-xs transition-all"
            />
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                selectedCategory === "all"
                  ? "bg-white text-black border-white"
                  : "bg-[#1c1c1c] text-neutral-400 border-transparent hover:bg-neutral-800"
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
                    ? "bg-white text-black border-white"
                    : "bg-[#1c1c1c] text-neutral-400 border-transparent hover:bg-neutral-800"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Scrolling blueprints grid list */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
            {filteredTemplates.map((blueprint) => (
              <div
                key={blueprint.id}
                className="bg-[#121212] border border-[#1f1f1f] rounded-2xl p-4 flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {blueprint.categoryId}
                    </span>
                    <span className="text-[9px] text-neutral-500">
                      {blueprint.schedule}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-200">
                    {blueprint.title}
                  </h4>
                  <p className="text-xs text-neutral-450 leading-relaxed line-clamp-2">
                    {blueprint.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-end pt-2 border-t border-[#1e1e1e]">
                  <button
                    onClick={() => onDeployClick(blueprint)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[10px] font-bold cursor-pointer transition-all"
                  >
                    Deploy Agent
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-neutral-500">
            No matching blueprints found.
          </div>
        )}
      </div>

    </div>
  );
}
