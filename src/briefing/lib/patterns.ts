/**
 * Briefing Patterns — read model for the room (B.2c-2).
 *
 * The Recipe Layer pipeline writes synthesized Patterns to the
 * `briefing_patterns` table (Stage 3.5, see the Edge Function's
 * llm/synthesis.ts). This module reads them back for the room: a
 * defensive row parser + the "latest run only" selector + the Supabase
 * load. RLS scopes the read to the operator's workspace, so the query
 * carries no workspace filter.
 *
 * The parser is pure + vitest-tested. loadStandardPatterns wraps the
 * Supabase read and degrades to [] on any failure (missing env, no
 * session, query error) — the room shows its empty state rather than
 * throwing.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";

export type Trajectory = "rising" | "stable" | "declining" | null;

export interface SixQuestions {
    readonly what_changed: string;
    readonly evidence: string;
    readonly confidence_rationale: string;
    readonly why_it_matters: string;
    readonly who_needs_to_know: string;
    readonly what_next: string;
}

export interface RecommendedMove {
    readonly label: string;
    readonly rationale: string;
    readonly destination: string;
}

/**
 * What a contrarian Pattern is challenging. Only populated for rows
 * with pattern_type='contrarian'; null on standard Patterns.
 */
export type TargetPositionKind = "watchlist" | "value_prop" | "icp" | "competitor_set";

export interface TargetPosition {
    readonly kind: TargetPositionKind;
    readonly source: string;
    readonly quoted_text: string;
}

export interface BriefingPattern {
    readonly id: string;
    readonly run_id: string;
    readonly title: string;
    readonly analysis: string;
    readonly six_questions: SixQuestions;
    readonly recommended_moves: ReadonlyArray<RecommendedMove>;
    readonly confidence: number;
    readonly evidence_count: number;
    readonly source_count: number;
    readonly trajectory: Trajectory;
    readonly surfaced_at: string;
    readonly target_position: TargetPosition | null;
}

const SIX_Q_KEYS: ReadonlyArray<keyof SixQuestions> = [
    "what_changed",
    "evidence",
    "confidence_rationale",
    "why_it_matters",
    "who_needs_to_know",
    "what_next"
];

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asTrajectory(v: unknown): Trajectory {
    return v === "rising" || v === "stable" || v === "declining" ? v : null;
}

function asSixQuestions(v: unknown): SixQuestions {
    const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    const out = {} as Record<keyof SixQuestions, string>;
    for (const k of SIX_Q_KEYS) out[k] = asString(o[k]).trim();
    return out as SixQuestions;
}

function asTargetPosition(v: unknown): TargetPosition | null {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const kind = asString(o["kind"]);
    if (!["watchlist", "value_prop", "icp", "competitor_set"].includes(kind)) return null;
    const quoted_text = asString(o["quoted_text"]).trim();
    if (quoted_text.length === 0) return null;
    return {
        kind: kind as TargetPositionKind,
        source: asString(o["source"]),
        quoted_text
    };
}

function asMoves(v: unknown): RecommendedMove[] {
    if (!Array.isArray(v)) return [];
    const out: RecommendedMove[] = [];
    for (const raw of v) {
        if (!raw || typeof raw !== "object") continue;
        const o = raw as Record<string, unknown>;
        // Stored shape uses `label`; tolerate `action` from older rows.
        const label = asString(o["label"]) || asString(o["action"]);
        const destination = asString(o["destination"]);
        if (label.trim().length === 0 && destination.trim().length === 0) continue;
        out.push({
            label: label.trim(),
            rationale: asString(o["rationale"]).trim(),
            destination: destination.trim()
        });
    }
    return out;
}

