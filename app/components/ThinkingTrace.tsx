"use client";

import { useState } from "react";

interface ThinkingTraceProps {
  reasoning: string;
  statusLabel: string;
  isStreaming: boolean;
  thinkingDuration?: number;
}

export default function ThinkingTrace({
  reasoning,
  statusLabel,
  isStreaming,
  thinkingDuration,
}: ThinkingTraceProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-collapse when streaming stops and there's reasoning to show
  const showCollapsed = !isStreaming && reasoning.length > 0;

  // Don't render at all if there's nothing to show
  if (!reasoning && !statusLabel && !isStreaming) return null;

  const durationText = thinkingDuration
    ? `Thought for ${thinkingDuration}s`
    : "Thinking";

  return (
    <div
      className="mb-3 rounded-lg overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: "var(--thinking-bg)",
        border: "1px solid var(--thinking-border)",
      }}
    >
      {/* Header / Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer transition-colors duration-150"
        style={{ color: "var(--text-secondary)" }}
      >
        {/* Animated dot */}
        {isStreaming && (
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse-dot flex-shrink-0"
            style={{ backgroundColor: "var(--accent)" }}
          />
        )}

        {/* Label */}
        <span className="font-medium flex-1 min-w-0 truncate">
          {isStreaming
            ? statusLabel || "Thinking…"
            : durationText}
        </span>

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--text-tertiary)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Content */}
      {(isExpanded || (isStreaming && !showCollapsed)) && reasoning && (
        <div
          className="px-3 pb-3 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            color: "var(--text-tertiary)",
            borderTop: "1px solid var(--thinking-border)",
            paddingTop: "0.5rem",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {reasoning}
        </div>
      )}
    </div>
  );
}
