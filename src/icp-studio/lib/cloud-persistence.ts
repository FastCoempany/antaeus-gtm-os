import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { reportError, trackEvent } from "@/lib/observability";
import {
    icpToInsert,
    icpToUpdate,
    looksLikePersistedId,
    rowToIcp,
    rowsToIcps
} from "./icp-bridge";
import type { SavedIcp } from "./types";
import {
    appendSavedIcp,
    removeSavedIcp,
    replaceSavedIcp,
    savedIcps,
    setSavedIcps
} from "../state";

/**
 * ICP Studio cloud persistence (Supabase + realtime + first-sync
 * migration of any localStorage-only ICPs).
 *
 * Mirrors the Signal Console template (Room 3): boot → load cloud or
 * migrate local up → subscribe realtime; saves go through saveIcp /
 * deleteIcp helpers.
 *
 * Boot flow (called from main.tsx after first paint):
 *   1. Load all rows for the current workspace
 *   2. If rows exist → cloud is canonical → setSavedIcps(rows)
 *   3. If rows are empty AND localStorage already had ICPs → migrate
 *      them by inserting each one (resolves the "browser-bound" gap
 *      for users who saved ICPs before cloud sync existed)
 *   4. Subscribe to realtime so cross-tab + cross-device mutations
 *      flow into this room without a refresh
 *
 * Every public function catches + reports via Sentry; nothing throws.
 * A persistence outage leaves the room with the last good in-memory
 * state.
 */

let clientRef: DataClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

/** Test-only — inject a stub client. */
export function __setDataClientForTests(client: DataClient | null): void {
    clientRef = client;
}

/** Test-only — read the current client reference. */
export function __getDataClientForTests(): DataClient | null {
    return clientRef;
}

export interface BootResult {
    /** "cloud" if rows were loaded; "migrated" on first cloud sync;
     *  "local-only" if Supabase failed; "empty" if cloud + local both empty. */
    readonly mode: "cloud" | "migrated" | "local-only" | "empty";
    /** Number of ICPs the room is now showing. */
    readonly icpCount: number;
}

/**
 * Boot-time persistence wiring. Called once after first paint —
 * does not block render. Decides between cloud-canonical, first-sync
 * migration, and offline-fallback paths and resolves with a tag for
 * observability.
 */
export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.icps.list({ limit: 500 });
        if (rows.length > 0) {
            const icps = rowsToIcps(rows);
            setSavedIcps(icps);
            subscribeRealtime(client);
            trackEvent("icp_studio_boot", {
                mode: "cloud",
                count: icps.length
            });
            return { mode: "cloud", icpCount: icps.length };
        }
        const local = savedIcps.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            trackEvent("icp_studio_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", icpCount: local.length };
        }
        subscribeRealtime(client);
        trackEvent("icp_studio_boot", { mode: "empty", count: 0 });
        return { mode: "empty", icpCount: 0 };
    } catch (err) {
        reportError(err, { op: "icp-studio.bootCloudPersistence" });
        return { mode: "local-only", icpCount: savedIcps.value.length };
    }
}

/**
 * One-time migration: take every SavedIcp currently in `savedIcps`
 * (seeded from localStorage) and insert it into Supabase. Updates
 * each SavedIcp's id to the server-generated uuid as the inserts
 * resolve, so subsequent saves go through the .update path.
 *
 * Errors per-row are reported but don't abort the batch — partial
 * migration is acceptable, and the next save will retry.
 */
async function migrateLocalToCloud(
    client: DataClient,
    localIcps: ReadonlyArray<SavedIcp>
): Promise<void> {
    const next: SavedIcp[] = [];
    for (const icp of localIcps) {
        try {
            const insert = icpToInsert(icp);
            const row = await client.icps.insert(insert);
            const hydrated = rowToIcp(row);
            next.push(hydrated ?? icp);
        } catch (err) {
            reportError(err, {
                op: "icp-studio.migrateLocalToCloud",
                icpId: icp.id
            });
            next.push(icp);
        }
    }
    setSavedIcps(next);
}

/**
 * Persist a SavedIcp create/update. Optimistic — `appendSavedIcp` /
 * `replaceSavedIcp` already happened in the caller; this just routes
 * to insert vs update based on the id shape. On insert, swaps the
 * legacy id for the server-generated uuid.
 */
export async function saveIcp(icp: SavedIcp): Promise<SavedIcp> {
    if (!clientRef) return icp;
    try {
        const isUpdate = looksLikePersistedId(icp.id);
        const row = isUpdate
            ? await clientRef.icps.update(icp.id, icpToUpdate(icp))
            : await clientRef.icps.insert(icpToInsert(icp));
        const saved = rowToIcp(row);
        if (saved) {
            if (!isUpdate && saved.id !== icp.id) {
                removeSavedIcp(icp.id);
                appendSavedIcp(saved);
            } else {
                replaceSavedIcp(saved);
            }
            trackEvent("icp_studio_save", {
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return icp;
    } catch (err) {
        reportError(err, { op: "icp-studio.saveIcp", icpId: icp.id });
        return icp;
    }
}

/**
 * Delete a SavedIcp from the cloud. Local removal already happened
 * before this is called; this just propagates to Supabase.
 */
export async function deleteIcpInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) {
        // Legacy id that was never synced — nothing to delete in cloud.
        return;
    }
    try {
        await clientRef.icps.remove(id);
    } catch (err) {
        reportError(err, { op: "icp-studio.deleteIcpInCloud", icpId: id });
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

/**
 * Translate a postgres_changes payload into a state mutation.
 * Pure function, exported so tests can drive it directly.
 */
export function applyRealtimePayload(payload: {
    eventType: string;
    new: unknown;
    old: unknown;
}): void {
    if (payload.eventType === "DELETE") {
        if (payloadHasRow(payload.old)) {
            removeSavedIcp(payload.old.id);
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payloadHasRow(payload.new)) {
            const icp = rowToIcp(payload.new);
            if (!icp) return;
            const exists = savedIcps.value.some((row) => row.id === icp.id);
            if (exists) {
                replaceSavedIcp(icp);
            } else {
                appendSavedIcp(icp);
            }
        }
    }
}

/**
 * Wire a realtime subscription. RLS gates per-workspace delivery, so
 * we don't filter manually.
 */
export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.icps.subscribe((payload) => {
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

/** Test-only — read the realtime channel reference. */
export function __getRealtimeChannelForTests(): RealtimeChannel | null {
    return realtimeChannel;
}

/** Tear down the realtime subscription. Safe if no channel is active. */
export async function teardownRealtime(): Promise<void> {
    if (!realtimeChannel) return;
    try {
        await realtimeChannel.unsubscribe();
    } catch (err) {
        reportError(err, { op: "icp-studio.teardownRealtime" });
    }
    realtimeChannel = null;
}
