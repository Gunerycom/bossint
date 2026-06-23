"use client";

import { AgentTemplate } from "../lib/templateData";
import { Clock, Play, Server, Layers, Award } from "lucide-react";

interface TemplateCardProps {
  template: AgentTemplate;
  onDeploy: (template: AgentTemplate) => void;
}

export default function TemplateCard({ template, onDeploy }: TemplateCardProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:shadow-md hover:-translate-y-0.5 rounded-xl p-5 transition-all duration-200 group">
      {/* Popular badge */}
      {template.isPopular && (
        <div className="flex justify-start items-start mb-3">
          <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-full border border-[var(--accent)]/10">
            <Award className="w-3 h-3" strokeWidth={2} />
            POPULAR
          </span>
        </div>
      )}

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