/** Parse one Supabase briefing_patterns row into the view model. */
export function parsePatternRow(row: unknown): BriefingPattern | null {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const id = asString(o["id"]);
    const title = asString(o["title"]).trim();
    const analysis = asString(o["body"]).trim();
    if (id.length === 0 || title.length === 0 || analysis.length === 0) return null;
    // target_position lives under attribute_grid for contrarian rows;
    // null for standard rows (or rows where the field is absent).
    const attributeGrid = o["attribute_grid"];
    const targetPositionRaw =
        attributeGrid && typeof attributeGrid === "object"
            ? (attributeGrid as Record<string, unknown>)["target_position"]
            : null;
    return {
        id,
        run_id: asString(o["run_id"]),
        title,
        analysis,
        six_questions: asSixQuestions(o["six_questions"]),
        recommended_moves: asMoves(o["recommended_moves"]),
        confidence: asNumber(o["confidence"]),
        evidence_count: asNumber(o["evidence_count"]),
        source_count: asNumber(o["source_count"]),
        trajectory: asTrajectory(o["trajectory"]),
        surfaced_at: asString(o["surfaced_at"]),
        target_position: asTargetPosition(targetPositionRaw)
    };
}

/**
 * Keep only the most recent run's Patterns. The table accumulates a row
 * per Pattern per run; the weekly briefing shows the latest run only.
 * Input is assumed ordered by surfaced_at desc (the query orders it),
 * so the first row's run_id is the latest run.
 */
export function latestRunPatterns(
    patterns: ReadonlyArray<BriefingPattern>
): BriefingPattern[] {
    if (patterns.length === 0) return [];
    const latestRunId = patterns[0]!.run_id;
    return patterns.filter((p) => p.run_id === latestRunId);
}

/**
 * Load the latest run's standard Patterns for the operator's workspace.
 * Defensive: returns [] on any failure so the room renders its empty
 * state instead of crashing.
 */
export async function loadStandardPatterns(): Promise<BriefingPattern[]> {
    try {
        const sb = getSupabaseClient();
        const result = await sb
            .from("briefing_patterns")
            .select(
                "id, run_id, title, body, six_questions, recommended_moves, confidence, evidence_count, source_count, trajectory, surfaced_at"
            )
            .eq("pattern_type", "standard")
            .order("surfaced_at", { ascending: false })
            .limit(50);
        if (result.error) {
            reportError(result.error, { scope: "briefing.loadStandardPatterns" });
            return [];
        }
        const parsed = (result.data ?? [])
            .map(parsePatternRow)
            .filter((p): p is BriefingPattern => p !== null);
        return latestRunPatterns(parsed);
    } catch (err) {
        reportError(err, { scope: "briefing.loadStandardPatterns" });
        return [];
    }
}

/**
 * Load the latest run's CONTRARIAN Patterns (pattern_type='contrarian').
 *
 * Same defensive shape as loadStandardPatterns — failures return [] so
 * the rail just doesn't render. The contrarian surface is supposed to
 * stay quiet most runs anyway (refusal is a valid outcome), so an empty
 * result is the common case, not an error state.
 *
 * Selects `attribute_grid` in addition to the standard columns because
 * contrarian Patterns carry the challenged target_position under there.
 */
export async function loadContrarianPatterns(): Promise<BriefingPattern[]> {
    try {
        const sb = getSupabaseClient();
        const result = await sb
            .from("briefing_patterns")
            .select(
                "id, run_id, title, body, six_questions, recommended_moves, confidence, evidence_count, source_count, trajectory, surfaced_at, attribute_grid"
            )
            .eq("pattern_type", "contrarian")
            .order("surfaced_at", { ascending: false })
            .limit(20);
        if (result.error) {
            reportError(result.error, { scope: "briefing.loadContrarianPatterns" });
            return [];
        }
        const parsed = (result.data ?? [])
            .map(parsePatternRow)
            .filter((p): p is BriefingPattern => p !== null);
        return latestRunPatterns(parsed);
    } catch (err) {
        reportError(err, { scope: "briefing.loadContrarianPatterns" });
        return [];
    }
}
