/**
 * Stage 3.3 Enrich (B.2a).
 *
 * For every raw item that was filter-passed in this run, call Haiku
 * 4.5 to produce structured enrichment (entities, event category,
 * pain tags, relevance score, exec_move, etc.) and write a row to
 * briefing_enriched_items.
 *
 * Per Recipe Layer Spec §3.3 (unchanged from v0.3 plus v0.4's
 * corporate ownership map addition):
 *   - One LLM call per filter-passed item
 *   - HydratedContext carries the workspace's watchlist + competitive
 *     set + active deals + watchlist triggers + pain tag library +
 *     corporate ownership map (B.1c onwards)
 *   - Response is JSON; defensive parser handles malformed output
 *   - Cost is recorded per item (briefing_enriched_items.enrichment_cost)
 *     AND rolled up to the run (briefing_runs.total_cost)
 *   - model_v_hash is recorded per item for B.6 audit envelopes
 *
 * Failure isolation:
 *   - Per-item LLM call failures (HTTP error, parse failure, rate
 *     limit) DON'T fail the pipeline. The failed item is skipped;
 *     the count is reported in the stage_log.
 *   - If ANTHROPIC_API_KEY is missing, every call fails fast with
 *     the same error; the stage records the gap and finishes
 *     cleanly with zero enriched items.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    ENRICH_SYSTEM_PROMPT,
    type EnrichPromptInputs,
    buildEnrichPrompt,
    parseEnrichResponse
} from "./_shared.ts";
import { callAnthropic } from "./anthropic.ts";

export interface EnrichResult {
    readonly attempted: number;
    readonly enriched: number;
    readonly noise: number;
    readonly errored: number;
    readonly total_cost_usd: number;
    readonly perItem: ReadonlyArray<{
        readonly raw_item_id: string;
        readonly outcome: "enriched" | "noise" | "error";
        readonly cost_usd: number;
        readonly error: string | null;
    }>;
}

interface FilteredItem {
    readonly id: string;
    readonly source_id: string;
    readonly external_id: string;
    readonly title: string;
    readonly body: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
}

interface HydratedContextLike {
    readonly watchlist_companies?: ReadonlyArray<string>;
    readonly icp?: any;
    readonly active_deals?: any;
    readonly watchlist_triggers?: any;
}

export async function runEnrich(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    ctx: HydratedContextLike,
    nowIso: string
): Promise<EnrichResult> {
    // Pull this-run's raw items that haven't already been enriched
    // (a re-run against the same run_id should be idempotent — the
    // run-id-scoped left-join ensures we never double-enrich).
    const rawItems = await loadFilteredItems(sb, runId, workspaceId);

    const perItem: Array<{
        raw_item_id: string;
        outcome: "enriched" | "noise" | "error";
        cost_usd: number;
        error: string | null;
    }> = [];
    let enrichedCount = 0;
    let noiseCount = 0;
    let erroredCount = 0;
    let totalCost = 0;

    // Build the per-item prompt inputs that are constant across the run.
    const sharedPromptParts = sharedPromptInputs(ctx);

    for (const item of rawItems) {
        const promptInputs: EnrichPromptInputs = {
            ...sharedPromptParts,
            source_id: item.source_id,
            title: item.title,
            body: item.body,
            published_date: item.published_date
        };

        const result = await callAnthropic({
            model: "haiku_4_5",
            system_prompt: ENRICH_SYSTEM_PROMPT,
            user_prompt: buildEnrichPrompt(promptInputs)
        });

        if (!result.ok) {
            erroredCount += 1;
            perItem.push({
                raw_item_id: item.id,
                outcome: "error",
                cost_usd: 0,
                error: result.error
            });
            console.warn("[briefing-enrich] call failed:", {
                runId,
                workspaceId,
                rawItemId: item.id,
                status: result.status,
                error: result.error
            });
            continue;
        }

        const parsed = parseEnrichResponse(result.text);
        if (parsed.enriched === null) {
            erroredCount += 1;
            perItem.push({
                raw_item_id: item.id,
                outcome: "error",
                cost_usd: result.cost_usd,
                error: parsed.error
            });
            totalCost += result.cost_usd;
            console.warn("[briefing-enrich] parse failed:", {
                runId,
                workspaceId,
                rawItemId: item.id,
                error: parsed.error,
                snippet: result.text.slice(0, 200)
            });
            continue;
        }

        const insert = await sb.from("briefing_enriched_items").insert({
            raw_item_id: item.id,
            run_id: runId,
            workspace_id: workspaceId,
            entities: parsed.enriched.entities,
            exec_move: parsed.enriched.exec_move,
            event_category: parsed.enriched.event_category,
            topic_tags: parsed.enriched.topic_tags,
            pain_tags: parsed.enriched.pain_tags,
            claim_type: parsed.enriched.claim_type,
            summary: parsed.enriched.summary,
            what_changed: parsed.enriched.what_changed,
            user_relevance_score: parsed.enriched.user_relevance_score,
            matches_triggers: parsed.enriched.matches_triggers,
            affects_deals: parsed.enriched.affects_deals,
            is_noise: parsed.enriched.is_noise,
            enrichment_cost: result.cost_usd,
            model_v_hash: result.model_v_hash,
            data: {
                input_tokens: result.usage.input_tokens,
                output_tokens: result.usage.output_tokens,
                enriched_at: nowIso
            }
        });

        if (insert.error) {
            erroredCount += 1;
            perItem.push({
                raw_item_id: item.id,
                outcome: "error",
                cost_usd: result.cost_usd,
                error: `enriched_items insert failed: ${insert.error.message}`
            });
            totalCost += result.cost_usd;
            continue;
        }

        totalCost += result.cost_usd;
        if (parsed.enriched.is_noise) {
            noiseCount += 1;
            perItem.push({
                raw_item_id: item.id,
                outcome: "noise",
                cost_usd: result.cost_usd,
                error: null
            });
        } else {
            enrichedCount += 1;
            perItem.push({
                raw_item_id: item.id,
                outcome: "enriched",
                cost_usd: result.cost_usd,
                error: null
            });
        }
    }

    // Roll the per-item cost up to the run row.
    if (totalCost > 0) {
        const cur = await sb
            .from("briefing_runs")
            .select("total_cost")
            .eq("id", runId)
            .maybeSingle();
        const priorCost =
            typeof cur.data?.total_cost === "number" ? cur.data.total_cost : 0;
        await sb
            .from("briefing_runs")
            .update({ total_cost: priorCost + totalCost })
            .eq("id", runId);
    }

    return {
        attempted: rawItems.length,
        enriched: enrichedCount,
        noise: noiseCount,
        errored: erroredCount,
        total_cost_usd: totalCost,
        perItem
    };
}

/**
 * Cap on items enriched per run. Bounds cost — at ~$0.001 per Haiku
 * call, 50 items = ~$0.05 per run worst case. When the workspace has
 * a backlog of un-enriched items larger than this, the cap takes the
 * oldest-first chunk; the rest catch up on subsequent runs.
 */
