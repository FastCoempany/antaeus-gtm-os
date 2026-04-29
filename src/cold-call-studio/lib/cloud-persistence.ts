import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { reportError, trackEvent } from "@/lib/observability";
import {
    callEntryToInsert,
    callEntryToUpdate,
    LOG_TYPE_COLD_CALL,
    looksLikePersistedId,
    rowToCallEntry,
    rowsToCallEntries
} from "./coldcall-bridge";
import type { CallLogEntry } from "./types";
import { appendCallEntry, callLog, setCallLog } from "../state";

let clientRef: DataClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

export function __setDataClientForTests(client: DataClient | null): void {
    clientRef = client;
}

export function __getDataClientForTests(): DataClient | null {
    return clientRef;
}

export interface BootResult {
    readonly mode: "cloud" | "migrated" | "local-only" | "empty";
    readonly callCount: number;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.discoveryCallLogs.list({
            where: { log_type: LOG_TYPE_COLD_CALL },
            limit: 500
        });
        if (rows.length > 0) {
            const next = rowsToCallEntries(rows);
            setCallLog(next);
            subscribeRealtime(client);
            trackEvent("cold_call_studio_boot", {
                mode: "cloud",
                count: next.length
            });
            return { mode: "cloud", callCount: next.length };
        }
        const local = callLog.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            trackEvent("cold_call_studio_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", callCount: local.length };
        }
        subscribeRealtime(client);
        trackEvent("cold_call_studio_boot", { mode: "empty", count: 0 });
        return { mode: "empty", callCount: 0 };
    } catch (err) {
        reportError(err, { op: "cold-call-studio.bootCloudPersistence" });
        return { mode: "local-only", callCount: callLog.value.length };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    local: ReadonlyArray<CallLogEntry>
): Promise<void> {
    const next: CallLogEntry[] = [];
    for (const entry of local) {
        try {
            const insert = callEntryToInsert(entry);
            const row = await client.discoveryCallLogs.insert(insert);
            const hydrated = rowToCallEntry(row);
            next.push(hydrated ?? entry);
        } catch (err) {
            reportError(err, {
                op: "cold-call-studio.migrateLocalToCloud",
                callId: entry.id
            });
            next.push(entry);
        }
    }
    setCallLog(next);
}

export async function saveCallEntry(entry: CallLogEntry): Promise<CallLogEntry> {
    if (!clientRef) return entry;
    try {
        const isUpdate = looksLikePersistedId(entry.id);
        const row = isUpdate
            ? await clientRef.discoveryCallLogs.update(
                  entry.id,
                  callEntryToUpdate(entry)
              )
            : await clientRef.discoveryCallLogs.insert(
                  callEntryToInsert(entry)
              );
        const saved = rowToCallEntry(row);
        if (saved) {
            if (!isUpdate && saved.id !== entry.id) {
                const without = callLog.value.filter((c) => c.id !== entry.id);
                setCallLog([saved, ...without]);
            } else {
                setCallLog(
                    callLog.value.map((c) => (c.id === saved.id ? saved : c))
                );
            }
            trackEvent("cold_call_studio_save", {
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return entry;
    } catch (err) {
        reportError(err, {
            op: "cold-call-studio.saveCallEntry",
            callId: entry.id
        });
        return entry;
    }
}

export async function deleteCallInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.discoveryCallLogs.remove(id);
    } catch (err) {
        reportError(err, {
            op: "cold-call-studio.deleteCallInCloud",
            callId: id
        });
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
        if (payloadHasRow(payload.old)) {
            const id = payload.old.id;
            setCallLog(callLog.value.filter((c) => c.id !== id));
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payloadHasRow(payload.new)) {
            const newRow = payload.new as { log_type?: unknown };
            if (
                typeof newRow.log_type === "string" &&
                newRow.log_type !== LOG_TYPE_COLD_CALL
            ) {
                return;
            }
            const entry = rowToCallEntry(payload.new);
            if (!entry) return;
            const exists = callLog.value.some((c) => c.id === entry.id);
            if (exists) {
                setCallLog(
                    callLog.value.map((c) =>
                        c.id === entry.id ? entry : c
                    )
                );
            } else {
                appendCallEntry(entry);
            }
        }
    }
}

export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.discoveryCallLogs.subscribe((payload) => {
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
        reportError(err, { op: "cold-call-studio.teardownRealtime" });
    }
    realtimeChannel = null;
}
