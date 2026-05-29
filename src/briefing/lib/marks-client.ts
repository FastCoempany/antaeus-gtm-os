/**
 * Marks client — the Behavioral Feedback wire (canon §4.21).
 *
 * Reads the operator's current marks on this-workspace's Patterns and
 * writes new marks via the submit_pattern_feedback RPC. Defensive
 * throughout: failures degrade to "no marks" rather than erroring the
 * room. The footer of the room is the cost telemetry; the marks UI is
 * inline on each Pattern card; neither is permitted to crash if the
 * RPC is briefly unavailable.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError, trackEvent } from "@/lib/observability";

export type PatternMark = "used" | "met" | "noise";

export interface PatternMarkRow {
    readonly pattern_id: string;
    readonly mark: PatternMark;
    readonly marked_at: string;
}

const MARK_VALUES: ReadonlyArray<PatternMark> = ["used", "met", "noise"];

function asMark(v: unknown): PatternMark | null {
    if (typeof v !== "string") return null;
    return (MARK_VALUES as ReadonlyArray<string>).includes(v) ? (v as PatternMark) : null;
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

export function parseMarkRow(row: unknown): PatternMarkRow | null {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const pattern_id = asString(o["pattern_id"]);
    const mark = asMark(o["mark"]);
    if (pattern_id.length === 0 || mark === null) return null;
    return {
        pattern_id,
        mark,
        marked_at: asString(o["marked_at"])
    };
}

/**
 * Load the current operator's marks for the latest run's Patterns.
 * Returns a map keyed by pattern_id; missing pattern_id means unmarked.
 *
 * Defensive: returns an empty map on any failure (missing env, no
 * session, query error, RLS rejection). The PatternList renders
 * regardless; the marks bar just shows "unmarked" state.
 */
export async function loadMyPatternMarks(): Promise<Map<string, PatternMark>> {
    try {
        const sb = getSupabaseClient();
        const auth = await sb.auth.getUser();
        const userId = auth.data.user?.id;
        if (!userId) return new Map();
        const result = await sb
            .from("briefing_pattern_feedback")
            .select("pattern_id, mark, marked_at")
            .eq("user_id", userId)
            // Newest first; the unique (pattern_id, user_id) index
            // means at most one row per pattern, but be defensive.
            .order("marked_at", { ascending: false })
            .limit(500);
        if (result.error) {
            reportError(result.error, { scope: "briefing.loadMyPatternMarks" });
            return new Map();
        }
        const out = new Map<string, PatternMark>();
        for (const row of result.data ?? []) {
            const parsed = parseMarkRow(row);
            if (parsed && !out.has(parsed.pattern_id)) {
                out.set(parsed.pattern_id, parsed.mark);
            }
        }
        return out;
    } catch (err) {
        reportError(err, { scope: "briefing.loadMyPatternMarks" });
        return new Map();
    }
}

/**
 * Set this operator's mark on a Pattern. Upserts via the
 * submit_pattern_feedback RPC. Returns true on success, false on any
 * failure — callers (the state action) should revert their optimistic
 * update on false.
 */
export async function setPatternMark(
    patternId: string,
    mark: PatternMark
): Promise<boolean> {
    try {
        const sb = getSupabaseClient();
        const result = await sb.rpc("submit_pattern_feedback", {
            p_pattern_id: patternId,
            p_mark: mark
        });
        if (result.error) {
            reportError(result.error, {
                scope: "briefing.setPatternMark",
                patternId,
                mark
            });
            return false;
        }
        trackEvent("briefing_pattern_marked", { pattern_id: patternId, mark });
        return true;
    } catch (err) {
        reportError(err, { scope: "briefing.setPatternMark", patternId, mark });
        return false;
    }
}

/**
 * Remove this operator's mark on a Pattern. Idempotent — succeeds
 * whether or not a row existed.
 */
export async function clearPatternMark(patternId: string): Promise<boolean> {
    try {
        const sb = getSupabaseClient();
        const result = await sb.rpc("clear_pattern_feedback", {
            p_pattern_id: patternId
        });
        if (result.error) {
            reportError(result.error, {
                scope: "briefing.clearPatternMark",
                patternId
            });
            return false;
        }
        trackEvent("briefing_pattern_mark_cleared", { pattern_id: patternId });
        return true;
    } catch (err) {
        reportError(err, { scope: "briefing.clearPatternMark", patternId });
        return false;
    }
}
