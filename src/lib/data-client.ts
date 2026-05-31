import type {
    RealtimeChannel,
    RealtimePostgresChangesPayload
} from "@supabase/supabase-js";
import type {
    Database,
    InsertRow,
    Row,
    TableName,
    UpdateRow,
    Workspace
} from "./database-helpers";
import { getSupabaseClient, type AntaeusSupabaseClient } from "./supabase-client";
import { reportError, trackEvent } from "./observability";
import {
    isDemoModeActive,
    makeDemoLocalNounAccessor
} from "./data-client-demo-local";

/**
 * Antaeus data client — typed, workspace-aware wrappers over the raw Supabase client.
 *
 * Every noun table in the schema gets a per-noun accessor with the same shape:
 *
 *     list(options)           select * from <table>      // RLS scopes to workspace
 *     get(id)                 select * from <table> where id = ?
 *     insert(row)             insert into <table> returning *
 *     update(id, patch)       update <table> set ... where id = ? returning *
 *     remove(id)              delete from <table> where id = ?
 *     subscribe(handler)      realtime subscription on postgres_changes
 *
 * The client intentionally does NOT manually filter by workspace_id in queries —
 * RLS handles that at the database layer, which is the only tamper-proof place.
 * Same for INSERTs: the table's DEFAULT on workspace_id calls
 * public.current_user_default_workspace_id() server-side.
 *
 * ─── Error handling ──────────────────────────────────────────────────────
 * All methods throw on error (don't return a {data, error} tuple). Callers
 * use try/catch. Every thrown error is also reported through reportError().
 *
 * ─── Optimistic updates ──────────────────────────────────────────────────
 * The optimisticMutate() helper applies a local change immediately, fires
 * the server call, and returns a rollback on failure. Rooms wire their
 * own state containers to it — see §Usage below.
 *
 * ─── Realtime ────────────────────────────────────────────────────────────
 * subscribe() returns a RealtimeChannel you can .unsubscribe() from. Channels
 * are filtered by the caller's session (RLS gates delivery), so each workspace's
 * users only see their own workspace's events.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────
 *
 *     import { createDataClient } from "@/lib/data-client";
 *     const data = createDataClient();
 *     const deals = await data.deals.list();
 *     const ws = await data.currentWorkspace();
 *
 *     // Optimistic pattern:
 *     const rollback = optimisticMutate(
 *         state.deals,
 *         (deals) => deals.map((d) => d.id === id ? { ...d, stage: "won" } : d),
 *         () => data.deals.update(id, { stage: "won" })
 *     );
 *     // If the server rejects, rollback() puts state.deals back.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.2
 */

// ─── List options ───────────────────────────────────────────────────────

export interface ListOptions<T extends TableName> {
    /** Order by a given column. Multiple orders compose. */
    orderBy?: {
        column: keyof Row<T> & string;
        ascending?: boolean;
    };
    /** Hard upper bound on rows returned. Supabase default is ~1000; we cap at 500 unless caller opts out. */
    limit?: number;
    /** Raw equality filters keyed by column. For richer filtering, use rawBuilder(). */
    where?: Partial<Row<T>>;
}

// ─── Per-noun accessor shape ────────────────────────────────────────────

export interface NounAccessor<T extends TableName> {
    list(options?: ListOptions<T>): Promise<Row<T>[]>;
    get(id: string): Promise<Row<T> | null>;
    insert(row: InsertRow<T>): Promise<Row<T>>;
    update(id: string, patch: UpdateRow<T>): Promise<Row<T>>;
    remove(id: string): Promise<void>;
    subscribe(
        handler: (payload: RealtimePostgresChangesPayload<Row<T>>) => void
    ): RealtimeChannel;
}

// ─── Factory ────────────────────────────────────────────────────────────

export interface DataClient {
    readonly client: AntaeusSupabaseClient;

    // Current-user / current-workspace helpers
    currentUserId(): Promise<string | null>;
    currentWorkspace(): Promise<Workspace | null>;

