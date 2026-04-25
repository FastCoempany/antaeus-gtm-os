import type { DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import { rowsToDeals } from "./deal-bridge";
import { setAllDeals } from "../state";

/**
 * Wave 2 — Deal Workspace persistence layer (read path).
 *
 * Boot-time: load all deals via data.deals.list() and seed the
 * `allDeals` signal. Handles both native deal rows and the Phase 2.3
 * migration blob row (rowsToDeals decides which to use).
 *
 * Wave 3 will add the write paths (insert/update on save). Wave 4
 * will add realtime subscriptions for cross-room updates.
 *
 * Errors NEVER throw — every public function catches, calls
 * reportError(), and returns null/undefined. A persistence outage
 * leaves the room with an empty list rather than crashing.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 4
 */

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
 * Boot-time persistence wiring. Call once after Preact has rendered.
 * Pure read in Wave 2; Wave 3+ will add saves and Wave 4 realtime.
 */
export async function bootPersistence(client: DataClient): Promise<void> {
    await loadDeals(client);
}
