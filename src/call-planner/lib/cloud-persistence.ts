import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { reportError, trackEvent } from "@/lib/observability";
import {
    LOG_TYPE_DISCOVERY_AGENDA,
    rowToSnapshot,
    rowsToSnapshots,
    snapshotToInsert
} from "./planner-bridge";
import type { AgendaSnapshot } from "./types";
import { hydrateDraftFromSnapshot } from "../state";

/**
 * Call Planner cloud persistence.
 *
 * Unlike the other rooms, Call Planner has only ONE in-flight agenda
 * at a time (the current draft), but every save adds an audit row to
 * `discovery_call_logs` so a future Handoff Kit / autopsy can replay
 * the planner's history.
 *
 * Boot flow:
 *   1. Fetch the most-recent discovery-agenda row for the workspace
 *   2. If a row exists → hydrate the draft from it (cloud is the
 *      cross-device canonical state for "what was I planning?")
 *   3. Subscribe to realtime so a snapshot saved on another device
 *      flows into this one without a refresh
 *
 * The localStorage `gtmos_discovery_agenda` key keeps writing on
 * every state change (autosave) — that's the offline fallback.
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
    readonly mode: "cloud" | "local-only" | "empty";
    readonly hadCloudSnapshot: boolean;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.discoveryCallLogs.list({
            where: { log_type: LOG_TYPE_DISCOVERY_AGENDA },
            orderBy: { column: "created_at", ascending: false },
            limit: 1
        });
        if (rows.length > 0) {
            const snapshots = rowsToSnapshots(rows);
            const latest = snapshots[0];
            if (latest) {
                hydrateDraftFromSnapshot(latest);
                subscribeRealtime(client);
                trackEvent("call_planner_boot", { mode: "cloud" });
                return { mode: "cloud", hadCloudSnapshot: true };
            }
        }
        subscribeRealtime(client);
        trackEvent("call_planner_boot", { mode: "empty" });
        return { mode: "empty", hadCloudSnapshot: false };
    } catch (err) {
        reportError(err, { op: "call-planner.bootCloudPersistence" });
        return { mode: "local-only", hadCloudSnapshot: false };
    }
}

/**
 * Persist a saved agenda snapshot to the cloud as a new audit row.
 * Returns the inserted row's id (or null on failure).
 */
export async function saveAgendaSnapshotToCloud(
    snapshot: AgendaSnapshot
): Promise<string | null> {
    if (!clientRef) return null;
    try {
        const row = await clientRef.discoveryCallLogs.insert(
            snapshotToInsert(snapshot)
        );
        trackEvent("call_planner_save", { mode: "insert" });
        return typeof row.id === "string" ? row.id : null;
    } catch (err) {
        reportError(err, { op: "call-planner.saveAgendaSnapshotToCloud" });
        return null;
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
    // Only react to INSERT — other devices saving an agenda is the
    // case we want to mirror. UPDATE / DELETE on agenda audit rows
    // shouldn't change the active draft.
    if (payload.eventType !== "INSERT") return;
    if (!payloadHasRow(payload.new)) return;
    const newRow = payload.new as { log_type?: unknown };
    if (
        typeof newRow.log_type === "string" &&
        newRow.log_type !== LOG_TYPE_DISCOVERY_AGENDA
    ) {
        return;
    }
    const snap = rowToSnapshot(payload.new);
    if (snap) hydrateDraftFromSnapshot(snap);
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
        reportError(err, { op: "call-planner.teardownRealtime" });
    }
    realtimeChannel = null;
}
