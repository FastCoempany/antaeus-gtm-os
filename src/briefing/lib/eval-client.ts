/**
 * Eval client (B.7) — reads the production-sampling eval rows so a
 * future Briefing surface (or a dev console) can render the rolling
 * voice-quality signal.
 *
 * Not consumed by the room itself in this PR — the marks bar +
 * Patterns + footer are the operator surfaces. This module is the
 * substrate for the eventual "voice health" panel and the regression
 * canary a future session can run against the rolling window.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";

export interface PatternEvalRow {
    readonly id: string;
    readonly pattern_id: string;
    readonly captured_at: string;
    readonly gate_passes: boolean;
    readonly gate_failures: ReadonlyArray<string>;
    readonly repair_used: boolean;
    readonly cluster_type: string | null;
    readonly anchor: string | null;
    readonly confidence: number;
    readonly synthesis_cost_usd: number;
    readonly critic_score: number | null;
}

export interface VoiceSignalRow {
    readonly cluster_type: string;
    readonly anchor: string;
    readonly pattern_count: number;
    readonly gate_pass_rate: number;
    readonly repair_rate: number;
    readonly mean_confidence: number;
    readonly mean_cost_usd: number;
    readonly last_captured_at: string;
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return fallback;
}

function asNumberOrNull(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return null;
}

function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
}

export function parsePatternEvalRow(row: unknown): PatternEvalRow | null {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const id = asString(o["id"]);
    const pattern_id = asString(o["pattern_id"]);
    if (id.length === 0 || pattern_id.length === 0) return null;
    return {
        id,
        pattern_id,
        captured_at: asString(o["captured_at"]),
        gate_passes: o["gate_passes"] === true,
        gate_failures: asStringArray(o["gate_failures"]),
        repair_used: o["repair_used"] === true,
        cluster_type: typeof o["cluster_type"] === "string" ? (o["cluster_type"] as string) : null,
        anchor: typeof o["anchor"] === "string" ? (o["anchor"] as string) : null,
        confidence: asNumber(o["confidence"]),
        synthesis_cost_usd: asNumber(o["synthesis_cost_usd"]),
        critic_score: asNumberOrNull(o["critic_score"])
    };
}

export function parseVoiceSignalRow(row: unknown): VoiceSignalRow | null {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const cluster_type = asString(o["cluster_type"]);
    const anchor = asString(o["anchor"]);
    if (cluster_type.length === 0 || anchor.length === 0) return null;
    return {
        cluster_type,
        anchor,
        pattern_count: asNumber(o["pattern_count"]),
        gate_pass_rate: asNumber(o["gate_pass_rate"]),
        repair_rate: asNumber(o["repair_rate"]),
        mean_confidence: asNumber(o["mean_confidence"]),
        mean_cost_usd: asNumber(o["mean_cost_usd"]),
        last_captured_at: asString(o["last_captured_at"])
    };
}

/**
 * Read the most recent N eval rows for this workspace. Defensive:
 * returns [] on any failure. RLS scopes the read.
 */
export async function loadRecentPatternEvals(
    limit = 100
): Promise<PatternEvalRow[]> {
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("briefing_pattern_eval")
            .select(
                "id, pattern_id, captured_at, gate_passes, gate_failures, repair_used, cluster_type, anchor, confidence, synthesis_cost_usd, critic_score"
            )
            .order("captured_at", { ascending: false })
            .limit(limit);
        if (r.error) {
            reportError(r.error, { scope: "briefing.loadRecentPatternEvals" });
            return [];
        }
        const out: PatternEvalRow[] = [];
        for (const row of r.data ?? []) {
            const parsed = parsePatternEvalRow(row);
            if (parsed) out.push(parsed);
        }
        return out;
    } catch (err) {
        reportError(err, { scope: "briefing.loadRecentPatternEvals" });
        return [];
    }
}

/**
 * Read the rolling-30d voice signal aggregated per (cluster_type,
 * anchor). The view does the math; this is a thin defensive wrapper.
 */
export async function loadVoiceSignal(): Promise<VoiceSignalRow[]> {
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("pattern_eval_voice_signal")
            .select(
                "cluster_type, anchor, pattern_count, gate_pass_rate, repair_rate, mean_confidence, mean_cost_usd, last_captured_at"
            )
            .order("last_captured_at", { ascending: false })
            .limit(100);
        if (r.error) {
            reportError(r.error, { scope: "briefing.loadVoiceSignal" });
            return [];
        }
        const out: VoiceSignalRow[] = [];
        for (const row of r.data ?? []) {
            const parsed = parseVoiceSignalRow(row);
            if (parsed) out.push(parsed);
        }
        return out;
    } catch (err) {
        reportError(err, { scope: "briefing.loadVoiceSignal" });
        return [];
    }
}
