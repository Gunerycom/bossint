import type { NLPCommand, Task } from "./taskTypes";

/**
 * Generate a short 8-char hex ID
 */
export function generateTaskId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Parse schedule text into interval milliseconds and a label
 */
function parseSchedule(text: string): { intervalMs: number; label: string; time?: string } {
  const lower = text.toLowerCase();

  // "daily at 9am", "daily at 09:00"
  const dailyAtMatch = lower.match(/daily\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (dailyAtMatch) {
    let hour = parseInt(dailyAtMatch[1], 10);
    const min = dailyAtMatch[2] ? parseInt(dailyAtMatch[2], 10) : 0;
    const ampm = dailyAtMatch[3];
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
    return {
      intervalMs: 24 * 60 * 60 * 1000,
      label: `Daily at ${timeStr}`,
      time: timeStr,
    };
  }

  // "every N hours/minutes/days"
  const everyMatch = lower.match(/every\s+(\d+)\s*(hour|hr|minute|min|day|second|sec)s?/);
  if (everyMatch) {
    const amount = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2];
    let ms: number;
    let unitLabel: string;
    if (unit.startsWith("hour") || unit.startsWith("hr")) {
      ms = amount * 60 * 60 * 1000;
      unitLabel = amount === 1 ? "hour" : "hours";
    } else if (unit.startsWith("min")) {
      ms = amount * 60 * 1000;
      unitLabel = amount === 1 ? "minute" : "minutes";
    } else if (unit.startsWith("day")) {
      ms = amount * 24 * 60 * 60 * 1000;
      unitLabel = amount === 1 ? "day" : "days";
    } else {
      ms = amount * 1000;
      unitLabel = amount === 1 ? "second" : "seconds";
    }
    return {
      intervalMs: ms,
      label: `Every ${amount} ${unitLabel}`,
    };
  }

  // "every hour"
  if (lower.includes("every hour") || lower.includes("hourly")) {
    return { intervalMs: 60 * 60 * 1000, label: "Every hour" };
  }

  // "daily"
  if (lower.includes("daily")) {
    return { intervalMs: 24 * 60 * 60 * 1000, label: "Daily" };
  }

  // "weekly"
  if (lower.includes("weekly")) {
    return { intervalMs: 7 * 24 * 60 * 60 * 1000, label: "Weekly" };
  }

  // Default: every 24 hours
  return { intervalMs: 24 * 60 * 60 * 1000, label: "Daily" };
}

/**
 * Detect if a URL is present in the text
 */
function extractUrl(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : null;
}

/**
 * Determine task type from the prompt
 */
function detectTaskType(text: string): Task["type"] {
  const lower = text.toLowerCase();
  if (lower.includes("crawl")) return "crawl";
  if (lower.includes("track") || lower.includes("monitor") || lower.includes("watch")) return "track";
  if (lower.includes("monitor")) return "monitor";
  return "custom";
}

/**
 * Generate a short title from the prompt
 */
function generateTitle(text: string): string {
  // Remove schedule parts
  let title = text
    .replace(/daily\s+at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/gi, "")
    .replace(/every\s+\d+\s*(hours?|hrs?|minutes?|mins?|days?|seconds?|secs?)/gi, "")
    .replace(/every\s+hour/gi, "")
    .replace(/hourly|daily|weekly/gi, "")
    .trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Truncate if too long
  if (title.length > 60) {
    title = title.slice(0, 57) + "…";
  }

  return title || "Untitled Task";
}

/**
 * Parse natural language input into an NLP command
 */
