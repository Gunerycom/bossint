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
import { TEMPLATES } from "../lib/templateData";

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

export function TaskStoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [onTriggerCommand, setOnTriggerCommand] = useState<((cmd: string) => void) | null>(null);

  // New views and conversations state
  const [currentView, setView] = useState<"welcome" | "chat" | "explore" | "dashboard" | "agent-detail" | "settings">("welcome");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Notifications and onboarding state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [createTaskPrefills, setCreateTaskPrefills] = useState<{ title: string; prompt: string } | null>(null);

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
              category: local?.category || getCategoryForTask(fetched.title || `Task ${fetched.id}`, local?.prompt || fetched.title || `Track ${fetched.id}`),
            };
          });
        });
      }
    } catch (err) {
      console.error("Error syncing tasks:", err);
    }
  }, []);

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
              title: "Welcome to Bossint Command Center",
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
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, data: [], runCount: 0 } : t))
    );
  }, [triggerCommand]);

  const updateSchedule = useCallback((taskId: string, scheduleLabel: string) => {
    triggerCommand(`change schedule of task ${taskId} to ${scheduleLabel}`);
  }, [triggerCommand]);

  const updateTaskDetails = useCallback((taskId: string, details: Partial<Task>) => {
    if (details.schedule?.label) {
      triggerCommand(`change schedule of task ${taskId} to ${details.schedule.label}`);
    }
    if (details.title) {
      triggerCommand(`rename task ${taskId} to "${details.title}"`);
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...details } : t))
    );
  }, [triggerCommand]);

  const runTask = useCallback((taskId: string) => {
    triggerCommand(`run task ${taskId} now`);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const now = Date.now();
        const newEntry = {
          id: `data-${now}`,
          timestamp: now,
          summary: `Task run triggered via NLP Command • ${new Date(now).toLocaleTimeString()}`,
        };

        addNotification({
          agentId: taskId,
          agentName: t.title,
          type: "info",
          title: `${t.title} • Executed`,
          message: `Intelligence scan completed at ${new Date(now).toLocaleTimeString()}. 0 issues detected.`,
        });

        return {
          ...t,
          status: "running" as TaskStatus,
          lastRunAt: now,
          runCount: t.runCount + 1,
          data: [newEntry, ...t.data].slice(0, 50),
        };
      })
    );
  }, [triggerCommand, addNotification]);

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
      }}
    >
      {children}
    </TaskStoreContext.Provider>
  );
}
