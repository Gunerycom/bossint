"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import WelcomeView from "./components/WelcomeView";
import ExploreView from "./components/ExploreView";
import DashboardView from "./components/DashboardView";
import AgentDetailView from "./components/AgentDetailView";
import TemplateDeployDialog from "./components/TemplateDeployDialog";
import OnboardingFlow from "./components/OnboardingFlow";
import SettingsView from "./components/SettingsView";
import CreateTaskDialog from "./components/CreateTaskDialog";
import type { Message } from "./components/MessageBubble";
import { useTaskStore } from "./components/TaskStore";
import type { NLPCommandType } from "./lib/taskTypes";
import { AgentTemplate } from "./lib/templateData";
import { generateTaskId } from "./lib/taskParser";

/** Parse a raw SSE buffer chunk and dispatch events */
function parseSSEEvents(
  raw: string,
  handlers: {
    onStatus: (label: string) => void;
    onReasoning: (text: string) => void;
    onAnswer: (text: string) => void;
    onDone: (answer: string, sources: Array<{ url: string; title?: string }>, images?: string[]) => void;
    onError: (text: string) => void;
    onIntent?: (action: string, message: string) => void;
    onImageUrl?: (url: string) => void;
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
          (data.answer as string) || (data.text as string) || "",
          (data.sources as Array<{ url: string; title?: string }>) || [],
          (data.images as string[]) || []
        );
        break;
      case "intent":
        handlers.onIntent?.((data.action as string) || "", (data.message as string) || "");
        break;
      case "image_url":
        handlers.onImageUrl?.((data.url as string) || "");
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
  
  const [deployTemplate, setDeployTemplate] = useState<AgentTemplate | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingStartRef = useRef<number | null>(null);
  
  const {
    currentView,
    setView,
    activeConversationId,
    setActiveConversationId,
    conversations,
    createConversation,
    setConversationMessages,
    syncTasks,
    registerTriggerCommand,
    addTask,
    triggerCommand,
    hasCompletedOnboarding,
    isCreateTaskOpen,
    setIsCreateTaskOpen,
  } = useTaskStore();

  // Load conversation messages when switching conversations
  useEffect(() => {
    if (activeConversationId && currentView === "chat") {
      const activeConv = conversations.find((c) => c.id === activeConversationId);
      setMessages(activeConv?.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, currentView, conversations]);

  // Handle auto-deploy of a pending agent configured on the landing page
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pendingStr = localStorage.getItem("bossint_pending_deploy");
    if (!pendingStr) return;

    try {
      const pending = JSON.parse(pendingStr);
      if (pending && pending.name && pending.prompt) {
        const taskId = generateTaskId();
        const now = Date.now();

        const schedule = pending.schedule;
        let intervalMs = 24 * 60 * 60 * 1000; // default daily
        if (schedule.includes("1 hour")) intervalMs = 60 * 60 * 1000;
        else if (schedule.includes("6 hours")) intervalMs = 6 * 60 * 60 * 1000;
        else if (schedule.includes("12 hours")) intervalMs = 12 * 60 * 60 * 1000;
        else if (schedule === "weekly") intervalMs = 7 * 24 * 60 * 60 * 1000;

        const SCHEDULE_PRESETS = [
          { label: "Every hour", value: "every 1 hour" },
          { label: "Every 6 hours", value: "every 6 hours" },
          { label: "Every 12 hours", value: "every 12 hours" },
          { label: "Daily", value: "daily" },
          { label: "Weekly", value: "weekly" },
        ];

        const newTask = {
          id: taskId,
          title: pending.name.trim(),
          prompt: pending.prompt.trim(),
          type: pending.taskType,
          status: "active" as const,
          schedule: {
            label: SCHEDULE_PRESETS.find((p) => p.value === schedule)?.label || "Daily",
            intervalMs,
          },
          target: pending.name.trim(),
          createdAt: now,
          nextRunAt: now + intervalMs,
          runCount: 0,
          data: [],
        };

        addTask(newTask);

        const nlpCommand = `${pending.taskType} "${pending.name.trim()}" ${schedule}: ${pending.prompt.trim()}`;
        triggerCommand(nlpCommand);

        localStorage.removeItem("bossint_pending_deploy");
        setView("dashboard");
      }
    } catch (err) {
      console.error("Error processing pending deployment:", err);
    }
  }, [addTask, triggerCommand, setView]);

  const fillInput = useCallback((text: string) => {
    setInput(text);
  }, []);

  const handleDeployClick = useCallback((template: AgentTemplate) => {
    setDeployTemplate(template);
    setIsDeployOpen(true);
  }, []);

  const sendMessage = useCallback(async (customText?: string, targetConvId?: string | null) => {
    const text = (customText || input).trim();
    if (!text || isStreaming) return;

    let convId = targetConvId || activeConversationId;
    if (!convId) {
      convId = createConversation(text.length > 35 ? text.slice(0, 35) + "..." : text);
    }

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
      images: [],
      isStreaming: true,
    };

    // Retrieve previous messages for the active context
    const activeConv = conversations.find((c) => c.id === convId);
    const existingMessages = activeConv?.messages || [];
    const updatedInitialMessages = [...existingMessages, userMessage, assistantMessage];
    
    // Update both local state and TaskStore context
    setMessages(updatedInitialMessages);
    setConversationMessages(convId, updatedInitialMessages);
    setView("chat");
    setActiveConversationId(convId);

    if (!customText) {
      setInput("");
    }
    
    setIsStreaming(true);
    thinkingStartRef.current = Date.now();

    // Create abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let taskMsg = "";
    let finalMessagesList = updatedInitialMessages;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: convId, // Pass actual conversation ID
          stream: true,
          image_generation: true,
          followup: existingMessages.length > 0,
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
      let isTask = false;
      let taskAction = "";
      const assistantImages: string[] = [];

      const handlers = {
        onStatus: (label: string) => {
          currentStatus = label;
          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === assistantId
                ? { ...m, statusLabel: currentStatus }
                : m
            );
            finalMessagesList = next;
            return next;
          });
        },
        onReasoning: (chunk: string) => {
          reasoningText += chunk;
          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === assistantId
                ? { ...m, reasoning: reasoningText, statusLabel: currentStatus }
                : m
            );
            finalMessagesList = next;
            return next;
          });
        },
        onAnswer: (chunk: string) => {
          answerText += chunk;
          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: answerText }
                : m
            );
            finalMessagesList = next;
            return next;
          });
        },
        onIntent: (action: string, msg: string) => {
          isTask = true;
          taskAction = action;
          taskMsg = msg;
          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    isTaskResponse: true,
                    taskCommandType: action as NLPCommandType,
                    content: answerText || msg,
                  }
                : m
            );
            finalMessagesList = next;
            return next;
          });
        },
        onImageUrl: (url: string) => {
          assistantImages.push(url);
          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === assistantId
                ? { ...m, images: assistantImages }
                : m
            );
            finalMessagesList = next;
            return next;
          });
        },
        onDone: (answer: string, sources: Array<{ url: string; title?: string }>, images?: string[]) => {
          receivedDone = true;
          const finalAnswer = answer || answerText || taskMsg;
          const thinkingDuration = thinkingStartRef.current
            ? Math.round((Date.now() - thinkingStartRef.current) / 1000)
            : undefined;

          const mergedImages = Array.from(new Set([...assistantImages, ...(images || [])]));

          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: finalAnswer,
                    sources,
                    images: mergedImages,
                    isStreaming: false,
                    thinkingDuration,
                  }
                : m
            );
            finalMessagesList = next;
            setTimeout(() => {
              setConversationMessages(convId, next);
            }, 0);
            return next;
          });

          // Sync tasks list
          syncTasks();
        },
        onError: (errorText: string) => {
          receivedDone = true;
          setMessages((prev) => {
            const next = prev
              .filter((m) => m.id !== assistantId)
              .concat({
                id: `error-${Date.now()}`,
                role: "error" as const,
                content: errorText,
              });
            finalMessagesList = next;
            setTimeout(() => {
              setConversationMessages(convId, next);
            }, 0);
            return next;
          });
        },
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.trim()) {
            parseSSEEvents(part, handlers);
          }
        }
      }

      if (buffer.trim()) {
        parseSSEEvents(buffer, handlers);
      }

      if (!receivedDone) {
        const thinkingDuration = thinkingStartRef.current
          ? Math.round((Date.now() - thinkingStartRef.current) / 1000)
          : undefined;
        
        setMessages((prev) => {
          const next = prev.map((m) => {
            if (m.id === assistantId && m.isStreaming) {
              return {
                ...m,
                isStreaming: false,
                thinkingDuration,
                content: m.content || taskMsg || "(Completed)",
              };
            }
            return m;
          });
          finalMessagesList = next;
          setTimeout(() => {
            setConversationMessages(convId, next);
          }, 0);
          return next;
        });
        syncTasks();
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((prev) => {
          const next = prev.map((m) => {
            if (m.id === assistantId && m.isStreaming) {
              return {
                ...m,
                isStreaming: false,
                content: m.content || taskMsg || "(Cancelled)",
              };
            }
            return m;
          });
          finalMessagesList = next;
          setTimeout(() => {
            setConversationMessages(convId, next);
          }, 0);
          return next;
        });
      } else {
        setMessages((prev) => {
          const next = prev
            .filter((m) => m.id !== assistantId)
            .concat({
              id: `error-${Date.now()}`,
              role: "error",
              content: "Bossint couldn't complete this request. Please try again.",
            });
          finalMessagesList = next;
          setTimeout(() => {
            setConversationMessages(convId, next);
          }, 0);
          return next;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      thinkingStartRef.current = null;
    }
  }, [input, isStreaming, activeConversationId, conversations, createConversation, setConversationMessages, setView, setActiveConversationId, syncTasks]);

  // Connect page message trigger to TaskStore trigger
  useEffect(() => {
    registerTriggerCommand((cmdText) => {
      sendMessage(cmdText);
    });
  }, [sendMessage, registerTriggerCommand]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const renderViewContent = () => {
    switch (currentView) {
      case "welcome":
        return (
          <div className="flex-1 overflow-y-auto">
            <WelcomeView
              onPromptFill={fillInput}
              onPromptSubmit={sendMessage}
              onDeployClick={handleDeployClick}
            />
          </div>
        );
      case "explore":
        return (
          <div className="flex-1 overflow-y-auto">
            <ExploreView onDeployClick={handleDeployClick} />
          </div>
        );
      case "dashboard":
        return (
          <div className="flex-1 overflow-y-auto">
            <DashboardView />
          </div>
        );
      case "agent-detail":
        return (
          <div className="flex-1 overflow-y-auto">
            <AgentDetailView />
          </div>
        );
      case "settings":
        return (
          <div className="flex-1 overflow-y-auto">
            <SettingsView />
          </div>
        );
      case "chat":
      default:
        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-start pt-20 pb-6 px-6 max-w-3xl mx-auto w-full space-y-10 animate-fade-in">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-md flex items-center justify-center mx-auto mb-4 select-none">
                    <img src="/bossint-b.png" alt="Bossint" className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] font-sans">
                    Autopilot Research
                  </h2>
                  <p className="text-base sm:text-lg text-[var(--text-secondary)] font-medium max-w-none mx-auto leading-relaxed">
                    Ask Bossint to crawl, track, or monitor anything. Check results in real-time.
                  </p>
                </div>
                <div className="w-full">
                  <ChatInput
                    value={input}
                    onChange={setInput}
                    onSend={() => sendMessage()}
                    onStop={stopStreaming}
                    isStreaming={isStreaming}
                    isCentered={true}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <MessageList messages={messages} />
                </div>
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={() => sendMessage()}
                  onStop={stopStreaming}
                  isStreaming={isStreaming}
                  isCentered={false}
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {renderViewContent()}

      {/* Global Template Deploy Dialog */}
      <TemplateDeployDialog
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        template={deployTemplate}
      />

      {/* Global Task Creation Dialog */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />

      {/* Onboarding Flow Overlay */}
      {!hasCompletedOnboarding && <OnboardingFlow />}
    </div>
  );
}
