import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { reportError, trackEvent } from "@/lib/observability";
import { dbRowToDeal, dealToDbWrite, rowsToDeals } from "./deal-bridge";
import type { Deal } from "./deal-shape";
import { allDeals, removeDeal, setAllDeals, upsertDeal } from "../state";
import { mirrorToLegacyStorage } from "./legacy-mirror";

/**
 * Wave 2 — Deal Workspace persistence layer (read path).
 * Wave 3 — write path (saveDealEdit).
 * Wave 4 — realtime subscription + legacy localStorage mirror.
 *
 * Boot-time: load all deals via data.deals.list() and seed the
 * `allDeals` signal. Handles both native deal rows and the Phase 2.3
 * migration blob row (rowsToDeals decides which to use). Wires a
 * realtime subscription so cross-room mutations (Cold Call Studio
 * creating a deal on `meeting_booked`, Future Autopsy updating a
 * stage, etc.) flow into the room without a refresh.
 *
 * Save-time: saveDealEdit() persists edits via data.deals.update or
 * .insert, then upserts the result back into the `allDeals` signal.
 * Always updates the local signal first (optimistic) so the room
 * stays responsive even when Supabase is offline.
 *
 * Legacy mirror: every state mutation also writes the current Deal
 * array to `gtmos_deal_workspaces` so legacy readers (Dashboard,
 * Future Autopsy, Readiness) stay consistent until they migrate. The
 * mirror is removed in Phase 5.
 *
 * Errors NEVER throw — every public function catches, calls
 * reportError(), and resolves with null/undefined. A persistence outage
 * leaves the room with the last good state rather than crashing.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 4
 */

let clientRef: DataClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

/** Test-only — inject a stub data client. */
export function __setDataClientForTests(client: DataClient | null): void {
    clientRef = client;
}

/** Test-only — read the current client reference. */
export function __getDataClientForTests(): DataClient | null {
    return clientRef;
}

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A deal's id looks like a real Supabase row when it's a UUID. Legacy
 * blob deals come in with `legacy-N` ids; their first save needs to
 * insert a fresh row, not update a non-existent one.
 */
export function looksLikePersistedId(id: string): boolean {
    return UUID_RE.test(id);
}

export async function loadDeals(client: DataClient): Promise<void> {
    try {
        const rows = await client.deals.list({ limit: 500 });
        const deals = rowsToDeals(rows);
        setAllDeals(deals);
        mirrorToLegacyStorage(deals);
    } catch (err) {
        reportError(err, { op: "loadDeals" });
        // Leave allDeals signal in its initial empty state.
    }
}

/**
 * Persist a Deal edit. Optimistic — the in-memory signal is updated
 * before the Supabase round-trip starts so the modal close + grid
 * refresh feel instant. If the round-trip fails, the local edit is
 * preserved (Sentry captures the persistence error) so the operator
 * can retry later.
 *
 * Returns the canonical Deal — server-returned shape on success, the
 * input deal on failure (so the caller can still close the modal and
 * transition state).
 */
export async function saveDealEdit(deal: Deal): Promise<Deal> {
    upsertDeal(deal);
    mirrorToLegacyStorage(allDeals.value);
    if (!clientRef) {
        // Persistence not booted (Supabase env missing) — local-only.
        return deal;
    }
    try {
        const write = dealToDbWrite(deal);
        const isUpdate = looksLikePersistedId(deal.id);
        const row = isUpdate
            ? await clientRef.deals.update(deal.id, write)
            : await clientRef.deals.insert(write);
        const saved = dbRowToDeal(row);
        upsertDeal(saved);
        mirrorToLegacyStorage(allDeals.value);
        trackEvent("deal_workspace_save", {
            mode: isUpdate ? "update" : "insert",
            stage: deal.stage,
            closed_lost: deal.stage === "closed-lost"
        });
        return saved;
    } catch (err) {
        reportError(err, { op: "saveDealEdit", dealId: deal.id });
        return deal;
    }
}

/**
 * Type guard for the realtime payload `new` and `old` rows. Supabase
 * narrows them to {} on DELETE / INSERT respectively, so we use a
 * minimal shape check before passing to dbRowToDeal.
 */
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
 * INSERT / UPDATE → upsertDeal; DELETE → removeDeal. Pure function,
 * exported so tests can drive it without a live channel.
 */
export function applyRealtimePayload(payload: {
    eventType: string;
    new: unknown;
    old: unknown;
}): void {
    if (payload.eventType === "DELETE") {
        if (payloadHasRow(payload.old)) {
            removeDeal(payload.old.id);
            mirrorToLegacyStorage(allDeals.value);
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payloadHasRow(payload.new)) {
            const deal = dbRowToDeal(payload.new);
            upsertDeal(deal);
            mirrorToLegacyStorage(allDeals.value);
        }
    }
}

/**
 * Wire a realtime subscription on the deals table. RLS gates delivery
 * per workspace, so we don't filter manually. Returns the channel so
 * tests / cleanup paths can unsubscribe.
 */
export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.deals.subscribe((payload) => {
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

/** Test-only — read the current realtime channel reference. */
export function __getRealtimeChannelForTests(): RealtimeChannel | null {
    return realtimeChannel;
}

/**
 * Tear down the realtime subscription. Safe to call if no subscription
 * is active. Used by logout / workspace-switch flows.
 */
export async function teardownRealtime(): Promise<void> {
    if (!realtimeChannel) return;
    try {
        await realtimeChannel.unsubscribe();
    } catch (err) {
        reportError(err, { op: "teardownRealtime" });
    }
    realtimeChannel = null;
}

/**
 * Boot-time persistence wiring. Call once after Preact has rendered.
 * Stores the client reference for save-path use, kicks off the initial
 * load, then attaches the realtime subscription.
 */
export async function bootPersistence(client: DataClient): Promise<void> {
    clientRef = client;
    await loadDeals(client);
    subscribeRealtime(client);
}
