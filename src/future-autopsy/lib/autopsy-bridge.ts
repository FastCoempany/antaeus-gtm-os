import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database.types";
import type { TaskLog, TaskLogPerDeal } from "./types";

/**
 * Future Autopsy ↔ Supabase row bridge.
 *
 * Future Autopsy persists exactly ONE bag of state — the task-completion
 * log keyed by dealId — so the cloud shape is one row in
 * `studio_artifacts` with `data.kind='future-autopsy.taskLog'`.
 *
 * Every save UPSERTS the same row (find-or-insert by kind). Realtime
 * INSERT/UPDATE on the kind replaces the in-memory log.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const KIND_TASK_LOG = "future-autopsy.taskLog";

export function looksLikePersistedId(id: string): boolean {
    return UUID_RE.test(id);
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

export function rowKind(row: Row<"studio_artifacts">): string | null {
    const data = asObject(row.data);
    if (!data) return null;
    return asString(data["kind"]) || null;
}

/**
 * Hydrate a TaskLog from a Supabase row. Returns null when the row
 * is not a future-autopsy.taskLog kind.
 */
export function rowToTaskLog(
    row:
        | Row<"studio_artifacts">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): TaskLog | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"studio_artifacts">;
    const data = asObject(r.data);
    if (!data) return null;
    if (data["kind"] !== KIND_TASK_LOG) return null;
    const log = asObject(data["log"]);
    if (!log) return {};

    const out: Record<string, TaskLogPerDeal> = {};
    for (const [dealId, value] of Object.entries(log)) {
        const o = asObject(value);
        if (!o) continue;
        const tasksRaw = asObject(o["tasks"]);
        const tasks: Record<string, { done: boolean; doneAt?: string }> = {};
        if (tasksRaw) {
            for (const [taskId, raw2] of Object.entries(tasksRaw)) {
                const t = asObject(raw2);
                if (!t) continue;
                const entry: { done: boolean; doneAt?: string } = {
                    done: t["done"] === true
                };
                if (typeof t["doneAt"] === "string") entry.doneAt = t["doneAt"];
                tasks[taskId] = entry;
            }
        }
        const lastRunAt = asString(o["lastRunAt"]);
        const perDeal: TaskLogPerDeal = lastRunAt
            ? { tasks, lastRunAt }
            : { tasks };
        out[dealId] = perDeal;
    }
    return out;
}

export function taskLogToInsert(log: TaskLog): InsertRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_TASK_LOG,
            log
        } as unknown as Json
    };
}

export function taskLogToUpdate(log: TaskLog): UpdateRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_TASK_LOG,
            log
        } as unknown as Json
    };
}
