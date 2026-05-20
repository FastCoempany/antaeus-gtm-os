/**
 * Phase A orchestration layer (ADR-004) — heartbeat Edge Function.
 *
 * The system's pulse. Wakes up every N minutes, inspects each
 * workspace's state, runs registered observation generators, and
 * writes the candidates into the observations ledger.
 *
 * Phase A ships this as a SKELETON — REGISTERED_GENERATORS is empty.
 * The function runs cleanly end-to-end (auth → enumerate workspaces →
 * empty generator loop → log summary → return 200) but writes
 * nothing yet. Phase B registers the first generator (signal-decay
 * detection) and the visible "this week's reads" card on the
 * Dashboard reads from the ledger this function will start
 * populating.
 *
 * Runtime: Deno (Supabase Edge Functions). NOT shared with the
 * Node-flavored src/ tree — types are duplicated here on purpose so
 * the function is fully self-contained. When Phase B+ generator
 * authors land they re-implement against the same `Generator` /
 * `ObservationCandidate` shapes defined here.
 *
 * Schedule: pg_cron job in supabase/migrations/20260519180002_*.sql.
 * Cadence: every 30 minutes by default. Manual invocation also
 * supported via POST to the function URL with the service-role key
 * for testing.
 *
 * Auth: invoked by pg_cron via net.http_post with the service-role
 * key in the Authorization header. The function then uses the
 * service-role key to create its own Supabase client (which bypasses
 * RLS — required since the observations table only permits inserts
 * from the service role).
 *
 * Error handling: per-workspace + per-generator errors are caught +
 * logged + included in the response summary. One workspace's failure
 * doesn't block the others.
 *
 * Ref: deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md §Heartbeat
 */

// deno-lint-ignore-file no-explicit-any

// Supabase Edge Functions ship with a Deno runtime and globals for
// std HTTP serve + the Supabase JS client via URL import. These
// imports resolve at deploy time; they don't need to resolve in the
// Node-flavored editor (the typecheck for src/ skips this directory).

// @ts-ignore - Deno URL import; resolved at deploy time
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore - Deno URL import; resolved at deploy time
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Generator contract (duplicated from src/lib/observations/types.ts) ─

type FocusedObjectType =
    | "account"
    | "deal"
    | "signal"
    | "call"
    | "proof"
    | "advisor"
    | "focus"
    | "approach";

type ObservationConfidence = "high" | "medium" | "low" | null;

interface ObservationCandidate {
    readonly observationText: string;
    readonly relatedObjectType?: FocusedObjectType | null;
    readonly relatedObjectId?: string | null;
    readonly confidence?: ObservationConfidence;
    readonly supersedesPrior?: boolean;
}

interface GeneratorContext {
    readonly workspaceId: string;
    readonly now: string;
    readonly session: {
        readonly focusedObjectType: FocusedObjectType | null;
        readonly focusedObjectId: string | null;
    } | null;
}

type Generator = (
    ctx: GeneratorContext
) => Promise<ReadonlyArray<ObservationCandidate>>;

interface RegisteredGenerator {
    readonly id: string;
    readonly run: Generator;
}

// ─── Phase A registry — empty. Phase B registers signal-decay. ──

const REGISTERED_GENERATORS: ReadonlyArray<RegisteredGenerator> = [
    // Phase B will add:
    //   { id: "phase-b/signal-decay", run: signalDecayGenerator }
];

// ─── Workspace activity filter ──────────────────────────────────

const HEARTBEAT_ACTIVE_DAYS = 7;

/**
 * Enumerate the workspaces the heartbeat should run against. A
 * workspace is "active" if it has any session activity OR any
 * recent observation in the last HEARTBEAT_ACTIVE_DAYS days. This
 * avoids running generators against dormant workspaces and keeps
 * the DB load proportional to actual use.
 */
