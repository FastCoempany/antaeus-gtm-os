/**
 * Compose client (B.9a) — read the "Read This Week" lead off the
 * latest briefing run.
 *
 * The lead lives in briefing_runs.data.compose_lead — set by the
 * compose stage during the pipeline run. Defensive: returns null on
 * any failure so the rail just doesn't render.
 *
 * We only read the LATEST completed run. If the last run produced no
 * lead (refused outcome, or empty-run skip), null. The Briefing room
 * renders nothing in that case — same shape as Periphery + Contrarian.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";

export interface BriefingLeadSummary {
    readonly lead: string | null;
    readonly refusal_reason: string | null;
    readonly run_id: string;
    readonly run_started_at: string;
}

function asString(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/** Pull lead / refusal_reason out of a briefing_runs.data jsonb blob. */
export function parseLeadFromRunData(
    runId: string,
    runStartedAt: string,
    data: unknown
): BriefingLeadSummary | null {
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    const lead = asString(o["compose_lead"]);
    const refusal = asString(o["compose_refusal_reason"]);
    // If neither is present, the compose stage hasn't run for this run
    // (older runs from before B.9a) — return null so the UI doesn't
    // render anything.
    if (lead === null && refusal === null) return null;
    return {
        lead,
        refusal_reason: refusal,
        run_id: runId,
        run_started_at: runStartedAt
    };
}

/**
 * Load the latest completed run's compose lead. Returns null when:
 *   - no completed runs exist
 *   - the latest run didn't have a compose pass (pre-B.9a)
 *   - the load errored
 */
export async function loadLatestBriefingLead(): Promise<BriefingLeadSummary | null> {
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("briefing_runs")
            .select("id, started_at, data")
            .eq("status", "complete")
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (r.error) {
            reportError(r.error, { scope: "compose.loadLatest" });
            return null;
        }
        if (!r.data) return null;
        return parseLeadFromRunData(
            String(r.data.id),
            String(r.data.started_at ?? ""),
            r.data.data
        );
    } catch (err) {
        reportError(err, { scope: "compose.loadLatest" });
        return null;
    }
}
