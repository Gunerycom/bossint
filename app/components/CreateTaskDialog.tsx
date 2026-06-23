"use client";

import { useState } from "react";
import Dialog, { DialogButton } from "./Dialog";
import { useTaskStore } from "./TaskStore";
import { buildTaskFromCommand } from "../lib/taskParser";
import type { Task } from "../lib/taskTypes";
import {
  Sparkles,
  LineChart,
  Globe,
  Activity,
  Settings,
  CheckCircle2,
  MessageSquare,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCHEDULE_PRESETS = [
  { label: "Every hour", value: "every 1 hour" },
  { label: "Every 6 hours", value: "every 6 hours" },
  { label: "Every 12 hours", value: "every 12 hours" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
];

const TASK_TYPE_OPTIONS: { value: Task["type"]; label: string; desc: string }[] = [
  { value: "track", label: "Track", desc: "Monitor changes over time" },
  { value: "crawl", label: "Crawl", desc: "Scrape web content" },
  { value: "monitor", label: "Monitor", desc: "Watch for events" },
  { value: "custom", label: "Custom", desc: "Custom automation" },
];

export default function CreateTaskDialog({ isOpen, onClose }: CreateTaskDialogProps) {
  const { triggerCommand, openSidebar, setView } = useTaskStore();
  const [mode, setMode] = useState<"nlp" | "form">("nlp");
  const [nlpInput, setNlpInput] = useState("");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [taskType, setTaskType] = useState<Task["type"]>("track");
  const [schedule, setSchedule] = useState("daily");
  const [customSchedule, setCustomSchedule] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  const getTaskTypeIcon = (type: Task["type"]) => {
    switch (type) {
      case "track":
        return <LineChart className="w-4 h-4" strokeWidth={1.5} />;
      case "crawl":
        return <Globe className="w-4 h-4" strokeWidth={1.5} />;
      case "monitor":
        return <Activity className="w-4 h-4" strokeWidth={1.5} />;
      case "custom":
      default:
        return <Settings className="w-4 h-4" strokeWidth={1.5} />;
    }
  };

  const reset = () => {
    setNlpInput("");
    setTitle("");
    setTarget("");
    setTaskType("track");
    setSchedule("daily");
    setCustomSchedule("");
    setShowSuccess(false);
    setCreatedTask(null);
    setMode("nlp");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleNlpCreate = () => {
    if (!nlpInput.trim()) return;
    triggerCommand(nlpInput.trim());
    setView("dashboard");
    handleClose();
  };

  const handleFormCreate = () => {
    if (taskType === "crawl" && !target.trim() && !title.trim()) return;
    if (taskType !== "crawl" && !title.trim()) return;
    
    const scheduleStr = customSchedule || schedule;
    let prompt = "";
    
    if (taskType === "crawl") {
      prompt = `crawl ${target.trim() || title.trim()} ${scheduleStr}`;
    } else {
      const targetPart = target.trim() ? ` ${target.trim()}` : "";
      prompt = `${taskType} ${title.trim()}${targetPart} ${scheduleStr}`;
    }
    
    triggerCommand(prompt);
    setView("dashboard");
    handleClose();
  };

  // Success view (if shown in modal directly)
  if (showSuccess && createdTask) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Task Created"
        subtitle="Your task is now active and scheduled"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />}
      >
        <div className="space-y-4">
          <div
            className="rounded-xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[var(--accent)]">
                {getTaskTypeIcon(createdTask.type)}
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {createdTask.title}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                  ID: {createdTask.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <InfoCell label="Schedule" value={createdTask.schedule.label} />
              <InfoCell
                label="Next Run"
                value={createdTask.nextRunAt ? new Date(createdTask.nextRunAt).toLocaleTimeString() : "Never"}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <DialogButton
              variant="secondary"
              onClick={() => {
                reset();
              }}
              fullWidth
            >
              Create Another
            </DialogButton>
            <DialogButton
              variant="primary"
              onClick={() => {
                setView("dashboard");
                handleClose();
              }}
              fullWidth
            >
              View Dashboard
            </DialogButton>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create a Task"
      subtitle="Automate recurring research, crawling, and monitoring"
      icon={<Sparkles className="w-5 h-5" strokeWidth={1.5} />}
      maxWidth="max-w-[520px]"
    >
      <div className="space-y-5">
        {/* Mode Toggle */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <ModeTab
            active={mode === "nlp"}
            onClick={() => setMode("nlp")}
            icon={<MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Natural Language"
          />
          <ModeTab
            active={mode === "form"}
            onClick={() => setMode("form")}
            icon={<FileText className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Form Builder"
          />
        </div>

        {mode === "nlp" ? (
          /* ---- NLP Mode ---- */
          <div className="space-y-3">
            <p
              className="text-xs text-[var(--text-secondary)]"
            >
              Describe what you want to track, crawl, or monitor. Include a schedule.
            </p>

            <textarea
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              placeholder='e.g. "Track Bitcoin price every 6 hours" or "Crawl https://news.ycombinator.com daily at 9am"'
              rows={3}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none transition-all duration-200 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent)]"
            />

            {/* Example chips */}
            <div className="space-y-2">
              <p
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]"
              >
                Examples
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Track petrol prices in London daily at 9am",
                  "Crawl https://news.ycombinator.com every 12 hours",
                  "Monitor weather in NYC every 6 hours",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setNlpInput(example)}
                    className="px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <DialogButton
              variant="primary"
              onClick={handleNlpCreate}
              disabled={!nlpInput.trim()}
              fullWidth
              icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
            >
              Create Task
            </DialogButton>
          </div>
        ) : (
          /* ---- Form Mode ---- */
          <div className="space-y-4">
            {/* Task Type */}
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider block mb-2 text-[var(--text-tertiary)]"
              >
                Task Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TASK_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTaskType(opt.value)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all duration-150 cursor-pointer"
                    style={{
                      backgroundColor:
                        taskType === opt.value
                          ? "var(--accent-subtle)"
                          : "var(--bg-surface)",
                      border: `1.5px solid ${
                        taskType === opt.value
                          ? "var(--accent)"
                          : "var(--border-subtle)"
                      }`,
                      color:
                        taskType === opt.value
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {getTaskTypeIcon(opt.value)}
                    <span className="text-[11px] font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <FormField label="Task Name" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Petrol prices London"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent)]"
              />
            </FormField>

            {/* Target */}
            <FormField label="Target (URL or Subject)">
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. https://example.com or 'Bitcoin price'"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent)]"
              />
            </FormField>

            {/* Schedule */}
            <FormField label="Schedule">
              <div className="flex flex-wrap gap-1.5">
                {SCHEDULE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setSchedule(preset.value);
                      setCustomSchedule("");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
                    style={{
                      backgroundColor:
                        schedule === preset.value && !customSchedule
                          ? "var(--accent-subtle)"
                          : "var(--bg-surface)",
                      color:
                        schedule === preset.value && !customSchedule
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                      border: `1px solid ${
                        schedule === preset.value && !customSchedule
                          ? "var(--accent)"
                          : "var(--border-subtle)"
                      }`,
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customSchedule}
                onChange={(e) => setCustomSchedule(e.target.value)}
                placeholder="Or type custom: 'daily at 9am', 'every 3 hours'"
                className="w-full mt-2 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent)]"
              />
            </FormField>

            <DialogButton
              variant="primary"
              onClick={handleFormCreate}
              disabled={!title.trim()}
              fullWidth
              icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
            >
              Create Task
            </DialogButton>
          </div>
        )}
      </div>
    </Dialog>
  );
}

/* ---- Sub-components ---- */

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
      style={{
        backgroundColor: active ? "var(--bg-primary)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
        boxShadow: active ? "var(--shadow-sm)" : "none",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-[11px] font-bold uppercase tracking-wider block text-[var(--text-tertiary)]"
      >
        {label}
        {required && (
          <span style={{ color: "var(--accent)" }}> *</span>
        )}
      </label>
      {children}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p
        className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]"
      >
        {label}
      </p>
      <p
        className="text-xs font-semibold text-[var(--text-secondary)]"
      >
        {value}
      </p>
    </div>
  );
}
