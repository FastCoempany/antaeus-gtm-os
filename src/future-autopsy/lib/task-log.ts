import type { TaskLog, TaskLogPerDeal } from "./types";
import { reportError } from "@/lib/observability";

/**
 * Phase 4 / Room 4 Wave 5 — task-completion log persistence.
 *
 * `gtmos_autopsy_log_v1` is the only persistent state Future Autopsy
 * owns. Shape (per legacy lines 1931-1951):
 *
 *   {
 *     [dealId]: {
 *       lastRunAt: ISO-8601,
 *       tasks: { [taskId]: { done: boolean, doneAt?: ISO-8601 } }
 *     }
 *   }
 *
 * Same defensive posture as Phase 4 / Room 1's mirror: malformed JSON
 * → empty object, hostile storage → swallowed via reportError.
 */

export const TASK_LOG_KEY = "gtmos_autopsy_log_v1";

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

export function loadTaskLog(
    storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): TaskLog {
    if (!storage) return {};
    try {
        const raw = storage.getItem(TASK_LOG_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        if (!root) return {};
        const out: Record<string, TaskLogPerDeal> = {};
        for (const [dealId, value] of Object.entries(root)) {
            const o = asObject(value);
            if (!o) continue;
            const tasks = asObject(o.tasks);
            const tasksOut: Record<string, { done: boolean; doneAt?: string }> = {};
            if (tasks) {
                for (const [taskId, raw2] of Object.entries(tasks)) {
                    const t = asObject(raw2);
                    if (!t) continue;
                    const done = t.done === true;
                    const entry: { done: boolean; doneAt?: string } = { done };
                    if (typeof t.doneAt === "string") entry.doneAt = t.doneAt;
                    tasksOut[taskId] = entry;
                }
            }
            const perDeal: TaskLogPerDeal = {
                tasks: tasksOut,
                ...(typeof o.lastRunAt === "string" ? { lastRunAt: o.lastRunAt } : {})
            };
            out[dealId] = perDeal;
        }
        return out;
    } catch (err) {
        reportError(err, { op: "future-autopsy.loadTaskLog" });
        return {};
    }
}

export function saveTaskLog(
    log: TaskLog,
    storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): void {
    if (!storage) return;
    try {
        storage.setItem(TASK_LOG_KEY, JSON.stringify(log));
    } catch (err) {
        reportError(err, { op: "future-autopsy.saveTaskLog" });
    }
}

export function isTaskDone(log: TaskLog, dealId: string, taskId: string): boolean {
    return !!log[dealId]?.tasks[taskId]?.done;
}

/**
 * Toggle a task's done state. Returns the new log shape (immutable —
 * the input log is not mutated).
 */
export function toggleTask(
    log: TaskLog,
    dealId: string,
    taskId: string,
    now: string = new Date().toISOString()
): TaskLog {
    const perDeal = log[dealId] ?? { tasks: {} };
    const wasDone = !!perDeal.tasks[taskId]?.done;
    const nextEntry: { done: boolean; doneAt?: string } = wasDone
        ? { done: false }
        : { done: true, doneAt: now };
    const nextPerDeal: TaskLogPerDeal = {
        lastRunAt: now,
        tasks: { ...perDeal.tasks, [taskId]: nextEntry }
    };
    return { ...log, [dealId]: nextPerDeal };
}
