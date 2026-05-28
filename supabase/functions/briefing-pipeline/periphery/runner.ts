/**
 * Stage 3.3b — Periphery Detection (B.4b).
 *
 * Runs between Triggers (3.3.5) and Cluster (3.4). Reads the run's
 * enriched items + the operator's watched-entity set, scores
 * off-watchlist entities by co-occurrence + vocabulary overlap (pure
 * math in _shared.ts), and writes the top candidates to
 * briefing_periphery_candidates for the right-rail UI (B.4c) to surface.
 *
 * The watched set is assembled from three sources:
 *   1. briefing_watchlist_entities — the operator's explicitly-named
 *      entities (manual or promoted from a previous candidate).
 *   2. signal_console_accounts — every account on their Signal Console
 *      radar (any relationship_type). These are the de-facto baseline
 *      watchlist for new workspaces that haven't authored entities yet.
 *   3. briefing_watchlist_triggers — company targets extracted from
 *      armed triggers' parsed_query (a trigger naming "Deel" implies
 *      Deel is being watched).
 *
 * Cost: ~$0 — pure compute, no LLM calls in B.4b. The investor /
 * hiring / buyer signals in B.4d may add small data fetches.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    type ScoringItem,
    normalizeEntity,
    rankCandidates
} from "./_shared.ts";

export interface PeripheryRunResult {
    readonly items_considered: number;
    readonly watched_count: number;
    readonly candidates_persisted: number;
    readonly per_candidate: ReadonlyArray<{
        readonly entity_name: string;
        readonly co_occurrence_score: number;
        readonly vocab_overlap_score: number;
        readonly total_score: number;
    }>;
}

const ITEM_CAP = 200;

export async function runPeriphery(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string
): Promise<PeripheryRunResult> {
    const [items, watched] = await Promise.all([
        loadItems(sb, runId, workspaceId),
        loadWatchedSet(sb, workspaceId)
    ]);

    const baseResult = {
        items_considered: items.length,
        watched_count: watched.size,
        candidates_persisted: 0,
        per_candidate: []
    } as const;

    if (items.length === 0 || watched.size === 0) {
        return baseResult;
    }

    const candidates = rankCandidates(items, watched);
    if (candidates.length === 0) {
        return baseResult;
    }

    const rows = candidates.map((c) => ({
        workspace_id: workspaceId,
        run_id: runId,
        entity_name: c.entity_name,
        entity_aliases: Array.from(c.entity_aliases),
        co_occurrence_score: c.co_occurrence_score,
        vocab_overlap_score: c.vocab_overlap_score,
        total_score: c.total_score,
        supporting_item_ids: Array.from(c.supporting_item_ids),
        reasoning: c.reasoning,
        status: "candidate"
    }));

    const ins = await sb.from("briefing_periphery_candidates").insert(rows);
    if (ins.error) {
        console.error("[briefing-periphery] insert failed:", ins.error);
        return baseResult;
    }

    return {
        items_considered: items.length,
        watched_count: watched.size,
        candidates_persisted: candidates.length,
        per_candidate: candidates.map((c) => ({
            entity_name: c.entity_name,
            co_occurrence_score: c.co_occurrence_score,
            vocab_overlap_score: c.vocab_overlap_score,
            total_score: c.total_score
        }))
    };
}

async function loadItems(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string
): Promise<ScoringItem[]> {
    const r = await sb
        .from("briefing_enriched_items")
        .select("id, entities, pain_tags, topic_tags")
        .eq("workspace_id", workspaceId)
        .eq("run_id", runId)
        .eq("is_noise", false)
        .limit(ITEM_CAP);
    if (r.error || !r.data) {
        if (r.error) console.error("[briefing-periphery] enriched_items load failed:", r.error);
        return [];
    }
    const out: ScoringItem[] = [];
    for (const row of r.data as Array<any>) {
        const e = row.entities ?? {};
        const companies = Array.isArray(e.companies)
            ? e.companies.filter((c: unknown): c is string => typeof c === "string" && c.length > 0)
            : [];
        out.push({
            id: String(row.id),
            entities: companies,
            pain_tags: Array.isArray(row.pain_tags) ? row.pain_tags : [],
            topic_tags: Array.isArray(row.topic_tags) ? row.topic_tags : []
        });
    }
    return out;
}

async function loadWatchedSet(
    sb: SupabaseClient,
    workspaceId: string
): Promise<Set<string>> {
    const watched = new Set<string>();
    await Promise.all([
        loadFromWatchlistEntities(sb, workspaceId, watched),
        loadFromSignalConsoleAccounts(sb, workspaceId, watched),
        loadFromArmedTriggers(sb, workspaceId, watched)
    ]);
    return watched;
}

async function loadFromWatchlistEntities(
    sb: SupabaseClient,
    workspaceId: string,
    out: Set<string>
): Promise<void> {
    const r = await sb
        .from("briefing_watchlist_entities")
        .select("entity_name, entity_aliases")
        .eq("workspace_id", workspaceId)
        .eq("status", "watched");
    if (r.error || !r.data) return;
    for (const row of r.data as Array<any>) {
        if (typeof row.entity_name === "string" && row.entity_name.length > 0) {
            out.add(normalizeEntity(row.entity_name));
        }
        if (Array.isArray(row.entity_aliases)) {
            for (const a of row.entity_aliases) {
                if (typeof a === "string" && a.length > 0) out.add(normalizeEntity(a));
            }
        }
    }
}

async function loadFromSignalConsoleAccounts(
    sb: SupabaseClient,
    workspaceId: string,
    out: Set<string>
): Promise<void> {
    const r = await sb
        .from("signal_console_accounts")
        .select("account_name")
        .eq("workspace_id", workspaceId);
    if (r.error || !r.data) return;
    for (const row of r.data as Array<any>) {
        if (typeof row.account_name === "string" && row.account_name.length > 0) {
            out.add(normalizeEntity(row.account_name));
        }
    }
}

async function loadFromArmedTriggers(
    sb: SupabaseClient,
    workspaceId: string,
    out: Set<string>
): Promise<void> {
    const r = await sb
        .from("briefing_watchlist_triggers")
        .select("parsed_query")
        .eq("workspace_id", workspaceId)
        .neq("status", "disabled");
    if (r.error || !r.data) return;
    for (const row of r.data as Array<any>) {
        const q = row.parsed_query;
        if (!q || typeof q !== "object") continue;
        const target = q.target;
        if (!target || typeof target !== "object") continue;
        if (target.type === "company" && typeof target.name === "string" && target.name.length > 0) {
            out.add(normalizeEntity(target.name));
        } else if (target.type === "companies" && Array.isArray(target.names)) {
            for (const n of target.names) {
                if (typeof n === "string" && n.length > 0) out.add(normalizeEntity(n));
            }
        }
    }
}
