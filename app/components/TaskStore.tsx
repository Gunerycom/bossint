"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Task, TaskStatus } from "../lib/taskTypes";
import { parseUpstreamTaskList, generateTaskId, parseNLPCommand, parseSchedule } from "../lib/taskParser";
import type { Message } from "./MessageBubble";
import { TEMPLATES, type AgentTemplate } from "../lib/templateData";
import { useRouter, usePathname } from "next/navigation";
import type { NLPCommandType } from "../lib/taskTypes";

const STORAGE_KEY = "bossint-tasks";

export interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

export interface Notification {
  id: string;
  agentId?: string;
  agentName?: string;
  type: "info" | "warning" | "error" | "milestone" | "system";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function getCategoryForTask(title: string, prompt: string): string {
  const cleanTitle = title.trim().toLowerCase();
  const cleanPrompt = prompt.trim().toLowerCase();
  
  // Try to find a template with exact title or prompt match
  const found = TEMPLATES.find(
    (t) => t.title.toLowerCase() === cleanTitle || t.prompt.toLowerCase() === cleanPrompt
  );
  if (found) return found.categoryId;

  // Keyword check
  if (/price|bitcoin|crypto|defi|finance|earnings|stock|whale|altcoin|market/i.test(cleanTitle) || /price|bitcoin|crypto|defi|finance|earnings|stock|whale|altcoin/i.test(cleanPrompt)) {
    return "finance";
  }
  if (/vulnerabilit|cve|zero-day|exploit|cyber|security|squat|threat|leak|ransomware/i.test(cleanTitle) || /vulnerabilit|cve|zero-day|exploit|cyber|security|squat|threat/i.test(cleanPrompt)) {
    return "cybersecurity";
  }
  if (/competitor|pricing|opening|job|hiring|product update|positioning|sales|lead|deal|customer|tender/i.test(cleanTitle) || /competitor|pricing|opening|job|hiring|product update|positioning/i.test(cleanPrompt)) {
    return "competitive";
  }
  if (/news|headline|story|stories|reuters|digest|breaking|media|article/i.test(cleanTitle) || /news|headline|story|stories|reuters|digest|breaking|media/i.test(cleanPrompt)) {
    return "news";
  }
  if (/brand|reputation|sentiment|pr|mention|tweet|social|feedback/i.test(cleanTitle) || /brand|reputation|sentiment|pr|mention|tweet|social/i.test(cleanPrompt)) {
    return "brand";
  }
  if (/academic|research|paper|scientific|study|studies|data|analytics/i.test(cleanTitle) || /academic|research|paper|scientific|study|studies/i.test(cleanPrompt)) {
    return "research";
  }
  if (/law|legal|court|compliance|policy|legislat|regulation/i.test(cleanTitle) || /law|legal|court|compliance|policy|legislat/i.test(cleanPrompt)) {
    return "legal";
  }
  if (/geopolitic|osint|conflict|sanction|global|country/i.test(cleanTitle) || /geopolitic|osint|conflict|sanction/i.test(cleanPrompt)) {
    return "geopolitics";
  }
  if (/esg|sustainability|greenhouse|carbon|environmental|emission/i.test(cleanTitle) || /esg|sustainability|greenhouse|carbon|environmental/i.test(cleanPrompt)) {
    return "esg";
  }
  if (/buy|shop|ecommerce|retail|store|product price/i.test(cleanTitle) || /buy|shop|ecommerce|retail|store/i.test(cleanPrompt)) {
    return "ecommerce";
  }
  return "research";
}

interface TaskStoreContextValue {
  tasks: Task[];
  /** Process a natural language command and return a feedback message */
  processCommand: (input: string) => string;
  /** Add a task directly */
  addTask: (task: Task) => void;
  /** Update a task's status */
  setTaskStatus: (taskId: string, status: TaskStatus) => void;
  /** Delete a task */
  deleteTask: (taskId: string) => void;
  /** Clear collected data for a task */
  clearTaskData: (taskId: string) => void;
  /** Update a task's schedule */
  updateSchedule: (taskId: string, scheduleLabel: string) => void;
  /** Update task details (title, prompt, category, etc.) */
  updateTaskDetails: (taskId: string, details: Partial<Task>) => void;
  /** Simulate running a task (adds a mock data entry) */
  runTask: (taskId: string) => void;
  /** Whether the sidebar is open */
  isSidebarOpen: boolean;
  /** Toggle sidebar */
  toggleSidebar: () => void;
  /** Open sidebar */
  openSidebar: () => void;
  /** Close sidebar */
  closeSidebar: () => void;
  /** Synchronize tasks list from the NLP API */
  syncTasks: () => Promise<void>;
  /** Trigger an NLP command via the chat interface */
  triggerCommand: (cmd: string) => void;
  /** Register command trigger callback */
  registerTriggerCommand: (callback: (cmd: string) => void) => void;

