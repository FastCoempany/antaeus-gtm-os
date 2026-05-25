/**
 * Stage 3.4 Cluster (B.2b).
 *
 * Loads this-workspace's enriched items (joined to raw_items for
 * source_id + dates), groups them into candidate clusters across the
 * three build-plan axes, evaluates each against the weighted-evidence
 * + qualification rules, and persists qualifying clusters to
 * briefing_clusters.
 *
 * Trajectory tracking: for each qualifying cluster, look up the most
 * recent prior cluster of the same (workspace, type, anchor). If one
 * exists, link it via parent_cluster_id and compute trajectory by
 * comparing weighted_evidence (rising / stable / declining). First-
 * time clusters get trajectory=null.
 *
 * Idempotency: a cluster row is keyed by (run_id, type, anchor) at
 * the application level (we delete this-run's clusters before
 * re-inserting, so a re-run produces the same set without
 * duplication).
 *
 * Failure isolation: per-cluster persistence failures are logged +
 * skipped; the stage completes with whatever persisted.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    type ClusterableItem,
    type ClusterEvaluation,
    clusterItems
} from "./_shared.ts";

export interface ClusterResult {
    readonly considered: number;
    readonly qualified: number;
    readonly persisted: number;
    readonly perCluster: ReadonlyArray<{
        readonly cluster_type: string;
        readonly anchor: string;
        readonly weighted_evidence: number;
        readonly qualifies: boolean;
        readonly trajectory: string | null;
        readonly reason: string;
    }>;
}

interface HydratedContextLike {
    readonly watchlist_companies?: ReadonlyArray<string>;
    readonly icp?: unknown;
    readonly active_deals?: unknown;
}

export async function runCluster(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    ctx: HydratedContextLike,
    nowIso: string
): Promise<ClusterResult> {
    const items = await loadClusterableItems(sb, workspaceId);
    if (items.length === 0) {
        return { considered: 0, qualified: 0, persisted: 0, perCluster: [] };
    }

    const workspaceConfigured = isWorkspaceConfigured(ctx);
    const evaluations = clusterItems(items, { nowIso, workspaceConfigured });

    // Clear this-run's clusters so a re-run is idempotent.
    await sb
        .from("briefing_clusters")
        .delete()
        .eq("run_id", runId)
        .eq("workspace_id", workspaceId);

    const perCluster: Array<{
        cluster_type: string;
        anchor: string;
        weighted_evidence: number;
        qualifies: boolean;
        trajectory: string | null;
        reason: string;
    }> = [];
    let persisted = 0;

    for (const evaluation of evaluations) {
        let trajectory: string | null = null;
        if (evaluation.qualifies) {
            const persistResult = await persistCluster(
                sb,
                runId,
                workspaceId,
                evaluation,
                nowIso
            );
            trajectory = persistResult.trajectory;
            if (persistResult.persisted) persisted += 1;
        }
        perCluster.push({
            cluster_type: evaluation.cluster_type,
            anchor: evaluation.anchor,
            weighted_evidence: Math.round(evaluation.weighted_evidence * 10000) / 10000,
            qualifies: evaluation.qualifies,
            trajectory,
            reason: evaluation.reason
        });
    }

    return {
        considered: evaluations.length,
        qualified: evaluations.filter((e) => e.qualifies).length,
        persisted,
        perCluster
    };
}

async function persistCluster(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    evaluation: ClusterEvaluation,
    nowIso: string
): Promise<{ persisted: boolean; trajectory: string | null }> {
    // Trajectory: find the most recent prior cluster of the same
    // (workspace, type, anchor) from a DIFFERENT run.
    const prior = await sb
        .from("briefing_clusters")
        .select("id, weighted_evidence")
        .eq("workspace_id", workspaceId)
        .eq("cluster_type", evaluation.cluster_type)
        .eq("anchor", evaluation.anchor)
        .neq("run_id", runId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    let trajectory: string | null = null;
    let parentClusterId: string | null = null;
    if (!prior.error && prior.data) {
        parentClusterId = (prior.data as { id: string }).id;
        const priorEvidence =
            typeof prior.data.weighted_evidence === "number"
                ? prior.data.weighted_evidence
                : 0;
        trajectory = computeTrajectory(priorEvidence, evaluation.weighted_evidence);
    }

    const insert = await sb.from("briefing_clusters").insert({
        run_id: runId,
        workspace_id: workspaceId,
        cluster_type: evaluation.cluster_type,
        anchor: evaluation.anchor,
        item_ids: evaluation.items.map((i) => i.enriched_id),
        weighted_evidence: Math.round(evaluation.weighted_evidence * 10000) / 10000,
        trajectory,
        parent_cluster_id: parentClusterId,
        data: {
            distinct_sources: evaluation.distinct_sources,
            distinct_accounts: evaluation.distinct_accounts,
            max_relevance: evaluation.max_relevance,
            reason: evaluation.reason,
            clustered_at: nowIso
        }
    });

    if (insert.error) {
        console.error("[briefing-cluster] persist failed:", {
            runId,
            workspaceId,
            cluster_type: evaluation.cluster_type,
            anchor: evaluation.anchor,
            error: insert.error
        });
        return { persisted: false, trajectory };
    }
    return { persisted: true, trajectory };
}

function computeTrajectory(prior: number, current: number): string {
    // 15% band around the prior value counts as "stable".
    const band = prior * 0.15;
    if (current > prior + band) return "rising";
    if (current < prior - band) return "declining";
    return "stable";
}

/**
 * Load enriched items joined to their raw_items for clustering. The
 * source_id + published_date + fetched_at live on raw_items; the
 * enrichment fields on briefing_enriched_items. We over-pull recent
 * items so cross-run clusters can form (an item enriched last week
 * can still join this week's cluster).
 */
