import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { reportError, trackEvent } from "@/lib/observability";
import {
    angleToInsert,
    angleToUpdate,
    looksLikePersistedId,
    rowToAngle,
    rowToTouch,
    rowsToAngles,
    rowsToTouches,
    SEQUENCE_KEY_OUTBOUND,
    SEQUENCE_KEY_OUTBOUND_ANGLE,
    touchToInsert,
    touchToUpdate
} from "./outbound-bridge";
import type { Angle, Touch } from "./types";
import {
    allAngles,
    allTouches,
    appendAngle,
    appendTouch,
    setAllAngles,
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
    readonly angleCount: number;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        // Fetch touches + angles in parallel — both live in `sequences`,
        // discriminated by sequence_key.
        const [touchRows, angleRows] = await Promise.all([
            client.sequences.list({
                where: { sequence_key: SEQUENCE_KEY_OUTBOUND },
                limit: 500
            }),
            client.sequences.list({
                where: { sequence_key: SEQUENCE_KEY_OUTBOUND_ANGLE },
                limit: 200
            })
        ]);

        const touchesCloud = rowsToTouches(touchRows);
        const anglesCloud = rowsToAngles(angleRows);
        const cloudHasData = touchesCloud.length + anglesCloud.length > 0;

        if (cloudHasData) {
            setAllTouches(touchesCloud);
            setAllAngles(anglesCloud);
            subscribeRealtime(client);
            trackEvent("outbound_studio_boot", {
                mode: "cloud",
                touchCount: touchesCloud.length,
                angleCount: anglesCloud.length
            });
            return {
                mode: "cloud",
                touchCount: touchesCloud.length,
                angleCount: anglesCloud.length
            };
        }
        const localTouches = allTouches.value;
        const localAngles = allAngles.value;
        const localHasData = localTouches.length + localAngles.length > 0;
        if (localHasData) {
            await migrateLocalToCloud(client, localTouches, localAngles);
            subscribeRealtime(client);
            trackEvent("outbound_studio_boot", {
                mode: "migrated",
                touchCount: localTouches.length,
                angleCount: localAngles.length
            });
            return {
                mode: "migrated",
                touchCount: localTouches.length,
                angleCount: localAngles.length
            };
        }
        subscribeRealtime(client);
        trackEvent("outbound_studio_boot", {
            mode: "empty",
            touchCount: 0,
            angleCount: 0
        });
        return { mode: "empty", touchCount: 0, angleCount: 0 };
    } catch (err) {
        reportError(err, { op: "outbound-studio.bootCloudPersistence" });
        return {
            mode: "local-only",
            touchCount: allTouches.value.length,
            angleCount: allAngles.value.length
        };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    localTouches: ReadonlyArray<Touch>,
    localAngles: ReadonlyArray<Angle>
): Promise<void> {
    const nextTouches: Touch[] = [];
    for (const touch of localTouches) {
        try {
            const insert = touchToInsert(touch);
            const row = await client.sequences.insert(insert);
            const hydrated = rowToTouch(row);
            nextTouches.push(hydrated ?? touch);
        } catch (err) {
            reportError(err, {
                op: "outbound-studio.migrateLocalToCloud.touch",
                touchId: touch.id
            });
            nextTouches.push(touch);
        }
    }
    setAllTouches(nextTouches);

    const nextAngles: Angle[] = [];
    for (const angle of localAngles) {
        try {
            const row = await client.sequences.insert(angleToInsert(angle));
            const hydrated = rowToAngle(row);
            nextAngles.push(hydrated ?? angle);
        } catch (err) {
            reportError(err, {
                op: "outbound-studio.migrateLocalToCloud.angle",
                angleId: angle.id
            });
            nextAngles.push(angle);
        }
    }
    setAllAngles(nextAngles);
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

/**
 * Persist an Angle create/update. Optimistic — `appendAngle` already
 * happened in the caller; this routes to insert vs update based on
 * the id shape.
 */
export async function saveAngle(angle: Angle): Promise<Angle> {
    if (!clientRef) return angle;
    try {
        const isUpdate = looksLikePersistedId(angle.id);
        const row = isUpdate
            ? await clientRef.sequences.update(angle.id, angleToUpdate(angle))
            : await clientRef.sequences.insert(angleToInsert(angle));
        const saved = rowToAngle(row);
        if (saved) {
            if (!isUpdate && saved.id !== angle.id) {
                const without = allAngles.value.filter(
                    (a) => a.id !== angle.id
                );
                setAllAngles([saved, ...without]);
            } else {
                setAllAngles(
                    allAngles.value.map((a) => (a.id === saved.id ? saved : a))
                );
            }
            trackEvent("outbound_studio_save_angle", {
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return angle;
    } catch (err) {
        reportError(err, {
            op: "outbound-studio.saveAngle",
            angleId: angle.id
        });
        return angle;
    }
}

export async function deleteAngleInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.sequences.remove(id);
    } catch (err) {
        reportError(err, {
            op: "outbound-studio.deleteAngleInCloud",
            angleId: id
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
            // Drop by id from whichever list contains it. Cheap because both
            // are small.
            if (allTouches.value.some((t) => t.id === id)) {
                setAllTouches(allTouches.value.filter((t) => t.id !== id));
            } else if (allAngles.value.some((a) => a.id === id)) {
                setAllAngles(allAngles.value.filter((a) => a.id !== id));
            }
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (!payloadHasRow(payload.new)) return;
        // Route by sequence_key. sequences holds outbound + outbound-angle +
        // linkedin; only the first two are ours.
        const newRow = payload.new as { sequence_key?: unknown };
        const key =
            typeof newRow.sequence_key === "string"
                ? newRow.sequence_key
                : null;
        if (key === SEQUENCE_KEY_OUTBOUND) {
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
        } else if (key === SEQUENCE_KEY_OUTBOUND_ANGLE) {
            const angle = rowToAngle(payload.new);
            if (!angle) return;
            const exists = allAngles.value.some((a) => a.id === angle.id);
            if (exists) {
                setAllAngles(
                    allAngles.value.map((a) =>
                        a.id === angle.id ? angle : a
                    )
                );
            } else {
                appendAngle(angle);
            }
        }
        // else: linkedin or other key — ignore.
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
