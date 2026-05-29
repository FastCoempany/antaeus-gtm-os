/**
 * Stage 3.5 Synthesize (B.2c).
 *
 * For each qualified cluster from Stage 3.4, resolves the cluster's
 * evidence (enriched items joined to raw items), then runs the
 * multi-stage synthesis:
 *
 *   5a Draft     — Opus 4.7 + extended thinking
 *   5b Critique  — Sonnet 4.6 (cross-model ensemble)
 *   5c Revise    — Opus 4.7 (only when the critique flags issues)
 *   5d Gate      — deterministic checks per Voice Document §6/§7
 *
 * A Pattern persists to briefing_patterns only when it passes the gate.
 * Per-cluster failures (parse error, gate fail, LLM error) are recorded
 * + skipped; the stage completes with whatever passed. Costs roll up
 * for the run total.
 *
 * Idempotency: clears this-run's standard patterns before re-inserting.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropic } from "./anthropic.ts";
import {
    type Critique,
    type DraftPattern,
    type EvidenceItem,
    type GateResult,
    type SynthesisInput,
    CRITIQUE_SYSTEM_PROMPT,
    DRAFT_SYSTEM_PROMPT,
    GATE_REPAIR_SYSTEM_PROMPT,
    REVISE_SYSTEM_PROMPT,
    SYNTHESIS_PROMPT_VERSION,
    buildCritiquePrompt,
    buildDraftPrompt,
    buildGateRepairPrompt,
    buildRevisePrompt,
    parseCritiqueResponse,
    parseDraftResponse,
    runQualityGate
} from "./synthesis-shared.ts";

const DRAFT_THINKING_BUDGET = 2000; // enable-flag for adaptive thinking
const DRAFT_EFFORT = "medium" as const;
const DRAFT_MAX_TOKENS = 8000; // room for adaptive thinking + the JSON answer
const REVISE_MAX_TOKENS = 8000;
const CRITIQUE_MAX_TOKENS = 2048;

// Cap how many clusters we synthesize per run. Bounds cost + the Edge
// Function wall-clock, and matches the spec's "~1-3 Patterns" target with
// headroom. Clusters are taken in weighted-evidence order (strongest first).
const SYNTH_MAX_CLUSTERS = 5;

export interface SynthesisResult {
    readonly clusters: number;
    readonly synthesized: number;
    readonly gated_out: number;
    readonly errored: number;
    readonly total_cost_usd: number;
    readonly perCluster: ReadonlyArray<{
        readonly cluster_id: string;
        readonly anchor: string;
        readonly outcome: "synthesized" | "gated_out" | "error";
        readonly detail: string;
    }>;
}

interface HydratedContextLike {
    readonly commercial_profile?: {
        product_category: string | null;
        what_we_sell: string | null;
        value_prop: string | null;
    } | null;
    readonly icp?: unknown;
}

interface ClusterRow {
    id: string;
    cluster_type: string;
    anchor: string;
    item_ids: string[];
    weighted_evidence: number;
    trajectory: string | null;
    data: Record<string, unknown> | null;
}

export interface SynthesisOptions {
    /**
     * B.8 — when true, the workspace's weekly cost is over the
     * throttle threshold; substitute Sonnet for Opus on the
     * draft + revise + repair calls (~5x cheaper). Critique was
     * already Sonnet; quality drops modestly on the draft side
     * but the synthesis still produces.
     */
    readonly throttle?: boolean;
}

