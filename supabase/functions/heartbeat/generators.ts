/**
 * Phase B workspace-scope observation generators (Deno runtime).
 *
 * Per ADR-009 (2026-05-31). Four SQL-only generators registered with
 * the heartbeat. Each issues a narrow SELECT against the workspace's
 * own tables, delegates pure logic + voice rendering to a port of the
 * src/lib/observations/generators/* module, and returns observation
 * candidates the heartbeat writer commits to the ledger.
 *
 * Sync source for the pure logic: src/lib/observations/generators/.
 * The functions below are intentionally near-verbatim copies of the
 * src-side pure functions, adapted to Deno (no imports across the
 * runtime boundary).
 *
 * Voice gate: every candidate's observationText passes through
 * validateObservation() before the heartbeat's writer commits it.
 * Failing candidates are logged + dropped (not written). The Voice
 * Document is at supabase/functions/heartbeat/voice-document.ts.
 */

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno URL import; resolved at deploy time.
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateObservation, formatViolations } from "./voice-document.ts";

// ─── Shared types ─────────────────────────────────────────────────────

type RelatedObjectType =
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
    readonly relatedObjectType?: RelatedObjectType | null;
    readonly relatedObjectId?: string | null;
    readonly confidence?: ObservationConfidence;
    readonly supersedesPrior?: boolean;
}

interface GeneratorContext {
    readonly workspaceId: string;
    readonly now: string;
    readonly session: unknown;
}

type Generator = (
    ctx: GeneratorContext,
    sb: SupabaseClient
) => Promise<ReadonlyArray<ObservationCandidate>>;

export interface RegisteredGenerator {
    readonly id: string;
    readonly run: Generator;
}

// ─── Voice gate ───────────────────────────────────────────────────────

function gateThroughVoice(
    generatorId: string,
    candidates: ReadonlyArray<ObservationCandidate>
): ReadonlyArray<ObservationCandidate> {
    const passed: ObservationCandidate[] = [];
    for (const c of candidates) {
        const v = validateObservation(c.observationText);
        if (v.valid) {
            passed.push(c);
        } else {
            console.warn(
                `[heartbeat] voice gate rejected candidate from ${generatorId}: ${formatViolations(v)} — text: ${JSON.stringify(c.observationText)}`
            );
        }
    }
    return passed;
}

// ─── 1. deal_decay ────────────────────────────────────────────────────

const STALL_THRESHOLD_DAYS = 7;
const DEAL_DECAY_GENERATOR_ID = "phase-b/deal-decay";
const CLOSED_STAGES: ReadonlySet<string> = new Set([
    "closed-won",
    "closed-lost"
]);

interface DealStageTransition {
    readonly from?: unknown;
    readonly to?: unknown;
    readonly at?: unknown;
}

function currentStageStartedAt(history: unknown): string | null {
    if (!Array.isArray(history) || history.length === 0) return null;
    for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i] as DealStageTransition;
        if (!entry) continue;
        if (typeof entry.at === "string" && entry.at.length > 0) {
            return entry.at;
        }
    }
    return null;
}