    // Per-noun accessors (workspace-scoped tables)
    workspaces: NounAccessor<"workspaces">;
    workspaceMembers: NounAccessor<"workspace_members">;
    icps: NounAccessor<"icps">;
    deals: NounAccessor<"deals">;
    sequences: NounAccessor<"sequences">;
    signalConsoleAccounts: NounAccessor<"signal_console_accounts">;
    // ─── Phase 4.5 / Tier 1 Signal Console Step 2 (ADR-005) ─────
    signals: NounAccessor<"signals">;
    discoveryFrameworks: NounAccessor<"discovery_frameworks">;
    discoveryCallLogs: NounAccessor<"discovery_call_logs">;
    pipelineSettings: NounAccessor<"pipeline_settings">;
    profiles: NounAccessor<"profiles">;
    studioArtifacts: NounAccessor<"studio_artifacts">;
    proofs: NounAccessor<"proofs">;
    advisorDeployments: NounAccessor<"advisor_deployments">;
    readinessSnapshots: NounAccessor<"readiness_snapshots">;
    handoffArtifacts: NounAccessor<"handoff_artifacts">;
    // ─── Founding GTM share-link mechanic (canon §4.19) ─────────────
    foundingGtmShares: NounAccessor<"founding_gtm_shares">;
    // ─── Skill scheduling (Phase E, ADR-012) ────────────────────────
    scheduledSkills: NounAccessor<"scheduled_skills">;
    scheduledSkillFires: NounAccessor<"scheduled_skill_fires">;
    // ─── Phase A orchestration layer (ADR-004) ─────────────────────
    workspaceSessions: NounAccessor<"workspace_sessions">;
    observations: NounAccessor<"observations">;
    // ─── Commercial identity layer (ADR-007) ───────────────────────
    workspaceProfile: NounAccessor<"workspace_profile">;
    // ─── Briefing room foundation (ADR-006, B.0a) ──────────────────
    briefingRuns: NounAccessor<"briefing_runs">;
    briefingRawItems: NounAccessor<"briefing_raw_items">;
    briefingEnrichedItems: NounAccessor<"briefing_enriched_items">;
    briefingClusters: NounAccessor<"briefing_clusters">;
    briefingPatterns: NounAccessor<"briefing_patterns">;
    briefingAuditEnvelopes: NounAccessor<"briefing_audit_envelopes">;
    briefingPatternFeedback: NounAccessor<"briefing_pattern_feedback">;
}

/**
 * Mode hint for the data client. "supabase" (default) returns the real
 * network-backed client. "demo-local" returns localStorage-backed accessors
 * that mirror the same shape but never hit the network. "auto" picks
 * "demo-local" when `sessionStorage.gtmos_env_mode === "demo"` and
 * "supabase" otherwise — matching the Phase 4.5 demo mode boundary
 * (ADR-005).
 */
export type DataClientMode = "supabase" | "demo-local" | "auto";

export interface CreateDataClientOptions {
    readonly client?: AntaeusSupabaseClient;
    readonly mode?: DataClientMode;
}

export function createDataClient(
    options: CreateDataClientOptions | AntaeusSupabaseClient = {}
): DataClient {
    // Back-compat: createDataClient(supabaseClient) still works.
    const opts: CreateDataClientOptions =
        options && typeof options === "object" && "from" in options
            ? { client: options as AntaeusSupabaseClient }
            : (options as CreateDataClientOptions);

    const requestedMode = opts.mode ?? "auto";
    const resolvedMode: "supabase" | "demo-local" =
        requestedMode === "auto"
            ? isDemoModeActive()
                ? "demo-local"
                : "supabase"
            : requestedMode;

    if (resolvedMode === "demo-local") {
        return makeDemoLocalDataClient();
    }

    const sb = opts.client ?? getSupabaseClient();

    return {
        client: sb,
        currentUserId: () => currentUserId(sb),
        currentWorkspace: () => currentWorkspace(sb),
        workspaces: makeNounAccessor(sb, "workspaces"),
        workspaceMembers: makeNounAccessor(sb, "workspace_members"),
        icps: makeNounAccessor(sb, "icps"),
        deals: makeNounAccessor(sb, "deals"),
        sequences: makeNounAccessor(sb, "sequences"),
        signalConsoleAccounts: makeNounAccessor(sb, "signal_console_accounts"),
        signals: makeNounAccessor(sb, "signals"),
        discoveryFrameworks: makeNounAccessor(sb, "discovery_frameworks"),
        discoveryCallLogs: makeNounAccessor(sb, "discovery_call_logs"),
        pipelineSettings: makeNounAccessor(sb, "pipeline_settings"),
        profiles: makeNounAccessor(sb, "profiles"),
        studioArtifacts: makeNounAccessor(sb, "studio_artifacts"),
        proofs: makeNounAccessor(sb, "proofs"),
        advisorDeployments: makeNounAccessor(sb, "advisor_deployments"),
        readinessSnapshots: makeNounAccessor(sb, "readiness_snapshots"),
        handoffArtifacts: makeNounAccessor(sb, "handoff_artifacts"),
        foundingGtmShares: makeNounAccessor(sb, "founding_gtm_shares"),
        scheduledSkills: makeNounAccessor(sb, "scheduled_skills"),
        scheduledSkillFires: makeNounAccessor(sb, "scheduled_skill_fires"),
        // ─── Phase A orchestration layer (ADR-004) ─────────────────
        workspaceProfile: makeNounAccessor(sb, "workspace_profile"),
        workspaceSessions: makeNounAccessor(sb, "workspace_sessions"),
        observations: makeNounAccessor(sb, "observations"),
        // ─── Briefing room foundation (ADR-006, B.0a) ──────────────
        briefingRuns: makeNounAccessor(sb, "briefing_runs"),
        briefingRawItems: makeNounAccessor(sb, "briefing_raw_items"),
        briefingEnrichedItems: makeNounAccessor(sb, "briefing_enriched_items"),
        briefingClusters: makeNounAccessor(sb, "briefing_clusters"),
        briefingPatterns: makeNounAccessor(sb, "briefing_patterns"),
        briefingAuditEnvelopes: makeNounAccessor(sb, "briefing_audit_envelopes"),
        briefingPatternFeedback: makeNounAccessor(sb, "briefing_pattern_feedback")
    };
}

