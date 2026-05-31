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

// Shared types extracted to ./types.ts so generators.ts and index.ts
// don't re-declare them. Canonical source is
// src/lib/observations/generators/types.ts (Node side).
import type {
    GeneratorContext,
    ObservationCandidate,
    RelatedObjectType
} from "./types.ts";

type Generator = (
    ctx: GeneratorContext,
    sb: SupabaseClient
) => Promise<ReadonlyArray<ObservationCandidate>>;

interface RegisteredGenerator {
    readonly id: string;
    readonly run: Generator;
}

// ─── Phase B registry (ADR-009, 2026-05-31) ──────────────────────
// Four SQL-only workspace-scope generators. The runtime implementations
// live in ./generators.ts; pure-function source of truth + tests live
// in src/lib/observations/generators/*.

import { PHASE_B_GENERATORS } from "./generators.ts";

const REGISTERED_GENERATORS: ReadonlyArray<RegisteredGenerator> =
    PHASE_B_GENERATORS;

// ─── Workspace activity filter ──────────────────────────────────

const HEARTBEAT_ACTIVE_DAYS = 7;

/**
 * Enumerate the workspaces the heartbeat should run against. A
 * workspace is "active" if it has any session activity OR any
 * recent observation in the last HEARTBEAT_ACTIVE_DAYS days, OR has
 * any data in the noun tables Phase B's generators read (deals,
 * signal_console_accounts, proofs, discovery_call_logs). The
 * noun-table check is the bootstrap path: a workspace with data but
 * no session row (because no room calls bootSession yet) and no prior
 * observation (chicken-and-egg) still gets generator coverage.
 *
 * Service-role auth means the queries below bypass RLS — necessary for
 * cross-workspace enumeration. The generators themselves run per-
 * workspace and are scoped via `.eq("workspace_id", ...)`.
 */
