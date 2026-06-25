"use client";

import { useState, useEffect } from "react";
import Dialog, { DialogButton } from "./Dialog";
import { useTaskStore } from "./TaskStore";
import { AgentTemplate } from "../lib/templateData";
import { generateTaskId, cleanAgentName } from "../lib/taskParser";
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


export default function TemplateDeployDialog({
  isOpen,
  onClose,
  template,
  onDeploy,
}: TemplateDeployDialogProps) {
  const { addTask, setSelectedAgentId, syncTasks, runTask } = useTaskStore();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [taskType, setTaskType] = useState<Task["type"]>("track");
  const [schedule, setSchedule] = useState("daily");
  const [customSchedule, setCustomSchedule] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (template) {
      setName(cleanAgentName(template.title));
      setPrompt(template.prompt);
      setTaskType(template.taskType);
      setCustomSchedule("");
      
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

    const finalSchedule = customSchedule.trim() || schedule;

    if (onDeploy) {
      onDeploy({
        name: name.trim(),
        prompt: prompt.trim(),
        taskType,
        schedule: finalSchedule,
      });
      setIsDeploying(false);
      return;
    }

    const now = Date.now();
    
    // Parse interval
    let intervalMs = 24 * 60 * 60 * 1000; // default daily
    if (finalSchedule.includes("1 hour")) intervalMs = 60 * 60 * 1000;
    else if (finalSchedule.includes("6 hours")) intervalMs = 6 * 60 * 60 * 1000;
    else if (finalSchedule.includes("12 hours")) intervalMs = 12 * 60 * 60 * 1000;
    else if (finalSchedule === "weekly") intervalMs = 7 * 24 * 60 * 60 * 1000;

    const nlpCommand = `${taskType} "${name.trim()}" ${finalSchedule}: ${prompt.trim()}`;
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nlpCommand, stream: false }),
      });

      let parsedId = null;
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.answer === "string") {
          // Extract taskId from answer
          const match = data.answer.match(/(?:task|created|id|agent)\s*[:\-#]?\s*\b([a-fA-F0-9]{8})\b/i);
          if (match) {
            parsedId = match[1];
          } else {
            const fallbackMatch = data.answer.match(/\b([a-fA-F0-9]{8})\b/);
            if (fallbackMatch) {
              parsedId = fallbackMatch[1];
            }
          }
        }
      }

      const finalTaskId = parsedId || generateTaskId();

      const newTask: Task = {
        id: finalTaskId,
        title: name.trim(),
        prompt: prompt.trim(),
        type: taskType,
        status: "active",
        schedule: {
          label: SCHEDULE_PRESETS.find((p) => p.value === finalSchedule)?.label || finalSchedule,
          intervalMs,
        },
        target: name.trim(),
        createdAt: now,
        nextRunAt: now + intervalMs,
        runCount: 0,
        data: [],
      };

      // Add task locally with the correct upstream ID
      addTask(newTask);

      // Start the task execution immediately in the background
      runTask(finalTaskId);

      // Sync tasks in background to align details
      syncTasks();

      setIsDeploying(false);
      setSelectedAgentId(finalTaskId);
      onClose();
    } catch (err) {
      console.error("Error creating task upstream:", err);
      // Fallback in case of network error
      const fallbackId = generateTaskId();
      const fallbackTask: Task = {
        id: fallbackId,
        title: name.trim(),
        prompt: prompt.trim(),
        type: taskType,
        status: "active",
        schedule: {
          label: SCHEDULE_PRESETS.find((p) => p.value === finalSchedule)?.label || finalSchedule,
          intervalMs,
        },
        target: name.trim(),
        createdAt: now,
        nextRunAt: now + intervalMs,
        runCount: 0,
        data: [],
      };
      addTask(fallbackTask);
      runTask(fallbackId);
      setIsDeploying(false);
      setSelectedAgentId(fallbackId);
      onClose();
    }
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

        {/* Schedule & Custom in 2 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Execution Schedule */}
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

          {/* Custom */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Custom
            </label>
            <input
              type="text"
              value={customSchedule}
              onChange={(e) => setCustomSchedule(e.target.value)}
              placeholder="Every monday at 9 am"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:border-[var(--accent)] text-sm transition-colors"
              disabled={isDeploying}
            />
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
