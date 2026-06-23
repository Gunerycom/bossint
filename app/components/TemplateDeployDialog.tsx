"use client";

import { useState, useEffect } from "react";
import Dialog, { DialogButton } from "./Dialog";
import { useTaskStore } from "./TaskStore";
import { AgentTemplate } from "../lib/templateData";
import { generateTaskId } from "../lib/taskParser";
import type { Task, TaskStatus } from "../lib/taskTypes";
import { Calendar, Play, Settings2, ShieldCheck } from "lucide-react";

interface TemplateDeployDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: AgentTemplate | null;
  onDeploy?: (configuredDetails: { name: string; prompt: string; taskType: Task["type"]; schedule: string }) => void;
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

export default function TemplateDeployDialog({
  isOpen,
  onClose,
  template,
  onDeploy,
}: TemplateDeployDialogProps) {
  const { triggerCommand, addTask, setView } = useTaskStore();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [taskType, setTaskType] = useState<Task["type"]>("track");
  const [schedule, setSchedule] = useState("daily");
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.title);
      setPrompt(template.prompt);
      setTaskType(template.taskType);
      
      // Try to match schedule label or default
      const matchedPreset = SCHEDULE_PRESETS.find(
        (p) => p.value === template.schedule || p.label.toLowerCase() === template.schedule.toLowerCase()
      );
      setSchedule(matchedPreset ? matchedPreset.value : "daily");
    }
  }, [template, isOpen]);

  if (!template) return null;

  const handleDeploy = async () => {
    if (!name.trim() || !prompt.trim()) return;

    setIsDeploying(true);

    if (onDeploy) {
      onDeploy({
        name: name.trim(),
        prompt: prompt.trim(),
        taskType,
        schedule,
      });
      setIsDeploying(false);
      return;
    }

    // 1. Generate clean task
    const taskId = generateTaskId();
    const now = Date.now();
    
    // Parse interval
    let intervalMs = 24 * 60 * 60 * 1000; // default daily
    if (schedule.includes("1 hour")) intervalMs = 60 * 60 * 1000;
    else if (schedule.includes("6 hours")) intervalMs = 6 * 60 * 60 * 1000;
    else if (schedule.includes("12 hours")) intervalMs = 12 * 60 * 60 * 1000;
    else if (schedule === "weekly") intervalMs = 7 * 24 * 60 * 60 * 1000;

    const newTask: Task = {
      id: taskId,
      title: name.trim(),
      prompt: prompt.trim(),
      type: taskType,
      status: "active",
      schedule: {
        label: SCHEDULE_PRESETS.find((p) => p.value === schedule)?.label || "Daily",
        intervalMs,
      },
      target: name.trim(),
      createdAt: now,
      nextRunAt: now + intervalMs,
      runCount: 0,
      data: [],
    };

    // 2. Add locally for immediate feedback
    addTask(newTask);

    // 3. Trigger command upstream so backend creates it
    // Format: "track 'Bitcoin Price Tracker' every 6 hours: Analyze Bitcoin..."
    const nlpCommand = `${taskType} "${name.trim()}" ${schedule}: ${prompt.trim()}`;
    triggerCommand(nlpCommand);

    // 4. Redirect to Dashboard & close
    setTimeout(() => {
      setIsDeploying(false);
      setView("dashboard");
      onClose();
    }, 800);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Configure & Deploy Agent"
      subtitle={`Deploying: ${template.title}`}
      icon={<Settings2 className="w-5 h-5" strokeWidth={1.5} />}
      maxWidth="max-w-[560px]"
    >
      <div className="space-y-5">
        {/* Agent Name */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Agent Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors"
            placeholder="E.g., Competitor Watchdog"
            disabled={isDeploying}
          />
        </div>

        {/* Task Type and Schedule Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Task Type */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Objective Type
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as Task["type"])}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors"
              disabled={isDeploying}
            >
              {TASK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.desc})
                </option>
              ))}
            </select>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Execution Schedule
            </label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors"
              disabled={isDeploying}
            >
              {SCHEDULE_PRESETS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Autopilot Prompt / Research Objective
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors font-sans resize-none"
            placeholder="Enter the instructions for the agent..."
            disabled={isDeploying}
          />
        </div>

        {/* Info Box */}
        <div className="flex gap-3 p-3.5 rounded-xl bg-[var(--thinking-bg)] border border-[var(--thinking-border)] text-xs text-[var(--text-secondary)]">
          <ShieldCheck className="w-5 h-5 text-[var(--accent)] flex-shrink-0" strokeWidth={1.5} />
          <p className="leading-relaxed">
            This agent will execute autonomously on the specified schedule. Any updates, crawled data, and screenshots will be saved to your dashboard log.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <DialogButton onClick={onClose} variant="ghost" disabled={isDeploying}>
            Cancel
          </DialogButton>
          <DialogButton
            onClick={handleDeploy}
            variant="primary"
            disabled={isDeploying || !name.trim() || !prompt.trim()}
            icon={isDeploying ? null : <Play className="w-4 h-4 fill-current" strokeWidth={1.5} />}
          >
            {isDeploying ? "Deploying..." : "Deploy Agent"}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  );
}