export async function runSynthesis(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    ctx: HydratedContextLike,
    options: SynthesisOptions = {}
): Promise<SynthesisResult> {
    const clusters = await loadQualifiedClusters(sb, runId, workspaceId);
    const result: SynthesisResult = {
        clusters: clusters.length,
        synthesized: 0,
        gated_out: 0,
        errored: 0,
        total_cost_usd: 0,
        perCluster: []
    };
    if (clusters.length === 0) return result;

    // Clear this-run's standard patterns so a re-run is idempotent.
    await sb
        .from("briefing_patterns")
        .delete()
        .eq("run_id", runId)
        .eq("workspace_id", workspaceId)
        .eq("pattern_type", "standard");

    const perCluster: Array<{
        cluster_id: string;
        anchor: string;
        outcome: "synthesized" | "gated_out" | "error";
        detail: string;
    }> = [];
    let synthesized = 0;
    let gatedOut = 0;
    let errored = 0;
    let totalCost = 0;

    const commercialProfile = normalizeProfile(ctx.commercial_profile);
    const icp = normalizeIcp(ctx.icp);

    // Strongest clusters first (already ordered by weighted_evidence desc),
    // capped so cost + wall-clock stay bounded.
    const selected = clusters.slice(0, SYNTH_MAX_CLUSTERS);

    // Synthesize clusters in parallel — each cluster's Draft → Critique →
    // Revise chain is independent, so running them concurrently keeps the
    // stage's wall-clock to roughly one cluster's latency regardless of
    // count. Persists happen sequentially afterward (fast DB writes).
    const synthTasks = selected.map(async (cluster) => {
        const evidence = await loadEvidence(sb, workspaceId, cluster.item_ids);
        if (evidence.length === 0) {
            return { cluster, input: null, synth: null };
        }
        const input: SynthesisInput = {
            cluster_id: cluster.id,
            cluster_type: cluster.cluster_type,
            anchor: cluster.anchor,
            weighted_evidence: cluster.weighted_evidence,
            distinct_sources: numFromData(cluster.data, "distinct_sources"),
            distinct_accounts: numFromData(cluster.data, "distinct_accounts"),
            trajectory: normalizeTrajectory(cluster.trajectory),
            evidence,
            commercial_profile: commercialProfile,
            icp
        };
        const synth = await synthesizeOne(input, options.throttle === true);
        return { cluster, input, synth };
    });

    const settled = await Promise.all(synthTasks);

    for (const { cluster, input, synth } of settled) {
        if (!synth || !input) {
            errored += 1;
            perCluster.push({
                cluster_id: cluster.id,
                anchor: cluster.anchor,
                outcome: "error",
                detail: "no evidence items resolved for cluster"
            });
            continue;
        }
        totalCost += synth.cost_usd;

        if (!synth.pattern) {
            errored += 1;
            perCluster.push({
                cluster_id: cluster.id,
                anchor: cluster.anchor,
                outcome: "error",
                detail: synth.error ?? "synthesis produced no pattern"
            });
            continue;
        }

        if (!synth.gate.passes) {
            gatedOut += 1;
            perCluster.push({
                cluster_id: cluster.id,
                anchor: cluster.anchor,
                outcome: "gated_out",
                detail: synth.gate.failures.join("; ")
            });
            continue;
        }

        const persisted = await persistPattern(
            sb,
            runId,
            workspaceId,
            cluster,
            input,
            synth.pattern,
            synth.gate,
            synth.critiqueSummary,
            synth.costs,
            synth.modelVHashes,
            synth.callRecords,
            ctx
        );
        if (persisted) {
            synthesized += 1;
            perCluster.push({
                cluster_id: cluster.id,
                anchor: cluster.anchor,
                outcome: "synthesized",
                detail: `pattern "${synth.pattern.name}" (confidence ${synth.pattern.confidence})`
            });
        } else {
            errored += 1;
            perCluster.push({
                cluster_id: cluster.id,
                anchor: cluster.anchor,
                outcome: "error",
                detail: "pattern persist failed"
            });
        }
    }

    return {
        clusters: clusters.length,
        synthesized,
        gated_out: gatedOut,
        errored,
        total_cost_usd: Math.round(totalCost * 10000) / 10000,
        perCluster
    };
}

/**
 * One LLM call captured for the audit envelope (B.6). Preserves enough
 * state to reconstruct the exchange months later — the operator can
 * see exactly what was sent, what came back, what it cost, and which
 * model_v_hash to compare against future runs.
 */
