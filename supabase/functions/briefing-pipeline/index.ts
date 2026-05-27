/**
 * Briefing pipeline Edge Function (B.1a).
 *
 * The orchestrator for the Recipe Layer pipeline. Wakes up on the
 * weekly cron (Monday 06:00 UTC) or a manual POST, enumerates active
 * workspaces, and runs each one through Stages 3.0 → 3.1 → 3.2.
 * Subsequent stages (3.3 Enrich, 3.4 Cluster, 3.5 Synthesize, …)
 * graduate in B.2 and beyond.
 *
 * Source registry: populated by B.1b + B.1c. All six fetchers
 * active — HN Algolia, TechCrunch RSS, PR Newswire personnel,
 * Wikipedia pageviews, GitHub releases atom, and HTML diff (B.1c
 * added the sixth with its own snapshot table briefing_html_snapshots).
 *
 * Context hydration: server-side stub returns "uninitialized" for
 * every module today — mirroring the client adapter shells from
 * B.0c. Each per-room adapter graduates to a real read (Supabase
 * row query) as that room hits ADR-005 Step 5; the contract surface
 * stays stable. Until then, the three watchlist-driven fetchers
 * (HN Algolia, Wikipedia pageviews, GitHub releases atom) gracefully
 * return zero items because the HydratedContext carries no query
 * terms / articles / repos to act on. The two firehose-style
 * fetchers (TechCrunch RSS, PR Newswire) return real items every
 * run regardless of HydratedContext.
 *
 * What B.1a verifies end-to-end:
 *   - The function authenticates with the service-role key (same
 *     pattern as the heartbeat).
 *   - Active workspaces are enumerated by recent session OR
 *     observation activity (canonical 7-day window).
 *   - A `briefing_runs` row is created per workspace per invocation,
 *     transitions through pending → hydrating → ingesting → filtering
 *     → complete, with a per-stage entry in `stage_log` (or
 *     terminates as `failed` with the error captured).
 *   - Stage 3.0 produces a HydratedContext (all uninitialized today).
 *   - Stage 3.1 dispatches the empty source registry, returns zero
 *     raw items, no duplicates to dedupe against.
 *   - Stage 3.2 evaluates filter rules over zero items (vacuously
 *     true) and records the (empty) decisions.
 *
 * Runtime: Deno (Supabase Edge Functions). NOT shared with the
 * Node-flavored src/ tree — types are duplicated here on purpose so
 * the function is fully self-contained. Mirrors the heartbeat
 * pattern at supabase/functions/heartbeat/index.ts.
 *
 * Schedule: pg_cron job in supabase/migrations/20260524000000_*.sql
 * (commented out by default — founder uncomments after deploy +
 * Vault setup, same as heartbeat).
 *
 * Auth: invoked by pg_cron via net.http_post with the service-role
 * key in the Authorization header. The function uses the service-
 * role key to create its own Supabase client (bypasses RLS — required
 * since the briefing tables are workspace-scoped and the cron runs
 * cross-workspace).
 *
 * Manual invocation:
 *   curl -X POST \
 *     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{}' \
 *     https://<project-ref>.supabase.co/functions/v1/briefing-pipeline
 *
 *   Optional body: { "workspaceId": "<uuid>" } targets one workspace.
 *
 * Error handling: per-workspace errors are caught + logged + the
 * run row is marked `failed` with the error captured. One workspace's
 * failure doesn't block the others.
 *
 * Ref: deliverables/specs/briefing/01-build-phase-plan.md §B.1
 * Ref: deliverables/specs/briefing/signal_console_recipe_layer_spec_v0.4.md §3
 * Ref: deliverables/adr/adr-006-briefing-room-2026-05-23.md
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore - Deno URL import; resolved at deploy time
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ALL_SOURCES } from "./sources/index.ts";
import { runEnrich } from "./llm/enrich.ts";
import { runCluster } from "./cluster/cluster.ts";
import { runSynthesis } from "./llm/synthesis.ts";
import { runTriggers } from "./triggers/runner.ts";
import { callAnthropic } from "./llm/anthropic.ts";
import {
    TRIGGER_PARSE_PROMPT_VERSION,
    TRIGGER_PARSE_SYSTEM_PROMPT,
    buildTriggerParsePrompt,
    parseDisposition,
    parseTriggerResponse
} from "./triggers/_shared.ts";

// ─── Run-lifecycle status enum ─────────────────────────────────

/**
 * Mirrors the check constraint on `public.briefing_runs.status` from
 * migration 20260523180000. The full enum includes downstream stages
 * (enriching / clustering / synthesizing / scoring / composing /
 * surfacing) that B.1a doesn't touch; B.2+ uses them as it lights up.
 */
type RunStatus =
    | "pending"
    | "hydrating"
    | "ingesting"
    | "filtering"
    | "enriching"
    | "clustering"
    | "synthesizing"
    | "scoring"
    | "composing"
    | "surfacing"
    | "complete"
    | "failed"
    | "aborted";

interface StageLogEntry {
    readonly stage:
        | "hydrate"
        | "ingest"
        | "filter"
        | "enrich"
        | "triggers"
        | "cluster"
        | "synthesize";
    readonly started_at: string;
    readonly ended_at: string;
    readonly duration_ms: number;
    readonly outcome: "ok" | "error";
    readonly notes: string;
    /**
     * Optional per-stage detail. Currently used by the ingest stage
     * to surface `perSource[]` with per-fetcher status (fetched
     * count + error message if any). Lets the founder diagnose
     * per-source failures from the curl response without diving
     * into Edge Function logs.
     */
    readonly data?: Record<string, unknown>;
}

