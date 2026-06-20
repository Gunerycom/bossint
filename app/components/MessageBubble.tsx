"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ThinkingTrace from "./ThinkingTrace";
import SourceChips from "./SourceChips";

export interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  reasoning?: string;
  statusLabel?: string;
  sources?: Array<{ url: string; title?: string }>;
  isStreaming?: boolean;
  thinkingDuration?: number;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, reasoning, statusLabel, sources, isStreaming, thinkingDuration } =
    message;

  if (role === "error") {
    return (
      <div className="flex justify-center my-3 animate-fade-in-up">
        <div
          className="max-w-[680px] w-full px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: "var(--error-bg)",
            color: "var(--error-text)",
            border: "1px solid var(--error-border)",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="flex justify-end my-3 animate-fade-in-up">
        <div
          className="max-w-[680px] px-4 py-3 rounded-2xl rounded-br-md text-[0.935rem] leading-relaxed whitespace-pre-wrap"
          style={{
            backgroundColor: "var(--bg-user-bubble)",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start my-3 animate-fade-in-up">
      <div className="max-w-[760px] w-full">
        {/* Thinking trace */}
        {(reasoning || statusLabel || isStreaming) && (
          <ThinkingTrace
            reasoning={reasoning || ""}
            statusLabel={statusLabel || ""}
            isStreaming={!!isStreaming}
            thinkingDuration={thinkingDuration}
          />
        )}

        {/* Answer content */}
        {content && (
          <div
            className="px-1 text-[0.935rem] markdown-content"
            style={{ color: "var(--text-primary)" }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        {/* Streaming cursor */}
        {isStreaming && !content && !reasoning && (
          <div className="flex gap-1 px-1 py-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse-dot"
              style={{ backgroundColor: "var(--accent)", animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 rounded-full animate-pulse-dot"
              style={{ backgroundColor: "var(--accent)", animationDelay: "200ms" }}
            />
            <span
              className="w-2 h-2 rounded-full animate-pulse-dot"
              style={{ backgroundColor: "var(--accent)", animationDelay: "400ms" }}
            />
          </div>
        )}

        {/* Sources */}
        {sources && sources.length > 0 && !isStreaming && (
          <div className="px-1">
            <SourceChips sources={sources} />
          </div>
        )}
      </div>
    </div>
  );
}