export function parseNLPCommand(input: string): NLPCommand {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  // --- List tasks ---
  if (/^(list|show|view)\s+(all\s+)?tasks?$/i.test(lower) || lower === "tasks") {
    return { type: "list_tasks", raw };
  }

  // --- Run task ---
  const runMatch = lower.match(/^run\s+task\s+([a-f0-9]{6,8})\s*(now)?$/);
  if (runMatch) {
    return { type: "run_task", taskId: runMatch[1], raw };
  }

  // --- Pause task ---
  const pauseMatch = lower.match(/^pause\s+task\s+([a-f0-9]{6,8})$/);
  if (pauseMatch) {
    return { type: "pause_task", taskId: pauseMatch[1], raw };
  }

  // --- Resume task ---
  const resumeMatch = lower.match(/^resume\s+task\s+([a-f0-9]{6,8})$/);
  if (resumeMatch) {
    return { type: "resume_task", taskId: resumeMatch[1], raw };
  }

  // --- Delete task ---
  const deleteMatch = lower.match(/^(delete|remove)\s+task\s+([a-f0-9]{6,8})$/);
  if (deleteMatch) {
    return { type: "delete_task", taskId: deleteMatch[2], raw };
  }

  // --- Clear data ---
  const clearMatch = lower.match(/^clear\s+data\s+(for\s+)?task\s+([a-f0-9]{6,8})$/);
  if (clearMatch) {
    return { type: "clear_data", taskId: clearMatch[2], raw };
  }

  // --- Edit schedule ---
  const editMatch = lower.match(
    /^change\s+schedule\s+(?:of\s+)?task\s+([a-f0-9]{6,8})\s+to\s+(.+)$/
  );
  if (editMatch) {
    return {
      type: "edit_schedule",
      taskId: editMatch[1],
      raw,
      params: { schedule: editMatch[2] },
    };
  }

  // --- Create task ---
  // Detect if user wants to create a task (track, crawl, monitor, watch)
  if (
    /^(track|crawl|monitor|watch|scrape|fetch)\s/i.test(lower) ||
    (lower.includes("every") && (lower.includes("crawl") || lower.includes("track") || lower.includes("check"))) ||
    /daily\s+at/i.test(lower)
  ) {
    const url = extractUrl(raw);
    const taskType = detectTaskType(raw);
    const schedule = parseSchedule(raw);
    const title = generateTitle(raw);
    const target = url || title;

    return {
      type: "create_task",
      raw,
      params: {
        title,
        target,
        schedule: schedule.label,
        type: taskType,
      },
    };
  }

  return { type: "unknown", raw };
}

/**
 * Build a Task object from a create command
 */
export function buildTaskFromCommand(command: NLPCommand): Task {
  const id = generateTaskId();
  const now = Date.now();
  const schedule = parseSchedule(command.params?.schedule || "daily");

  return {
    id,
    prompt: command.raw,
    title: command.params?.title || "Untitled Task",
    type: command.params?.type || "custom",
    status: "active",
    schedule: {
      label: schedule.label,
      intervalMs: schedule.intervalMs,
      time: schedule.time,
    },
    target: command.params?.target || "",
    createdAt: now,
    nextRunAt: now + schedule.intervalMs,
    runCount: 0,
    data: [],
  };
}

/**
 * Check if an input looks like a task command (for quick detection without full parse)
 */
export function isTaskCommand(input: string): boolean {
  const cmd = parseNLPCommand(input);
  return cmd.type !== "unknown";
}

/**
 * Format a timestamp to a human-readable relative string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a future timestamp to a relative string
 */
export function formatNextRun(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) return "overdue";
  if (diff < 60_000) return "in < 1m";
  if (diff < 3_600_000) return `in ${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `in ${Math.floor(diff / 3_600_000)}h`;

  return `in ${Math.floor(diff / 86_400_000)}d`;
}

/**
 * Parse the upstream "list tasks" response into partial Task objects
 */
export function parseUpstreamTaskList(text: string): Partial<Task>[] {
  const lines = text.split("\n");
  const tasks: Partial<Task>[] = [];
  
  let currentTask: Partial<Task> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Header line, e.g. "🔹 b4ad2d18 - Every hour" or "🔹 b4ad2d18 - Her gün saat 09:00"
    const headerMatch = line.match(/^(?:[^\w\s\d]+)?\s*([a-fA-F0-9]{8})\s*-\s*(.+)$/i);
    if (headerMatch) {
      const id = headerMatch[1];
      const scheduleLabel = headerMatch[2].trim();
      const scheduleParsed = parseSchedule(scheduleLabel);
      currentTask = {
        id,
        schedule: {
          label: scheduleLabel,
          intervalMs: scheduleParsed.intervalMs,
          time: scheduleParsed.time,
        },
      };
      continue;
    }
    
    // Body/status line, e.g. "🟢 Active | ukrayna..." or "⏸️ Paused | ukrayna..."
    const bodyMatch = line.match(/^(?:[^\w\s\d]+)?\s*(Active|Paused|Running|Error|Completed|Done)\s*(?:\|\s*(.+))?$/i);
    if (bodyMatch && currentTask) {
      const statusWord = bodyMatch[1].toLowerCase();
      const title = bodyMatch[2] ? bodyMatch[2].trim() : "";
      
      let status: Task["status"] = "active";
      if (statusWord === "paused") status = "paused";
      else if (statusWord === "running") status = "running";
      else if (statusWord === "error") status = "error";
      else if (statusWord === "completed" || statusWord === "done") status = "completed";
      
      currentTask.status = status;
      currentTask.title = title || "Task " + currentTask.id;
      
      // Determine type from title/description keywords
      let type: Task["type"] = "track";
      const titleLower = currentTask.title.toLowerCase();
      if (titleLower.includes("crawl") || titleLower.includes("scrape")) {
        type = "crawl";
      } else if (titleLower.includes("monitor") || titleLower.includes("watch")) {
        type = "monitor";
      }
      currentTask.type = type;
      
      tasks.push(currentTask);
      currentTask = null;
    }
  }
  
  return tasks;
}

