"use client";

import { useRef, useEffect, type KeyboardEvent, type FormEvent } from "react";
import { useTheme } from "./ThemeProvider";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Re-focus after streaming completes
  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) {
        onSend();
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isStreaming) {
      onStop();
    } else if (value.trim()) {
      onSend();
    }
  };

  return (
    <div
      className="sticky bottom-0 w-full px-4 sm:px-6 pb-4 pt-2"
      style={{
        background: `linear-gradient(to bottom, transparent, var(--bg-primary) 30%)`,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-[820px] mx-auto"
      >
        <div
          className="relative flex items-end rounded-2xl transition-all duration-200"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-md)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
          }}
        >
          {/* Logo before input */}
          <div className="flex-shrink-0 pl-4 pb-3.5 flex items-center justify-center select-none">
            <img
              src="/bossint-b.png"
              alt=""
              className="w-5 h-5"
              style={{
                filter: theme === "dark" ? "invert(1)" : "none",
              }}
            />
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Bossint anything..."
            disabled={isStreaming || disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent pl-2 pr-4 py-3.5 text-[0.935rem] leading-relaxed outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
            style={{
              color: "var(--text-primary)",
              maxHeight: "200px",
            }}
          />

          {/* Send / Stop button */}
          <div className="flex-shrink-0 p-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
                style={{
                  backgroundColor: "var(--error-bg)",
                  color: "var(--error-text)",
                }}
              >
                {/* Stop icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!value.trim() || disabled}
                aria-label="Send message"
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  backgroundColor: value.trim()
                    ? "var(--accent)"
                    : "var(--bg-surface-hover)",
                  color: value.trim() ? "#FFFFFF" : "var(--text-tertiary)",
                }}
                onMouseEnter={(e) => {
                  if (value.trim()) {
                    e.currentTarget.style.backgroundColor = "var(--accent-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (value.trim()) {
                    e.currentTarget.style.backgroundColor = "var(--accent)";
                  }
                }}
              >
                {/* Arrow up icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <p
          className="text-xs text-center mt-2 select-none"
          style={{ color: "var(--text-tertiary)" }}
        >
          Bossint can make mistakes. Verify important information.
        </p>
      </form>
    </div>
  );
}
