"use client";

import type { NLPCommandType } from "../lib/taskTypes";
import {
  Sparkles,
  List,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Clock,
  HelpCircle,
} from "lucide-react";

interface TaskCommandBannerProps {
  commandType: NLPCommandType;
  message: string;
}

const commandMeta: Record<
  NLPCommandType,
  { accentColor: string; bgColor: string }
> = {
  create_task: {
    accentColor: "var(--task-active)",
    bgColor: "var(--task-active-bg)",
  },
  list_tasks: {
    accentColor: "var(--accent)",
    bgColor: "var(--accent-subtle)",
  },
  run_task: {
    accentColor: "var(--task-running)",
    bgColor: "var(--task-running-bg)",
  },
  pause_task: {
    accentColor: "var(--task-paused)",
    bgColor: "var(--task-paused-bg)",
  },
  resume_task: {
    accentColor: "var(--task-active)",
    bgColor: "var(--task-active-bg)",
  },
  delete_task: {
    accentColor: "var(--error-text)",
    bgColor: "var(--error-bg)",
  },
  clear_data: {
    accentColor: "var(--text-secondary)",
    bgColor: "var(--bg-surface)",
  },
  edit_schedule: {
    accentColor: "var(--accent)",
    bgColor: "var(--accent-subtle)",
  },
  unknown: {
    accentColor: "var(--text-tertiary)",
    bgColor: "var(--bg-surface)",
  },
};

function getCommandIcon(type: NLPCommandType) {
  const props = { className: "w-4 h-4", strokeWidth: 1.5 };
  switch (type) {
    case "create_task":
      return <Sparkles {...props} />;
    case "list_tasks":
      return <List {...props} />;
    case "run_task":
    case "resume_task":
      return <Play {...props} />;
    case "pause_task":
      return <Pause {...props} />;
    case "delete_task":
      return <Trash2 {...props} />;
    case "clear_data":
      return <RefreshCw {...props} />;
    case "edit_schedule":
      return <Clock {...props} />;
    case "unknown":
    default:
      return <HelpCircle {...props} />;
  }
}

function normalizeCommandType(type: string): NLPCommandType {
  if (!type) return "unknown";
  const t = type.toLowerCase();
  if (t === "create" || t === "create_task") return "create_task";
  if (t === "list" || t === "list_tasks") return "list_tasks";
  if (t === "run" || t === "run_task") return "run_task";
  if (t === "pause" || t === "pause_task") return "pause_task";
  if (t === "resume" || t === "resume_task") return "resume_task";
  if (t === "delete" || t === "delete_task") return "delete_task";
  if (t === "clear" || t === "clear_data") return "clear_data";
  if (t === "edit" || t === "edit_schedule") return "edit_schedule";
  return "unknown";
}

export default function TaskCommandBanner({
  commandType,
  message,
}: TaskCommandBannerProps) {
  const normalized = normalizeCommandType(commandType);
  const meta = commandMeta[normalized] || commandMeta.unknown;

  return (
    <div className="flex justify-start my-3 animate-fade-in-up">
      <div
        className="max-w-[760px] w-full rounded-xl overflow-hidden"
        style={{
          border: `1px solid ${meta.accentColor}20`,
          backgroundColor: meta.bgColor,
        }}
      >
        {/* Banner Header */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <span style={{ color: meta.accentColor }}>{getCommandIcon(normalized)}</span>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: meta.accentColor }}
          >
            Task Command
          </span>
        </div>

        {/* Message Content */}
        <div
          className="px-4 pb-3 text-[0.875rem] leading-relaxed whitespace-pre-wrap"
          style={{
            color: "var(--text-primary)",
            borderTop: `1px solid ${meta.accentColor}15`,
            paddingTop: "0.75rem",
          }}
        >
          {/* Render markdown-like bold and code */}
          {message.split("\n").map((line, i) => (
            <p key={i} className="mb-1 last:mb-0">
              {renderInlineFormatting(line)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Very simple inline markdown renderer for bold (**) and code (`)
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check for inline code
    const codeMatch = remaining.match(/`(.+?)`/);

    // Find earliest match
    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
    const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;

    if (boldIndex === Infinity && codeIndex === Infinity) {
      // No more formatting
      parts.push(remaining);
      break;
    }

    if (boldIndex <= codeIndex && boldMatch) {
      // Bold comes first
      if (boldIndex > 0) {
        parts.push(remaining.slice(0, boldIndex));
      }
      parts.push(
        <strong key={key++} style={{ fontWeight: 600 }}>
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldIndex + boldMatch[0].length);
    } else if (codeMatch) {
      // Code comes first
      if (codeIndex > 0) {
        parts.push(remaining.slice(0, codeIndex));
      }
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded text-xs font-mono"
          style={{
            backgroundColor: "var(--code-bg)",
            border: "1px solid var(--code-border)",
          }}
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeIndex + codeMatch[0].length);
    }
  }

  return parts;
}
