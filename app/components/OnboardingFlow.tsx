"use client";

import { useState } from "react";
import { useTaskStore } from "./TaskStore";
import { generateTaskId } from "../lib/taskParser";
import type { Task, TaskStatus } from "../lib/taskTypes";
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Coins, 
  Globe, 
  Eye, 
  ShieldAlert, 
  Megaphone, 
  Cpu, 
  PartyPopper 
} from "lucide-react";

interface StarterAgent {
  title: string;
  description: string;
  prompt: string;
  category: string;
  schedule: string;
  intervalMs: number;
  icon: any;
  iconColor: string;
}

const STARTER_AGENTS: StarterAgent[] = [
  {
    title: "Bitcoin Price Tracker",
    description: "Tracks Bitcoin price changes hourly on public feeds and alerts you if fluctuations exceed 2%.",
    prompt: "Track Bitcoin price fluctuations on CoinGecko hourly and flag changes > 2%",
    category: "finance",
    schedule: "Every hour",
    intervalMs: 60 * 60 * 1000,
    icon: Coins,
    iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  },
  {
    title: "Global Headlines Digest",
    description: "Scans major news agencies daily and flags global breaking headlines matching intelligence keywords.",
    prompt: "Scan major international news feeds daily and summarize articles containing high geopolitical keywords.",
    category: "news",
    schedule: "Daily",
    intervalMs: 24 * 60 * 60 * 1000,
    icon: Globe,
    iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20"
  },
  {
    title: "Competitor Web Changes",
    description: "Monitors competitor pricing structures daily, compiling structured reports on page modifications.",
    prompt: "Watch competitor landing pages and pricing directories daily for any updates to pricing values.",
    category: "competitive",
    schedule: "Daily",
    intervalMs: 24 * 60 * 60 * 1000,
    icon: Eye,
    iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    title: "Zero-Day Exploit Watch",
    description: "Aggregates National Vulnerability Database alerts for zero-days matching core architecture keywords.",
    prompt: "Query NVD CVE vulnerability updates daily for zero-days affecting Apache, Postgres or Nginx packages.",
    category: "cybersecurity",
    schedule: "Daily",
    intervalMs: 24 * 60 * 60 * 1000,
    icon: ShieldAlert,
    iconColor: "text-red-500 bg-red-500/10 border-red-500/20"
  },
  {
    title: "Brand Sentiment Watch",
    description: "Analyzes social media mentions and PR logs for negative brand keywords, reporting alerts weekly.",
    prompt: "Search brand index directories weekly for mentions of Bossint and classify sentiment of reviews.",
    category: "brand",
    schedule: "Weekly",
    intervalMs: 7 * 24 * 60 * 60 * 1000,
    icon: Megaphone,
    iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/20"
  },
  {
    title: "AI Tech Launch Digest",
    description: "Crawls HackerNews and ProductHunt daily for AI agent launches, grouping findings into a clean newsletter.",
    prompt: "Read HackerNews top listings daily and summarize launches related to AI agents or AI frameworks.",
    category: "research",
    schedule: "Daily",
    intervalMs: 24 * 60 * 60 * 1000,
    icon: Cpu,
    iconColor: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
  }
];

export default function OnboardingFlow() {
  const { addTask, completeOnboarding, setView, triggerCommand } = useTaskStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deployedName, setDeployedName] = useState("");

  const handlePickStarter = (agent: StarterAgent) => {
    const taskId = generateTaskId();
    const now = Date.now();

    const newTask: Task = {
      id: taskId,
      title: agent.title,
      prompt: agent.prompt,
      type: "track",
      status: "active",
      schedule: {
        label: agent.schedule,
        intervalMs: agent.intervalMs,
      },
      target: agent.title,
      createdAt: now,
      nextRunAt: now + agent.intervalMs,
      runCount: 0,
      data: [],
      category: agent.category,
    };

    // Add locally for feedback
    addTask(newTask);

    // Trigger command upstream
    const commandText = `track "${agent.title}" every ${agent.schedule === "Every hour" ? "1 hour" : agent.schedule.toLowerCase()}: ${agent.prompt}`;
    triggerCommand(commandText);

    setDeployedName(agent.title);
    setStep(3);
  };

  const handleSkipOnboarding = () => {
    completeOnboarding();
    setView("welcome");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)] p-4 overflow-y-auto">
      
      {/* Onboarding Box */}
      <div className="max-w-2xl w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-10 shadow-2xl relative space-y-8 animate-dialog-in">
        
        {/* Skip button top corner */}
        {step < 3 && (
          <button 
            onClick={handleSkipOnboarding}
            className="absolute top-6 right-6 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer font-semibold"
          >
            Skip Setup
          </button>
        )}

        {/* Step 1: Splash Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6 py-6 max-w-lg mx-auto">
            <div className="inline-flex p-3 bg-indigo-500/10 text-[var(--accent)] rounded-2xl">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight">Welcome to Bossint, Gökhan.</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Your next-generation intelligence autopilot is active. Let's deploy your first background monitoring agent to start collecting insights.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all cursor-pointer shadow-md"
              >
                <span>Pick from Blueprints</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  completeOnboarding();
                  setView("chat");
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold cursor-pointer transition-all"
              >
                <span>Write Custom in Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Starter Pack Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold">Pick a Starter Intelligence Agent</h3>
              <p className="text-xs text-[var(--text-secondary)]">These pre-configured blueprints run immediately with one click.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
              {STARTER_AGENTS.map((agent, index) => {
                const AgentIcon = agent.icon;
                return (
                  <div
                    key={index}
                    onClick={() => handlePickStarter(agent)}
                    className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] cursor-pointer transition-all text-left flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${agent.iconColor}`}>
                          <AgentIcon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold group-hover:text-[var(--accent)] transition-colors">{agent.title}</h4>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {agent.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-[var(--text-tertiary)] border-t border-[var(--border-subtle)] pt-2.5 mt-2">
                      <span>Schedule: {agent.schedule}</span>
                      <span className="font-semibold text-[var(--accent)] group-hover:underline flex items-center gap-0.5">
                        <span>Deploy Instantly</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Deployment Success Celebration */}
        {step === 3 && (
          <div className="text-center space-y-6 py-6 max-w-lg mx-auto">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl animate-bounce">
              <PartyPopper className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight">Setup Complete!</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Agent <strong className="text-[var(--text-primary)]">"{deployedName}"</strong> has been initialized successfully. It will automatically crawl targets and update scan logs in the background.
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-primary)]/40 rounded-2xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] flex items-center gap-3 max-w-sm mx-auto">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 stroke-[3px]" />
              <span className="text-left leading-normal">Your intelligence digest is routing to your in-app Dashboard logs feed.</span>
            </div>
            <div className="pt-4">
              <button
                onClick={() => {
                  completeOnboarding();
                  setView("dashboard");
                }}
                className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <span>Enter Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
