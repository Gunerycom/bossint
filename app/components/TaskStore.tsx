"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Task, TaskStatus } from "../lib/taskTypes";
import { parseUpstreamTaskList } from "../lib/taskParser";
import type { Message } from "./MessageBubble";

const STORAGE_KEY = "bossint-tasks";

export interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
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
  currentView: "welcome" | "chat" | "explore" | "dashboard" | "agent-detail";
  setView: (view: "welcome" | "chat" | "explore" | "dashboard" | "agent-detail") => void;
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
}

const TaskStoreContext = createContext<TaskStoreContextValue>({
  tasks: [],
  processCommand: () => "",
  addTask: () => {},
  setTaskStatus: () => {},
  deleteTask: () => {},
  clearTaskData: () => {},
  updateSchedule: () => {},
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
});

export function useTaskStore() {
  return useContext(TaskStoreContext);
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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

export function TaskStoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [onTriggerCommand, setOnTriggerCommand] = useState<((cmd: string) => void) | null>(null);

  // New views and conversations state
  const [currentView, setView] = useState<"welcome" | "chat" | "explore" | "dashboard" | "agent-detail">("welcome");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const registerTriggerCommand = useCallback((callback: (cmd: string) => void) => {
    setOnTriggerCommand(() => callback);
  }, []);

  const triggerCommand = useCallback((cmd: string) => {
    if (onTriggerCommand) {
      onTriggerCommand(cmd);
      setIsSidebarOpen(true);
    } else {
      console.warn("No command trigger callback registered");
    }
  }, [onTriggerCommand]);

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
          return parsed.map((fetched) => {
            const local = prev.find((t) => t.id === fetched.id);
            const now = Date.now();
            return {
              id: fetched.id!,
              prompt: local?.prompt || fetched.title || `Track ${fetched.id}`,
              title: fetched.title || local?.title || `Task ${fetched.id}`,
              type: fetched.type || local?.type || "track",
              status: fetched.status || local?.status || "active",
              schedule: fetched.schedule || local?.schedule || { label: "Daily", intervalMs: 24 * 60 * 60 * 1000 },
              target: local?.target || fetched.title || "",
              createdAt: local?.createdAt || now,
              lastRunAt: local?.lastRunAt,
              nextRunAt: fetched.status === "active" ? (local?.nextRunAt || (now + (fetched.schedule?.intervalMs || 24 * 60 * 60 * 1000))) : undefined,
              runCount: local?.runCount || 0,
              data: local?.data || [],
            };
          });
        });
      }
    } catch (err) {
      console.error("Error syncing tasks:", err);
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
          if (["welcome", "chat", "explore", "dashboard", "agent-detail"].includes(view)) {
            setView(view);
          }
        }
      } catch (err) {
        console.error("Error loading conversations:", err);
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

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev]);
  }, []);

  const setTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    if (status === "paused") {
      triggerCommand(`pause task ${taskId}`);
    } else if (status === "active") {
      triggerCommand(`resume task ${taskId}`);
    }
  }, [triggerCommand]);

  const deleteTask = useCallback((taskId: string) => {
    triggerCommand(`delete task ${taskId}`);
  }, [triggerCommand]);

  const clearTaskData = useCallback((taskId: string) => {
    triggerCommand(`clear data for task ${taskId}`);
    // Clear locally too
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, data: [], runCount: 0 } : t))
    );
  }, [triggerCommand]);

  const updateSchedule = useCallback((taskId: string, scheduleLabel: string) => {
    triggerCommand(`change schedule of task ${taskId} to ${scheduleLabel}`);
  }, [triggerCommand]);

  const runTask = useCallback((taskId: string) => {
    triggerCommand(`run task ${taskId} now`);
    // Local simulation feedback
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const now = Date.now();
        const newEntry = {
          id: `data-${now}`,
          timestamp: now,
          summary: `Task run triggered via NLP Command • ${new Date(now).toLocaleTimeString()}`,
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
  }, [triggerCommand]);

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
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setView("welcome");
    }
  }, [activeConversationId]);

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
      }}
    >
      {children}
    </TaskStoreContext.Provider>
  );
}
