import { effect } from "@preact/signals";
import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Row } from "@/lib/database-helpers";
import { reportError, trackEvent } from "@/lib/observability";
import {
    bagToInsert,
    bagToUpdate,
    KIND_NEGOTIATION_WORKSPACE,
    rowKind,
    rowToWorkspaceBag,
    type NegotiationWorkspaceBag
} from "./negotiation-bridge";
import {
    allNegotiations,
    learnings,
    setAllNegotiations
} from "../state";
import type { LearningEntry } from "./types";

/**
 * Negotiation cloud persistence.
 *
 * The room owns ONE workspace-level bag: history + learnings. Maps to
 * a single `studio_artifacts` row with `data.kind='negotiation.workspace'`.
 *
 * Boot flow:
 *   1. Fetch all studio_artifacts rows for the workspace
 *   2. Find the row with kind='negotiation.workspace'; if found,
 *      hydrate the signals from it and remember the row id
 *   3. If not found AND local signals have content → insert them and
 *      remember the new row id (migration)
 *   4. Subscribe to realtime; UPDATE/INSERT on the kind replaces the
 *      in-memory bags; DELETE clears them
 *
 * After boot, the auto-save effect mirrors signal changes back to the
 * cloud (debounced).
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

export function __setCloudRowIdForTests(id: string | null): void {
    cloudRowId = id;
}

export interface BootResult {
    readonly mode: "cloud" | "migrated" | "local-only" | "empty";
}

function setLearnings(next: ReadonlyArray<LearningEntry>): void {
    learnings.value = next;
}

function isEmptyBag(bag: NegotiationWorkspaceBag): boolean {
    return bag.negotiations.length === 0 && bag.learnings.length === 0;
}

function currentBag(): NegotiationWorkspaceBag {
    return {
        negotiations: allNegotiations.value,
        learnings: learnings.value
    };
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.studioArtifacts.list({
            orderBy: { column: "updated_at", ascending: false },
            limit: 1000
        });
        const matching = rows.find(
            (r) => rowKind(r) === KIND_NEGOTIATION_WORKSPACE
        );
        if (matching) {
            cloudRowId = matching.id;
            const bag = rowToWorkspaceBag(matching);
            if (bag) {
                setAllNegotiations(bag.negotiations);
                setLearnings(bag.learnings);
            }
            subscribeRealtime(client);
            trackEvent("negotiation_boot", { mode: "cloud" });
            return { mode: "cloud" };
        }
        const local = currentBag();
        if (!isEmptyBag(local)) {
            const inserted = await client.studioArtifacts.insert(
                bagToInsert(local)
            );
            cloudRowId = inserted.id;
            subscribeRealtime(client);
            trackEvent("negotiation_boot", { mode: "migrated" });
            return { mode: "migrated" };
        }
        subscribeRealtime(client);
        trackEvent("negotiation_boot", { mode: "empty" });
        return { mode: "empty" };
    } catch (err) {
        reportError(err, { op: "negotiation.bootCloudPersistence" });
        return { mode: "local-only" };
    }
}

/**
 * Persist the current bag. Upserts the single workspace row;
 * inserts on first save, updates on subsequent saves.
 */
export async function saveBagToCloud(
    bag: NegotiationWorkspaceBag
): Promise<NegotiationWorkspaceBag> {
    if (!clientRef) return bag;
    try {
        if (cloudRowId) {
            await clientRef.studioArtifacts.update(
                cloudRowId,
                bagToUpdate(bag)
            );
        } else {
            const inserted = await clientRef.studioArtifacts.insert(
                bagToInsert(bag)
            );
            cloudRowId = inserted.id;
        }
        trackEvent("negotiation_save", {});
        return bag;
    } catch (err) {
        reportError(err, { op: "negotiation.saveBagToCloud" });
        return bag;
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
            setAllNegotiations([]);
            setLearnings([]);
            cloudRowId = null;
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (!payloadHasRow(payload.new)) return;
        const row = payload.new as Row<"studio_artifacts">;
        if (rowKind(row) !== KIND_NEGOTIATION_WORKSPACE) return;
        const bag = rowToWorkspaceBag(row);
        if (!bag) return;
        cloudRowId = row.id;
        setAllNegotiations(bag.negotiations);
        setLearnings(bag.learnings);
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
        reportError(err, { op: "negotiation.teardownRealtime" });
    }
    realtimeChannel = null;
}

// ─── Auto-save effect ──────────────────────────────────────────────────

let autoSaveStop: (() => void) | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 600;

/**
 * Wire an auto-save effect that mirrors `allNegotiations` + `learnings`
 * changes to the cloud, debounced so rapid edits don't blast the API.
 * First run is suppressed (boot already wrote the row through the
 * migrated path).
 */
export function startCloudAutoSave(): () => void {
    if (autoSaveStop) return autoSaveStop;
    let firstRun = true;
    const dispose = effect(() => {
        // Reading both signals subscribes to both.
        const bag: NegotiationWorkspaceBag = {
            negotiations: allNegotiations.value,
            learnings: learnings.value
        };
        if (firstRun) {
            firstRun = false;
            return;
        }
        if (pendingTimer) clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => {
            void saveBagToCloud(bag);
            pendingTimer = null;
        }, SAVE_DEBOUNCE_MS);
    });
    autoSaveStop = () => {
        dispose();
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            pendingTimer = null;
        }
        autoSaveStop = null;
    };
    return autoSaveStop;
}
