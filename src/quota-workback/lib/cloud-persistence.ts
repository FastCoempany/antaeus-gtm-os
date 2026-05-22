import { effect } from "@preact/signals";
import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Row } from "@/lib/database-helpers";
import { reportError, trackEvent } from "@/lib/observability";
import {
    inputsToInsert,
    inputsToUpdate,
    KIND_QUOTA_INPUTS,
    rowKind,
    rowToInputs
} from "./quota-bridge";
import { DEFAULT_INPUTS, type PlanInputs } from "./types";
import { inputs, setInputs } from "../state";

/**
 * Quota Workback cloud persistence.
 *
 * The room owns ONE bag of state — `PlanInputs` (quota, acv, win
 * rate, conversion rates, etc.) — that maps to a single
 * `pipeline_settings` row with kind='quota.inputs'. Saves UPSERT
 * that single row.
 *
 * Boot flow:
 *   1. Fetch all pipeline_settings rows for the workspace
 *   2. Find the row with kind='quota.inputs'; if it exists, hydrate
 *      inputs from it and remember the row id
 *   3. If no row found AND localStorage inputs are non-default,
 *      insert them and remember the new row id
 *   4. Subscribe to realtime; UPDATE/INSERT on the kind replaces
 *      the in-memory inputs
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

function isDefault(p: PlanInputs): boolean {
    return (
        p.quota === DEFAULT_INPUTS.quota &&
        p.acv === DEFAULT_INPUTS.acv &&
        p.win === DEFAULT_INPUTS.win &&
        p.m2o === DEFAULT_INPUTS.m2o &&
        p.t2m === DEFAULT_INPUTS.t2m &&
        p.show === DEFAULT_INPUTS.show &&
        p.days === DEFAULT_INPUTS.days &&
        p.tpa === DEFAULT_INPUTS.tpa &&
        p.cycle === DEFAULT_INPUTS.cycle
    );
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.pipelineSettings.list({
            orderBy: { column: "updated_at", ascending: false },
            limit: 100
        });
        const matching = rows.find((r) => rowKind(r) === KIND_QUOTA_INPUTS);
        if (matching) {
            cloudRowId = matching.id;
            const hydrated = rowToInputs(matching);
            if (hydrated) setInputs(hydrated);
            subscribeRealtime(client);
            trackEvent("quota_workback_boot", { mode: "cloud" });
            return { mode: "cloud" };
        }
        if (!isDefault(inputs.value)) {
            const inserted = await client.pipelineSettings.insert(
                inputsToInsert(inputs.value)
            );
            cloudRowId = inserted.id;
            subscribeRealtime(client);
            trackEvent("quota_workback_boot", { mode: "migrated" });
            return { mode: "migrated" };
        }
        subscribeRealtime(client);
        trackEvent("quota_workback_boot", { mode: "empty" });
        return { mode: "empty" };
    } catch (err) {
        reportError(err, { op: "quota-workback.bootCloudPersistence" });
        return { mode: "local-only" };
    }
}

/**
 * Persist the current inputs. Upserts the single workspace row;
 * inserts on first save, updates on subsequent saves.
 */
export async function saveInputsToCloud(
    next: PlanInputs
): Promise<PlanInputs> {
    if (!clientRef) return next;
    try {
        if (cloudRowId) {
            await clientRef.pipelineSettings.update(
                cloudRowId,
                inputsToUpdate(next)
            );
        } else {
            const inserted = await clientRef.pipelineSettings.insert(
                inputsToInsert(next)
            );
            cloudRowId = inserted.id;
        }
        trackEvent("quota_workback_save", {});
        return next;
    } catch (err) {
        reportError(err, { op: "quota-workback.saveInputsToCloud" });
        return next;
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
            setInputs(DEFAULT_INPUTS);
            cloudRowId = null;
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (!payloadHasRow(payload.new)) return;
        const row = payload.new as Row<"pipeline_settings">;
        if (rowKind(row) !== KIND_QUOTA_INPUTS) return;
        const hydrated = rowToInputs(row);
        if (!hydrated) return;
        cloudRowId = row.id;
        setInputs(hydrated);
    }
}

export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.pipelineSettings.subscribe((payload) => {
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
        reportError(err, { op: "quota-workback.teardownRealtime" });
    }
    realtimeChannel = null;
}

// ─── Auto-save effect ──────────────────────────────────────────────────

let autoSaveStop: (() => void) | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 600;

/**
 * Wire an auto-save effect that mirrors `inputs` changes to the cloud,
 * debounced so rapid typing doesn't blast the API. First run is
 * suppressed (boot-time seed already wrote the row through
 * bootCloudPersistence's migrated path).
 */
export function startCloudAutoSave(): () => void {
    if (autoSaveStop) return autoSaveStop;
    let firstRun = true;
    const dispose = effect(() => {
        const next = inputs.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        if (pendingTimer) clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => {
            void saveInputsToCloud(next);
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
