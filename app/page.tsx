"use client";

import { useState, useRef, useCallback } from "react";
import Header from "./components/Header";
import EmptyState from "./components/EmptyState";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import type { Message } from "./components/MessageBubble";

/** Parse a raw SSE buffer chunk and dispatch events */
function parseSSEEvents(
  raw: string,
  handlers: {
    onSession: (sessionId: string) => void;
    onStatus: (label: string) => void;
    onReasoning: (text: string) => void;
    onAnswer: (text: string) => void;
    onDone: (answer: string, sources: Array<{ url: string; title?: string }>) => void;
    onError: (text: string) => void;
  }
) {
  const lines = raw.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const jsonStr = trimmed.slice(5).trim();
    if (!jsonStr || jsonStr === "[DONE]") continue;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      continue;
    }

    const eventType = data.type as string;

    switch (eventType) {
      case "session":
        handlers.onSession((data.sessionId as string) || "");
        break;
      case "status":
        handlers.onStatus((data.label as string) || "");
        break;
      case "reasoning":
        handlers.onReasoning((data.text as string) || "");
        break;
      case "answer":
        handlers.onAnswer((data.text as string) || "");
        break;
      case "done":
        handlers.onDone(
          (data.answer as string) || "",
          (data.sources as Array<{ url: string; title?: string }>) || []
        );
        break;
      case "error":
        handlers.onError(
          (data.text as string) || "Something went wrong. Please try again."
        );
        break;
    }
  }
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingStartRef = useRef<number | null>(null);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      reasoning: "",
      statusLabel: "",
      sources: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);
    thinkingStartRef.current = Date.now();

    // Create abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Accumulators for the current assistant message
      let answerText = "";
      let reasoningText = "";
      let currentStatus = "";
      let receivedDone = false;

      const handlers = {
        onSession: (sid: string) => {
          if (sid) setSessionId(sid);
        },
        onStatus: (label: string) => {
          currentStatus = label;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, statusLabel: currentStatus }
                : m
            )
          );
        },
        onReasoning: (chunk: string) => {
          reasoningText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, reasoning: reasoningText, statusLabel: currentStatus }
                : m
            )
          );
        },
        onAnswer: (chunk: string) => {
          answerText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: answerText }
                : m
            )
          );
        },
        onDone: (answer: string, sources: Array<{ url: string; title?: string }>) => {
          receivedDone = true;
          const finalAnswer = answer || answerText;
          const thinkingDuration = thinkingStartRef.current
            ? Math.round((Date.now() - thinkingStartRef.current) / 1000)
            : undefined;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: finalAnswer,
                    sources,
                    isStreaming: false,
                    thinkingDuration,
                  }
                : m
            )
          );
        },
        onError: (errorText: string) => {
          receivedDone = true;
          setMessages((prev) =>
            prev
              .filter((m) => m.id !== assistantId)
              .concat({
                id: `error-${Date.now()}`,
                role: "error" as const,
                content: errorText,
              })
          );
        },
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Normalize \r\n to \n
        buffer = buffer.replace(/\r\n/g, "\n");

        // Process complete SSE events
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.trim()) {
            parseSSEEvents(part, handlers);
          }
        }
      }

      // ** CRITICAL: Flush any remaining buffer after stream ends **
      // The final event (often "done") may not have a trailing \n\n
      if (buffer.trim()) {
        parseSSEEvents(buffer, handlers);
      }

      // If stream ended without a done event, finalize the message
      if (!receivedDone) {
        const thinkingDuration = thinkingStartRef.current
          ? Math.round((Date.now() - thinkingStartRef.current) / 1000)
          : undefined;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === assistantId && m.isStreaming) {
              return {
                ...m,
                isStreaming: false,
                thinkingDuration,
              };
            }
            return m;
          })
        );
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled — finalize the message as-is
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === assistantId && m.isStreaming) {
              return {
                ...m,
                isStreaming: false,
                content: m.content || "(Cancelled)",
              };
            }
            return m;
          })
        );
      } else {
        // Connection error
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== assistantId)
            .concat({
              id: `error-${Date.now()}`,
              role: "error",
              content:
                "Bossint couldn\u2019t complete this request. Please try again.",
            })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      thinkingStartRef.current = null;
    }
  }, [input, isStreaming, sessionId]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <Header />

      <main className="flex-1 flex flex-col min-h-0">
        {!hasMessages ? (
          <>
            <EmptyState />
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              onStop={stopStreaming}
              isStreaming={isStreaming}
            />
          </>
        ) : (
          <>
            <MessageList messages={messages} />
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              onStop={stopStreaming}
              isStreaming={isStreaming}
            />
          </>
        )}
      </main>
    </div>
  );
}
