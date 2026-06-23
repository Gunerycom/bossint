"use client";

import { useTaskStore } from "./TaskStore";
import { TEMPLATES, AgentTemplate } from "../lib/templateData";
import { Compass, LayoutDashboard, Cpu, Sparkles, ArrowRight, Zap, Play, Award, CheckCircle2 } from "lucide-react";

interface WelcomeViewProps {
  onPromptFill: (text: string) => void;
  onDeployClick: (template: AgentTemplate) => void;
}

export default function WelcomeView({ onPromptFill, onDeployClick }: WelcomeViewProps) {
  const { tasks, setView, createConversation } = useTaskStore();

  const totalRuns = tasks.reduce((acc, t) => acc + (t.runCount || 0), 0);
  const activeCount = tasks.filter((t) => t.status === "active" || t.status === "running").length;

  const popularTemplates = TEMPLATES.filter((t) => t.isPopular).slice(0, 4);

  const suggestedPrompts = [
    "Track Bitcoin price fluctuations on CoinGecko hourly and flag changes > 3%",
    "Monitor federal contract filings for green energy listings weekly",
    "Scrape YCombinator front page daily and summarize AI agent launches",
    "Track competitor job postings weekly for machine learning keywords",
  ];

  const handleSuggestedPromptClick = (prompt: string) => {
    const convId = createConversation(prompt.length > 30 ? prompt.slice(0, 30) + "..." : prompt);
    // Fill the input or directly send it (since we created a new conversation, we set view to chat)
    onPromptFill(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
      {/* Top Splash Branding */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent)]/15 bg-[var(--accent-subtle)] text-[var(--accent)] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Next-Generation Intelligence Autopilot</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Autonomous Market Research &amp; OSINT Pipelines
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Create AI agents that gather data, track metrics, watch website alterations, and push insights to your channels automatically.
        </p>
      </div>

      {/* Metrics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl p-5">
        <div className="space-y-1.5 p-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <Cpu className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            <span>Active Agents</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{activeCount}</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">Running on background crons</p>
        </div>

        <div className="space-y-1.5 p-3 text-center sm:text-left border-y sm:border-y-0 sm:border-x border-[var(--border-color)]">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <Zap className="w-4 h-4 text-cyan-500" strokeWidth={1.5} />
            <span>Total Executions</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalRuns}</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">Data fetch logs generated</p>
        </div>

        <div className="space-y-1.5 p-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <Compass className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
            <span>OSINT Templates</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{TEMPLATES.length}</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">Ready-to-deploy blueprints</p>
        </div>
      </div>

      {/* Explore Featured Blueprints */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <Award className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            Featured Agent Blueprints
          </h3>
          <button
            onClick={() => setView("explore")}
            className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Library</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popularTemplates.map((template) => (
            <div
              key={template.id}
              className="group border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all duration-200"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {template.title}
                  </h4>
                  <span className="text-[9px] font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {template.taskType.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-4">
                  {template.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] mt-auto">
                <span className="text-[10px] text-[var(--text-tertiary)] italic">Interval: {template.schedule}</span>
                <button
                  onClick={() => onDeployClick(template)}
                  className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" strokeWidth={1.5} />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Starting Prompts */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Deploy Instantly via Prompt
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedPrompts.map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleSuggestedPromptClick(promptText)}
              className="p-3.5 text-left rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 group flex items-start justify-between gap-3 cursor-pointer"
            >
              <span className="leading-relaxed truncate pr-2">{promptText}</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      {/* Platform Capabilities Highlights */}
      <div className="border border-[var(--border-color)] rounded-2xl p-6 bg-[var(--thinking-bg)] space-y-4">
        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
          Bossint Platform Capabilities
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[var(--text-secondary)]">
          <div className="space-y-1">
            <h5 className="font-bold text-[var(--text-primary)]">Web Crawler Agents</h5>
            <p className="leading-relaxed">Crawls complex JavaScript-rendered web pages, saves text snapshots, and analyzes details.</p>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-[var(--text-primary)]">Cron Scheduling</h5>
            <p className="leading-relaxed">Set automated intervals from 15 minutes to weekly loops to get updates pushed right to your logs.</p>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-[var(--text-primary)]">Autopilot Reasoning</h5>
            <p className="leading-relaxed">Leverages upstream LLM tool calling to execute search steps, read urls, and output structured briefs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