async function dealDecayGenerator(
    ctx: GeneratorContext,
    sb: SupabaseClient
): Promise<ReadonlyArray<ObservationCandidate>> {
    // Real Postgres `deals` schema: stage (text), stage_history (jsonb),
    // next_step_date (timestamptz), updated_at (timestamptz). No
    // `is_closed` or `stage_changed_at` columns — closed-ness is derived
    // from stage, stage-age is derived from stage_history.
    const { data, error } = await sb
        .from("deals")
        .select("id, account_name, stage, stage_history, next_step_date, updated_at")
        .eq("workspace_id", ctx.workspaceId)
        .not("stage", "in", '("closed-won","closed-lost")');

    if (error) {
        console.error("[heartbeat] deal_decay select failed:", error);
        return [];
    }

    const now = new Date(ctx.now);
    const candidates: ObservationCandidate[] = [];
    for (const d of (data ?? []) as Array<{
        id: string;
        account_name: string | null;
        stage: string | null;
        stage_history: unknown;
        next_step_date: string | null;
        updated_at: string | null;
    }>) {
        if (!d.stage) continue;
        if (CLOSED_STAGES.has(d.stage)) continue;

        const sinceIso =
            currentStageStartedAt(d.stage_history) ?? d.updated_at;
        if (!sinceIso) continue;
        const since = new Date(sinceIso);
        if (Number.isNaN(since.getTime())) continue;
        const daysAtStage = Math.floor(
            (now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysAtStage < STALL_THRESHOLD_DAYS) continue;

        const nextStepInFuture =
            d.next_step_date !== null &&
            d.next_step_date !== "" &&
            !Number.isNaN(new Date(d.next_step_date).getTime()) &&
            new Date(d.next_step_date).getTime() > now.getTime();
        if (nextStepInFuture) continue;

        const account = (d.account_name ?? "").trim() || "An unnamed deal";
        const stage = d.stage.trim() || "an early stage";
        const nextStepClause =
            d.next_step_date === null || d.next_step_date === ""
                ? "no dated next step"
                : "an overdue next step";

        candidates.push({
            observationText: `${account} has been at ${stage} for ${daysAtStage} days with ${nextStepClause}.`,
            relatedObjectType: "deal",
            relatedObjectId: d.id,
            confidence: "high",
            supersedesPrior: true
        });
    }
    return gateThroughVoice(DEAL_DECAY_GENERATOR_ID, candidates);
}

// ─── 2. signal_decay ──────────────────────────────────────────────────

const SILENCE_THRESHOLD_DAYS = 14;
const SIGNAL_DECAY_GENERATOR_ID = "phase-b/signal-decay";

async function signalDecayGenerator(
    ctx: GeneratorContext,
    sb: SupabaseClient
): Promise<ReadonlyArray<ObservationCandidate>> {
    const accountsResp = await sb
        .from("signal_console_accounts")
        .select("id, account_name")
        .eq("workspace_id", ctx.workspaceId);

    if (accountsResp.error) {
        console.error(
            "[heartbeat] signal_decay accounts select failed:",
            accountsResp.error
        );
        return [];
    }
    const accounts = (accountsResp.data ?? []) as Array<{
        id: string;
        account_name: string | null;
    }>;
    if (accounts.length === 0) return [];

    const accountIds = accounts.map((a) => a.id);
    const signalsResp = await sb
        .from("signals")
        .select("account_id, published_date, fetched_at, captured_at, flagged")
        .in("account_id", accountIds)
        .eq("workspace_id", ctx.workspaceId);

    if (signalsResp.error) {
        console.error(
            "[heartbeat] signal_decay signals select failed:",
            signalsResp.error
        );
        return [];
    }

    const now = new Date(ctx.now);
    const newestByAccount = new Map<string, number>();
    for (const s of (signalsResp.data ?? []) as Array<{
        account_id: string;
        published_date: string | null;
        fetched_at: string | null;
        captured_at: string | null;
        flagged: boolean | null;
    }>) {
        if (s.flagged) continue;
        const iso = s.published_date ?? s.fetched_at ?? s.captured_at;
        if (!iso) continue;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) continue;
        const prev = newestByAccount.get(s.account_id);
        if (prev === undefined || t > prev) {
            newestByAccount.set(s.account_id, t);
        }
    }

    const candidates: ObservationCandidate[] = [];
    for (const a of accounts) {
        const newest = newestByAccount.get(a.id);
        const account =
            (a.account_name ?? "").trim() || "An unnamed account";
        if (newest === undefined) {
            candidates.push({
                observationText: `${account} is on the watchlist but no signals are on record.`,
                relatedObjectType: "account",
                relatedObjectId: a.id,
                confidence: "high",
                supersedesPrior: true
            });
            continue;
        }
        const daysSilent = Math.floor(
            (now.getTime() - newest) / (1000 * 60 * 60 * 24)
        );
        if (daysSilent < SILENCE_THRESHOLD_DAYS) continue;
        candidates.push({
            observationText: `${account} has been silent for ${daysSilent} days — no fresh signal coverage.`,
            relatedObjectType: "account",
            relatedObjectId: a.id,
            confidence: "high",
            supersedesPrior: true
        });
    }
    return gateThroughVoice(SIGNAL_DECAY_GENERATOR_ID, candidates);
}

// ─── 3. proof_staleness ───────────────────────────────────────────────

const PROOF_STALENESS_GENERATOR_ID = "phase-b/proof-staleness";

