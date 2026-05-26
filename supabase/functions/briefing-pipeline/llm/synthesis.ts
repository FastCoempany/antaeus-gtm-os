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
    REVISE_SYSTEM_PROMPT,
    SYNTHESIS_PROMPT_VERSION,
    buildCritiquePrompt,
    buildDraftPrompt,
    buildRevisePrompt,
    parseCritiqueResponse,
    parseDraftResponse,
    runQualityGate
} from "./synthesis-shared.ts";

const DRAFT_THINKING_BUDGET = 2000;
const DRAFT_MAX_TOKENS = 4096;
const REVISE_MAX_TOKENS = 4096;
const CRITIQUE_MAX_TOKENS = 2048;

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

export async function runSynthesis(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    ctx: HydratedContextLike
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

    for (const cluster of clusters) {
        const evidence = await loadEvidence(sb, workspaceId, cluster.item_ids);
        if (evidence.length === 0) {
            errored += 1;
            perCluster.push({
                cluster_id: cluster.id,
                anchor: cluster.anchor,
                outcome: "error",
                detail: "no evidence items resolved for cluster"
            });
            continue;
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

        const synth = await synthesizeOne(input);
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
            synth.modelVHashes
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

interface SynthesizeOne {
    pattern: DraftPattern | null;
    gate: GateResult;
    error: string | null;
    cost_usd: number;
    costs: { draft: number; critique: number; revise: number };
    modelVHashes: { draft: string; critique: string; revise: string | null };
    critiqueSummary: string;
}

const EMPTY_GATE: GateResult = { passes: false, checks: [], failures: ["not evaluated"] };

async function synthesizeOne(input: SynthesisInput): Promise<SynthesizeOne> {
    const costs = { draft: 0, critique: 0, revise: 0 };
    const modelVHashes: { draft: string; critique: string; revise: string | null } = {
        draft: "",
        critique: "",
        revise: null
    };

    // ── 5a Draft ──
    const draftCall = await callAnthropic({
        model: "opus_4_7",
        system_prompt: DRAFT_SYSTEM_PROMPT,
        user_prompt: buildDraftPrompt(input),
        max_tokens: DRAFT_MAX_TOKENS,
        thinking_budget_tokens: DRAFT_THINKING_BUDGET,
        prompt_version: SYNTHESIS_PROMPT_VERSION
    });
    costs.draft = draftCall.cost_usd;
    modelVHashes.draft = draftCall.model_v_hash;
    if (!draftCall.ok) {
        return {
            pattern: null, gate: EMPTY_GATE, error: `draft call failed: ${draftCall.error}`,
            cost_usd: costs.draft, costs, modelVHashes, critiqueSummary: ""
        };
    }
    const draftParse = parseDraftResponse(draftCall.text);
    if (!draftParse.pattern) {
        return {
            pattern: null, gate: EMPTY_GATE, error: `draft parse failed: ${draftParse.error}`,
            cost_usd: costs.draft, costs, modelVHashes, critiqueSummary: ""
        };
    }
    let current = draftParse.pattern;

    // ── 5b Critique ──
    let critique: Critique | null = null;
    let critiqueSummary = "";
    const critiqueCall = await callAnthropic({
        model: "sonnet_4_6",
        system_prompt: CRITIQUE_SYSTEM_PROMPT,
        user_prompt: buildCritiquePrompt(input, current),
        max_tokens: CRITIQUE_MAX_TOKENS,
        prompt_version: SYNTHESIS_PROMPT_VERSION
    });
    costs.critique = critiqueCall.cost_usd;
    modelVHashes.critique = critiqueCall.model_v_hash;
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
        const reviseCall = await callAnthropic({
            model: "opus_4_7",
            system_prompt: REVISE_SYSTEM_PROMPT,
            user_prompt: buildRevisePrompt(input, current, critique),
            max_tokens: REVISE_MAX_TOKENS,
            prompt_version: SYNTHESIS_PROMPT_VERSION
        });
        costs.revise = reviseCall.cost_usd;
        modelVHashes.revise = reviseCall.model_v_hash;
        if (reviseCall.ok) {
            const revisedParse = parseDraftResponse(reviseCall.text);
            if (revisedParse.pattern) current = revisedParse.pattern;
        }
        // Revise failure is non-fatal — gate the (un-revised) draft.
    }

    // ── 5d Quality Gate ──
    const validIds = input.evidence.map((e) => e.enriched_id);
    const gate = runQualityGate(current, validIds);
    const totalCost = costs.draft + costs.critique + costs.revise;

    return {
        pattern: current,
        gate,
        error: null,
        cost_usd: totalCost,
        costs,
        modelVHashes,
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
    costs: { draft: number; critique: number; revise: number },
    modelVHashes: { draft: string; critique: string; revise: string | null }
): Promise<boolean> {
    const trajectory = pattern.trajectory ?? input.trajectory;
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
                total: Math.round((costs.draft + costs.critique + costs.revise) * 10000) / 10000
            },
            model_v_hashes: modelVHashes,
            critique_summary: critiqueSummary,
            gate_checks: gate.checks,
            prompt_version: SYNTHESIS_PROMPT_VERSION
        }
    });

    if (insert.error) {
        console.error("[briefing-synthesis] pattern persist failed:", {
            runId, workspaceId, cluster_id: cluster.id, error: insert.error
        });
        return false;
    }
    return true;
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