// ─── Demo-local data client (ADR-005 §"Demo mode boundary") ─────────────

function makeDemoLocalDataClient(): DataClient {
    // The demo-local client does not need a real Supabase client. We expose
    // a stub on `.client` so the DataClient type stays exact — callers that
    // reach for `.client` directly are doing something the demo shape doesn't
    // support and should refactor through the accessor interface.
    const stubClient = {} as AntaeusSupabaseClient;

    return {
        client: stubClient,
        currentUserId: async () => "demo-user",
        currentWorkspace: async () => null,
        workspaces: makeDemoLocalNounAccessor("workspaces"),
        workspaceMembers: makeDemoLocalNounAccessor("workspace_members"),
        icps: makeDemoLocalNounAccessor("icps"),
        deals: makeDemoLocalNounAccessor("deals"),
        sequences: makeDemoLocalNounAccessor("sequences"),
        signalConsoleAccounts: makeDemoLocalNounAccessor("signal_console_accounts"),
        signals: makeDemoLocalNounAccessor("signals"),
        discoveryFrameworks: makeDemoLocalNounAccessor("discovery_frameworks"),
        discoveryCallLogs: makeDemoLocalNounAccessor("discovery_call_logs"),
        pipelineSettings: makeDemoLocalNounAccessor("pipeline_settings"),
        profiles: makeDemoLocalNounAccessor("profiles"),
        studioArtifacts: makeDemoLocalNounAccessor("studio_artifacts"),
        proofs: makeDemoLocalNounAccessor("proofs"),
        advisorDeployments: makeDemoLocalNounAccessor("advisor_deployments"),
        readinessSnapshots: makeDemoLocalNounAccessor("readiness_snapshots"),
        handoffArtifacts: makeDemoLocalNounAccessor("handoff_artifacts"),
        foundingGtmShares: makeDemoLocalNounAccessor("founding_gtm_shares"),
        scheduledSkills: makeDemoLocalNounAccessor("scheduled_skills"),
        scheduledSkillFires: makeDemoLocalNounAccessor("scheduled_skill_fires"),
        workspaceProfile: makeDemoLocalNounAccessor("workspace_profile"),
        workspaceSessions: makeDemoLocalNounAccessor("workspace_sessions"),
        observations: makeDemoLocalNounAccessor("observations"),
        // ─── Briefing room foundation (ADR-006, B.0a) ──────────────
        briefingRuns: makeDemoLocalNounAccessor("briefing_runs"),
        briefingRawItems: makeDemoLocalNounAccessor("briefing_raw_items"),
        briefingEnrichedItems: makeDemoLocalNounAccessor("briefing_enriched_items"),
        briefingClusters: makeDemoLocalNounAccessor("briefing_clusters"),
        briefingPatterns: makeDemoLocalNounAccessor("briefing_patterns"),
        briefingAuditEnvelopes: makeDemoLocalNounAccessor("briefing_audit_envelopes"),
        briefingPatternFeedback: makeDemoLocalNounAccessor("briefing_pattern_feedback")
    };
}

// ─── Current user / workspace ───────────────────────────────────────────

async function currentUserId(sb: AntaeusSupabaseClient): Promise<string | null> {
    const { data, error } = await sb.auth.getUser();
    if (error) {
        reportError(error, { op: "currentUserId" });
        throw error;
    }
    return data.user?.id ?? null;
}

async function currentWorkspace(sb: AntaeusSupabaseClient): Promise<Workspace | null> {
    const userId = await currentUserId(sb);
    if (!userId) return null;

    const { data, error } = await sb
        .from("workspaces")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) {
        reportError(error, { op: "currentWorkspace", userId });
        throw error;
    }
    return data;
}

