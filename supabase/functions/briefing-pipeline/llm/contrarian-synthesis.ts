/**
 * Stage 3.5b — Contrarian Synthesis (B.5).
 *
 * Runs after standard synthesis (Stage 3.5). Reads the operator's
 * stated positions (commercial profile, watchlist, ICP) + the run's
 * enriched items + the standard Patterns just synthesized, and asks
 * Opus 4.7 to find the strongest contradiction between what the
 * operator stated and what the evidence is saying.
 *
 * Refusing is a feature — the LLM is instructed to output
 * found_contradiction=false when no strong, evidence-backed challenge
 * exists. Only when the gate passes AND a real contradiction was found
 * does a Pattern persist with pattern_type='contrarian'.
 *
 * One LLM call per run. Cost ~$0.10-0.15 (Opus 4.7 with adaptive
 * thinking at medium effort). The UI surface that renders contrarian
 * patterns ships in B.5b — until then, contrarian patterns sit in
 * briefing_patterns and the front-end (which filters on
 * pattern_type='standard') ignores them.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropic } from "./anthropic.ts";
import {
    type ContrarianDraft,
    type ContrarianEvidenceItem,
    type ContrarianGateResult,
    type ContrarianInput,
    type ContrarianStatedPositions,
    CONTRARIAN_PROMPT_VERSION,
    CONTRARIAN_SYSTEM_PROMPT,
    buildContrarianPrompt,
    parseContrarianResponse,
    runContrarianGate
} from "./contrarian-shared.ts";

const MAX_EVIDENCE_ITEMS = 30;
const DRAFT_MAX_TOKENS = 8000;

export interface ContrarianResult {
    readonly outcome:
        | "synthesized"          // pattern written
        | "no_contradiction"     // LLM refused (passes gate, no Pattern)
        | "gated_out"            // LLM produced a draft but gate rejected it
        | "skipped_no_evidence"  // run had no enriched items
        | "skipped_no_positions" // workspace has no stated positions
        | "error";
    readonly cost_usd: number;
    readonly detail: string;
    readonly model_v_hash: string | null;
    readonly draft: ContrarianDraft | null;
    readonly gate: ContrarianGateResult | null;
}

interface HydratedContextLike {
    readonly commercial_profile: {
        product_category: string | null;
        what_we_sell: string | null;
        value_prop: string | null;
    } | null;
    readonly watchlist_companies: ReadonlyArray<string>;
    readonly icp?: unknown;
}

export async function runContrarianSynthesis(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    ctx: HydratedContextLike
): Promise<ContrarianResult> {
    const stated = buildStatedPositions(ctx);
    if (isStatedEmpty(stated)) {
        return mkResult("skipped_no_positions", 0, "No stated positions on file — nothing to challenge.");
    }

    const evidence = await loadEvidence(sb, runId, workspaceId);
    if (evidence.length === 0) {
        return mkResult("skipped_no_evidence", 0, "This run produced no enriched items.");
    }

    // Idempotency: clear any prior contrarian patterns from this run.
    await sb
        .from("briefing_patterns")
        .delete()
        .eq("run_id", runId)
        .eq("pattern_type", "contrarian");

    const input: ContrarianInput = {
        run_id: runId,
        stated_positions: stated,
        evidence
    };

    const userPrompt = buildContrarianPrompt(input);
    const r = await callAnthropic({
        model: "opus_4_7",
        system_prompt: CONTRARIAN_SYSTEM_PROMPT,
        user_prompt: userPrompt,
        prompt_version: CONTRARIAN_PROMPT_VERSION,
        max_tokens: DRAFT_MAX_TOKENS,
        thinking_budget_tokens: 2000, // enable-flag for adaptive thinking
        effort: "medium"
    });
    const draftRecord = {
        model: "opus_4_7",
        prompt_version: CONTRARIAN_PROMPT_VERSION,
        system_prompt: CONTRARIAN_SYSTEM_PROMPT,
        user_prompt: userPrompt,
        response_text: r.text,
        cost_usd: r.cost_usd,
        model_v_hash: r.model_v_hash,
        input_tokens: r.usage.input_tokens,
        output_tokens: r.usage.output_tokens,
        ok: r.ok,
        error: r.error
    };

    if (!r.ok) {
        return {
            outcome: "error",
            cost_usd: r.cost_usd,
            detail: `Anthropic call failed: ${r.error ?? `HTTP ${r.status}`}`,
            model_v_hash: r.model_v_hash,
            draft: null,
            gate: null
        };
    }

    const draft = parseContrarianResponse(r.text);
    if (!draft) {
        return {
            outcome: "error",
            cost_usd: r.cost_usd,
            detail: "Could not parse the LLM response as ContrarianDraft.",
            model_v_hash: r.model_v_hash,
            draft: null,
            gate: null
        };
    }

    const gate = runContrarianGate(draft, input);
    if (!draft.found_contradiction) {
        return {
            outcome: "no_contradiction",
            cost_usd: r.cost_usd,
            detail: draft.no_contradiction_reason ?? "LLM found no contradiction.",
            model_v_hash: r.model_v_hash,
            draft,
            gate
        };
    }
    if (!gate.passes) {
        return {
            outcome: "gated_out",
            cost_usd: r.cost_usd,
            detail: `Gate failed: ${gate.failures.join(", ")}`,
            model_v_hash: r.model_v_hash,
            draft,
            gate
        };
    }

    const persisted = await persistContrarianPattern(
        sb,
        runId,
        workspaceId,
        input,
        draft,
        r.cost_usd,
        r.model_v_hash,
        draftRecord,
        gate
    );
    if (!persisted) {
        return {
            outcome: "error",
            cost_usd: r.cost_usd,
            detail: "Persist failed.",
            model_v_hash: r.model_v_hash,
            draft,
            gate
        };
    }

    return {
        outcome: "synthesized",
        cost_usd: r.cost_usd,
        detail: `Persisted contrarian pattern challenging ${draft.target_position?.kind ?? "?"} (confidence ${draft.confidence?.toFixed(2) ?? "?"}).`,
        model_v_hash: r.model_v_hash,
        draft,
        gate
    };
}

// ─── Helpers ───────────────────────────────────────────────────

function mkResult(
    outcome: ContrarianResult["outcome"],
    cost: number,
    detail: string
): ContrarianResult {
    return { outcome, cost_usd: cost, detail, model_v_hash: null, draft: null, gate: null };
}

function buildStatedPositions(ctx: HydratedContextLike): ContrarianStatedPositions {
    const cp = ctx.commercial_profile ?? null;
    return {
        product_category: cp?.product_category ?? null,
        what_we_sell: cp?.what_we_sell ?? null,
        value_prop: cp?.value_prop ?? null,
        watchlist_companies: ctx.watchlist_companies,
        icp_statement: extractIcpStatement(ctx.icp)
    };
}

function extractIcpStatement(icp: unknown): string | null {
    if (!icp || typeof icp !== "object") return null;
    const o = icp as Record<string, unknown>;
    // The ICP table is rich; the plain-English statement field varies
    // by how the ICP studio writes it. We probe the most likely shapes.
    const candidates = [o["statement"], o["icp_statement"], o["summary"], o["one_liner"]];
    for (const c of candidates) {
        if (typeof c === "string" && c.trim().length > 0) return c.trim();
    }
    return null;
}

function isStatedEmpty(p: ContrarianStatedPositions): boolean {
    return (
        !p.product_category &&
        !p.what_we_sell &&
        !p.value_prop &&
        !p.icp_statement &&
        p.watchlist_companies.length === 0
    );
}

async function loadEvidence(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string
): Promise<ContrarianEvidenceItem[]> {
    const r = await sb
        .from("briefing_enriched_items")
        .select("id, summary, entities, event_category, topic_tags, pain_tags, user_relevance_score, raw_item:briefing_raw_items!inner(source_id, published_date)")
        .eq("workspace_id", workspaceId)
        .eq("run_id", runId)
        .eq("is_noise", false)
        .order("user_relevance_score", { ascending: false })
        .limit(MAX_EVIDENCE_ITEMS);
    if (r.error || !r.data) return [];
    const out: ContrarianEvidenceItem[] = [];
    for (const row of r.data as Array<any>) {
        const raw = Array.isArray(row.raw_item) ? row.raw_item[0] : row.raw_item;
        const entities = row.entities ?? {};
        const companies = Array.isArray(entities.companies)
            ? entities.companies.filter((c: unknown): c is string => typeof c === "string")
            : [];
        out.push({
            enriched_id: String(row.id),
            source_id: String(raw?.source_id ?? "unknown"),
            summary: String(row.summary ?? ""),
            companies,
            event_category: typeof row.event_category === "string" ? row.event_category : null,
            topic_tags: Array.isArray(row.topic_tags) ? row.topic_tags : [],
            pain_tags: Array.isArray(row.pain_tags) ? row.pain_tags : [],
            user_relevance_score: typeof row.user_relevance_score === "number" ? row.user_relevance_score : 0,
            published_date: raw?.published_date ?? null
        });
    }
    return out;
}

async function persistContrarianPattern(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    input: ContrarianInput,
    draft: ContrarianDraft,
    cost: number,
    modelVHash: string,
    draftRecord: Record<string, unknown>,
    gate: ContrarianGateResult
): Promise<boolean> {
    if (!draft.title || !draft.analysis || !draft.six_questions || draft.confidence === null) {
        // Defensive — should never happen if the gate passed, but guard.
        return false;
    }
    const insert = await sb.from("briefing_patterns").insert({
        run_id: runId,
        workspace_id: workspaceId,
        pattern_type: "contrarian",
        cluster_id: null,
        title: draft.title,
        body: draft.analysis,
        attribute_grid: {
            target_position: draft.target_position,
            evidence_count: draft.evidence_ids.length,
            stated_positions_snapshot: input.stated_positions
        },
        six_questions: draft.six_questions,
        recommended_moves: draft.recommended_moves.map((m, i) => ({
            label: m.label,
            rationale: m.rationale,
            destination: m.destination,
            draft_payload: null,
            leverage: i
        })),
        confidence: draft.confidence,
        evidence_count: draft.evidence_ids.length,
        source_count: new Set(
            input.evidence
                .filter((e) => draft.evidence_ids.includes(e.enriched_id))
                .map((e) => e.source_id)
        ).size,
        trajectory: null,
        matches_triggers: [],
        affects_deals: [],
        data: {
            evidence_item_ids: draft.evidence_ids,
            target_position: draft.target_position,
            synthesis_cost: { contrarian: cost },
            model_v_hashes: { contrarian: modelVHash },
            prompt_version: CONTRARIAN_PROMPT_VERSION
        }
    }).select("id").single();
    if (insert.error || !insert.data) {
        console.error("[contrarian] insert failed:", insert.error);
        return false;
    }
    const patternId = String(insert.data.id);

    // B.6 — audit envelope. Contrarian is single-pass (no critique /
    // revise), so cluster_snapshot carries the synthetic input shape
    // (stated_positions + evidence we challenged with), draft_record
    // is the one Opus call, and critique_record / revise_record are
    // null. Non-fatal if it fails.
    const envelope = await sb.from("briefing_audit_envelopes").insert({
        workspace_id: workspaceId,
        pattern_id: patternId,
        cluster_snapshot: {
            kind: "contrarian_stated_positions",
            stated_positions: input.stated_positions,
            evidence: input.evidence
        } as unknown as never,
        hydrated_context_snapshot: {
            commercial_profile: {
                product_category: input.stated_positions.product_category,
                what_we_sell: input.stated_positions.what_we_sell,
                value_prop: input.stated_positions.value_prop
            },
            watchlist_companies: input.stated_positions.watchlist_companies,
            icp_statement: input.stated_positions.icp_statement
        } as unknown as never,
        draft_record: draftRecord as unknown as never,
        critique_record: null,
        revise_record: null,
        gate_decisions: {
            passes: gate.passes,
            failures: gate.failures,
            found_contradiction: draft.found_contradiction,
            no_contradiction_reason: draft.no_contradiction_reason
        } as unknown as never,
        total_cost: cost,
        user_actions: {} as unknown as never
    });
    if (envelope.error) {
        console.error("[contrarian] audit envelope persist failed:", {
            patternId, error: envelope.error
        });
    }
    return true;
}