// ─── Stage 3.0 — Context Hydration (server-side stub) ──────────

/**
 * Server-side mirror of the client adapter contract from
 * src/briefing/lib/contracts.ts. B.1a returns uninitialized for every
 * module — same shape, no data. Real per-room reads land as each
 * adapter graduates (ADR-005 Step 5 for the migrated rooms, or a
 * legacy localStorage→Supabase mirror for those still on-disk).
 *
 * Why duplicated here: Deno Edge Functions can't import from the
 * src/ tree (different runtime). Both the client shells and this
 * server stub conform to the same JSON shape — anything that
 * round-trips through `briefing_runs.data.hydrated_context` reads
 * identically on both sides.
 */
interface ModuleReadResult {
    readonly module: string;
    readonly read_at: string;
    readonly health: "ok" | "degraded" | "uninitialized" | "error";
    readonly schema_version: string;
    readonly last_modified_at: string | null;
    readonly read_duration_ms: number;
    readonly error_message: string | null;
}

interface HydratedContext {
    readonly context_id: string;
    readonly user_id: string;
    readonly workspace_id: string;
    readonly hydrated_at: string;
    readonly modules_read: ReadonlyArray<ModuleReadResult>;
    readonly icp: unknown;
    readonly discovery: unknown;
    readonly call_planner: unknown;
    readonly outbound: unknown;
    readonly asset_builder: unknown;
    readonly active_deals: unknown;
    readonly watchlist_triggers: unknown;
    readonly voice_document: unknown;
    readonly behavioral_feedback: unknown;
    /** ADR-007 commercial identity — what we sell. Seeds category relevance. */
    readonly commercial_profile: {
        product_category: string | null;
        what_we_sell: string | null;
        value_prop: string | null;
    } | null;
    readonly watchlist_companies: ReadonlyArray<string>;
    readonly pain_lib: ReadonlyArray<unknown>;
}

const MODULES: ReadonlyArray<ModuleReadResult["module"]> = [
    "icp_studio",
    "discovery_studio",
    "call_planner",
    "outbound_studio",
    "asset_builder",
    "active_deals",
    "watchlist_triggers",
    "voice_document",
    "behavioral_feedback"
];

/**
 * Stage 3.0 Context Hydration (ADR-007, PR 5 — real reads).
 *
 * Reads the commercial-identity layer from Supabase and derives the
 * seed the pipeline acts on:
 *   - workspace_profile  → commercial profile (what we sell)
 *   - icps               → ICP body (industries, buyers)
 *   - signal_console_accounts WHERE relationship_type='competitor'
 *                        → competitor names
 *
 * watchlist_companies = competitors + ICP industries, which is what
 * the watchlist-driven sources (HN Algolia, Wikipedia, GitHub) query
 * on. With real data here, those sources activate + enrichment becomes
 * category-specific.
 *
 * The derivation mirrors src/briefing/lib/seed-derivation.ts (the
 * vitest-tested canonical reference). The reads run with the service
 * role, so each query filters by workspace_id explicitly (RLS is
 * bypassed cross-workspace).
 *
 * Modules still unwired server-side (Discovery, Call Planner, Outbound,
 * Asset Builder, Watchlist Triggers, Voice Document, Behavioral
 * Feedback) report uninitialized. Discovery's objection library lives
 * in client-side framework runtime data, not Supabase — a future sync
 * path (ADR-007 §4) brings it server-side. Never throws; a failed read
 * degrades that slice to empty + the run proceeds.
 */
async function hydrateContext(
    sb: SupabaseClient,
    workspaceId: string,
    now: string
): Promise<HydratedContext> {
    let profileRow: {
        product_category: string | null;
        what_we_sell: string | null;
        value_prop: string | null;
    } | null = null;
    let icpRows: Array<{
        industry: string | null;
        primary_buyer: string | null;
        statement: string | null;
        company_size: string | null;
        geography: string | null;
        pain_point: string | null;
    }> = [];
    let competitorNames: string[] = [];
    const errors: Record<string, string> = {};

    try {
        const res = await sb
            .from("workspace_profile")
            .select("product_category, what_we_sell, value_prop")
            .eq("workspace_id", workspaceId)
            .limit(1);
        if (res.error) errors["workspace_profile"] = res.error.message;
        else if (res.data && res.data[0]) profileRow = res.data[0] as any;
    } catch (err) {
        errors["workspace_profile"] = err instanceof Error ? err.message : String(err);
    }

    try {
        const res = await sb
            .from("icps")
            .select("industry, primary_buyer, statement, company_size, geography, pain_point")
            .eq("workspace_id", workspaceId);
        if (res.error) errors["icps"] = res.error.message;
        else icpRows = (res.data ?? []) as any[];
    } catch (err) {
        errors["icps"] = err instanceof Error ? err.message : String(err);
    }

    try {
        const res = await sb
            .from("signal_console_accounts")
            .select("account_name")
            .eq("workspace_id", workspaceId)
            .eq("relationship_type", "competitor");
        if (res.error) errors["competitors"] = res.error.message;
        else {
            competitorNames = (res.data ?? [])
                .map((r: any) => (typeof r.account_name === "string" ? r.account_name : null))
                .filter((n: string | null): n is string => !!n && n.trim().length > 0);
        }
    } catch (err) {
        errors["competitors"] = err instanceof Error ? err.message : String(err);
    }

    const seed = deriveBriefingSeed({ profile: profileRow, icpRows, competitorNames });

    const modules_read: ModuleReadResult[] = MODULES.map((module) => {
        // icp_studio reflects the commercial profile + ICP rows we just
        // read; everything else stays uninitialized until wired.
        const health =
            module === "icp_studio"
                ? seed.icp_health === "ok" || seed.profile_health === "ok"
                    ? "ok"
                    : "uninitialized"
                : "uninitialized";
        const errMsg =
            module === "icp_studio"
                ? errors["workspace_profile"] ?? errors["icps"] ?? null
                : null;
        return {
            module,
            read_at: now,
            health: errMsg ? "error" : (health as ModuleReadResult["health"]),
            schema_version: "1.0",
            last_modified_at: null,
            read_duration_ms: 0,
            error_message: errMsg
        };
    });

    return {
        context_id: `ctx_${crypto.randomUUID()}`,
        user_id: "default",
        workspace_id: workspaceId,
        hydrated_at: now,
        modules_read,
        icp: seed.icp,
        discovery: null,
        call_planner: null,
        outbound: null,
        asset_builder: null,
        active_deals: null,
        watchlist_triggers: null,
        voice_document: null,
        behavioral_feedback: null,
        commercial_profile: seed.commercial_profile,
        watchlist_companies: seed.watchlist_companies,
        pain_lib: []
    };
}