const MAX_ENRICH_PER_RUN = 50;

/**
 * Load raw items that need enriching. Scope:
 *   - workspace_id scoped (the pipeline runs per workspace; we never
 *     leak items across workspaces)
 *   - CROSS-RUN: enriches anything previously-ingested but not yet
 *     enriched, oldest-first. The first run after B.2a deploys
 *     catches up on items already in the table from prior B.1+ runs;
 *     subsequent runs only see whatever this-run actually ingested
 *     (because everything else is already enriched).
 *   - bounded by MAX_ENRICH_PER_RUN
 *
 * Implementation: pull workspace-scoped raw items oldest-first, then
 * filter out any that already have an enriched_items row.
 */
async function loadFilteredItems(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string
): Promise<ReadonlyArray<FilteredItem>> {
    // Pull a generous window of recent raw items — anything we might
    // want to enrich. We over-pull so we can apply the
    // left-anti-join in code, then cap to MAX_ENRICH_PER_RUN.
    const all = await sb
        .from("briefing_raw_items")
        .select("id, source_id, external_id, title, body, url, published_date, fetched_at")
        .eq("workspace_id", workspaceId)
        .order("fetched_at", { ascending: true })
        .limit(MAX_ENRICH_PER_RUN * 4);

    if (all.error) {
        console.error("[briefing-enrich] raw_items query failed:", all.error);
        return [];
    }

    const rawItems = (all.data ?? []) as Array<FilteredItem>;
    if (rawItems.length === 0) return [];

    // Look up which raw_item_ids are already enriched anywhere in this
    // workspace (not scoped to this run — once enriched, never re-
    // enrich; that's B.7+ territory).
    const alreadyEnriched = await sb
        .from("briefing_enriched_items")
        .select("raw_item_id")
        .eq("workspace_id", workspaceId)
        .in(
            "raw_item_id",
            rawItems.map((r) => r.id)
        );
    const enrichedIds = new Set<string>(
        (alreadyEnriched.data ?? []).map(
            (r: any) => r.raw_item_id as string
        )
    );
    void runId; // run_id is recorded on the inserted row, not used for filter scoping anymore
    return rawItems
        .filter((r) => !enrichedIds.has(r.id))
        .slice(0, MAX_ENRICH_PER_RUN);
}