async function listActiveWorkspaces(sb: SupabaseClient): Promise<Array<{ id: string }>> {
    // Session-touched workspaces.
    const since = new Date(
        Date.now() - HEARTBEAT_ACTIVE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const sessionRows = await sb
        .from("workspace_sessions")
        .select("workspace_id")
        .gte("updated_at", since);

    if (sessionRows.error) {
        console.error("[heartbeat] failed to list active sessions:", sessionRows.error);
        return [];
    }

    const sessionIds = new Set(
        (sessionRows.data ?? []).map((row: any) => row.workspace_id)
    );

    // Recently-written observations also count (a generator may have
    // written something even if no session activity).
    const obsRows = await sb
        .from("observations")
        .select("workspace_id")
        .gte("written_at", since);

    if (!obsRows.error) {
        for (const row of obsRows.data ?? []) {
            sessionIds.add(row.workspace_id);
        }
    }

    return Array.from(sessionIds).map((id) => ({ id }));
}

// ─── Session context loader ──────────────────────────────────────

async function loadSessionContext(
    sb: SupabaseClient,
    workspaceId: string
): Promise<GeneratorContext["session"]> {
    const result = await sb
        .from("workspace_sessions")
        .select("focused_object_type,focused_object_id")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

    if (result.error || !result.data) return null;

    const row = result.data as {
        focused_object_type: string | null;
        focused_object_id: string | null;
    };
    return {
        focusedObjectType: row.focused_object_type as FocusedObjectType | null,
        focusedObjectId: row.focused_object_id
    };
}

// ─── Writer (duplicated from src/lib/observations/writer.ts) ─────

interface WriteOutcome {
    inserted: boolean;
    deduped: boolean;
    errored: boolean;
}

async function writeObservation(
    sb: SupabaseClient,
    workspaceId: string,
    sourceGenerator: string,
    candidate: ObservationCandidate,
    now: string
): Promise<WriteOutcome> {
    try {
        // Dedupe scan.
        const existing = await sb
            .from("observations")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("source_generator", sourceGenerator)
            .eq("status", "active")
            .eq("related_object_type", candidate.relatedObjectType ?? null)
            .eq("related_object_id", candidate.relatedObjectId ?? null)
            .limit(5);

        if (existing.error) {
            console.error(
                "[heartbeat] dedupe-scan failed:",
                existing.error,
                { workspaceId, sourceGenerator }
            );
            return { inserted: false, deduped: false, errored: true };
        }

        const priorRows = existing.data ?? [];
        const textMatch = priorRows.find(
            (r: any) => r.observation_text === candidate.observationText
        );
        if (textMatch) {
            return { inserted: false, deduped: true, errored: false };
        }

        // Optional supersession.
        if (candidate.supersedesPrior && priorRows.length > 0) {
            await sb
                .from("observations")
                .update({ status: "superseded" })
                .in("id", priorRows.map((r: any) => r.id));
        }

        // Insert.
        const inserted = await sb.from("observations").insert({
            workspace_id: workspaceId,
            observation_text: candidate.observationText,
            related_object_type: candidate.relatedObjectType ?? null,
            related_object_id: candidate.relatedObjectId ?? null,
            source_generator: sourceGenerator,
            confidence: candidate.confidence ?? null,
            status: "active",
            written_at: now
        }).select().single();

        if (inserted.error) {
            console.error("[heartbeat] insert failed:", inserted.error, {
                workspaceId,
                sourceGenerator
            });
            return { inserted: false, deduped: false, errored: true };
        }

        // Backfill superseded_by links (best-effort).
        if (candidate.supersedesPrior && priorRows.length > 0) {
            await sb
                .from("observations")
                .update({ superseded_by: (inserted.data as any).id })
                .in("id", priorRows.map((r: any) => r.id));
        }

        return { inserted: true, deduped: false, errored: false };
    } catch (err) {
        console.error("[heartbeat] writeObservation threw:", err, {
            workspaceId,
            sourceGenerator
        });
        return { inserted: false, deduped: false, errored: true };
    }
}

async function runGenerator(
    sb: SupabaseClient,
    ctx: GeneratorContext,
    generator: RegisteredGenerator
): Promise<{
    generatorId: string;
    produced: number;
    inserted: number;
    deduped: number;
    errored: number;
}> {
    let candidates: ReadonlyArray<ObservationCandidate>;
    try {
        candidates = await generator.run(ctx);
    } catch (err) {
        console.error("[heartbeat] generator threw:", err, {
            generatorId: generator.id,
            workspaceId: ctx.workspaceId
        });
        return {
            generatorId: generator.id,
            produced: 0,
            inserted: 0,
            deduped: 0,
            errored: 1
        };
    }

    let inserted = 0;
    let deduped = 0;
    let errored = 0;
    for (const candidate of candidates) {
        const outcome = await writeObservation(
            sb,
            ctx.workspaceId,
            generator.id,
            candidate,
            ctx.now
        );
        if (outcome.inserted) inserted += 1;
        if (outcome.deduped) deduped += 1;
        if (outcome.errored) errored += 1;
    }

    return {
        generatorId: generator.id,
        produced: candidates.length,
        inserted,
        deduped,
        errored
    };
}

// ─── Main entrypoint ────────────────────────────────────────────

interface HeartbeatReport {
    ok: boolean;
    startedAt: string;
    endedAt: string;
    durationMs: number;
    workspaces: number;
    generators: number;
    totals: {
        produced: number;
        inserted: number;
        deduped: number;
        errored: number;
    };
    perWorkspace?: Array<{
        workspaceId: string;
        runs: Array<{
            generatorId: string;
            produced: number;
            inserted: number;
            deduped: number;
            errored: number;
        }>;
    }>;
}

async function runHeartbeat(sb: SupabaseClient): Promise<HeartbeatReport> {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();

    const workspaces = await listActiveWorkspaces(sb);
    const totals = { produced: 0, inserted: 0, deduped: 0, errored: 0 };
    const perWorkspace: HeartbeatReport["perWorkspace"] = [];

    if (REGISTERED_GENERATORS.length === 0) {
        // Phase A: no generators registered yet. Return early; the
        // heartbeat still runs to confirm the infrastructure works.
        const endedAt = new Date().toISOString();
        return {
            ok: true,
            startedAt,
            endedAt,
            durationMs: Date.now() - startMs,
            workspaces: workspaces.length,
            generators: 0,
            totals,
            perWorkspace: []
        };
    }

    for (const workspace of workspaces) {
        const session = await loadSessionContext(sb, workspace.id);
        const ctx: GeneratorContext = {
            workspaceId: workspace.id,
            now: new Date().toISOString(),
            session
        };

        const runs: NonNullable<HeartbeatReport["perWorkspace"]>[number]["runs"] = [];
        for (const generator of REGISTERED_GENERATORS) {
            const result = await runGenerator(sb, ctx, generator);
            runs.push(result);
            totals.produced += result.produced;
            totals.inserted += result.inserted;
            totals.deduped += result.deduped;
            totals.errored += result.errored;
        }
        perWorkspace.push({ workspaceId: workspace.id, runs });
    }

    const endedAt = new Date().toISOString();
    return {
        ok: true,
        startedAt,
        endedAt,
        durationMs: Date.now() - startMs,
        workspaces: workspaces.length,
        generators: REGISTERED_GENERATORS.length,
        totals,
        perWorkspace
    };
}

// ─── HTTP serve loop ─────────────────────────────────────────────

// @ts-ignore - Deno global; resolved at deploy time
serve(async (req: Request): Promise<Response> => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ ok: false, error: "POST only" }), {
            status: 405,
            headers: { "content-type": "application/json" }
        });
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

    const sb = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const report = await runHeartbeat(sb);
        console.log(
            "[heartbeat] run complete:",
            JSON.stringify({
                workspaces: report.workspaces,
                generators: report.generators,
                totals: report.totals,
                durationMs: report.durationMs
            })
        );
        return new Response(JSON.stringify(report), {
            status: 200,
            headers: { "content-type": "application/json" }
        });
    } catch (err) {
        console.error("[heartbeat] run failed:", err);
        return new Response(
            JSON.stringify({
                ok: false,
                error: err instanceof Error ? err.message : String(err)
            }),
            { status: 500, headers: { "content-type": "application/json" } }
        );
    }
});
