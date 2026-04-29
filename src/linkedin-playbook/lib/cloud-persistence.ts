import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json } from "@/lib/database.types";
import { reportError, trackEvent } from "@/lib/observability";
import { enqueueRetry } from "@/lib/cloud-sync-queue";
import {
    actionToInsert,
    actionToUpdate,
    looksLikePersistedId,
    rowToAction,
    rowsToActions,
    SEQUENCE_KEY_LINKEDIN
} from "./linkedin-bridge";
import type { ActionEntry } from "./types";
import { actions, appendAction, setActions } from "../state";

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
    readonly actionCount: number;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.sequences.list({
            where: { sequence_key: SEQUENCE_KEY_LINKEDIN },
            limit: 500
        });
        if (rows.length > 0) {
            const next = rowsToActions(rows);
            setActions(next);
            subscribeRealtime(client);
            trackEvent("linkedin_playbook_boot", {
                mode: "cloud",
                count: next.length
            });
            return { mode: "cloud", actionCount: next.length };
        }
        const local = actions.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            trackEvent("linkedin_playbook_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", actionCount: local.length };
        }
        subscribeRealtime(client);
        trackEvent("linkedin_playbook_boot", { mode: "empty", count: 0 });
        return { mode: "empty", actionCount: 0 };
    } catch (err) {
        reportError(err, { op: "linkedin-playbook.bootCloudPersistence" });
        return { mode: "local-only", actionCount: actions.value.length };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    local: ReadonlyArray<ActionEntry>
): Promise<void> {
    const next: ActionEntry[] = [];
    for (const entry of local) {
        try {
            const insert = actionToInsert(entry);
            const row = await client.sequences.insert(insert);
            const hydrated = rowToAction(row);
            next.push(hydrated ?? entry);
        } catch (err) {
            reportError(err, {
                op: "linkedin-playbook.migrateLocalToCloud",
                actionId: entry.id
            });
            next.push(entry);
        }
    }
    setActions(next);
}

export async function saveAction(entry: ActionEntry): Promise<ActionEntry> {
    if (!clientRef) return entry;
    try {
        const isUpdate = looksLikePersistedId(entry.id);
        const row = isUpdate
            ? await clientRef.sequences.update(entry.id, actionToUpdate(entry))
            : await clientRef.sequences.insert(actionToInsert(entry));
        const saved = rowToAction(row);
        if (saved) {
            if (!isUpdate && saved.id !== entry.id) {
                const without = actions.value.filter((a) => a.id !== entry.id);
                setActions([saved, ...without]);
            } else {
                setActions(
                    actions.value.map((a) => (a.id === saved.id ? saved : a))
                );
            }
            trackEvent("linkedin_playbook_save", {
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return entry;
    } catch (err) {
        reportError(err, {
            op: "linkedin-playbook.saveAction",
            actionId: entry.id
        });
        const isUpdate = looksLikePersistedId(entry.id);
        enqueueRetry({
            table: "sequences",
            op: isUpdate ? "update" : "insert",
            rowId: isUpdate ? entry.id : null,
            payload: (isUpdate
                ? actionToUpdate(entry)
                : actionToInsert(entry)) as unknown as Json,
            source: "linkedin-playbook.saveAction"
        });
        return entry;
    }
}

export async function deleteActionInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.sequences.remove(id);
    } catch (err) {
        reportError(err, {
            op: "linkedin-playbook.deleteActionInCloud",
            actionId: id
        });
        enqueueRetry({
            table: "sequences",
            op: "delete",
            rowId: id,
            source: "linkedin-playbook.deleteActionInCloud"
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
            setActions(actions.value.filter((a) => a.id !== id));
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payloadHasRow(payload.new)) {
            const newRow = payload.new as { sequence_key?: unknown };
            if (
                typeof newRow.sequence_key === "string" &&
                newRow.sequence_key !== SEQUENCE_KEY_LINKEDIN
            ) {
                return;
            }
            const entry = rowToAction(payload.new);
            if (!entry) return;
            const exists = actions.value.some((a) => a.id === entry.id);
            if (exists) {
                setActions(
                    actions.value.map((a) => (a.id === entry.id ? entry : a))
                );
            } else {
                appendAction(entry);
            }
        }
    }
}

export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.sequences.subscribe((payload) => {
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
        reportError(err, { op: "linkedin-playbook.teardownRealtime" });
    }
    realtimeChannel = null;
}