/**
 * Derive the constant-per-run prompt parts from HydratedContext.
 * Each per-item call layers source/title/body/published_date on top.
 *
 * The HydratedContext slots map directly:
 *   ctx.watchlist_companies → watchlist_companies + competitive_set
 *                              (both — until a clear distinction
 *                              surfaces in an adapter)
 *   ctx.icp.target_industries → competitive_set additions
 *   ctx.active_deals.deals    → active_deals
 *   ctx.watchlist_triggers.triggers → watchlist_triggers
 *   ctx.pain_lib              → available_pain_tags (B.2c+)
 *
 * Corporate ownership map is hardcoded for B.2a — small static
 * curated list. Future work (B.4+) loads it from a global registry.
 */
function sharedPromptInputs(
    ctx: HydratedContextLike
): Omit<EnrichPromptInputs, "source_id" | "title" | "body" | "published_date"> {
    const watchlist = Array.isArray(ctx.watchlist_companies)
        ? ctx.watchlist_companies.slice()
        : [];

    const competitiveSet: string[] = [...watchlist];
    const icpIndustries =
        ctx.icp && typeof ctx.icp === "object"
            ? (ctx.icp as { target_industries?: unknown }).target_industries
            : null;
    if (Array.isArray(icpIndustries)) {
        for (const i of icpIndustries) {
            if (typeof i === "string" && i.trim().length > 0) {
                competitiveSet.push(i.trim());
            }
        }
    }

    const activeDeals: EnrichPromptInputs["active_deals"] = [];
    const dealsRoot =
        ctx.active_deals && typeof ctx.active_deals === "object"
            ? (ctx.active_deals as { deals?: unknown }).deals
            : null;
    if (Array.isArray(dealsRoot)) {
        for (const d of dealsRoot) {
            if (d && typeof d === "object") {
                const od = d as Record<string, unknown>;
                activeDeals.push({
                    deal_id: String(od["deal_id"] ?? ""),
                    account_name: String(od["account_name"] ?? ""),
                    competitive_set: Array.isArray(od["competitive_set"])
                        ? (od["competitive_set"] as ReadonlyArray<string>).filter(
                              (x) => typeof x === "string"
                          )
                        : [],
                    watch_for: Array.isArray(od["watch_for"])
                        ? (od["watch_for"] as ReadonlyArray<string>).filter(
                              (x) => typeof x === "string"
                          )
                        : []
                });
            }
        }
    }

    const watchlistTriggers: EnrichPromptInputs["watchlist_triggers"] = [];
    const triggersRoot =
        ctx.watchlist_triggers && typeof ctx.watchlist_triggers === "object"
            ? (ctx.watchlist_triggers as { triggers?: unknown }).triggers
            : null;
    if (Array.isArray(triggersRoot)) {
        for (const t of triggersRoot) {
            if (t && typeof t === "object") {
                const ot = t as Record<string, unknown>;
                watchlistTriggers.push({
                    trigger_id: String(ot["trigger_id"] ?? ""),
                    natural_language: String(ot["natural_language"] ?? "")
                });
            }
        }
    }

    return {
        watchlist_companies: Array.from(new Set(watchlist)),
        competitive_set: Array.from(new Set(competitiveSet)),
        active_deals: activeDeals,
        watchlist_triggers: watchlistTriggers,
        // B.2c lands the global pain tag registry. Empty here means the
        // model is instructed to leave pain_tags empty (the prompt
        // requires pain_tags only from the supplied list).
        available_pain_tags: [],
        // B.4+ loads this from the global Corporate Ownership Map
        // resource. Empty here means the prompt skips the addendum
        // entirely.
        corporate_ownership_map: []
    };
}
