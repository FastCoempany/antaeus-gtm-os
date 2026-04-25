import type { DataClient } from "@/lib/data-client";
import { reportError, trackEvent } from "@/lib/observability";
import { dbRowToDeal, dealToDbWrite, rowsToDeals } from "./deal-bridge";
import type { Deal } from "./deal-shape";
import { setAllDeals, upsertDeal } from "../state";

/**
 * Wave 2 — Deal Workspace persistence layer (read path).
 * Wave 3 — extended with the write path (saveDealEdit).
 *
 * Boot-time: load all deals via data.deals.list() and seed the
 * `allDeals` signal. Handles both native deal rows and the Phase 2.3
 * migration blob row (rowsToDeals decides which to use).
 *
 * Save-time: saveDealEdit() persists edits via data.deals.update or
 * .insert, then upserts the result back into the `allDeals` signal.
 * Always updates the local signal first (optimistic) so the room
 * stays responsive even when Supabase is offline.
 *
 * Wave 4 will add realtime subscriptions for cross-room updates and
 * dual-write to the legacy `gtmos_deal_room_health` localStorage key
 * for backwards compatibility with the Dashboard / Future Autopsy
 * readers.
 *
 * Errors NEVER throw — every public function catches, calls
 * reportError(), and resolves with null/undefined. A persistence outage
 * leaves the room with the last good state rather than crashing.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 4
 */

let clientRef: DataClient | null = null;

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
 * Boot-time persistence wiring. Call once after Preact has rendered.
 * Stores the client reference for save-path use, then kicks off the
 * initial load.
 */
export async function bootPersistence(client: DataClient): Promise<void> {
    clientRef = client;
    await loadDeals(client);
}