// ─── Briefing seed derivation (mirror of src/briefing/lib/seed-derivation.ts) ─

interface SeedInput {
    profile: {
        product_category: string | null;
        what_we_sell: string | null;
        value_prop: string | null;
    } | null;
    icpRows: ReadonlyArray<{
        industry: string | null;
        primary_buyer: string | null;
        statement: string | null;
        company_size: string | null;
        geography: string | null;
        pain_point: string | null;
    }>;
    competitorNames: ReadonlyArray<string>;
}

function deriveBriefingSeed(input: SeedInput): {
    commercial_profile: {
        product_category: string | null;
        what_we_sell: string | null;
        value_prop: string | null;
    } | null;
    icp: {
        icp_summary: string;
        target_industries: string[];
        decision_maker_titles: string[];
        geographies: string[];
        pains: string[];
    } | null;
    watchlist_companies: string[];
    icp_health: "ok" | "uninitialized";
    profile_health: "ok" | "uninitialized";
} {
    const clean = (v: string | null | undefined): string | null => {
        if (typeof v !== "string") return null;
        const t = v.trim();
        return t.length > 0 ? t : null;
    };
    const uniqueNonEmpty = (values: ReadonlyArray<string | null>): string[] => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const v of values) {
            const c = clean(v);
            if (c === null) continue;
            const key = c.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(c);
        }
        return out;
    };

    const pc = clean(input.profile?.product_category);
    const ws = clean(input.profile?.what_we_sell);
    const vp = clean(input.profile?.value_prop);
    const hasProfile = pc !== null || ws !== null || vp !== null;
    const commercial_profile = hasProfile
        ? { product_category: pc, what_we_sell: ws, value_prop: vp }
        : null;

    const industries = uniqueNonEmpty(input.icpRows.map((r) => r.industry));
    const buyers = uniqueNonEmpty(input.icpRows.map((r) => r.primary_buyer));
    const geographies = uniqueNonEmpty(input.icpRows.map((r) => r.geography));
    const pains = uniqueNonEmpty(input.icpRows.map((r) => r.pain_point));
    const statements = uniqueNonEmpty(input.icpRows.map((r) => r.statement));
    const icpSummary =
        statements[0] ??
        (industries.length > 0
            ? `B2B ${industries[0]}${buyers.length > 0 ? ` selling to ${buyers[0]}` : ""}`
            : "");
    const hasIcp =
        industries.length > 0 || buyers.length > 0 || icpSummary.length > 0;
    const icp = hasIcp
        ? {
              icp_summary: icpSummary,
              target_industries: industries,
              decision_maker_titles: buyers,
              geographies,
              pains
          }
        : null;

    const watchlist_companies = uniqueNonEmpty([
        ...input.competitorNames,
        ...industries
    ]);

    return {
        commercial_profile,
        icp,
        watchlist_companies,
        icp_health: hasIcp ? "ok" : "uninitialized",
        profile_health: hasProfile ? "ok" : "uninitialized"
    };
}

// ─── Stage 3.1 — Ingest ────────────────────────────────────────

interface RawItem {
    readonly source_id: string;
    readonly external_id: string;
    readonly title: string;
    readonly body: string | null;
    readonly url: string | null;
    readonly published_date: string | null;
    readonly data: Record<string, unknown>;
}

/**
 * Each source's fetch returns an envelope, not a bare array, so per-
 * source failures surface upstream as structured data instead of
 * console.warn'd into the void. `error` is null when the fetch
 * succeeded (even if the result was an intentional empty array, e.g.
 * a watchlist-driven fetcher with no watchlist terms to act on);
 * `error` is a string when the fetcher saw a non-200 HTTP response,
 * parse failure, or other recoverable problem. If a fetcher throws,
 * Promise.allSettled in the dispatch captures it as a rejection +
 * the orchestrator records its own error message — that's reserved
 * for truly unexpected failures.
 */
interface FetchResult {
    readonly items: ReadonlyArray<RawItem>;
    readonly error: string | null;
}