async function listActiveWorkspaces(sb: SupabaseClient): Promise<Array<{ id: string }>> {
    const since = new Date(
        Date.now() - HEARTBEAT_ACTIVE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const ids = new Set<string>();

    // 1. Session-touched workspaces (the original Phase A filter).
    const sessionRows = await sb
        .from("workspace_sessions")
        .select("workspace_id")
        .gte("updated_at", since);
    if (sessionRows.error) {
        console.error(
            "[heartbeat] failed to list active sessions:",
            sessionRows.error
        );
    } else {
        for (const row of sessionRows.data ?? []) {
            ids.add((row as any).workspace_id);
        }
    }

    // 2. Recently-written observations (a generator may have written
    //    something even if no session activity).
    const obsRows = await sb
        .from("observations")
        .select("workspace_id")
        .gte("written_at", since);
    if (obsRows.error) {
        console.error(
            "[heartbeat] failed to list active observations:",
            obsRows.error
        );
    } else {
        for (const row of obsRows.data ?? []) {
            ids.add((row as any).workspace_id);
        }
    }

    // 3. Phase B bootstrap (ADR-009): workspaces with any data in the
    //    noun tables Phase B's generators consume. No date filter —
    //    the generators themselves decide what's "stale enough"; the
    //    heartbeat just needs to know which workspaces have data to
    //    look at. 10000 row cap per table is generous for current
    //    scale (1-100 workspaces, ≤100 rows per workspace average).
    //    Tables explicitly enumerated rather than dynamically
    //    discovered so the bootstrap surface is auditable.
    const NOUN_TABLES = [
        "deals",
        "signal_console_accounts",
        "proofs",
        "discovery_call_logs"
    ];
    for (const table of NOUN_TABLES) {
        const resp = await sb
            .from(table)
            .select("workspace_id")
            .not("workspace_id", "is", null)
            .limit(10000);
        if (resp.error) {
            console.error(
                `[heartbeat] failed to scan ${table} for active workspaces:`,
                resp.error
            );
            continue;
        }
        for (const row of resp.data ?? []) {
            const wid = (row as any).workspace_id;
            if (wid) ids.add(wid);
        }
    }

    return Array.from(ids).map((id) => ({ id }));
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
        focusedObjectType: row.focused_object_type as RelatedObjectType | null,
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
        // Dedupe scan. CRITICAL: PostgREST `.eq(col, null)` becomes
        // SQL `col = null`, which never matches NULL rows — you must
        // use `.is(col, null)` for NULL comparison. Workspace-scoped
        // observations (discovery_rhythm) carry null related_object_*,
        // so the old `.eq(..., null)` found zero prior rows every tick,
        // supersession never fired, and duplicates stacked. Branch on
        // null to pick the right operator.
        let query = sb
            .from("observations")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("source_generator", sourceGenerator)
            .eq("status", "active");
        query =
            candidate.relatedObjectType === null ||
            candidate.relatedObjectType === undefined
                ? query.is("related_object_type", null)
                : query.eq("related_object_type", candidate.relatedObjectType);
        query =
            candidate.relatedObjectId === null ||
            candidate.relatedObjectId === undefined
                ? query.is("related_object_id", null)
                : query.eq("related_object_id", candidate.relatedObjectId);
        const existing = await query.limit(5);

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
        candidates = await generator.run(ctx, sb);
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

    // Phase E (ADR-012) — fire any due scheduled skills for every
    // workspace. Independent of the generator loop; cheap SQL.
    await fireDueScheduledSkills(sb);

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

// ─── Phase E (ADR-012) — scheduled skill firing ──────────────────

/**
 * Read every `scheduled_skills` row whose next_fire_at is past, write
 * a `scheduled_skill_fires` ledger entry (idempotent on
 * (schedule_id, fired_at)), then advance next_fire_at via the cadence.
 *
 * Re-implements the cadence math from src/skills/lib/scheduling.ts in
 * Deno because cross-runtime imports aren't available. Logic stays in
 * sync; both sides have tests.
 */
async function fireDueScheduledSkills(sb: SupabaseClient): Promise<void> {
    const nowIso = new Date().toISOString();
    const dueResp = await sb
        .from("scheduled_skills")
        .select("id, workspace_id, skill_id, cadence_kind, cadence_data")
        .lte("next_fire_at", nowIso);
    if (dueResp.error) {
        console.error(
            "[heartbeat] scheduled_skills select failed:",
            dueResp.error
        );
        return;
    }
    const due = (dueResp.data ?? []) as Array<{
        id: string;
        workspace_id: string;
        skill_id: string;
        cadence_kind: string;
        cadence_data: unknown;
    }>;
    if (due.length === 0) return;

    const firedAt = new Date();
    for (const row of due) {
        const cadence = parseCadenceDeno(row.cadence_kind, row.cadence_data);
        if (!cadence) {
            console.warn(
                `[heartbeat] scheduled_skill ${row.id} has unparseable cadence; skipping`
            );
            continue;
        }
        // Write the fire ledger row.
        const insertResp = await sb.from("scheduled_skill_fires").insert({
            workspace_id: row.workspace_id,
            schedule_id: row.id,
            skill_id: row.skill_id,
            fired_at: firedAt.toISOString()
        });
        if (insertResp.error) {
            // If it's a unique-constraint collision (already fired this
            // tick), that's fine — idempotent retry.
            const code = (insertResp.error as { code?: string }).code;
            if (code !== "23505") {
                console.error(
                    `[heartbeat] fire-insert failed for schedule ${row.id}:`,
                    insertResp.error
                );
                continue;
            }
        }
        // Advance next_fire_at.
        const nextFire = nextFireAtDeno(cadence, firedAt);
        const updateResp = await sb
            .from("scheduled_skills")
            .update({
                next_fire_at: nextFire.toISOString(),
                last_fired_at: firedAt.toISOString()
            })
            .eq("id", row.id);
        if (updateResp.error) {
            console.error(
                `[heartbeat] next_fire_at update failed for schedule ${row.id}:`,
                updateResp.error
            );
        }
    }
}

// Cadence helpers (Deno duplicate of src/skills/lib/scheduling.ts).
const DAY_INDEX_DENO: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
};

interface ParsedCadence {
    kind: "daily" | "weekly" | "monthly";
    hour: number;
    minute: number;
    dayOfWeek?: string;
    dayOfMonth?: number;
}

function parseCadenceDeno(kind: string, data: unknown): ParsedCadence | null {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const o = data as Record<string, unknown>;
    const hour = typeof o.hour === "number" ? o.hour : null;
    const minute = typeof o.minute === "number" ? o.minute : null;
    if (hour === null || minute === null) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    if (kind === "daily") return { kind: "daily", hour, minute };
    if (kind === "weekly") {
        const dow = typeof o.day_of_week === "string" ? o.day_of_week : null;
        if (!dow || !(dow in DAY_INDEX_DENO)) return null;
        return { kind: "weekly", hour, minute, dayOfWeek: dow };
    }
    if (kind === "monthly") {
        const dom = typeof o.day_of_month === "number" ? o.day_of_month : null;
        if (dom === null || dom < 1 || dom > 31) return null;
        return { kind: "monthly", hour, minute, dayOfMonth: dom };
    }
    return null;
}

function nextFireAtDeno(c: ParsedCadence, from: Date): Date {
    const next = new Date(from.getTime());
    next.setUTCHours(c.hour, c.minute, 0, 0);
    if (c.kind === "daily") {
        if (next.getTime() <= from.getTime()) {
            next.setUTCDate(next.getUTCDate() + 1);
        }
        return next;
    }
    if (c.kind === "weekly") {
        const targetDow = DAY_INDEX_DENO[c.dayOfWeek!];
        const currentDow = next.getUTCDay();
        let daysAhead = (targetDow - currentDow + 7) % 7;
        if (daysAhead === 0 && next.getTime() <= from.getTime()) {
            daysAhead = 7;
        }
        next.setUTCDate(next.getUTCDate() + daysAhead);
        return next;
    }
    // monthly
    setMonthlyDayDeno(next, c.dayOfMonth!);
    if (next.getTime() <= from.getTime()) {
        // Reset date to 1 BEFORE incrementing month so a current
        // date of 31 doesn't overflow into the month after the next
        // when that next month is shorter (Jan 31 + 1 → Mar 3,
        // skipping February). See scheduling.ts for the same fix.
        next.setUTCDate(1);
        next.setUTCMonth(next.getUTCMonth() + 1);
        setMonthlyDayDeno(next, c.dayOfMonth!);
    }
    return next;
}

function setMonthlyDayDeno(d: Date, targetDom: number): void {
    d.setUTCDate(1);
    const lastDay = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)
    ).getUTCDate();
    d.setUTCDate(Math.min(targetDom, lastDay));
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
