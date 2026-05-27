/**
 * Stage 3.3.5 — Watchlist Trigger matching (B.3a).
 *
 * Runs between Enrich and Cluster. Loads the workspace's armed triggers
 * and evaluates the item-based types against this run's enriched items:
 *
 *   single_event — fires when a NEW matching item appears this run
 *                  (respecting fire_once + cooldown_days).
 *   adjacency    — fires once per run (digest) over this run's matches.
 *   aggregation  — counts matching items across the window (cross-run)
 *                  and fires at min_count (respecting fire_once_per_window).
 *
 * threshold + silence are "surface stage" types that need metric history
 * / activity logs the pipeline doesn't yet maintain — they're loaded but
 * reported as skipped until those sources mature (B.4+).
 *
 * Each fire writes a briefing_trigger_fires row + bumps the trigger
 * (last_fired_at, fire_count, status). Pure matching logic lives in
 * _shared.ts (mirrored from the vitest-tested canonical).
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    type AdjacencyQuery,
    type AggregationQuery,
    type MatchableItem,
    type SingleEventQuery,
    type TriggerParsedQuery,
    aggregationFires,
    aggregationItemMatches,
    matchAdjacency,
    matchSingleEvent,
    withinWindow
} from "./_shared.ts";

export interface TriggerRunResult {
    readonly evaluated: number;
    readonly fired: number;
    readonly skipped: number;
    readonly perTrigger: ReadonlyArray<{
        readonly trigger_id: string;
        readonly trigger_type: string;
        readonly outcome: "fired" | "no_match" | "skipped" | "error";
        readonly detail: string;
    }>;
}

interface TriggerRow {
    id: string;
    trigger_type: string;
    parsed_query: TriggerParsedQuery | null;
    status: string;
    last_fired_at: string | null;
    fire_count: number;
}

interface NamedItem extends MatchableItem {
    readonly title: string;
}

const ITEM_LOOKBACK_DAYS = 90;
const ITEM_CAP = 500;

export async function runTriggers(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    nowIso: string
): Promise<TriggerRunResult> {
    const triggers = await loadArmedTriggers(sb, workspaceId);
    if (triggers.length === 0) {
        return { evaluated: 0, fired: 0, skipped: 0, perTrigger: [] };
    }

    const thisRunItems = await loadItems(sb, workspaceId, { runId });
    const recentItems = await loadItems(sb, workspaceId, { sinceDays: ITEM_LOOKBACK_DAYS });

    const perTrigger: Array<{
        trigger_id: string;
        trigger_type: string;
        outcome: "fired" | "no_match" | "skipped" | "error";
        detail: string;
    }> = [];
    let fired = 0;
    let skipped = 0;

    for (const t of triggers) {
        const q = t.parsed_query;
        if (!q || typeof q !== "object") {
            skipped += 1;
            perTrigger.push({ trigger_id: t.id, trigger_type: t.trigger_type, outcome: "skipped", detail: "no parsed_query" });
            continue;
        }

        try {
            if (q.type === "single_event") {
                const r = await evalSingleEvent(sb, runId, workspaceId, t, q, thisRunItems, nowIso);
                perTrigger.push({ trigger_id: t.id, trigger_type: t.trigger_type, ...r });
                if (r.outcome === "fired") fired += 1;
            } else if (q.type === "adjacency") {
                const r = await evalAdjacency(sb, runId, workspaceId, t, q, thisRunItems, nowIso);
                perTrigger.push({ trigger_id: t.id, trigger_type: t.trigger_type, ...r });
                if (r.outcome === "fired") fired += 1;
            } else if (q.type === "aggregation") {
                const r = await evalAggregation(sb, runId, workspaceId, t, q, recentItems, nowIso);
                perTrigger.push({ trigger_id: t.id, trigger_type: t.trigger_type, ...r });
                if (r.outcome === "fired") fired += 1;
            } else {
                // threshold / silence — need metric/activity sources (B.4+).
                skipped += 1;
                perTrigger.push({
                    trigger_id: t.id,
                    trigger_type: t.trigger_type,
                    outcome: "skipped",
                    detail: `${q.type} evaluated at surface stage; metric/activity source not wired yet`
                });
            }
        } catch (err) {
            perTrigger.push({
                trigger_id: t.id,
                trigger_type: t.trigger_type,
                outcome: "error",
                detail: err instanceof Error ? err.message : String(err)
            });
        }
    }

    return {
        evaluated: triggers.length,
        fired,
        skipped,
        perTrigger
    };
}

function daysBetween(aIso: string, bIso: string): number {
    const a = new Date(aIso).getTime();
    const b = new Date(bIso).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
    return Math.abs(b - a) / (24 * 60 * 60 * 1000);
}

async function evalSingleEvent(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    t: TriggerRow,
    q: SingleEventQuery,
    items: ReadonlyArray<NamedItem>,
    nowIso: string
): Promise<{ outcome: "fired" | "no_match" | "skipped"; detail: string }> {
    if (q.fire_once && t.last_fired_at) {
        return { outcome: "skipped", detail: "fire_once already fired" };
    }
    if (q.cooldown_days && t.last_fired_at && daysBetween(t.last_fired_at, nowIso) < q.cooldown_days) {
        return { outcome: "skipped", detail: `within ${q.cooldown_days}d cooldown` };
    }
    const matches = items.filter((i) => matchSingleEvent(i, q));
    if (matches.length === 0) return { outcome: "no_match", detail: "no matching items this run" };
    const summary = summarize(`${targetLabel(q)} — ${q.event.category}`, matches);
    await recordFire(sb, runId, workspaceId, t, matches, summary, nowIso);
    return { outcome: "fired", detail: summary };
}

async function evalAdjacency(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    t: TriggerRow,
    q: AdjacencyQuery,
    items: ReadonlyArray<NamedItem>,
    nowIso: string
): Promise<{ outcome: "fired" | "no_match" | "skipped"; detail: string }> {
    const matches = items.filter((i) => matchAdjacency(i, q));
    if (matches.length === 0) return { outcome: "no_match", detail: "no matching items this run" };
    // Digest: one fire per run summarizing the matches.
    const summary = summarize(`${targetLabel(q)} — activity`, matches);
    await recordFire(sb, runId, workspaceId, t, matches, summary, nowIso);
    return { outcome: "fired", detail: summary };
}

async function evalAggregation(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    t: TriggerRow,
    q: AggregationQuery,
    recentItems: ReadonlyArray<NamedItem>,
    nowIso: string
): Promise<{ outcome: "fired" | "no_match" | "skipped"; detail: string }> {
    const windowDays = q.window_days > 0 ? q.window_days : 30;
    const fireOncePerWindow = q.fire_once_per_window !== false; // default true
    if (fireOncePerWindow && t.last_fired_at && daysBetween(t.last_fired_at, nowIso) < windowDays) {
        return { outcome: "skipped", detail: `already fired within the ${windowDays}d window` };
    }
    const matches = recentItems.filter(
        (i) => aggregationItemMatches(i, q) && withinWindow(i, windowDays, nowIso)
    );
    const { count, fires } = aggregationFires(matches, q);
    if (!fires) {
        return { outcome: "no_match", detail: `${count}/${q.min_count} in ${windowDays}d window` };
    }
    const summary = summarize(
        `${count} ${q.event.category} events across the set in ${windowDays}d`,
        matches
    );
    await recordFire(sb, runId, workspaceId, t, matches, summary, nowIso);
    return { outcome: "fired", detail: summary };
}

function targetLabel(q: { target?: { type: string; name?: string; names?: ReadonlyArray<string>; category_descriptor?: string } }): string {
    const tgt = q.target;
    if (!tgt || tgt.type === "any") return "Anything";
    if (tgt.type === "company") return tgt.name ?? "company";
    if (tgt.type === "companies") return (tgt.names ?? []).join(" / ");
    if (tgt.type === "category") return tgt.category_descriptor ?? "category";
    return "target";
}

function summarize(prefix: string, matches: ReadonlyArray<NamedItem>): string {
    const first = matches[0]?.title ?? "";
    const extra = matches.length > 1 ? ` (+${matches.length - 1} more)` : "";
    return first ? `${prefix}: ${first}${extra}` : `${prefix} (${matches.length} item${matches.length === 1 ? "" : "s"})`;
}

async function recordFire(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    t: TriggerRow,
    matches: ReadonlyArray<NamedItem>,
    summary: string,
    nowIso: string
): Promise<void> {
    const evidenceIds = Array.from(new Set(matches.map((m) => m.enriched_id)));
    const insert = await sb.from("briefing_trigger_fires").insert({
        trigger_id: t.id,
        workspace_id: workspaceId,
        run_id: runId,
        fired_at: nowIso,
        evidence_item_ids: evidenceIds,
        summary,
        data: { matched_count: matches.length }
    });
    if (insert.error) {
        console.error("[briefing-triggers] fire insert failed:", { trigger_id: t.id, error: insert.error });
        return;
    }
    await sb
        .from("briefing_watchlist_triggers")
        .update({
            last_fired_at: nowIso,
            fire_count: t.fire_count + 1,
            status: "fired_today"
        })
        .eq("id", t.id)
        .eq("workspace_id", workspaceId);
}

async function loadArmedTriggers(sb: SupabaseClient, workspaceId: string): Promise<TriggerRow[]> {
    const result = await sb
        .from("briefing_watchlist_triggers")
        .select("id, trigger_type, parsed_query, status, last_fired_at, fire_count")
        .eq("workspace_id", workspaceId)
        .neq("status", "disabled");
    if (result.error) {
        console.error("[briefing-triggers] trigger query failed:", result.error);
        return [];
    }
    return (result.data ?? []) as TriggerRow[];
}

async function loadItems(
    sb: SupabaseClient,
    workspaceId: string,
    scope: { runId?: string; sinceDays?: number }
): Promise<NamedItem[]> {
    let query = sb
        .from("briefing_enriched_items")
        .select(
            "id, entities, exec_move, event_category, topic_tags, user_relevance_score, summary, what_changed, is_noise, raw_item:briefing_raw_items!inner(title, published_date)"
        )
        .eq("workspace_id", workspaceId)
        .eq("is_noise", false)
        .order("created_at", { ascending: false })
        .limit(ITEM_CAP);
    if (scope.runId) {
        query = query.eq("run_id", scope.runId);
    } else if (scope.sinceDays) {
        const since = new Date(Date.now() - scope.sinceDays * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", since);
    }
    const result = await query;
    if (result.error) {
        console.error("[briefing-triggers] enriched_items query failed:", result.error);
        return [];
    }
    const rows = (result.data ?? []) as Array<any>;
    const items: NamedItem[] = [];
    for (const row of rows) {
        const raw = Array.isArray(row.raw_item) ? row.raw_item[0] : row.raw_item;
        const entities = row.entities ?? {};
        const companies = Array.isArray(entities.companies)
            ? entities.companies.filter((c: unknown): c is string => typeof c === "string")
            : [];
        const exec = row.exec_move && typeof row.exec_move === "object" ? row.exec_move : null;
        const text = `${row.summary ?? ""} ${row.what_changed ?? ""}`.toLowerCase();
        items.push({
            enriched_id: row.id,
            companies,
            exec_move_company: exec && typeof exec.company === "string" ? exec.company : null,
            exec_move_role: exec && typeof exec.new_role === "string" ? exec.new_role : null,
            event_category: String(row.event_category ?? "other"),
            topic_tags: Array.isArray(row.topic_tags) ? row.topic_tags : [],
            user_relevance_score: typeof row.user_relevance_score === "number" ? row.user_relevance_score : 0.5,
            text,
            published_date: raw?.published_date ?? null,
            title: raw && typeof raw.title === "string" ? raw.title : ""
        });
    }
    return items;
}