interface SourceFetcher {
    readonly id: string;
    /**
     * The optional `sb` arg lets stateful fetchers (HTML diff is the
     * only one today) read + write their own state tables. Pure HTTP
     * fetchers ignore it. TypeScript treats `(ctx, now) => ...` as
     * assignable to `(ctx, now, sb?) => ...` so existing fetchers
     * don't need a signature change.
     */
    readonly fetch: (
        ctx: HydratedContext,
        now: string,
        sb?: SupabaseClient
    ) => Promise<FetchResult>;
}

/**
 * Source registry — populated by B.1b. Each fetcher is registered in
 * supabase/functions/briefing-pipeline/sources/index.ts. The HTML
 * diff source (sixth on the original B.1 list) ships in a B.1c
 * follow-up — it needs a schema decision about where to store prior
 * snapshots that's out of B.1b scope.
 *
 * Each source's fetch() is called once per pipeline run, in parallel
 * with the others via Promise.allSettled (per-source failures don't
 * fail the pipeline).
 */
const SOURCE_REGISTRY: ReadonlyArray<SourceFetcher> = ALL_SOURCES;

async function runIngest(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    ctx: HydratedContext,
    now: string
): Promise<{
    fetched: number;
    inserted: number;
    deduped: number;
    perSource: Array<{ source: string; fetched: number; error: string | null }>;
}> {
    if (SOURCE_REGISTRY.length === 0) {
        return { fetched: 0, inserted: 0, deduped: 0, perSource: [] };
    }

    const results = await Promise.allSettled(
        SOURCE_REGISTRY.map(async (source) => {
            const fetchResult = await source.fetch(ctx, now, sb);
            return {
                source: source.id,
                items: fetchResult.items,
                error: fetchResult.error
            };
        })
    );

    const perSource: Array<{
        source: string;
        fetched: number;
        error: string | null;
    }> = [];
    const allItems: Array<{ source: string; item: RawItem }> = [];

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const source = SOURCE_REGISTRY[i];
        if (!result || !source) continue;
        if (result.status === "fulfilled") {
            // The fetcher's own error (HTTP failure, parse failure)
            // surfaces here. items may still be empty + error
            // populated — that's the canonical "fetcher ran but
            // failed" shape.
            perSource.push({
                source: source.id,
                fetched: result.value.items.length,
                error: result.value.error
            });
            if (result.value.error !== null) {
                console.warn("[briefing-pipeline] source reported error:", {
                    source: source.id,
                    workspaceId,
                    error: result.value.error
                });
            }
            for (const item of result.value.items) {
                allItems.push({ source: source.id, item });
            }
        } else {
            // Promise rejection — the fetcher threw an unhandled
            // exception. Distinct from a reported error in the
            // resolved value because it indicates the fetcher
            // didn't follow the contract.
            const message =
                result.reason instanceof Error
                    ? result.reason.message
                    : String(result.reason);
            console.error("[briefing-pipeline] source threw:", {
                source: source.id,
                workspaceId,
                error: message
            });
            perSource.push({
                source: source.id,
                fetched: 0,
                error: `unhandled: ${message}`
            });
        }
    }

    // Insert. The UNIQUE (workspace_id, source_id, external_id)
    // constraint on briefing_raw_items dedupes across runs — a
    // re-fetch of the same item is idempotent. We use an upsert
    // with onConflict='ignore' semantics to count dedupes.
    let inserted = 0;
    let deduped = 0;
    for (const { source, item } of allItems) {
        // Use the item's own source_id when set (the Signal Console
        // source stamps a per-outlet `sc:<outlet>` id so corroboration
        // counts per outlet); fall back to the fetcher id. Existing
        // HTTP fetchers set item.source_id === their fetcher id, so this
        // is a no-op for them.
        const itemSourceId =
            typeof item.source_id === "string" && item.source_id.length > 0
                ? item.source_id
                : source;
        const insert = await sb.from("briefing_raw_items").insert({
            run_id: runId,
            workspace_id: workspaceId,
            source_id: itemSourceId,
            external_id: item.external_id,
            title: item.title,
            body: item.body,
            url: item.url,
            published_date: item.published_date,
            fetched_at: now,
            data: item.data
        });
        if (insert.error) {
            // Unique-violation = dedupe (already saw this item from a
            // prior run). Postgres error code 23505 surfaces as code.
            const code = (insert.error as { code?: string }).code;
            if (code === "23505") {
                deduped += 1;
            } else {
                console.error("[briefing-pipeline] raw_item insert failed:", {
                    source,
                    workspaceId,
                    runId,
                    external_id: item.external_id,
                    error: insert.error
                });
            }
        } else {
            inserted += 1;
        }
    }

    return {
        fetched: allItems.length,
        inserted,
        deduped,
        perSource
    };
}

// ─── Stage 3.2 — Filter ────────────────────────────────────────

interface FilterDecision {
    readonly raw_item_external_id: string;
    readonly source_id: string;
    readonly decision: "keep" | "reject";
    readonly rule: string;
}

/**
 * B.1a ships pass-through filter logic. Per Recipe Layer Spec §3.2
 * (unchanged from v0.3), the filter applies deterministic off-
 * category rejection rules — but the rules themselves are workspace-
 * specific (driven by ICP + competitive set in HydratedContext). With
 * ICP returning uninitialized in B.1a, the filter has no axis to
 * reject on, so every item passes. Real rules graduate alongside the
 * ICP adapter's first real read.
 *
 * The decision log is still recorded — a row per item with
 * `rule: "none — keep"`. That logs the structural pass-through
 * decision and gives B.2 something to read from when the LLM enrich
 * stage joins against filter decisions.
 */