// ─── Generic noun-accessor implementation ───────────────────────────────

function makeNounAccessor<T extends TableName>(
    sb: AntaeusSupabaseClient,
    table: T
): NounAccessor<T> {
    // Supabase's strict per-table type inference breaks when `table` is a
    // generic parameter — it falls back to union-of-all-tables which then
    // fails narrowing at every query method. We type-erase at the boundary
    // (`any` on the from() result) and restore typing at the NounAccessor
    // return signatures, which is the idiomatic pattern for generic
    // wrappers over @supabase/supabase-js.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = (): any => sb.from(table as never);

    return {
        async list(options?: ListOptions<T>): Promise<Row<T>[]> {
            let query = from().select("*");

            if (options?.where) {
                for (const [col, value] of Object.entries(options.where)) {
                    if (value === undefined) continue;
                    query = query.eq(col, value);
                }
            }

            if (options?.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending ?? true
                });
            }

            const limit = options?.limit ?? 500;
            query = query.limit(limit);

            const { data, error } = await query;
            if (error) {
                reportError(error, { op: "list", table });
                throw error;
            }
            return (data ?? []) as Row<T>[];
        },

        async get(id: string): Promise<Row<T> | null> {
            const { data, error } = await from()
                .select("*")
                .eq("id", id)
                .maybeSingle();

            if (error) {
                reportError(error, { op: "get", table, id });
                throw error;
            }
            return data as Row<T> | null;
        },

        async insert(row: InsertRow<T>): Promise<Row<T>> {
            const { data, error } = await from()
                .insert(row)
                .select("*")
                .single();

            if (error) {
                reportError(error, { op: "insert", table });
                throw error;
            }
            trackEvent("data_client_insert", { table });
            return data as Row<T>;
        },

        async update(id: string, patch: UpdateRow<T>): Promise<Row<T>> {
            const { data, error } = await from()
                .update(patch)
                .eq("id", id)
                .select("*")
                .single();

            if (error) {
                reportError(error, { op: "update", table, id });
                throw error;
            }
            trackEvent("data_client_update", { table });
            return data as Row<T>;
        },

        async remove(id: string): Promise<void> {
            const { error } = await from()
                .delete()
                .eq("id", id);

            if (error) {
                reportError(error, { op: "remove", table, id });
                throw error;
            }
            trackEvent("data_client_delete", { table });
        },

        subscribe(
            handler: (payload: RealtimePostgresChangesPayload<Row<T>>) => void
        ): RealtimeChannel {
            const channelName = `antaeus:${table}:${crypto.randomUUID()}`;
            const channel = sb
                .channel(channelName)
                .on(
                    "postgres_changes" as never,
                    {
                        event: "*",
                        schema: "public",
                        table: table as string
                    },
                    (payload: RealtimePostgresChangesPayload<Row<T>>) => {
                        handler(payload);
                    }
                )
                .subscribe();

            return channel;
        }
    };
}

// ─── Optimistic mutation helper ─────────────────────────────────────────

/**
 * Apply a local change immediately, then fire a server call. If the server
 * rejects, the returned rollback() puts the state back.
 *
 * This is a pure function — it neither stores state nor assumes a framework.
 * Rooms wire it to their state holder (signal, store, useState, etc.).
 *
 * Returns an object with:
 *   optimistic   — the transformed state (apply immediately)
 *   promise      — resolves with the server's authoritative result
 *   rollback()   — returns the original state, for UIs that need to revert
 *
 * Typical use:
 *
 *   const { optimistic, promise, rollback } = optimisticMutate(
 *     currentDeals,
 *     (deals) => deals.filter((d) => d.id !== removedId),
 *     () => data.deals.remove(removedId)
 *   );
 *   setDeals(optimistic);
 *   try {
 *     await promise;
 *   } catch (err) {
 *     setDeals(rollback());
 *   }
 */
export interface OptimisticMutation<TState, TResult> {
    readonly optimistic: TState;
    readonly promise: Promise<TResult>;
    rollback(): TState;
}

export function optimisticMutate<TState, TResult>(
    current: TState,
    transform: (state: TState) => TState,
    serverCall: () => Promise<TResult>
): OptimisticMutation<TState, TResult> {
    const optimistic = transform(current);
    const promise = serverCall().catch((err) => {
        reportError(err, { op: "optimisticMutate" });
        throw err;
    });
    return {
        optimistic,
        promise,
        rollback() {
            return current;
        }
    };
}

// ─── Convenience re-exports ─────────────────────────────────────────────

export type { Database };
export { getSupabaseClient };