  // New views and conversation management
  currentView: "welcome" | "chat" | "explore" | "dashboard" | "agent-detail" | "settings";
  setView: (view: "welcome" | "chat" | "explore" | "dashboard" | "agent-detail" | "settings") => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversations: Conversation[];
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  addMessageToConversation: (convId: string, message: Message) => void;
  setConversationMessages: (convId: string, messages: Message[]) => void;
  updateConversationTitle: (convId: string, title: string) => void;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;

  // Notifications and onboarding
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  isCreateTaskOpen: boolean;
  setIsCreateTaskOpen: (val: boolean) => void;
  createTaskPrefills: { title: string; prompt: string } | null;
  setCreateTaskPrefills: (val: { title: string; prompt: string } | null) => void;

  // Template deploy controls
  deployTemplate: AgentTemplate | null;
  setDeployTemplate: (template: AgentTemplate | null) => void;
  isDeployOpen: boolean;
  setIsDeployOpen: (open: boolean) => void;

  // Global Chat state and actions
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  input: string;
  setInput: (input: string) => void;
  isStreaming: boolean;
  sendMessage: (customText?: string, targetConvId?: string | null) => Promise<void>;
  stopStreaming: () => void;
}

const TaskStoreContext = createContext<TaskStoreContextValue>({
  tasks: [],
  processCommand: () => "",
  addTask: () => {},
  setTaskStatus: () => {},
  deleteTask: () => {},
  clearTaskData: () => {},
  updateSchedule: () => {},
  updateTaskDetails: () => {},
  runTask: () => {},
  isSidebarOpen: false,
  toggleSidebar: () => {},
  openSidebar: () => {},
  closeSidebar: () => {},
  syncTasks: async () => {},
  triggerCommand: () => {},
  registerTriggerCommand: () => {},
  currentView: "welcome",
  setView: () => {},
  activeConversationId: null,
  setActiveConversationId: () => {},
  conversations: [],
  createConversation: () => "",
  deleteConversation: () => {},
  addMessageToConversation: () => {},
  setConversationMessages: () => {},
  updateConversationTitle: () => {},
  selectedAgentId: null,
  setSelectedAgentId: () => {},
  
  notifications: [],
  addNotification: () => {},
  markNotificationAsRead: () => {},
  markAllNotificationsAsRead: () => {},
  clearNotifications: () => {},
  hasCompletedOnboarding: true,
  completeOnboarding: () => {},
  isCreateTaskOpen: false,
  setIsCreateTaskOpen: () => {},
  createTaskPrefills: null,
  setCreateTaskPrefills: () => {},

  deployTemplate: null,
  setDeployTemplate: () => {},
  isDeployOpen: false,
  setIsDeployOpen: () => {},
  messages: [],
  setMessages: () => {},
  input: "",
  setInput: () => {},
  isStreaming: false,
  sendMessage: async () => {},
  stopStreaming: () => {},
});

export function useTaskStore() {
  return useContext(TaskStoreContext);
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Task[];
      return parsed.map((t) => ({
        ...t,
        category: t.category || getCategoryForTask(t.title, t.prompt),
      }));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage errors
  }
}

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