async function runFilter(
    sb: SupabaseClient,
    runId: string,
    workspaceId: string,
    now: string
): Promise<{
    evaluated: number;
    kept: number;
    rejected: number;
    decisions: ReadonlyArray<FilterDecision>;
}> {
    const rawItems = await sb
        .from("briefing_raw_items")
        .select("source_id,external_id")
        .eq("run_id", runId)
        .eq("workspace_id", workspaceId);

    if (rawItems.error) {
        console.error("[briefing-pipeline] raw_items query failed:", {
            runId,
            workspaceId,
            error: rawItems.error
        });
        return { evaluated: 0, kept: 0, rejected: 0, decisions: [] };
    }

    const rows = (rawItems.data ?? []) as Array<{
        source_id: string;
        external_id: string;
    }>;

    const decisions: FilterDecision[] = rows.map((row) => ({
        raw_item_external_id: row.external_id,
        source_id: row.source_id,
        decision: "keep" as const,
        rule: "none — keep (B.1a pass-through; rules graduate with ICP adapter)"
    }));

    // Decisions persist into briefing_runs.data.filter_decisions for
    // now. When B.2's enrich stage lands, the decisions migrate to a
    // dedicated column on briefing_enriched_items (already in the
    // schema as `data jsonb` per migration 20260523180000).
    return {
        evaluated: rows.length,
        kept: decisions.length,
        rejected: 0,
        decisions
    };
}

// ─── Per-workspace pipeline runner ─────────────────────────────

interface WorkspaceRunReport {
    readonly workspaceId: string;
    readonly runId: string | null;
    readonly status: RunStatus;
    readonly stages: ReadonlyArray<StageLogEntry>;
    readonly counts: {
        readonly fetched: number;
        readonly inserted: number;
        readonly deduped: number;
        readonly kept: number;
        readonly rejected: number;
        readonly enriched: number;
        readonly enrich_noise: number;
        readonly enrich_errored: number;
        readonly enrich_cost_usd: number;
        readonly clusters_considered: number;
        readonly clusters_qualified: number;
        readonly clusters_persisted: number;
        readonly patterns_synthesized: number;
        readonly patterns_gated_out: number;
        readonly synth_cost_usd: number;
        readonly triggers_evaluated: number;
        readonly triggers_fired: number;
    };
    readonly error: string | null;
}

async function updateRun(
    sb: SupabaseClient,
    runId: string,
    patch: Record<string, unknown>
): Promise<void> {
    const upd = await sb
        .from("briefing_runs")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", runId);
    if (upd.error) {
        console.error("[briefing-pipeline] run update failed:", {
            runId,
            patch,
            error: upd.error
        });
    }
}

async function recordStage(
    sb: SupabaseClient,
    runId: string,
    entry: StageLogEntry,
    nextStatus: RunStatus
): Promise<void> {
    // Append to stage_log + transition status. We re-read the current
    // log to avoid clobbering parallel writes — though the function
    // runs single-threaded per workspace, future fan-out could need
    // this anyway.
    const current = await sb
        .from("briefing_runs")
        .select("stage_log")
        .eq("id", runId)
        .maybeSingle();

    const existing =
        current.data?.stage_log && Array.isArray(current.data.stage_log)
            ? (current.data.stage_log as StageLogEntry[])
            : [];

    await updateRun(sb, runId, {
        stage_log: [...existing, entry],
        status: nextStatus
    });
}

