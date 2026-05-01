import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json } from "@/lib/database.types";
import { reportError, trackEvent } from "@/lib/observability";
import { enqueueRetry } from "@/lib/cloud-sync-queue";
import {
    looksLikePersistedId,
    proofToInsert,
    proofToUpdate,
    rowToProof,
    rowsToProofs
} from "./poc-bridge";
import type { Proof } from "./types";
import { allProofs, setAllProofs, upsertProof } from "../state";

/**
 * PoC Framework cloud persistence (Supabase + realtime + first-sync
 * migration of any localStorage-only proofs).
 *
 * Mirrors the Signal Console / ICP Studio templates: boot → load
 * cloud or migrate local up → subscribe realtime; saves go through
 * saveProof / deleteProofInCloud helpers.
 *
 * Boot flow (called from main.tsx after first paint):
 *   1. Load all rows for the current workspace
 *   2. If rows exist → cloud is canonical → setAllProofs(rows)
 *   3. If rows are empty AND localStorage already had proofs →
 *      migrate them by inserting each one
 *   4. Subscribe to realtime so cross-tab + cross-device mutations
 *      flow into this room without a refresh
 *
 * Every public function catches + reports via Sentry; nothing throws.
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
    readonly proofCount: number;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.proofs.list({ limit: 200 });
        if (rows.length > 0) {
            const proofs = rowsToProofs(rows);
            setAllProofs(proofs);
            subscribeRealtime(client);
            trackEvent("poc_framework_boot", {
                mode: "cloud",
                count: proofs.length
            });
            return { mode: "cloud", proofCount: proofs.length };
        }
        const local = allProofs.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            trackEvent("poc_framework_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", proofCount: local.length };
        }
        subscribeRealtime(client);
        trackEvent("poc_framework_boot", { mode: "empty", count: 0 });
        return { mode: "empty", proofCount: 0 };
    } catch (err) {
        reportError(err, { op: "poc-framework.bootCloudPersistence" });
        return { mode: "local-only", proofCount: allProofs.value.length };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    localProofs: ReadonlyArray<Proof>
): Promise<void> {
    const next: Proof[] = [];
    for (const proof of localProofs) {
        try {
            const insert = proofToInsert(proof);
            const row = await client.proofs.insert(insert);
            const hydrated = rowToProof(row);
            // Cloud row drops in-memory fields (account/vendor) into the
            // data blob — but rowToProof reads them back, so the hydrated
            // proof should already match. Fall back to local if not.
            next.push(hydrated ?? proof);
        } catch (err) {
            reportError(err, {
                op: "poc-framework.migrateLocalToCloud",
                proofId: proof.id
            });
            next.push(proof);
        }
    }
    setAllProofs(next);
}

/**
 * Persist a Proof create/update. Optimistic — `upsertProof` already
 * happened in the caller; this routes to insert vs update based on
 * the id shape and reconciles the server-generated uuid on insert.
 */
export async function saveProof(proof: Proof): Promise<Proof> {
    if (!clientRef) return proof;
    try {
        const isUpdate = looksLikePersistedId(proof.id);
        const row = isUpdate
            ? await clientRef.proofs.update(proof.id, proofToUpdate(proof))
            : await clientRef.proofs.insert(proofToInsert(proof));
        const saved = rowToProof(row);
        if (saved) {
            if (!isUpdate && saved.id !== proof.id) {
                // Drop the old legacy-id row from state and add the new one.
                const without = allProofs.value.filter(
                    (p) => p.id !== proof.id
                );
                setAllProofs([saved, ...without]);
            } else {
                upsertProof(saved);
            }
            trackEvent("poc_framework_save", {
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return proof;
    } catch (err) {
        reportError(err, { op: "poc-framework.saveProof", proofId: proof.id });
        const isUpdate = looksLikePersistedId(proof.id);
        enqueueRetry({
            table: "proofs",
            op: isUpdate ? "update" : "insert",
            rowId: isUpdate ? proof.id : null,
            payload: (isUpdate
                ? proofToUpdate(proof)
                : proofToInsert(proof)) as unknown as Json,
            source: "poc-framework.saveProof"
        });
        return proof;
    }
}

export async function deleteProofInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.proofs.remove(id);
    } catch (err) {
        reportError(err, {
            op: "poc-framework.deleteProofInCloud",
            proofId: id
        });
        enqueueRetry({
            table: "proofs",
            op: "delete",
            rowId: id,
            source: "poc-framework.deleteProofInCloud"
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
            setAllProofs(allProofs.value.filter((p) => p.id !== id));
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payloadHasRow(payload.new)) {
            const proof = rowToProof(payload.new);
            if (proof) upsertProof(proof);
        }
    }
}

export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.proofs.subscribe((payload) => {
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
        reportError(err, { op: "poc-framework.teardownRealtime" });
    }
    realtimeChannel = null;
}
