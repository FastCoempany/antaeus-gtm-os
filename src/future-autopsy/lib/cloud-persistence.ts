import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json, Row } from "@/lib/database.types";
import { reportError, trackEvent } from "@/lib/observability";
import { enqueueRetry } from "@/lib/cloud-sync-queue";
import {
    KIND_TASK_LOG,
    rowKind,
    rowToTaskLog,
    taskLogToInsert,
    taskLogToUpdate
} from "./autopsy-bridge";
import type { TaskLog } from "./types";
import { setTaskLog, taskLog } from "../state";

/**
 * Future Autopsy cloud persistence.
 *
 * The room owns ONE bag of state: the task-completion log keyed by
 * dealId. It maps to a single studio_artifacts row with
 * kind='future-autopsy.taskLog'. Saves UPSERT that single row.
 *
 * Boot flow:
 *   1. Find the task-log row for the workspace (if any)
 *   2. If found → cloud is canonical → setTaskLog(rowToTaskLog(row));
 *      remember the row id for future updates
 *   3. If not found AND localStorage has a non-empty log → insert it
 *      and remember the new row id
 *   4. Subscribe to realtime; UPDATE/INSERT on the kind replaces the
 *      in-memory log; DELETE clears it
 */

let clientRef: DataClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let cloudRowId: string | null = null;

export function __setDataClientForTests(client: DataClient | null): void {
    clientRef = client;
    cloudRowId = null;
}

export function __getDataClientForTests(): DataClient | null {
    return clientRef;
}

export function __getCloudRowIdForTests(): string | null {
    return cloudRowId;
}

export interface BootResult {
    readonly mode: "cloud" | "migrated" | "local-only" | "empty";
}

function isEmpty(log: TaskLog): boolean {
    return Object.keys(log).length === 0;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        // Fetch all studio_artifacts; find the most recent task-log row.
        const rows = await client.studioArtifacts.list({
            orderBy: { column: "updated_at", ascending: false },
            limit: 1000
        });
        const matching = rows.find((r) => rowKind(r) === KIND_TASK_LOG);
        if (matching) {
            const log = rowToTaskLog(matching);
            cloudRowId = matching.id;
            if (log) setTaskLog(log);
            subscribeRealtime(client);
            trackEvent("future_autopsy_boot", { mode: "cloud" });
            return { mode: "cloud" };
        }
        if (!isEmpty(taskLog.value)) {
            const inserted = await client.studioArtifacts.insert(
                taskLogToInsert(taskLog.value)
            );
            cloudRowId = inserted.id;
            subscribeRealtime(client);
            trackEvent("future_autopsy_boot", { mode: "migrated" });
            return { mode: "migrated" };
        }
        subscribeRealtime(client);
        trackEvent("future_autopsy_boot", { mode: "empty" });
        return { mode: "empty" };
    } catch (err) {
        reportError(err, { op: "future-autopsy.bootCloudPersistence" });
        return { mode: "local-only" };
    }
}

/**
 * Persist the current task log. Upserts the single workspace row;
 * inserts on first save, updates on subsequent saves.
 */
export async function saveTaskLogToCloud(
    log: TaskLog
): Promise<TaskLog> {
    if (!clientRef) return log;
    try {
        if (cloudRowId) {
            await clientRef.studioArtifacts.update(
                cloudRowId,
                taskLogToUpdate(log)
            );
        } else {
            const inserted = await clientRef.studioArtifacts.insert(
                taskLogToInsert(log)
            );
            cloudRowId = inserted.id;
        }
        trackEvent("future_autopsy_save", {});
        return log;
    } catch (err) {
        reportError(err, { op: "future-autopsy.saveTaskLogToCloud" });
        // Singleton: insert if no rowId tracked, update otherwise.
        enqueueRetry({
            table: "studio_artifacts",
            op: cloudRowId ? "update" : "insert",
            rowId: cloudRowId,
            payload: (cloudRowId
                ? taskLogToUpdate(log)
                : taskLogToInsert(log)) as unknown as Json,
            source: "future-autopsy.saveTaskLogToCloud"
        });
        return log;
    }
}

function payloadHasRow(value: unknown): value is { id: string } {
    return (
        !!value &&
        typeof value === "object" &&
        "id" in value &&
        typeof (value as { id?: unknown }).id === "string"
    );
}

export function applyRealtimePayload(payload: {
    eventType: string;
    new: unknown;
    old: unknown;
}): void {
    if (payload.eventType === "DELETE") {
        if (!payloadHasRow(payload.old)) return;
        if (payload.old.id === cloudRowId) {
            setTaskLog({});
            cloudRowId = null;
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (!payloadHasRow(payload.new)) return;
        const row = payload.new as Row<"studio_artifacts">;
        if (rowKind(row) !== KIND_TASK_LOG) return;
        const log = rowToTaskLog(row);
        if (!log) return;
        cloudRowId = row.id;
        setTaskLog(log);
    }
}

export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.studioArtifacts.subscribe((payload) => {
        applyRealtimePayload(
            payload as unknown as {
                eventType: string;
                new: unknown;
                old: unknown;
            }
        );
    });
    realtimeChannel = channel;
    return channel;
}

export function __getRealtimeChannelForTests(): RealtimeChannel | null {
    return realtimeChannel;
}

export async function teardownRealtime(): Promise<void> {
    if (!realtimeChannel) return;
    try {
        await realtimeChannel.unsubscribe();
    } catch (err) {
        reportError(err, { op: "future-autopsy.teardownRealtime" });
    }
    realtimeChannel = null;
}