export function TaskStoreProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // New views and conversations state
  const [currentView, setViewOnly] = useState<"welcome" | "chat" | "explore" | "dashboard" | "agent-detail" | "settings">("welcome");
  const [activeConversationId, setActiveConversationIdOnly] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedAgentId, setSelectedAgentIdOnly] = useState<string | null>(null);

  // Notifications and onboarding state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [createTaskPrefills, setCreateTaskPrefills] = useState<{ title: string; prompt: string } | null>(null);

  // Track deleted task IDs locally during active session to prevent race conditions during sync
  const deletedTaskIdsRef = useRef<Set<string>>(new Set());

  // Template deploy controls
  const [deployTemplate, setDeployTemplate] = useState<AgentTemplate | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);

  // Global Chat state and actions
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingStartRef = useRef<number | null>(null);

  // Keep state synchronized with pathname changes (back/forward navigation)
  useEffect(() => {
    if (pathname === "/") {
      setViewOnly("welcome");
    } else if (pathname === "/explore") {
      setViewOnly("explore");
    } else if (pathname === "/dashboard") {
      setViewOnly("dashboard");
    } else if (pathname === "/settings") {
      setViewOnly("settings");
    } else if (pathname.startsWith("/chat")) {
      setViewOnly("chat");
      const parts = pathname.split("/");
      const id = parts[2] || null;
      setActiveConversationIdOnly(id);
    } else if (pathname.startsWith("/agents")) {
      setViewOnly("agent-detail");
      const parts = pathname.split("/");
      const id = parts[2] || null;
      setSelectedAgentIdOnly(id);
    }
  }, [pathname]);

  const setView = useCallback((view: "welcome" | "chat" | "explore" | "dashboard" | "agent-detail" | "settings") => {
    setViewOnly(view);
    if (view === "welcome" && pathname !== "/") router.push("/");
    else if (view === "explore" && pathname !== "/explore") router.push("/explore");
    else if (view === "dashboard" && pathname !== "/dashboard") router.push("/dashboard");
    else if (view === "settings" && pathname !== "/settings") router.push("/settings");
    else if (view === "chat" && !pathname.startsWith("/chat")) router.push("/chat");
    else if (view === "agent-detail" && selectedAgentId && !pathname.startsWith("/agents")) router.push(`/agents/${selectedAgentId}`);
  }, [pathname, router, selectedAgentId]);

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdOnly(id);
    if (id) {
      if (pathname !== `/chat/${id}`) router.push(`/chat/${id}`);
    } else {
      if (pathname !== "/chat") router.push("/chat");
    }
  }, [pathname, router]);

  const setSelectedAgentId = useCallback((id: string | null) => {
    setSelectedAgentIdOnly(id);
    if (id) {
      if (pathname !== `/agents/${id}`) router.push(`/agents/${id}`);
    }
  }, [pathname, router]);

  // Load conversation messages when switching conversations
  useEffect(() => {
    if (activeConversationId) {
      const activeConv = conversations.find((c) => c.id === activeConversationId);
      setMessages(activeConv?.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, conversations]);

  const createConversation = useCallback((title?: string) => {
    const id = crypto.randomUUID();
    const newConv: Conversation = {
      id,
      title: title || "New Research",
      timestamp: Date.now(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(id);
    setView("chat");
    return id;
  }, [setActiveConversationId, setView]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setView("welcome");
    }
  }, [activeConversationId, setActiveConversationId, setView]);

  const addMessageToConversation = useCallback((convId: string, message: Message) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        let newTitle = c.title;
        if (c.title === "New Research" && message.role === "user") {
          newTitle = message.content.length > 30 ? message.content.slice(0, 30) + "..." : message.content;
        }
        return {
          ...c,
          title: newTitle,
          messages: [...c.messages, message],
        };
      })
    );
  }, []);

  const setConversationMessages = useCallback((convId: string, messages: Message[]) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages } : c))
    );
  }, []);

  const updateConversationTitle = useCallback((convId: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title } : c))
    );
  }, []);

  const syncTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "list tasks", stream: false }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data.answer === "string") {
        const parsed = parseUpstreamTaskList(data.answer);
        setTasks((prev) => {
          const merged = [...prev];
          const now = Date.now();

          parsed.forEach((fetched) => {
            if (!fetched.id || deletedTaskIdsRef.current.has(fetched.id)) {
              return;
            }

            const index = merged.findIndex((t) => t.id === fetched.id);
            if (index !== -1) {
              const local = merged[index];
              merged[index] = {
                ...local,
                title: fetched.title || local.title,
                status: fetched.status || local.status,
                schedule: fetched.schedule || local.schedule,
                type: fetched.type || local.type,
                nextRunAt: fetched.status === "active"
                  ? (local.nextRunAt || (now + (fetched.schedule?.intervalMs || 24 * 60 * 60 * 1000)))
                  : undefined,
              };
            } else {
              merged.push({
                id: fetched.id,
                prompt: fetched.title || `Track ${fetched.id}`,
                title: fetched.title || `Task ${fetched.id}`,
                type: fetched.type || "track",
                status: fetched.status || "active",
                schedule: fetched.schedule || { label: "Daily", intervalMs: 24 * 60 * 60 * 1000 },
                target: fetched.title || "",
                createdAt: now,
                runCount: 0,
                data: [],
                category: getCategoryForTask(fetched.title || `Task ${fetched.id}`, fetched.title || `Track ${fetched.id}`),
              });
            }
          });

          return merged;
        });
      }
    } catch (err) {
      console.error("Error syncing tasks:", err);
    }
  }, []);

  const registerTriggerCommand = useCallback((callback: (cmd: string) => void) => {
    // No-op for backward compatibility
  }, []);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const sendMessage = useCallback(async (customText?: string, targetConvId?: string | null) => {
    const text = (customText || input).trim();
    if (!text || isStreaming) return;

    // Process NLP command locally in parallel to prevent UI lag/desync
    try {
      const parsedCmd = parseNLPCommand(text);
      if (parsedCmd.type === "delete_task" && parsedCmd.taskId) {
        const tid = parsedCmd.taskId;
        setTasks((prev) => prev.filter((t) => t.id !== tid));
        deletedTaskIdsRef.current.add(tid);
      } else if (parsedCmd.type === "pause_task" && parsedCmd.taskId) {
        const tid = parsedCmd.taskId;
        setTasks((prev) => prev.map((t) => t.id === tid ? { ...t, status: "paused" } : t));
      } else if (parsedCmd.type === "resume_task" && parsedCmd.taskId) {
        const tid = parsedCmd.taskId;
        setTasks((prev) => prev.map((t) => t.id === tid ? { ...t, status: "active" } : t));
      } else if (parsedCmd.type === "clear_data" && parsedCmd.taskId) {
        const tid = parsedCmd.taskId;
        setTasks((prev) => prev.map((t) => t.id === tid ? { ...t, data: [], runCount: 0 } : t));
      } else if (parsedCmd.type === "edit_schedule" && parsedCmd.taskId && parsedCmd.params?.schedule) {
        const tid = parsedCmd.taskId;
        const scheduleParsed = parseSchedule(parsedCmd.params.schedule);
        setTasks((prev) => prev.map((t) => t.id === tid ? {
          ...t,
          schedule: {
            label: scheduleParsed.label,
            intervalMs: scheduleParsed.intervalMs,
            time: scheduleParsed.time,
          }
        } : t));
      }
    } catch (e) {
      console.error("Error handling command locally:", e);
    }

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
    
    // Crucial: Route to chat page for this conversation
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
          leftAnswerChunks:
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
  }, [input, isStreaming, activeConversationId, conversations, createConversation, setConversationMessages, setActiveConversationId, syncTasks]);

  const triggerCommand = useCallback((cmd: string) => {
    sendMessage(cmd);
    setIsSidebarOpen(true);
  }, [sendMessage]);

  const addNotification = useCallback((notif: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${crypto.randomUUID()}`,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("bossint-onboarding-completed", "true");
    }
  }, []);

  // Load from localStorage on mount and sync with server
  useEffect(() => {
    setTasks(loadTasks());
    
    // Load conversations and view settings
    if (typeof window !== "undefined") {
      try {
        const storedConvs = localStorage.getItem("bossint-conversations");
        if (storedConvs) {
          setConversations(JSON.parse(storedConvs));
        }
        const storedActiveConv = localStorage.getItem("bossint-active-conv");
        if (storedActiveConv) {
          setActiveConversationId(storedActiveConv);
        }
        const storedView = localStorage.getItem("bossint-current-view");
        if (storedView) {
          const view = storedView as any;
          if (["welcome", "chat", "explore", "dashboard", "agent-detail", "settings"].includes(view)) {
            setView(view);
          }
        }

        // Load onboarding state
        const storedOnboarding = localStorage.getItem("bossint-onboarding-completed");
        if (storedOnboarding) {
          setHasCompletedOnboarding(storedOnboarding === "true");
        } else {
          const localT = loadTasks();
          setHasCompletedOnboarding(localT.length > 0);
        }

        // Load notifications
        const storedNotifs = localStorage.getItem("bossint-notifications");
        if (storedNotifs) {
          setNotifications(JSON.parse(storedNotifs));
        } else {
          // Seed initial mock notifications
          const now = Date.now();
          const initialNotifs: Notification[] = [
            {
              id: "notif-welcome",
              type: "system",
              title: "Welcome to Bossint My Agents",
              message: "Get started by exploring agent blueprints or creating a custom agent in chat. Know everything. Before everyone.",
              timestamp: now - 3600 * 1000 * 2, // 2 hours ago
              read: false,
            },
            {
              id: "notif-seed-1",
              type: "info",
              title: "Bitcoin Price Tracker • Scan Complete",
              message: "BTC crossed $68,420 (▲ +2.3% since last scan). No anomalies detected.",
              timestamp: now - 60 * 1000 * 42, // 42 min ago
              read: false,
              agentId: "agent-btc",
            },
            {
              id: "notif-seed-2",
              type: "warning",
              title: "Zero-Day Exploit Watch • Threat Alert",
              message: "CVE-2026-4521 flagged as HIGH severity in Apache Struts vulnerability feed.",
              timestamp: now - 3600 * 1000 * 1.2, // 1.2 hours ago
              read: false,
              agentId: "agent-cve",
            },
            {
              id: "notif-seed-3",
              type: "info",
              title: "Competitor Monitor • Change Detected",
              message: "competitor.com pricing plans page altered. 2 changes detected.",
              timestamp: now - 3600 * 1000 * 6, // 6 hours ago
              read: true,
              agentId: "agent-competitor",
            }
          ];
          setNotifications(initialNotifs);
        }
      } catch (err) {
        console.error("Error loading conversations/settings:", err);
      }
    }
    
    setMounted(true);
    syncTasks();
  }, [syncTasks]);

  // Persist to localStorage on every change
  useEffect(() => {
    if (mounted) {
      saveTasks(tasks);
    }
  }, [tasks, mounted]);

  // Persist conversations
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("bossint-conversations", JSON.stringify(conversations));
    }
  }, [conversations, mounted]);

  // Persist active conversation id
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      if (activeConversationId) {
        localStorage.setItem("bossint-active-conv", activeConversationId);
      } else {
        localStorage.removeItem("bossint-active-conv");
      }
    }
  }, [activeConversationId, mounted]);

  // Persist current view
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("bossint-current-view", currentView);
    }
  }, [currentView, mounted]);

  // Persist notifications
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("bossint-notifications", JSON.stringify(notifications));
    }
  }, [notifications, mounted]);

  const addTask = useCallback((task: Task) => {
    const taskWithCategory = {
      ...task,
      category: task.category || getCategoryForTask(task.title, task.prompt),
    };
    setTasks((prev) => [taskWithCategory, ...prev]);
  }, []);

  const setTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    const cmd = status === "paused" ? `pause task ${taskId}` : `resume task ${taskId}`;
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: cmd, stream: false }),
    })
      .then(() => syncTasks())
      .catch((err) => console.error("Error setting task status upstream:", err));
  }, [syncTasks]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    deletedTaskIdsRef.current.add(taskId);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `delete task ${taskId}`, stream: false }),
    })
      .then(() => syncTasks())
      .catch((err) => console.error("Error deleting task upstream:", err));
  }, [syncTasks]);

  const clearTaskData = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, data: [], runCount: 0 } : t))
    );
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `clear data for task ${taskId}`, stream: false }),
    })
      .then(() => syncTasks())
      .catch((err) => console.error("Error clearing task data upstream:", err));
  }, [syncTasks]);

  const updateSchedule = useCallback((taskId: string, scheduleLabel: string) => {
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `change schedule of task ${taskId} to ${scheduleLabel}`, stream: false }),
    })
      .then(() => syncTasks())
      .catch((err) => console.error("Error updating schedule upstream:", err));
  }, [syncTasks]);

  const updateTaskDetails = useCallback((taskId: string, details: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...details } : t))
    );

    const promises = [];
    if (details.schedule?.label) {
      promises.push(
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `change schedule of task ${taskId} to ${details.schedule.label}`, stream: false }),
        })
      );
    }
    if (details.title) {
      promises.push(
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `rename task ${taskId} to "${details.title}"`, stream: false }),
        })
      );
    }

    if (promises.length > 0) {
      Promise.all(promises)
        .then(() => syncTasks())
        .catch((err) => console.error("Error updating task details upstream:", err));
    }
  }, [syncTasks]);

  const runTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const now = Date.now();
        const newEntry = {
          id: `data-${now}`,
          timestamp: now,
          summary: `Task run triggered silently • ${new Date(now).toLocaleTimeString()}`,
        };

        return {
          ...t,
          status: "running" as TaskStatus,
          lastRunAt: now,
          runCount: t.runCount + 1,
          data: [newEntry, ...t.data].slice(0, 50),
        };
      })
    );

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `run task ${taskId} now`, stream: false }),
    })
      .then((res) => res.json())
      .then(() => {
        syncTasks();
        
        // Add a notification when complete
        setTasks((prev) => {
          const matched = prev.find(t => t.id === taskId);
          if (matched) {
            addNotification({
              agentId: taskId,
              agentName: matched.title,
              type: "info",
              title: `${matched.title} • Scan Complete`,
              message: `Intelligence scan completed at ${new Date().toLocaleTimeString()}. 0 issues detected.`,
            });
            return prev.map((t) =>
              t.id === taskId ? { ...t, status: "active" as TaskStatus } : t
            );
          }
          return prev;
        });
      })
      .catch((err) => {
        console.error("Error running task upstream:", err);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: "error" as TaskStatus } : t
          )
        );
      });
  }, [syncTasks, addNotification]);

  const processCommand = useCallback(
    (input: string): string => {
      return "";
    },
    []
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <TaskStoreContext.Provider
      value={{
        tasks,
        processCommand,
        addTask,
        setTaskStatus,
        deleteTask,
        clearTaskData,
        updateSchedule,
        updateTaskDetails,
        runTask,
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        syncTasks,
        triggerCommand,
        registerTriggerCommand,
        currentView,
        setView,
        activeConversationId,
        setActiveConversationId,
        conversations,
        createConversation,
        deleteConversation,
        addMessageToConversation,
        setConversationMessages,
        updateConversationTitle,
        selectedAgentId,
        setSelectedAgentId,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        hasCompletedOnboarding,
        completeOnboarding,
        isCreateTaskOpen,
        setIsCreateTaskOpen,
        createTaskPrefills,
        setCreateTaskPrefills,
        deployTemplate,
        setDeployTemplate,
        isDeployOpen,
        setIsDeployOpen,
        messages,
        setMessages,
        input,
        setInput,
        isStreaming,
        sendMessage,
        stopStreaming,
      }}
    >
      {children}
    </TaskStoreContext.Provider>
  );
}
