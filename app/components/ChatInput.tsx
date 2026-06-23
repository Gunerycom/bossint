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
  isCentered?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
  isCentered = false,
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

  // 1. Centered layout for empty chat landing
  if (isCentered) {
    return (
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl mx-auto animate-fade-in text-left"
      >
        <div
          className="relative flex flex-col rounded-[28px] transition-all duration-200 p-6 sm:p-7 shadow-xl border border-[var(--border-color)] bg-[var(--bg-surface)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/10"
        >
          {/* 1st Row: Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            disabled={isStreaming || disabled}
            rows={2}
            className="w-full bg-transparent outline-none text-base sm:text-lg placeholder:text-[var(--text-tertiary)] disabled:opacity-50 resize-none"
            style={{
              color: "var(--text-primary)",
              maxHeight: "200px",
            }}
          />

          {/* 2nd Row: Actions Toolbar */}
          <div className="flex items-center justify-between mt-4">
            {/* Left Side */}
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Add attachment"
            >
              {/* Plus icon */}
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
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

              {/* Submit Arrow Button */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer shadow-sm"
                  style={{
                    backgroundColor: "var(--error-bg)",
                    color: "var(--error-text)",
                  }}
                  title="Stop generating"
                >
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
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-30 disabled:hover:bg-[var(--accent)] transition-all cursor-pointer shadow-sm"
                  title="Ask AI"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    );
  }

  // 2. Default bottom pinned layout
  return (
    <div
      className="sticky bottom-0 w-full px-4 sm:px-6 pb-4 pt-2"
      style={{
        background: `linear-gradient(to bottom, transparent, var(--bg-primary) 30%)`,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-[820px] mx-auto text-left"
      >
        <div
          className="relative flex flex-col rounded-2xl transition-all duration-200 p-4 shadow-md border border-[var(--border-color)] bg-[var(--bg-surface)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/10"
        >
          {/* 1st Row: Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Bossint anything..."
            disabled={isStreaming || disabled}
            rows={1}
            className="w-full resize-none bg-transparent outline-none text-sm placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
            style={{
              color: "var(--text-primary)",
              maxHeight: "180px",
            }}
          />

          {/* 2nd Row: Actions Toolbar */}
          <div className="flex items-center justify-between mt-2.5 pt-1">
            {/* Left Side */}
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Add attachment"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            {/* Right Side */}
            <div className="flex items-center gap-4 text-[var(--text-secondary)]">
              {/* Voice Input Icon */}
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Voice input"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3v-6a3 3 0 00-6 0v6a3 3 0 003 3z" />
                </svg>
              </button>

              {/* Waveform / Send Button */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label="Stop generating"
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer shadow-sm"
                  style={{
                    backgroundColor: "var(--error-bg)",
                    color: "var(--error-text)",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!value.trim() || disabled}
                  aria-label="Send message"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-30 disabled:hover:bg-[var(--accent)] transition-all cursor-pointer shadow-sm"
                  title="Ask AI"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
