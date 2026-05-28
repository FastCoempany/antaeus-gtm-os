/**
 * Stage 3.8 — Briefing Compose (B.9a).
 *
 * Runs after standard synthesize + contrarian synthesize, before the
 * run completes. Reads the patterns just persisted + any trigger fires
 * recorded this run, asks Sonnet 4.6 to write the one-line lead at
 * the top of the briefing, and stores it on briefing_runs.data.compose_lead.
 *
 * Refusing is a valid outcome — when there's nothing to lead with, the
 * stage records refused=true and no lead lands. The front-end renders
 * nothing in that case.
 *
 * One Sonnet call per run. ~250 output tokens. Cheap (~$0.005).
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropic } from "./anthropic.ts";
import {
    type ComposeDraft,
    type ComposeGateResult,
    type ComposeInput,
    type ComposePatternSummary,
    type ComposeTriggerFireSummary,
    COMPOSE_PROMPT_VERSION,
    COMPOSE_SYSTEM_PROMPT,
    buildComposePrompt,
    parseComposeResponse,
    runComposeGate
} from "./compose-shared.ts";

const MAX_OUTPUT_TOKENS = 350; // ~250 actual + headroom for JSON envelope

export interface ComposeResult {
    readonly outcome:
        | "lead_written"
        | "refused"
        | "gated_out"
        | "skipped_empty_run"
        | "error";
    readonly cost_usd: number;
    readonly detail: string;
    readonly lead: string | null;
    readonly model_v_hash: string | null;
    readonly gate: ComposeGateResult | null;
}

export async function runCompose(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string
): Promise<ComposeResult> {
    const [patterns, fires] = await Promise.all([
        loadPatterns(sb, runId, workspaceId),
        loadTriggerFires(sb, runId, workspaceId)
    ]);

    if (patterns.length === 0 && fires.length === 0) {
        return {
            outcome: "skipped_empty_run",
            cost_usd: 0,
            detail: "Zero patterns + zero trigger fires this run — nothing to lead with.",
            lead: null,
            model_v_hash: null,
            gate: null
        };
    }

    const input: ComposeInput = { patterns, trigger_fires: fires };
    const userPrompt = buildComposePrompt(input);

    const r = await callAnthropic({
        model: "sonnet_4_6",
        system_prompt: COMPOSE_SYSTEM_PROMPT,
        user_prompt: userPrompt,
        prompt_version: COMPOSE_PROMPT_VERSION,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3
    });

    if (!r.ok) {
        return {
            outcome: "error",
            cost_usd: r.cost_usd,
            detail: `Anthropic call failed: ${r.error ?? `HTTP ${r.status}`}`,
            lead: null,
            model_v_hash: r.model_v_hash,
            gate: null
        };
    }

    const draft = parseComposeResponse(r.text);
    if (!draft) {
        return {
            outcome: "error",
            cost_usd: r.cost_usd,
            detail: "Could not parse the LLM response as ComposeDraft.",
            lead: null,
            model_v_hash: r.model_v_hash,
            gate: null
        };
    }

    const gate = runComposeGate(draft);
    if (draft.refused) {
        await persistLead(sb, runId, null, draft.refusal_reason, r.cost_usd);
        return {
            outcome: "refused",
            cost_usd: r.cost_usd,
            detail: draft.refusal_reason ?? "LLM declined to write a lead.",
            lead: null,
            model_v_hash: r.model_v_hash,
            gate
        };
    }
    if (!gate.passes) {
        return {
            outcome: "gated_out",
            cost_usd: r.cost_usd,
            detail: `Gate failed: ${gate.failures.join(", ")}`,
            lead: draft.lead,
            model_v_hash: r.model_v_hash,
            gate
        };
    }

    await persistLead(sb, runId, draft.lead, null, r.cost_usd);
    return {
        outcome: "lead_written",
        cost_usd: r.cost_usd,
        detail: `Lead persisted: "${(draft.lead ?? "").slice(0, 80)}${(draft.lead ?? "").length > 80 ? "…" : ""}"`,
        lead: draft.lead,
        model_v_hash: r.model_v_hash,
        gate
    };
}

// ─── Loaders ───────────────────────────────────────────────────

async function loadPatterns(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string
): Promise<ComposePatternSummary[]> {
    const r = await sb
        .from("briefing_patterns")
        .select("pattern_type, title, body, confidence")
        .eq("workspace_id", workspaceId)
        .eq("run_id", runId)
        .order("confidence", { ascending: false })
        .limit(8);
    if (r.error || !r.data) return [];
    const out: ComposePatternSummary[] = [];
    for (const row of r.data as Array<any>) {
        const body = String(row.body ?? "");
        // Clip to first ~200 chars or first sentence — whichever comes first.
        const firstStop = body.search(/[.!?](?:\s|$)/);
        const summary = firstStop > 0 && firstStop < 200
            ? body.slice(0, firstStop + 1)
            : body.slice(0, 200);
        out.push({
            pattern_type: row.pattern_type === "contrarian" ? "contrarian" : "standard",
            title: String(row.title ?? ""),
            summary,
            confidence: typeof row.confidence === "number" ? row.confidence : 0
        });
    }
    return out;
}

async function loadTriggerFires(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string
): Promise<ComposeTriggerFireSummary[]> {
    const r = await sb
        .from("briefing_trigger_fires")
        .select(
            "summary, evidence_item_ids, trigger:briefing_watchlist_triggers!inner(natural_language)"
        )
        .eq("workspace_id", workspaceId)
        .eq("run_id", runId)
        .order("fired_at", { ascending: false })
        .limit(5);
    if (r.error || !r.data) return [];
    const out: ComposeTriggerFireSummary[] = [];
    for (const row of r.data as Array<any>) {
        const trig = Array.isArray(row.trigger) ? row.trigger[0] : row.trigger;
        const ids = row.evidence_item_ids;
        out.push({
            trigger_natural_language: String(trig?.natural_language ?? ""),
            fire_summary: String(row.summary ?? ""),
            evidence_count: Array.isArray(ids) ? ids.length : 0
        });
    }
    return out;
}

// ─── Persist ───────────────────────────────────────────────────

async function persistLead(
    sb: SupabaseClient,
    runId: string,
    lead: string | null,
    refusalReason: string | null,
    cost: number
): Promise<void> {
    // Merge into briefing_runs.data without clobbering hydrated_context
    // + filter_decisions (which the final run-completion write also sets).
    const sel = await sb
        .from("briefing_runs")
        .select("data")
        .eq("id", runId)
        .single();
    const existing = (sel.data?.data ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
        ...existing,
        compose_lead: lead,
        compose_refusal_reason: refusalReason,
        compose_cost_usd: cost,
        compose_prompt_version: COMPOSE_PROMPT_VERSION
    };
    const upd = await sb
        .from("briefing_runs")
        .update({ data: patch as unknown as never })
        .eq("id", runId);
    if (upd.error) {
        console.error("[compose] persist failed:", upd.error);
    }
}