async function runWorkspacePipeline(
    sb: SupabaseClient,
    workspaceId: string
): Promise<WorkspaceRunReport> {
    const stages: StageLogEntry[] = [];
    const counts = {
        fetched: 0,
        inserted: 0,
        deduped: 0,
        kept: 0,
        rejected: 0,
        enriched: 0,
        enrich_noise: 0,
        enrich_errored: 0,
        enrich_cost_usd: 0,
        clusters_considered: 0,
        clusters_qualified: 0,
        clusters_persisted: 0,
        patterns_synthesized: 0,
        patterns_gated_out: 0,
        synth_cost_usd: 0,
        triggers_evaluated: 0,
        triggers_fired: 0
    };
    const now = (): string => new Date().toISOString();

    // Create the run row up-front so any subsequent failure has a
    // place to record itself.
    const created = await sb
        .from("briefing_runs")
        .insert({
            workspace_id: workspaceId,
            status: "pending",
            started_at: now(),
            stage_log: [],
            total_cost: 0,
            data: {}
        })
        .select("id")
        .single();

    if (created.error || !created.data) {
        const message = created.error?.message ?? "insert returned no data";
        console.error("[briefing-pipeline] failed to create run row:", {
            workspaceId,
            error: created.error
        });
        return {
            workspaceId,
            runId: null,
            status: "failed",
            stages: [],
            counts,
            error: message
        };
    }

    const runId = (created.data as { id: string }).id;

    try {
        // ── Stage 3.0 Hydrate ──
        const hydrateStart = now();
        const hydrateT0 = Date.now();
        await updateRun(sb, runId, { status: "hydrating" });
        const ctx = await hydrateContext(sb, workspaceId, hydrateStart);
        const hydrateEntry: StageLogEntry = {
            stage: "hydrate",
            started_at: hydrateStart,
            ended_at: now(),
            duration_ms: Date.now() - hydrateT0,
            outcome: "ok",
            notes: `Hydrated context: ${ctx.watchlist_companies.length} watchlist terms (competitors + ICP industries), commercial profile ${ctx.commercial_profile ? "set" : "unset"}, ICP ${ctx.icp ? "set" : "unset"}.`,
            data: {
                watchlist_companies: ctx.watchlist_companies,
                commercial_profile: ctx.commercial_profile,
                icp_health: ctx.modules_read.find((m) => m.module === "icp_studio")?.health ?? "unknown"
            }
        };
        stages.push(hydrateEntry);
        await recordStage(sb, runId, hydrateEntry, "ingesting");
        await updateRun(sb, runId, {
            data: { hydrated_context: ctx }
        });

        // ── Stage 3.1 Ingest ──
        const ingestStart = now();
        const ingestT0 = Date.now();
        const ingestResult = await runIngest(sb, runId, workspaceId, ctx, ingestStart);
        counts.fetched = ingestResult.fetched;
        counts.inserted = ingestResult.inserted;
        counts.deduped = ingestResult.deduped;
        const ingestEntry: StageLogEntry = {
            stage: "ingest",
            started_at: ingestStart,
            ended_at: now(),
            duration_ms: Date.now() - ingestT0,
            outcome: "ok",
            notes:
                SOURCE_REGISTRY.length === 0
                    ? "Source registry is empty — no items fetched."
                    : `Fetched ${ingestResult.fetched} items across ${ingestResult.perSource.length} sources (${ingestResult.inserted} inserted, ${ingestResult.deduped} deduped).`,
            // Surface per-source status so per-fetcher failures show
            // up in the curl response + briefing_runs.stage_log
            // jsonb. Each entry carries { source, fetched, error }
            // — error is null on success, a string when the fetcher
            // returned a non-200 or threw.
            data: {
                perSource: ingestResult.perSource
            }
        };
        stages.push(ingestEntry);
        await recordStage(sb, runId, ingestEntry, "filtering");

        // ── Stage 3.2 Filter ──
        const filterStart = now();
        const filterT0 = Date.now();
        const filterResult = await runFilter(sb, runId, workspaceId, filterStart);
        counts.kept = filterResult.kept;
        counts.rejected = filterResult.rejected;
        const filterEntry: StageLogEntry = {
            stage: "filter",
            started_at: filterStart,
            ended_at: now(),
            duration_ms: Date.now() - filterT0,
            outcome: "ok",
            notes: `Evaluated ${filterResult.evaluated} items; ${filterResult.kept} kept, ${filterResult.rejected} rejected. Pass-through in B.1a (rules graduate with ICP adapter).`
        };
        stages.push(filterEntry);
        await recordStage(sb, runId, filterEntry, "enriching");

        // ── Stage 3.3 Enrich (B.2a — first LLM call) ──
        const enrichStart = now();
        const enrichT0 = Date.now();
        const enrichResult = await runEnrich(sb, runId, workspaceId, ctx, enrichStart);
        counts.enriched = enrichResult.enriched;
        counts.enrich_noise = enrichResult.noise;
        counts.enrich_errored = enrichResult.errored;
        counts.enrich_cost_usd = enrichResult.total_cost_usd;
        const enrichEntry: StageLogEntry = {
            stage: "enrich",
            started_at: enrichStart,
            ended_at: now(),
            duration_ms: Date.now() - enrichT0,
            outcome: enrichResult.errored > 0 && enrichResult.enriched === 0 ? "error" : "ok",
            notes: `Attempted ${enrichResult.attempted} items; ${enrichResult.enriched} enriched, ${enrichResult.noise} flagged noise, ${enrichResult.errored} errored. Cost: $${enrichResult.total_cost_usd.toFixed(4)}.`,
            data: {
                perItem: enrichResult.perItem
            }
        };
        stages.push(enrichEntry);
        await recordStage(sb, runId, enrichEntry, "clustering");

        // ── Stage 3.3.5 Watchlist Triggers (B.3a) ──
        const triggerStart = now();
        const triggerT0 = Date.now();
        const triggerResult = await runTriggers(sb, runId, workspaceId, triggerStart);
        counts.triggers_evaluated = triggerResult.evaluated;
        counts.triggers_fired = triggerResult.fired;
        const triggerEntry: StageLogEntry = {
            stage: "triggers",
            started_at: triggerStart,
            ended_at: now(),
            duration_ms: Date.now() - triggerT0,
            outcome: "ok",
            notes: `Evaluated ${triggerResult.evaluated} armed triggers; ${triggerResult.fired} fired, ${triggerResult.skipped} skipped.`,
            data: {
                perTrigger: triggerResult.perTrigger
            }
        };
        stages.push(triggerEntry);
        await recordStage(sb, runId, triggerEntry, "clustering");

        // ── Stage 3.4 Cluster (B.2b) ──
        const clusterStart = now();
        const clusterT0 = Date.now();
        const clusterResult = await runCluster(sb, runId, workspaceId, ctx, clusterStart);
        counts.clusters_considered = clusterResult.considered;
        counts.clusters_qualified = clusterResult.qualified;
        counts.clusters_persisted = clusterResult.persisted;
        const clusterEntry: StageLogEntry = {
            stage: "cluster",
            started_at: clusterStart,
            ended_at: now(),
            duration_ms: Date.now() - clusterT0,
            outcome: "ok",
            notes: `Considered ${clusterResult.considered} candidate clusters; ${clusterResult.qualified} qualified, ${clusterResult.persisted} persisted.`,
            data: {
                perCluster: clusterResult.perCluster
            }
        };
        stages.push(clusterEntry);
        await recordStage(sb, runId, clusterEntry, "synthesizing");

        // ── Stage 3.5 Synthesize (B.2c — Draft / Critique / Revise / Gate) ──
        const synthStart = now();
        const synthT0 = Date.now();
        const synthResult = await runSynthesis(sb, runId, workspaceId, ctx);
        counts.patterns_synthesized = synthResult.synthesized;
        counts.patterns_gated_out = synthResult.gated_out;
        counts.synth_cost_usd = synthResult.total_cost_usd;
        const synthEntry: StageLogEntry = {
            stage: "synthesize",
            started_at: synthStart,
            ended_at: now(),
            duration_ms: Date.now() - synthT0,
            outcome:
                synthResult.errored > 0 && synthResult.synthesized === 0 && synthResult.clusters > 0
                    ? "error"
                    : "ok",
            notes: `Synthesized ${synthResult.synthesized} patterns from ${synthResult.clusters} qualified clusters (${synthResult.gated_out} gated out, ${synthResult.errored} errored). Cost: $${synthResult.total_cost_usd.toFixed(4)}.`,
            data: {
                perCluster: synthResult.perCluster
            }
        };
        stages.push(synthEntry);
        await recordStage(sb, runId, synthEntry, "complete");

        // Roll synthesis cost into the run total (enrich already bumped it).
        if (synthResult.total_cost_usd > 0) {
            const cur = await sb
                .from("briefing_runs")
                .select("total_cost")
                .eq("id", runId)
                .single();
            const priorCost =
                typeof cur.data?.total_cost === "number" ? cur.data.total_cost : 0;
            await updateRun(sb, runId, {
                total_cost: priorCost + synthResult.total_cost_usd
            });
        }

        await updateRun(sb, runId, {
            completed_at: now(),
            data: {
                hydrated_context: ctx,
                filter_decisions: filterResult.decisions
            }
        });

        return {
            workspaceId,
            runId,
            status: "complete",
            stages,
            counts,
            error: null
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[briefing-pipeline] pipeline threw:", {
            workspaceId,
            runId,
            error: message
        });
        await updateRun(sb, runId, {
            status: "failed",
            completed_at: now(),
            error: message
        });
        return {
            workspaceId,
            runId,
            status: "failed",
            stages,
            counts,
            error: message
        };
    }
}

