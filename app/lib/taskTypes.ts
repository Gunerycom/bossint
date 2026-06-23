/* ========================================
   Task Management – Core Types
   ======================================== */

export type TaskStatus = "active" | "paused" | "running" | "completed" | "error";

export interface TaskSchedule {
  /** Human-readable schedule description, e.g. "every 12 hours" */
  label: string;
  /** Cron-like interval in ms (for display purposes) */
  intervalMs: number;
  /** Specific time if applicable, e.g. "09:00" */
  time?: string;
}

export interface TaskDataEntry {
  id: string;
  timestamp: number;
  summary: string;
}

export interface Task {
  id: string;
  /** The original natural language prompt that created this task */
  prompt: string;
  /** Short title derived from the prompt */
  title: string;
  /** Task type: "track" for monitoring, "crawl" for web crawling */
  type: "track" | "crawl" | "monitor" | "custom";
  /** Current status */
  status: TaskStatus;
  /** Schedule configuration */
  schedule: TaskSchedule;
  /** Target URL or subject */
  target: string;
  /** When the task was created */
  createdAt: number;
  /** Last time the task executed */
  lastRunAt?: number;
  /** Next scheduled run */
  nextRunAt?: number;
  /** Number of times the task has run */
  runCount: number;
  /** Collected data entries */
  data: TaskDataEntry[];
  /** Error message if status is "error" */
  errorMessage?: string;
  /** Auto-assigned or manual category grouping (e.g. "finance", "security", "news") */
  category?: string;
}

/* ========================================
   NLP Command Types
   ======================================== */

export type NLPCommandType =
  | "create_task"
  | "list_tasks"
  | "run_task"
  | "pause_task"
  | "resume_task"
  | "delete_task"
  | "clear_data"
  | "edit_schedule"
  | "unknown";

export interface NLPCommand {
  type: NLPCommandType;
  /** The task ID referenced (for operations on existing tasks) */
  taskId?: string;
  /** Raw input text */
  raw: string;
  /** Parsed parameters for create_task */
  params?: {
    title?: string;
    target?: string;
    schedule?: string;
    type?: Task["type"];
  };
}
