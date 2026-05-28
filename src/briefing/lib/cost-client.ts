/**
 * Cost client (B.8) — reads the operator's rolling 7-day pipeline
 * cost from briefing_runs and packages it into a CostSummary for the
 * footer to render.
 *
 * Computes the same summary the Edge Function uses to decide
 * throttle/pause — same module, same thresholds — so the footer's
 * read of the state matches the pipeline's behavior.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";
import { type CostSummary, buildCostSummary } from "./cost/tracker";

/**
 * Load the workspace's last 7 days of briefing_runs and compute the
 * rolling cost summary. RLS scopes the read so the operator only
 * sees their own workspace.
 *
 * Defensive: returns an ok-state empty summary on any failure so the
 * footer renders cleanly instead of breaking the room.
 */
export async function loadCostSummary(): Promise<CostSummary> {
    try {
        const sb = getSupabaseClient();
        const cutoff = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        const r = await sb
            .from("briefing_runs")
            .select("total_cost, started_at")
            .gte("started_at", cutoff)
            .order("started_at", { ascending: false })
            .limit(100);
        if (r.error) {
            reportError(r.error, { scope: "cost.loadSummary" });
            return buildCostSummary([]);
        }
        const rows = (r.data ?? []).map((row) => ({
            total_cost: typeof row.total_cost === "number" ? row.total_cost : 0,
            started_at: typeof row.started_at === "string" ? row.started_at : ""
        }));
        return buildCostSummary(rows);
    } catch (err) {
        reportError(err, { scope: "cost.loadSummary" });
        return buildCostSummary([]);
    }
}