// ─── Active-workspace enumeration ──────────────────────────────

const PIPELINE_ACTIVE_DAYS = 7;

async function listActiveWorkspaces(
    sb: SupabaseClient
): Promise<Array<{ id: string }>> {
    const since = new Date(
        Date.now() - PIPELINE_ACTIVE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const sessionRows = await sb
        .from("workspace_sessions")
        .select("workspace_id")
        .gte("updated_at", since);

    if (sessionRows.error) {
        console.error(
            "[briefing-pipeline] failed to list active sessions:",
            sessionRows.error
        );
        return [];
    }

    const ids = new Set(
        (sessionRows.data ?? []).map((row: any) => row.workspace_id as string)
    );

    // Also include workspaces with a recent briefing_run (in case
    // the operator hasn't touched the workspace this week but it's
    // still on the weekly cadence).
    const recentRuns = await sb
        .from("briefing_runs")
        .select("workspace_id")
        .gte("started_at", since);

    if (!recentRuns.error) {
        for (const row of recentRuns.data ?? []) {
            ids.add((row as { workspace_id: string }).workspace_id);
        }
    }

    return Array.from(ids).map((id) => ({ id }));
}

// ─── Main entrypoint ───────────────────────────────────────────

interface PipelineReport {
    ok: boolean;
    startedAt: string;
    endedAt: string;
    durationMs: number;
    workspaces: number;
    sources: number;
    totals: {
        fetched: number;
        inserted: number;
        deduped: number;
        kept: number;
        rejected: number;
        enriched: number;
        enrich_noise: number;
        enrich_errored: number;
        enrich_cost_usd: number;
        clusters_considered: number;
        clusters_qualified: number;
        clusters_persisted: number;
    };
    perWorkspace: ReadonlyArray<WorkspaceRunReport>;
}

interface PipelineRequestBody {
    /** Optional — target one workspace instead of every active workspace. */
    readonly workspaceId?: string;
    /** When "parse_trigger", parse natural_language into a trigger query. */
    readonly action?: string;
    /** Natural-language trigger text (for action=parse_trigger). */
    readonly natural_language?: string;
}

/**
 * Parse a natural-language Watchlist Trigger (B.3a). Hydrates the
 * workspace's context for reference resolution, runs the parser
 * (Sonnet 4.6), and returns the structured parse + disposition. The
 * Watch List UI (B.3b) calls this, shows the rephrasing for
 * confirmation, then inserts the armed trigger directly (RLS-gated).
 */
async function parseTriggerAction(
    sb: SupabaseClient,
    workspaceId: string,
    naturalLanguage: string
): Promise<Record<string, unknown>> {
    const ctx = await hydrateContext(sb, workspaceId, new Date().toISOString());
    const watchlist = Array.isArray(ctx.watchlist_companies)
        ? (ctx.watchlist_companies as string[])
        : [];
    const icp = ctx.icp as { target_industries?: unknown } | null;
    const icpCategories =
        icp && Array.isArray(icp.target_industries)
            ? (icp.target_industries as unknown[]).filter((x): x is string => typeof x === "string")
            : [];

    // Existing armed triggers, for the parser's de-dup awareness.
    const existing = await sb
        .from("briefing_watchlist_triggers")
        .select("natural_language")
        .eq("workspace_id", workspaceId)
        .neq("status", "disabled")
        .limit(20);
    const activeTriggers = (existing.data ?? [])
        .map((r: any) => (typeof r.natural_language === "string" ? r.natural_language : ""))
        .filter((s: string) => s.length > 0);

    const prompt = buildTriggerParsePrompt({
        natural_language: naturalLanguage,
        watchlist_companies: watchlist,
        competitors: watchlist,
        icp_categories: icpCategories,
        active_triggers_summary: activeTriggers
    });
    const call = await callAnthropic({
        model: "sonnet_4_6",
        system_prompt: TRIGGER_PARSE_SYSTEM_PROMPT,
        user_prompt: prompt,
        max_tokens: 1500,
        prompt_version: TRIGGER_PARSE_PROMPT_VERSION
    });
    if (!call.ok) {
        return { ok: false, error: `parser call failed: ${call.error}` };
    }
    const result = parseTriggerResponse(call.text);
    return {
        ok: true,
        parse: result,
        disposition: parseDisposition(result),
        cost_usd: call.cost_usd
    };
}

async function runPipeline(
    sb: SupabaseClient,
    body: PipelineRequestBody
): Promise<PipelineReport> {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();

    const workspaces = body.workspaceId
        ? [{ id: body.workspaceId }]
        : await listActiveWorkspaces(sb);

    const totals = {
        fetched: 0,
        inserted: 0,
        deduped: 0,
        kept: 0,
        rejected: 0,
        enriched: 0,
        enrich_noise: 0,
        enrich_errored: 0,
        enrich_cost_usd: 0,
        clusters_considered: 0,
        clusters_qualified: 0,
        clusters_persisted: 0,
        patterns_synthesized: 0,
        patterns_gated_out: 0,
        synth_cost_usd: 0,
        triggers_evaluated: 0,
        triggers_fired: 0
    };
    const perWorkspace: WorkspaceRunReport[] = [];

    for (const workspace of workspaces) {
        const report = await runWorkspacePipeline(sb, workspace.id);
        perWorkspace.push(report);
        totals.fetched += report.counts.fetched;
        totals.inserted += report.counts.inserted;
        totals.deduped += report.counts.deduped;
        totals.kept += report.counts.kept;
        totals.rejected += report.counts.rejected;
        totals.enriched += report.counts.enriched;
        totals.enrich_noise += report.counts.enrich_noise;
        totals.enrich_errored += report.counts.enrich_errored;
        totals.enrich_cost_usd += report.counts.enrich_cost_usd;
        totals.clusters_considered += report.counts.clusters_considered;
        totals.clusters_qualified += report.counts.clusters_qualified;
        totals.clusters_persisted += report.counts.clusters_persisted;
        totals.patterns_synthesized += report.counts.patterns_synthesized;
        totals.patterns_gated_out += report.counts.patterns_gated_out;
        totals.synth_cost_usd += report.counts.synth_cost_usd;
        totals.triggers_evaluated += report.counts.triggers_evaluated;
        totals.triggers_fired += report.counts.triggers_fired;
    }

    return {
        ok: true,
        startedAt,
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        workspaces: workspaces.length,
        sources: SOURCE_REGISTRY.length,
        totals,
        perWorkspace
    };
}

// ─── HTTP serve loop ───────────────────────────────────────────

// @ts-ignore - Deno global; resolved at deploy time
serve(async (req: Request): Promise<Response> => {
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ ok: false, error: "POST only" }),
            { status: 405, headers: { "content-type": "application/json" } }
        );
    }

    // @ts-ignore - Deno.env; resolved at deploy time
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-ignore - Deno.env; resolved at deploy time
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
        return new Response(
            JSON.stringify({
                ok: false,
                error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing"
            }),
            { status: 500, headers: { "content-type": "application/json" } }
        );
    }

    let body: PipelineRequestBody = {};
    try {
        const text = await req.text();
        if (text.trim().length > 0) {
            body = JSON.parse(text) as PipelineRequestBody;
        }
    } catch (err) {
        return new Response(
            JSON.stringify({
                ok: false,
                error: `Invalid JSON body: ${err instanceof Error ? err.message : String(err)}`
            }),
            { status: 400, headers: { "content-type": "application/json" } }
        );
    }

    const sb = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // Trigger-parse action (B.3a) — distinct from a pipeline run.
    if (body.action === "parse_trigger") {
        const ws = body.workspaceId ?? "";
        const nl = (body.natural_language ?? "").trim();
        if (ws.length === 0 || nl.length === 0) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "parse_trigger requires workspaceId + natural_language"
                }),
                { status: 400, headers: { "content-type": "application/json" } }
            );
        }
        try {
            const out = await parseTriggerAction(sb, ws, nl);
            return new Response(JSON.stringify(out), {
                status: out.ok === false ? 502 : 200,
                headers: { "content-type": "application/json" }
            });
        } catch (err) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    error: err instanceof Error ? err.message : String(err)
                }),
                { status: 500, headers: { "content-type": "application/json" } }
            );
        }
    }

    try {
        const report = await runPipeline(sb, body);
        console.log(
            "[briefing-pipeline] run complete:",
            JSON.stringify({
                workspaces: report.workspaces,
                sources: report.sources,
                totals: report.totals,
                durationMs: report.durationMs
            })
        );
        return new Response(JSON.stringify(report), {
            status: 200,
            headers: { "content-type": "application/json" }
        });
    } catch (err) {
        console.error("[briefing-pipeline] run failed:", err);
        return new Response(
            JSON.stringify({
                ok: false,
                error: err instanceof Error ? err.message : String(err)
            }),
            { status: 500, headers: { "content-type": "application/json" } }
        );
    }
});
