"use client";

import { AgentTemplate } from "../lib/templateData";
import { Clock, Play, Server, Layers, Award } from "lucide-react";

interface TemplateCardProps {
  template: AgentTemplate;
  onDeploy: (template: AgentTemplate) => void;
}

export default function TemplateCard({ template, onDeploy }: TemplateCardProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "track":
        return { label: "Track Metrics", className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" };
      case "crawl":
        return { label: "Web Scrape", className: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" };
      case "monitor":
        return { label: "Continuous Alert", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
      default:
        return { label: "Custom Intelligence", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" };
    }
  };

  const badge = getTypeBadge(template.taskType);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:shadow-md hover:-translate-y-0.5 rounded-xl p-5 transition-all duration-200 group">
      {/* Popular badge */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badge.className}`}>
          {badge.label}
        </span>
        {template.isPopular && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-full border border-[var(--accent)]/10">
            <Award className="w-3 h-3" strokeWidth={2} />
            POPULAR
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 group-hover:text-[var(--accent)] transition-colors">
          {template.title}
        </h4>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-4">
          {template.description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] font-medium">
          <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{template.schedule}</span>
        </div>

        <button
          onClick={() => onDeploy(template)}
          className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[var(--accent-subtle)] cursor-pointer"
        >
          <Play className="w-3 h-3 fill-current" strokeWidth={1.5} />
          <span>Deploy</span>
        </button>
      </div>
    </div>
  );
}