interface CallRecord {
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

interface SynthesizeOne {
    pattern: DraftPattern | null;
    draftBeforeRevise: DraftPattern | null;
    gate: GateResult;
    error: string | null;
    cost_usd: number;
    costs: { draft: number; critique: number; revise: number; repair: number };
    modelVHashes: {
        draft: string;
        critique: string;
        revise: string | null;
        repair: string | null;
    };
    callRecords: {
        draft: CallRecord | null;
        critique: CallRecord | null;
        revise: CallRecord | null;
        repair: CallRecord | null;
    };
    critiqueSummary: string;
}

const EMPTY_GATE: GateResult = { passes: false, checks: [], failures: ["not evaluated"] };

async function synthesizeOne(
    input: SynthesisInput,
    throttle: boolean = false
): Promise<SynthesizeOne> {
    // B.8 — when throttled, swap Opus → Sonnet on draft/revise/repair.
    // Critique is already Sonnet; no change there.
    const draftModel = throttle ? "sonnet_4_6" : "opus_4_7";
    const reviseModel = throttle ? "sonnet_4_6" : "opus_4_7";
    const repairModel = throttle ? "sonnet_4_6" : "opus_4_7";

    const costs = { draft: 0, critique: 0, revise: 0, repair: 0 };
    const modelVHashes: {
        draft: string;
        critique: string;
        revise: string | null;
        repair: string | null;
    } = {
        draft: "",
        critique: "",
        revise: null,
        repair: null
    };
    const callRecords: {
        draft: CallRecord | null;
        critique: CallRecord | null;
        revise: CallRecord | null;
        repair: CallRecord | null;
    } = { draft: null, critique: null, revise: null, repair: null };

    // ── 5a Draft ──
    const draftPrompt = buildDraftPrompt(input);
    const draftCall = await callAnthropic({
        model: draftModel,
        system_prompt: DRAFT_SYSTEM_PROMPT,
        user_prompt: draftPrompt,
        max_tokens: DRAFT_MAX_TOKENS,
        thinking_budget_tokens: DRAFT_THINKING_BUDGET,
        effort: DRAFT_EFFORT,
        prompt_version: SYNTHESIS_PROMPT_VERSION
    });
    costs.draft = draftCall.cost_usd;
    modelVHashes.draft = draftCall.model_v_hash;
    callRecords.draft = {
        model: draftModel,
        prompt_version: SYNTHESIS_PROMPT_VERSION,
        system_prompt: DRAFT_SYSTEM_PROMPT,
        user_prompt: draftPrompt,
        response_text: draftCall.text,
        cost_usd: draftCall.cost_usd,
        model_v_hash: draftCall.model_v_hash,
        input_tokens: draftCall.usage.input_tokens,
        output_tokens: draftCall.usage.output_tokens,
        ok: draftCall.ok,
        error: draftCall.error
    };
    if (!draftCall.ok) {
        return {
            pattern: null, draftBeforeRevise: null, gate: EMPTY_GATE,
            error: `draft call failed: ${draftCall.error}`,
            cost_usd: costs.draft, costs, modelVHashes, callRecords, critiqueSummary: ""
        };
    }
    const draftParse = parseDraftResponse(draftCall.text);
    if (!draftParse.pattern) {
        return {
            pattern: null, draftBeforeRevise: null, gate: EMPTY_GATE,
            error: `draft parse failed: ${draftParse.error}`,
            cost_usd: costs.draft, costs, modelVHashes, callRecords, critiqueSummary: ""
        };
    }
    const draftBeforeRevise = draftParse.pattern;
    let current = draftParse.pattern;

    // ── 5b Critique ──
    let critique: Critique | null = null;
    let critiqueSummary = "";
    const critiquePrompt = buildCritiquePrompt(input, current);
    const critiqueCall = await callAnthropic({
        model: "sonnet_4_6",
        system_prompt: CRITIQUE_SYSTEM_PROMPT,
        user_prompt: critiquePrompt,
        max_tokens: CRITIQUE_MAX_TOKENS,
        prompt_version: SYNTHESIS_PROMPT_VERSION
    });
    costs.critique = critiqueCall.cost_usd;
    modelVHashes.critique = critiqueCall.model_v_hash;
    callRecords.critique = {
        model: "sonnet_4_6",
        prompt_version: SYNTHESIS_PROMPT_VERSION,
        system_prompt: CRITIQUE_SYSTEM_PROMPT,
        user_prompt: critiquePrompt,
        response_text: critiqueCall.text,
        cost_usd: critiqueCall.cost_usd,
        model_v_hash: critiqueCall.model_v_hash,
        input_tokens: critiqueCall.usage.input_tokens,
        output_tokens: critiqueCall.usage.output_tokens,
        ok: critiqueCall.ok,
        error: critiqueCall.error
    };
    if (critiqueCall.ok) {
        const parsed = parseCritiqueResponse(critiqueCall.text);
        if (parsed.critique) {
            critique = parsed.critique;
            critiqueSummary = parsed.critique.overall_assessment;
        }
    }
    // Critique failure is non-fatal — we proceed to gate the draft.

    // ── 5c Revise (only when critique asks for it) ──
    if (critique && critique.revise_required) {
        const revisePrompt = buildRevisePrompt(input, current, critique);
        const reviseCall = await callAnthropic({
            model: reviseModel,
            system_prompt: REVISE_SYSTEM_PROMPT,
            user_prompt: revisePrompt,
            max_tokens: REVISE_MAX_TOKENS,
            prompt_version: SYNTHESIS_PROMPT_VERSION
        });
        costs.revise = reviseCall.cost_usd;
        modelVHashes.revise = reviseCall.model_v_hash;
        callRecords.revise = {
            model: reviseModel,
            prompt_version: SYNTHESIS_PROMPT_VERSION,
            system_prompt: REVISE_SYSTEM_PROMPT,
            user_prompt: revisePrompt,
            response_text: reviseCall.text,
            cost_usd: reviseCall.cost_usd,
            model_v_hash: reviseCall.model_v_hash,
            input_tokens: reviseCall.usage.input_tokens,
            output_tokens: reviseCall.usage.output_tokens,
            ok: reviseCall.ok,
            error: reviseCall.error
        };
        if (reviseCall.ok) {
            const revisedParse = parseDraftResponse(reviseCall.text);
            if (revisedParse.pattern) current = revisedParse.pattern;
        }
        // Revise failure is non-fatal — gate the (un-revised) draft.
    }

    // ── 5d Quality Gate ──
    const validIds = input.evidence.map((e) => e.enriched_id);
    let gate = runQualityGate(current, validIds);

    // ── 5d.1 Gate repair (one shot) ──
    // The gate rejects on mechanical violations (name too long, > 3
    // moves, a stray hedge construction). Rather than discard an
    // otherwise-good Pattern, send it back once for a minimal fix, then
    // re-gate. Skipped when the only failure is fabricated evidence ids
    // (a content problem the model can't honestly repair).
    const repairable =
        !gate.passes &&
        gate.checks.some(
            (c) => !c.pass && c.name !== "evidence_ids_valid"
        );
    if (repairable) {
        const repairPrompt = buildGateRepairPrompt(current, gate.failures);
        const repairCall = await callAnthropic({
            model: repairModel,
            system_prompt: GATE_REPAIR_SYSTEM_PROMPT,
            user_prompt: repairPrompt,
            max_tokens: REVISE_MAX_TOKENS,
            prompt_version: SYNTHESIS_PROMPT_VERSION
        });
        costs.repair = repairCall.cost_usd;
        modelVHashes.repair = repairCall.model_v_hash;
        callRecords.repair = {
            model: repairModel,
            prompt_version: SYNTHESIS_PROMPT_VERSION,
            system_prompt: GATE_REPAIR_SYSTEM_PROMPT,
            user_prompt: repairPrompt,
            response_text: repairCall.text,
            cost_usd: repairCall.cost_usd,
            model_v_hash: repairCall.model_v_hash,
            input_tokens: repairCall.usage.input_tokens,
            output_tokens: repairCall.usage.output_tokens,
            ok: repairCall.ok,
            error: repairCall.error
        };
        if (repairCall.ok) {
            const repairedParse = parseDraftResponse(repairCall.text);
            if (repairedParse.pattern) {
                const repairedGate = runQualityGate(repairedParse.pattern, validIds);
                // Only adopt the repair if it actually passes — never
                // regress to a worse pattern.
                if (repairedGate.passes) {
                    current = repairedParse.pattern;
                    gate = repairedGate;
                }
            }
        }
    }

    const totalCost = costs.draft + costs.critique + costs.revise + costs.repair;

    return {
        pattern: current,
        draftBeforeRevise,
        gate,
        error: null,
        cost_usd: totalCost,
        costs,
        modelVHashes,
        callRecords,
        critiqueSummary
    };
}

async function persistPattern(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    cluster: ClusterRow,
    input: SynthesisInput,
    pattern: DraftPattern,
    gate: GateResult,
    critiqueSummary: string,
    costs: { draft: number; critique: number; revise: number; repair: number },
    modelVHashes: {
        draft: string;
        critique: string;
        revise: string | null;
        repair: string | null;
    },
    callRecords: {
        draft: CallRecord | null;
        critique: CallRecord | null;
        revise: CallRecord | null;
        repair: CallRecord | null;
    },
    ctx: HydratedContextLike
): Promise<boolean> {
    const trajectory = pattern.trajectory ?? input.trajectory;
    const totalCost =
        Math.round(
            (costs.draft + costs.critique + costs.revise + costs.repair) * 10000
        ) / 10000;
    const insert = await sb.from("briefing_patterns").insert({
        run_id: runId,
        workspace_id: workspaceId,
        pattern_type: "standard",
        cluster_id: cluster.id,
        title: pattern.name,
        body: pattern.analysis,
        attribute_grid: {
            what_changed: pattern.six_questions.what_changed,
            trajectory,
            distinct_sources: input.distinct_sources,
            distinct_accounts: input.distinct_accounts,
            weighted_evidence: input.weighted_evidence
        },
        six_questions: pattern.six_questions,
        recommended_moves: pattern.recommended_moves.map((m, i) => ({
            label: m.action,
            rationale: m.rationale,
            destination: m.destination,
            draft_payload: null,
            leverage: i
        })),
        confidence: pattern.confidence,
        evidence_count: pattern.evidence_item_ids.length,
        source_count: input.distinct_sources,
        trajectory,
        matches_triggers: [],
        affects_deals: [],
        data: {
            anchor: cluster.anchor,
            cluster_type: cluster.cluster_type,
            evidence_item_ids: pattern.evidence_item_ids,
            synthesis_cost: {
                draft: costs.draft,
                critique: costs.critique,
                revise: costs.revise,
                repair: costs.repair,
                total: totalCost
            },
            model_v_hashes: modelVHashes,
            critique_summary: critiqueSummary,
            gate_checks: gate.checks,
            prompt_version: SYNTHESIS_PROMPT_VERSION
        }
    }).select("id").single();

    if (insert.error || !insert.data) {
        console.error("[briefing-synthesis] pattern persist failed:", {
            runId, workspaceId, cluster_id: cluster.id, error: insert.error
        });
        return false;
    }
    const patternId = String(insert.data.id);

    // B.7 — production-side eval row. Captures the gate's verdict at
    // synthesis time so a future deploy that starts degrading voice
    // (more hedging, more banned vocab, more repair_used) is observable
    // in the pattern_eval table without re-running the LLM. Non-fatal.
    await persistPatternEval(sb, workspaceId, patternId, {
        gate_passes: gate.passes,
        gate_failures: gate.failures.map((f) => f.name),
        gate_checks: gate.checks,
        repair_used: callRecords.repair !== null,
        cluster_type: cluster.cluster_type,
        anchor: cluster.anchor,
        confidence: pattern.confidence,
        synthesis_cost_usd: totalCost
    });

    // B.6 — audit envelope. Captures cluster + hydrated context + the
    // full LLM call chain + gate decisions so the operator can
    // reconstruct what the system did months later. Non-fatal if it
    // fails — the Pattern is still surfaceable, just without the
    // "show your work" trail.
    await persistAuditEnvelope(sb, workspaceId, patternId, {
        cluster_snapshot: {
            cluster_id: cluster.id,
            anchor: cluster.anchor,
            cluster_type: cluster.cluster_type,
            weighted_evidence: cluster.weighted_evidence,
            trajectory: cluster.trajectory,
            input_distinct_sources: input.distinct_sources,
            input_distinct_accounts: input.distinct_accounts,
            evidence: input.evidence
        },
        hydrated_context_snapshot: {
            commercial_profile: ctx.commercial_profile,
            watchlist_companies: ctx.watchlist_companies,
            icp: ctx.icp
        },
        draft_record: callRecords.draft,
        critique_record: callRecords.critique,
        revise_record: callRecords.revise ?? callRecords.repair,
        gate_decisions: {
            passes: gate.passes,
            failures: gate.failures,
            checks: gate.checks,
            critique_summary: critiqueSummary
        },
        total_cost: totalCost
    });

    return true;
}

interface EnvelopePayload {
    readonly cluster_snapshot: unknown;
    readonly hydrated_context_snapshot: unknown;
    readonly draft_record: unknown;
    readonly critique_record: unknown;
    readonly revise_record: unknown;
    readonly gate_decisions: unknown;
    readonly total_cost: number;
}

async function persistAuditEnvelope(
    sb: SupabaseClient,
    workspaceId: string,
    patternId: string,
    payload: EnvelopePayload
): Promise<void> {
    const r = await sb.from("briefing_audit_envelopes").insert({
        workspace_id: workspaceId,
        pattern_id: patternId,
        cluster_snapshot: payload.cluster_snapshot as unknown as never,
        hydrated_context_snapshot: payload.hydrated_context_snapshot as unknown as never,
        draft_record: payload.draft_record as unknown as never,
        critique_record: payload.critique_record as unknown as never,
        revise_record: payload.revise_record as unknown as never,
        gate_decisions: payload.gate_decisions as unknown as never,
        total_cost: payload.total_cost,
        user_actions: {} as unknown as never
    });
    if (r.error) {
        console.error("[briefing-synthesis] audit envelope persist failed:", {
            patternId, error: r.error
        });
    }
}

interface PatternEvalPayload {
    readonly gate_passes: boolean;
    readonly gate_failures: ReadonlyArray<string>;
    readonly gate_checks: unknown;
    readonly repair_used: boolean;
    readonly cluster_type: string | null;
    readonly anchor: string | null;
    readonly confidence: number;
    readonly synthesis_cost_usd: number;
}

/**
 * Write the production-sampling eval row for this Pattern. Non-fatal:
 * a failure here logs but doesn't break the Pattern persist. The row
 * is the substrate the pattern_eval_voice_signal view aggregates from
 * — drops in gate_pass_rate or rises in repair_rate are visible there
 * without re-running the LLM.
 */
async function persistPatternEval(
    sb: SupabaseClient,
    workspaceId: string,
    patternId: string,
    payload: PatternEvalPayload
): Promise<void> {
    const r = await sb.from("briefing_pattern_eval").insert({
        workspace_id: workspaceId,
        pattern_id: patternId,
        gate_passes: payload.gate_passes,
        gate_failures: payload.gate_failures as unknown as never,
        gate_checks: payload.gate_checks as unknown as never,
        repair_used: payload.repair_used,
        cluster_type: payload.cluster_type,
        anchor: payload.anchor,
        confidence: payload.confidence,
        synthesis_cost_usd: payload.synthesis_cost_usd
    });
    if (r.error) {
        console.error("[briefing-synthesis] pattern_eval persist failed:", {
            patternId, error: r.error
        });
    }
}

async function loadQualifiedClusters(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string
): Promise<ClusterRow[]> {
    const result = await sb
        .from("briefing_clusters")
        .select("id, cluster_type, anchor, item_ids, weighted_evidence, trajectory, data")
        .eq("run_id", runId)
        .eq("workspace_id", workspaceId)
        .order("weighted_evidence", { ascending: false });
    if (result.error) {
        console.error("[briefing-synthesis] cluster query failed:", result.error);
        return [];
    }
    return (result.data ?? []) as ClusterRow[];
}

/**
 * Resolve a cluster's item_ids into evidence. Joins enriched items to
 * their raw items for title / url / published_date / source_id.
 */
async function loadEvidence(
    sb: SupabaseClient,
    workspaceId: string,
    itemIds: ReadonlyArray<string>
): Promise<EvidenceItem[]> {
    if (itemIds.length === 0) return [];
    const result = await sb
        .from("briefing_enriched_items")
        .select(
            "id, entities, event_category, summary, what_changed, user_relevance_score, raw_item:briefing_raw_items!inner(source_id, title, url, published_date)"
        )
        .eq("workspace_id", workspaceId)
        .in("id", itemIds as string[]);
    if (result.error) {
        console.error("[briefing-synthesis] evidence query failed:", result.error);
        return [];
    }
    const rows = (result.data ?? []) as Array<any>;
    const out: EvidenceItem[] = [];
    for (const row of rows) {
        const raw = Array.isArray(row.raw_item) ? row.raw_item[0] : row.raw_item;
        if (!raw) continue;
        const entities = row.entities ?? {};
        const companies = Array.isArray(entities.companies)
            ? entities.companies.filter((c: unknown): c is string => typeof c === "string")
            : [];
        out.push({
            enriched_id: row.id,
            source_id: String(raw.source_id ?? ""),
            title: String(raw.title ?? ""),
            url: raw.url ?? null,
            published_date: raw.published_date ?? null,
            summary: String(row.summary ?? ""),
            what_changed: String(row.what_changed ?? ""),
            event_category: String(row.event_category ?? "other"),
            companies,
            user_relevance_score:
                typeof row.user_relevance_score === "number" ? row.user_relevance_score : 0.5
        });
    }
    return out;
}

function normalizeProfile(
    p: HydratedContextLike["commercial_profile"]
): SynthesisInput["commercial_profile"] {
    if (!p) return null;
    const pc = typeof p.product_category === "string" ? p.product_category : null;
    const vp = typeof p.value_prop === "string" ? p.value_prop : null;
    if (!pc && !vp) return null;
    return { product_category: pc, value_prop: vp };
}

function normalizeIcp(v: unknown): SynthesisInput["icp"] {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const icpSummary = typeof o["icp_summary"] === "string" ? o["icp_summary"] : "";
    const industries = Array.isArray(o["target_industries"])
        ? (o["target_industries"] as unknown[]).filter((x): x is string => typeof x === "string")
        : [];
    const buyers = Array.isArray(o["decision_maker_titles"])
        ? (o["decision_maker_titles"] as unknown[]).filter((x): x is string => typeof x === "string")
        : [];
    const pains = Array.isArray(o["pains"])
        ? (o["pains"] as unknown[]).filter((x): x is string => typeof x === "string")
        : [];
    if (icpSummary.length === 0 && industries.length === 0 && buyers.length === 0) {
        return null;
    }
    return {
        icp_summary: icpSummary,
        target_industries: industries,
        decision_maker_titles: buyers,
        pains
    };
}

function normalizeTrajectory(v: string | null): "rising" | "stable" | "declining" | null {
    if (v === "rising" || v === "stable" || v === "declining") return v;
    return null;
}

function numFromData(data: Record<string, unknown> | null, key: string): number {
    if (!data) return 0;
    const v = data[key];
    return typeof v === "number" ? v : 0;
}
