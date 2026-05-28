/**
 * Periphery client (B.4c) — the front-end data layer for the right-rail
 * candidates the detector produced.
 *
 * Reads candidates for the latest run scoped to status='candidate'
 * (the operator hasn't acted on them yet); promotes a candidate to the
 * watchlist (writes `briefing_watchlist_entities`) + transitions its
 * status to 'added_to_watchlist'; snoozes or dismisses without
 * promoting. All reads + writes degrade to null/false on failure so
 * the room renders rather than throwing.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError, trackEvent } from "@/lib/observability";

export interface PeripheryCandidate {
    readonly id: string;
    readonly run_id: string;
    readonly entity_name: string;
    readonly entity_aliases: ReadonlyArray<string>;
    readonly co_occurrence_score: number;
    readonly vocab_overlap_score: number;
    readonly total_score: number;
    readonly supporting_item_ids: ReadonlyArray<string>;
    readonly reasoning: string;
    readonly status: PeripheryStatus;
}

export type PeripheryStatus = "candidate" | "added_to_watchlist" | "snoozed" | "dismissed";

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asStringArray(v: unknown): ReadonlyArray<string> {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
}

function asStatus(v: unknown): PeripheryStatus {
    if (v === "added_to_watchlist" || v === "snoozed" || v === "dismissed") return v;
    return "candidate";
}

/** Shape one candidate row. Returns null if it has no usable id. */
export function parsePeripheryRow(row: unknown): PeripheryCandidate | null {
    if (row === null || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const id = asString(o["id"]);
    if (id.length === 0) return null;
    return {
        id,
        run_id: asString(o["run_id"]),
        entity_name: asString(o["entity_name"]),
        entity_aliases: asStringArray(o["entity_aliases"]),
        co_occurrence_score: asNumber(o["co_occurrence_score"]),
        vocab_overlap_score: asNumber(o["vocab_overlap_score"]),
        total_score: asNumber(o["total_score"]),
        supporting_item_ids: asStringArray(o["supporting_item_ids"]),
        reasoning: asString(o["reasoning"]),
        status: asStatus(o["status"])
    };
}

/**
 * Keep only candidates from the most recent run_id (the rows come back
 * created_at desc; the first run_id we see wins, anything else is from
 * an older run and shouldn't compete for attention).
 */
export function latestRunCandidates(
    rows: ReadonlyArray<PeripheryCandidate>
): ReadonlyArray<PeripheryCandidate> {
    if (rows.length === 0) return [];
    const latest = rows[0]?.run_id;
    if (!latest) return [];
    return rows.filter((r) => r.run_id === latest);
}

/**
 * Read up to 5 candidates from the latest run for this workspace,
 * scoped to status='candidate' (the operator hasn't acted yet).
 */
export async function loadActivePeripheryCandidates(): Promise<PeripheryCandidate[]> {
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("briefing_periphery_candidates")
            .select("id, run_id, entity_name, entity_aliases, co_occurrence_score, vocab_overlap_score, total_score, supporting_item_ids, reasoning, status")
            .eq("status", "candidate")
            .order("created_at", { ascending: false })
            .order("total_score", { ascending: false })
            .limit(20);
        if (r.error) {
            reportError(r.error, { scope: "periphery.loadActiveCandidates" });
            return [];
        }
        const parsed = (r.data ?? [])
            .map(parsePeripheryRow)
            .filter((c): c is PeripheryCandidate => c !== null);
        return [...latestRunCandidates(parsed)];
    } catch (err) {
        reportError(err, { scope: "periphery.loadActiveCandidates" });
        return [];
    }
}

/**
 * Promote a candidate to the watchlist. Inserts a watchlist-entity row
 * with source='periphery_promoted' + a back-reference to the candidate,
 * then transitions the candidate's status to 'added_to_watchlist'.
 * Returns true on success.
 */
export async function addPeripheryToWatchlist(
    candidate: PeripheryCandidate
): Promise<boolean> {
    try {
        const sb = getSupabaseClient();
        const ins = await sb
            .from("briefing_watchlist_entities")
            .insert({
                entity_name: candidate.entity_name,
                entity_aliases: [...candidate.entity_aliases] as unknown as never,
                source: "periphery_promoted",
                status: "watched",
                promoted_from_periphery_id: candidate.id
            });
        if (ins.error) {
            reportError(ins.error, { scope: "periphery.addToWatchlist.insert" });
            return false;
        }
        const upd = await sb
            .from("briefing_periphery_candidates")
            .update({ status: "added_to_watchlist", last_action_at: new Date().toISOString() })
            .eq("id", candidate.id);
        if (upd.error) {
            reportError(upd.error, { scope: "periphery.addToWatchlist.update" });
            // The watchlist insert succeeded but the status flip didn't.
            // Returning true would lie; returning false would cause the
            // operator to retry and create a duplicate. We split the
            // difference: log it + return true so the UI removes the
            // candidate, and rely on the next run's RLS-scoped read to
            // reflect the truth.
            trackEvent("briefing_periphery_added_partial", { id: candidate.id });
            return true;
        }
        trackEvent("briefing_periphery_added", { entity_name: candidate.entity_name });
        return true;
    } catch (err) {
        reportError(err, { scope: "periphery.addToWatchlist" });
        return false;
    }
}

export async function snoozePeripheryCandidate(id: string): Promise<boolean> {
    return updatePeripheryStatus(id, "snoozed", "periphery.snooze");
}

export async function dismissPeripheryCandidate(id: string): Promise<boolean> {
    return updatePeripheryStatus(id, "dismissed", "periphery.dismiss");
}

async function updatePeripheryStatus(
    id: string,
    next: PeripheryStatus,
    scope: string
): Promise<boolean> {
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("briefing_periphery_candidates")
            .update({ status: next, last_action_at: new Date().toISOString() })
            .eq("id", id);
        if (r.error) {
            reportError(r.error, { scope });
            return false;
        }
        trackEvent(`briefing_periphery_${next}`, { id });
        return true;
    } catch (err) {
        reportError(err, { scope });
        return false;
    }
}
