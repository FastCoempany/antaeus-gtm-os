/**
 * Cost ceiling check (B.8 — server side).
 *
 * Called once at the start of each workspace's pipeline. Reads the
 * last 7 days of completed-or-running briefing_runs for the workspace,
 * computes the rolling weekly cost, and returns the band the workspace
 * is in (ok / warn / throttle / paused).
 *
 * The orchestrator uses this to decide:
 *   - paused: abort the run cleanly (write a 'aborted' row with the
 *     reason in stage_log; return without enriching or synthesizing).
 *   - throttle: pass a flag to synthesis so it uses Sonnet instead of
 *     Opus for the standard draft + revise + repair calls (~5x cheaper).
 *   - warn / ok: nothing special; the front-end footer surfaces the
 *     warn state on its own.
 *
 * The check itself is one cheap DB query — no LLM, no external HTTP.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    type CostSummary,
    type RunCostRow,
    buildCostSummary
} from "./_shared.ts";

const LOOKBACK_DAYS = 7;

export async function loadCostSummary(
    sb: SupabaseClient,
    workspaceId: string,
    now: Date = new Date()
): Promise<CostSummary> {
    const cutoff = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const r = await sb
        .from("briefing_runs")
        .select("total_cost, started_at")
        .eq("workspace_id", workspaceId)
        .gte("started_at", cutoff)
        .order("started_at", { ascending: false })
        .limit(100);
    if (r.error || !r.data) {
        if (r.error) console.error("[cost-check] query failed:", r.error);
        // Fail open: degraded read returns ok state. Better than
        // silently pausing the briefing because the DB hiccuped.
        return buildCostSummary([], now);
    }
    const rows: RunCostRow[] = (r.data as Array<any>).map((row) => ({
        total_cost: typeof row.total_cost === "number" ? row.total_cost : 0,
        started_at: typeof row.started_at === "string" ? row.started_at : ""
    }));
    return buildCostSummary(rows, now);
}
