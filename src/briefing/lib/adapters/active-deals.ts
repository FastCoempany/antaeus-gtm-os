import type {
    ActiveDealsState,
    ActiveDealsStateBody
} from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * Active Deals adapter (B.0c shell).
 *
 * Future data source: Deal Workspace writes `gtmos_deal_workspaces`
 * in localStorage today. ADR-005 Step 4 (Tier 1 retrofit) flips Deal
 * Workspace to cloud reads against the `deals` table; this adapter
 * graduates to a cloud read at that point.
 *
 * The contract's `account_url` / `competitive_set` / `watch_for`
 * fields aren't first-class on the Deal Workspace today — the
 * adapter will need to derive them from the existing `accountName` +
 * stage + freeform fields when it lights up. The contract leaves
 * room for that without forcing the room to grow new state shapes.
 *
 * B.0c returns uninitialized. The `notes: null` invariant (anti-CRM
 * — never carry deal notes into the Briefing pipeline) is enforced
 * at the type level via `ActiveDeal.notes: null`.
 */
export function getActiveDealsState(): ActiveDealsState {
    return uninitializedContract<ActiveDealsStateBody>(
        "Active Deals adapter shell — B.0c. Real read lands in a follow-up."
    );
}
