import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { reportError, trackEvent } from "@/lib/observability";
import {
    looksLikePersistedId,
    rowToTouch,
    rowsToTouches,
    SEQUENCE_KEY_OUTBOUND,
    touchToInsert,
    touchToUpdate
} from "./outbound-bridge";
import type { Touch } from "./types";
import {
    allTouches,
    appendTouch,
    setAllTouches
} from "../state";

/**
 * Outbound Studio cloud persistence (Supabase + realtime + first-sync
 * migration of any localStorage-only touches).
 *
 * Mirrors the Signal Console / ICP / PoC / Advisor templates: boot →
 * load cloud or migrate local up → subscribe realtime; saves go
 * through saveTouch + setTouchOutcomeInCloud helpers.
 *
 * The Outbound ANGLES library (saved value props) stays in localStorage
 * — angles are operator-personal templates, not cross-device shared
 * data. Touches are the cross-device-relevant data because Phase 4 /
 * Rooms 3 + 4 read them for execution-context temperature.
 */

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
    readonly touchCount: number;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.sequences.list({
            where: { sequence_key: SEQUENCE_KEY_OUTBOUND },
            limit: 500
        });
        if (rows.length > 0) {
            const touches = rowsToTouches(rows);
            setAllTouches(touches);
            subscribeRealtime(client);
            trackEvent("outbound_studio_boot", {
                mode: "cloud",
                count: touches.length
            });
            return { mode: "cloud", touchCount: touches.length };
        }
        const local = allTouches.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            trackEvent("outbound_studio_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", touchCount: local.length };
        }
        subscribeRealtime(client);
        trackEvent("outbound_studio_boot", { mode: "empty", count: 0 });
        return { mode: "empty", touchCount: 0 };
    } catch (err) {
        reportError(err, { op: "outbound-studio.bootCloudPersistence" });
        return { mode: "local-only", touchCount: allTouches.value.length };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    localTouches: ReadonlyArray<Touch>
): Promise<void> {
    const next: Touch[] = [];
    for (const touch of localTouches) {
        try {
            const insert = touchToInsert(touch);
            const row = await client.sequences.insert(insert);
            const hydrated = rowToTouch(row);
            next.push(hydrated ?? touch);
        } catch (err) {
            reportError(err, {
                op: "outbound-studio.migrateLocalToCloud",
                touchId: touch.id
            });
            next.push(touch);
        }
    }
    setAllTouches(next);
}

/**
 * Persist a Touch create/update. Optimistic — `appendTouch` already
 * happened in the caller; this routes to insert vs update.
 */
export async function saveTouch(touch: Touch): Promise<Touch> {
    if (!clientRef) return touch;
    try {
        const isUpdate = looksLikePersistedId(touch.id);
        const row = isUpdate
            ? await clientRef.sequences.update(touch.id, touchToUpdate(touch))
            : await clientRef.sequences.insert(touchToInsert(touch));
        const saved = rowToTouch(row);
        if (saved) {
            if (!isUpdate && saved.id !== touch.id) {
                // Drop legacy-id row, prepend the server's row.
                const without = allTouches.value.filter(
                    (t) => t.id !== touch.id
                );
                setAllTouches([saved, ...without]);
            } else {
                setAllTouches(
                    allTouches.value.map((t) => (t.id === saved.id ? saved : t))
                );
            }
            trackEvent("outbound_studio_save", {
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return touch;
    } catch (err) {
        reportError(err, {
            op: "outbound-studio.saveTouch",
            touchId: touch.id
        });
        return touch;
    }
}

export async function deleteTouchInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.sequences.remove(id);
    } catch (err) {
        reportError(err, {
            op: "outbound-studio.deleteTouchInCloud",
            touchId: id
        });
    }
}

function payloadHasRow(value: unknown): value is { id: string; sequence_key?: unknown } {
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
            setAllTouches(allTouches.value.filter((t) => t.id !== id));
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payloadHasRow(payload.new)) {
            // Filter to outbound rows only — sequences holds linkedin too.
            const newRow = payload.new as { sequence_key?: unknown };
            if (
                typeof newRow.sequence_key === "string" &&
                newRow.sequence_key !== SEQUENCE_KEY_OUTBOUND
            ) {
                return;
            }
            const touch = rowToTouch(payload.new);
            if (!touch) return;
            const exists = allTouches.value.some((t) => t.id === touch.id);
            if (exists) {
                setAllTouches(
                    allTouches.value.map((t) =>
                        t.id === touch.id ? touch : t
                    )
                );
            } else {
                appendTouch(touch);
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
        reportError(err, { op: "outbound-studio.teardownRealtime" });
    }
    realtimeChannel = null;
}