async function loadClusterableItems(
    sb: SupabaseClient,
    workspaceId: string
): Promise<ReadonlyArray<ClusterableItem>> {
    // Supabase embedded select: pull enriched_items + the joined
    // raw_item's source_id / published_date / fetched_at.
    const result = await sb
        .from("briefing_enriched_items")
        .select(
            "id, entities, exec_move, event_category, topic_tags, pain_tags, user_relevance_score, is_noise, raw_item:briefing_raw_items!inner(source_id, published_date, fetched_at)"
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(500);

    if (result.error) {
        console.error("[briefing-cluster] enriched_items query failed:", result.error);
        return [];
    }

    const rows = (result.data ?? []) as Array<any>;
    const items: ClusterableItem[] = [];
    for (const row of rows) {
        const raw = Array.isArray(row.raw_item) ? row.raw_item[0] : row.raw_item;
        if (!raw) continue;
        const entities = row.entities ?? {};
        const companies = Array.isArray(entities.companies)
            ? entities.companies.filter((c: unknown): c is string => typeof c === "string")
            : [];
        const execMoveCompany =
            row.exec_move && typeof row.exec_move === "object" && typeof row.exec_move.company === "string"
                ? row.exec_move.company
                : null;
        items.push({
            enriched_id: row.id,
            source_id: String(raw.source_id ?? ""),
            published_date: raw.published_date ?? null,
            fetched_at: raw.fetched_at ?? new Date().toISOString(),
            companies,
            exec_move_company: execMoveCompany,
            event_category: String(row.event_category ?? "other"),
            topic_tags: Array.isArray(row.topic_tags) ? row.topic_tags : [],
            pain_tags: Array.isArray(row.pain_tags) ? row.pain_tags : [],
            user_relevance_score:
                typeof row.user_relevance_score === "number" ? row.user_relevance_score : 0.5,
            is_noise: row.is_noise === true
        });
    }
    return items;
}

function isWorkspaceConfigured(ctx: HydratedContextLike): boolean {
    const hasWatchlist =
        Array.isArray(ctx.watchlist_companies) && ctx.watchlist_companies.length > 0;
    const hasIcp = ctx.icp !== null && ctx.icp !== undefined;
    const dealsRoot =
        ctx.active_deals && typeof ctx.active_deals === "object"
            ? (ctx.active_deals as { deals?: unknown }).deals
            : null;
    const hasDeals = Array.isArray(dealsRoot) && dealsRoot.length > 0;
    return hasWatchlist || hasIcp || hasDeals;
}
