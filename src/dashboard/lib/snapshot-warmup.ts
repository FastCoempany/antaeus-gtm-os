import { loadAccounts } from "@/signal-console/lib/persistence";
import {
    HEALTH_SNAPSHOT_KEY as SIGNAL_KEY,
    publishHealthSnapshot as publishSignalSnapshot
} from "@/signal-console/lib/health-snapshot";
import { legacyDealToDeal } from "@/deal-workspace/lib/deal-bridge";
import {
    HEALTH_SNAPSHOT_KEY as DEAL_KEY,
    publishHealthSnapshot as publishDealSnapshot
} from "@/deal-workspace/lib/health-snapshot";
import type { Deal } from "@/deal-workspace/lib/deal-shape";

/**
 * Dashboard's snapshot aggregator (snapshot-aggregator.ts) reads four
 * derived snapshot keys produced by sibling rooms on persist:
 *   - gtmos_deal_workspace_health   (Deal Workspace)
 *   - gtmos_signal_room_health      (Signal Console)
 *   - gtmos_readiness_snapshot      (legacy Readiness)
 *   - gtmos_quota_targets           (Quota Workback)
 *
 * Those snapshots only exist if the producing room has booted at
 * least once since the raw nouns landed. Two cases where they don't:
 *
 *   1. Demo-seed lane — the legacy js/demo-seed-runtime.js writes
 *      raw nouns directly to localStorage and redirects the operator
 *      straight to /dashboard/. Deal Workspace + Signal Console
 *      never boot, so their publishers never fire. Dashboard renders
 *      its empty state on a workspace that should be fully populated.
 *
 *   2. Cross-tab cold start — operator imports a backup or another
 *      tab seeded raw nouns; Dashboard loads first.
 *
 * Fix: on cold boot, if a snapshot key is missing AND its raw-noun
 * source exists, call the producing room's publisher directly. Same
 * code path that runs when the room boots — no schema duplication,
 * no aggregation logic duplicated, no demo-seed code change required.
 *
 * The producing rooms' publishers are pure read-from-args + write-to-
 * storage; calling them from here mutates only the snapshot key,
 * not any in-memory room state.
 *
 * Readiness + Quota are deliberately NOT warmed here:
 *   - Readiness is computed from many room snapshots downstream of
 *     the aggregator (Phase 5.A's aggregateReadinessInput); a fresh
 *     verdict gets composed on next render anyway.
 *   - Quota targets exist only after the operator hits "Save" in
 *     Quota Workback; absence is meaningful, not a bug.
 */
export function warmUpMissingSnapshots(
    storage: Storage | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): { signal: boolean; deal: boolean } {
    const result = { signal: false, deal: false };
    if (!storage) return result;

    if (!storage.getItem(SIGNAL_KEY)) {
        const accounts = loadAccounts(storage);
        if (accounts.length > 0) {
            publishSignalSnapshot(accounts, storage);
            result.signal = true;
        }
    }

    if (!storage.getItem(DEAL_KEY)) {
        const deals = readLegacyDeals(storage);
        if (deals.length > 0) {
            publishDealSnapshot(deals);
            result.deal = true;
        }
    }

    return result;
}

function readLegacyDeals(storage: Storage): ReadonlyArray<Deal> {
    try {
        const raw = storage.getItem("gtmos_deal_workspaces");
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((item, idx) =>
            legacyDealToDeal(item, `legacy_${idx}`)
        );
    } catch {
        return [];
    }
}
