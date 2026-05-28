/**
 * Audit envelope client (B.6b).
 *
 * Reads a single envelope by pattern_id from briefing_audit_envelopes.
 * RLS scopes envelopes to workspace members so cross-workspace reads
 * aren't possible. Defensive: every field tolerated as malformed,
 * since envelopes are JSONB and shapes evolve.
 *
 * Loaded lazily — only when the operator clicks "Show the work" on a
 * Pattern card. We never fetch envelopes for Patterns the operator
 * doesn't expand.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";

export interface CallRecord {
    readonly model: string;
    readonly prompt_version: string;
    readonly system_prompt: string;
    readonly user_prompt: string;
    readonly response_text: string;
    readonly cost_usd: number;
    readonly model_v_hash: string;
    readonly input_tokens: number;
    readonly output_tokens: number;
    readonly ok: boolean;
    readonly error: string | null;
}

export interface AuditEnvelope {
    readonly id: string;
    readonly pattern_id: string;
    /** Cluster row + evidence items, or contrarian's synthetic shape. */
    readonly cluster_snapshot: unknown;
    readonly hydrated_context_snapshot: unknown;
    readonly draft_record: CallRecord | null;
    readonly critique_record: CallRecord | null;
    readonly revise_record: CallRecord | null;
    /** Free-form: gate passes, failures, checks, critique_summary. */
    readonly gate_decisions: unknown;
    readonly total_cost: number;
    readonly created_at: string;
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
    return typeof v === "boolean" ? v : fallback;
}

/**
 * Shape one call record. Returns null if the input doesn't even look
 * like a record. The rendered view skips null call records gracefully
 * (contrarian envelopes have critique + revise as null by design).
 */
export function parseCallRecord(raw: unknown): CallRecord | null {
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    // We require AT LEAST a model name or system prompt to consider
    // this a real call; otherwise it's just the JSON null leaking
    // through.
    const model = asString(o["model"]);
    const systemPrompt = asString(o["system_prompt"]);
    if (model.length === 0 && systemPrompt.length === 0) return null;
    return {
        model,
        prompt_version: asString(o["prompt_version"]),
        system_prompt: systemPrompt,
        user_prompt: asString(o["user_prompt"]),
        response_text: asString(o["response_text"]),
        cost_usd: asNumber(o["cost_usd"]),
        model_v_hash: asString(o["model_v_hash"]),
        input_tokens: asNumber(o["input_tokens"]),
        output_tokens: asNumber(o["output_tokens"]),
        ok: asBool(o["ok"], true),
        error: typeof o["error"] === "string" ? o["error"] : null
    };
}

/** Shape one envelope row. Returns null if no id. */
export function parseAuditEnvelopeRow(row: unknown): AuditEnvelope | null {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const id = asString(o["id"]);
    const patternId = asString(o["pattern_id"]);
    if (id.length === 0 || patternId.length === 0) return null;
    return {
        id,
        pattern_id: patternId,
        cluster_snapshot: o["cluster_snapshot"] ?? null,
        hydrated_context_snapshot: o["hydrated_context_snapshot"] ?? null,
        draft_record: parseCallRecord(o["draft_record"]),
        critique_record: parseCallRecord(o["critique_record"]),
        revise_record: parseCallRecord(o["revise_record"]),
        gate_decisions: o["gate_decisions"] ?? null,
        total_cost: asNumber(o["total_cost"]),
        created_at: asString(o["created_at"])
    };
}

/**
 * Read one envelope by pattern_id. Returns null on failure so the
 * "show your work" surface degrades gracefully (renders nothing or
 * an error line) instead of crashing the room.
 */
export async function loadAuditEnvelope(
    patternId: string
): Promise<AuditEnvelope | null> {
    if (!patternId) return null;
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("briefing_audit_envelopes")
            .select(
                "id, pattern_id, cluster_snapshot, hydrated_context_snapshot, draft_record, critique_record, revise_record, gate_decisions, total_cost, created_at"
            )
            .eq("pattern_id", patternId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (r.error) {
            reportError(r.error, { scope: "audit.loadEnvelope", patternId });
            return null;
        }
        if (!r.data) return null;
        return parseAuditEnvelopeRow(r.data);
    } catch (err) {
        reportError(err, { scope: "audit.loadEnvelope", patternId });
        return null;
    }
}