async function proofStalenessGenerator(
    ctx: GeneratorContext,
    sb: SupabaseClient
): Promise<ReadonlyArray<ObservationCandidate>> {
    const { data, error } = await sb
        .from("proofs")
        .select("id, claim, claim_owner, outcome_state, created_at, duration_days")
        .eq("workspace_id", ctx.workspaceId)
        .eq("outcome_state", "open");

    if (error) {
        console.error("[heartbeat] proof_staleness select failed:", error);
        return [];
    }

    const now = new Date(ctx.now);
    const candidates: ObservationCandidate[] = [];
    for (const p of (data ?? []) as Array<{
        id: string;
        claim: string | null;
        claim_owner: string | null;
        outcome_state: string | null;
        created_at: string;
        duration_days: number;
    }>) {
        const created = new Date(p.created_at);
        if (Number.isNaN(created.getTime())) continue;
        const readout = new Date(
            created.getTime() + p.duration_days * 24 * 60 * 60 * 1000
        );
        if (readout.getTime() > now.getTime()) continue;
        const daysOverdue = Math.floor(
            (now.getTime() - readout.getTime()) / (1000 * 60 * 60 * 24)
        );
        const claim = (p.claim ?? "").trim();
        const owner = (p.claim_owner ?? "").trim();
        const subject = claim ? `The "${claim}" proof` : "A pilot proof";
        const ownerClause = owner ? ` Readout owner is ${owner}.` : "";
        const overdueClause =
            daysOverdue === 0
                ? "is at its readout window today"
                : `passed its readout window ${daysOverdue} days ago`;
        candidates.push({
            observationText: `${subject} ${overdueClause} with no recorded outcome.${ownerClause}`,
            relatedObjectType: "proof",
            relatedObjectId: p.id,
            confidence: "high",
            supersedesPrior: true
        });
    }
    return gateThroughVoice(PROOF_STALENESS_GENERATOR_ID, candidates);
}

// ─── 4. discovery_rhythm ──────────────────────────────────────────────

const WEEK_WINDOW_DAYS = 7;
const MIN_CALLS_PER_WEEK = 1;
const DISCOVERY_RHYTHM_GENERATOR_ID = "phase-b/discovery-rhythm";

async function discoveryRhythmGenerator(
    ctx: GeneratorContext,
    sb: SupabaseClient
): Promise<ReadonlyArray<ObservationCandidate>> {
    const now = new Date(ctx.now);
    const cutoff = new Date(
        now.getTime() - WEEK_WINDOW_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data, error } = await sb
        .from("discovery_call_logs")
        .select("call_date, created_at")
        .eq("workspace_id", ctx.workspaceId)
        .or(`call_date.gte.${cutoff},created_at.gte.${cutoff}`);

    if (error) {
        console.error("[heartbeat] discovery_rhythm select failed:", error);
        return [];
    }

    let count = 0;
    for (const r of (data ?? []) as Array<{
        call_date: string | null;
        created_at: string;
    }>) {
        const iso = r.call_date ?? r.created_at;
        if (!iso) continue;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) continue;
        if (t >= new Date(cutoff).getTime()) count += 1;
    }
    if (count >= MIN_CALLS_PER_WEEK) return [];

    const text =
        count === 0
            ? `No discovery calls were logged in the last ${WEEK_WINDOW_DAYS} days. Discovery is the muscle that compounds; a quiet week shows up later as a thin pipeline.`
            : `Only ${count} discovery call was logged in the last ${WEEK_WINDOW_DAYS} days. Below the floor for the cadence to compound.`;

    return gateThroughVoice(DISCOVERY_RHYTHM_GENERATOR_ID, [
        {
            observationText: text,
            relatedObjectType: null,
            relatedObjectId: null,
            confidence: "medium",
            supersedesPrior: true
        }
    ]);
}

// ─── Registry ─────────────────────────────────────────────────────────

export const PHASE_B_GENERATORS: ReadonlyArray<RegisteredGenerator> = [
    { id: DEAL_DECAY_GENERATOR_ID, run: dealDecayGenerator },
    { id: SIGNAL_DECAY_GENERATOR_ID, run: signalDecayGenerator },
    { id: PROOF_STALENESS_GENERATOR_ID, run: proofStalenessGenerator },
    { id: DISCOVERY_RHYTHM_GENERATOR_ID, run: discoveryRhythmGenerator }
];
