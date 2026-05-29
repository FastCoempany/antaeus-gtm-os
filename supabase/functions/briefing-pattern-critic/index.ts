/**
 * Briefing pattern critic Edge Function.
 *
 * Retroactive voice-quality scorer for the B.7 Eval Harness. Reads
 * unscored briefing_pattern_eval rows, joins them to the originating
 * briefing_patterns row to get the text the gate already approved,
 * sends each Pattern through a critic prompt (Sonnet 4.6), and
 * writes critic_score + critic_notes + critic_model + scored_at
 * back into the eval row.
 *
 * Scope per invocation: at most CRITIC_BATCH_SIZE rows (default 10)
 * per workspace, oldest unscored first. The cron fires weekly
 * (Wednesday 14:00 UTC, between Monday pipeline runs), so the
 * accumulated unscored queue stays bounded.
 *
 * Costs: one Sonnet 4.6 call per Pattern, ~$0.003-0.005 each.
 * Bounded per run by CRITIC_BATCH_SIZE.
 *
 * Failure isolation: per-row LLM failures log + skip; the worker
 * keeps going. RLS is bypassed via service-role key; the new
 * service_role-only UPDATE policy on briefing_pattern_eval
 * (migration 20260529020000) authorizes the writes.
 *
 * Schedule: pg_cron job in migration 20260529030000 (commented out
 * by default — founder uncomments after deploy + confirms the Vault
 * secret is still valid, same pattern as briefing-pipeline +
 * heartbeat).
 *
 * Runtime: Deno (Supabase Edge Functions). Self-contained; does
 * NOT import from briefing-pipeline/ since each function deploys
 * separately.
 */

// @ts-ignore - Deno URL import; resolved at deploy time
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore - Deno URL import; resolved at deploy time
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { callCriticAnthropic } from "./anthropic.ts";
import { buildCriticPrompt, parseCriticOutput } from "./prompt.ts";

const CRITIC_BATCH_SIZE = 10;
const CRITIC_MODEL_ID = "claude-sonnet-4-6";
const CRITIC_PROMPT_VERSION = "v1.0.0";

interface PatternEvalRow {
    id: string;
    workspace_id: string;
    pattern_id: string;
    cluster_type: string | null;
    anchor: string | null;
}

interface PatternRow {
    id: string;
    title: string;
    body: string;
    six_questions: Record<string, unknown> | null;
    recommended_moves: unknown;
    confidence: number;
    evidence_count: number;
    source_count: number;
}

interface WorkspaceReport {
    workspace_id: string;
    scored: number;
    errored: number;
    skipped: number;
    cost_usd: number;
}

interface CriticReport {
    ok: boolean;
    started_at: string;
    ended_at: string;
    duration_ms: number;
    workspaces: number;
    totals: {
        scored: number;
        errored: number;
        skipped: number;
        cost_usd: number;
    };
    perWorkspace: WorkspaceReport[];
}

async function loadActiveWorkspaces(sb: SupabaseClient): Promise<string[]> {
    // The critic runs against every workspace that has at least one
    // unscored pattern_eval row; the active-workspace filter the
    // pipeline uses is overkill here since synthesis already gated
    // on activity.
    const r = await sb
        .from("briefing_pattern_eval")
        .select("workspace_id")
        .is("critic_score", null)
        .limit(1000);
    if (r.error) {
        console.error("[pattern-critic] failed to enumerate workspaces:", r.error);
        return [];
    }
    const seen = new Set<string>();
    for (const row of (r.data ?? []) as Array<{ workspace_id: string }>) {
        if (row.workspace_id) seen.add(row.workspace_id);
    }
    return Array.from(seen);
}

async function loadUnscoredForWorkspace(
    sb: SupabaseClient,
    workspaceId: string,
    limit: number
): Promise<PatternEvalRow[]> {
    const r = await sb
        .from("briefing_pattern_eval")
        .select("id, workspace_id, pattern_id, cluster_type, anchor")
        .eq("workspace_id", workspaceId)
        .is("critic_score", null)
        .order("captured_at", { ascending: true })
        .limit(limit);
    if (r.error) {
        console.error("[pattern-critic] unscored read failed:", { workspaceId, error: r.error });
        return [];
    }
    return ((r.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id ?? ""),
        workspace_id: String(row.workspace_id ?? ""),
        pattern_id: String(row.pattern_id ?? ""),
        cluster_type: row.cluster_type === null || row.cluster_type === undefined
            ? null
            : String(row.cluster_type),
        anchor: row.anchor === null || row.anchor === undefined ? null : String(row.anchor)
    }));
}

async function loadPattern(
    sb: SupabaseClient,
    patternId: string
): Promise<PatternRow | null> {
    const r = await sb
        .from("briefing_patterns")
        .select("id, title, body, six_questions, recommended_moves, confidence, evidence_count, source_count")
        .eq("id", patternId)
        .maybeSingle();
    if (r.error || !r.data) return null;
    const row = r.data as Record<string, unknown>;
    return {
        id: String(row.id ?? ""),
        title: String(row.title ?? ""),
        body: String(row.body ?? ""),
        six_questions: (row.six_questions as Record<string, unknown> | null) ?? null,
        recommended_moves: row.recommended_moves ?? [],
        confidence: typeof row.confidence === "number" ? row.confidence : 0,
        evidence_count: typeof row.evidence_count === "number" ? row.evidence_count : 0,
        source_count: typeof row.source_count === "number" ? row.source_count : 0
    };
}

async function critiqueOne(
    sb: SupabaseClient,
    evalRow: PatternEvalRow
): Promise<{ scored: boolean; errored: boolean; skipped: boolean; cost_usd: number }> {
    const pattern = await loadPattern(sb, evalRow.pattern_id);
    if (!pattern) {
        console.warn("[pattern-critic] pattern not found, marking skipped:", evalRow);
        return { scored: false, errored: false, skipped: true, cost_usd: 0 };
    }

    const promptInput = {
        title: pattern.title,
        analysis: pattern.body,
        six_questions: pattern.six_questions,
        recommended_moves: pattern.recommended_moves,
        confidence: pattern.confidence,
        evidence_count: pattern.evidence_count,
        source_count: pattern.source_count,
        cluster_type: evalRow.cluster_type,
        anchor: evalRow.anchor
    };
    const { system_prompt, user_prompt } = buildCriticPrompt(promptInput);

    const llm = await callCriticAnthropic({
        model_api_id: CRITIC_MODEL_ID,
        system_prompt,
        user_prompt,
        max_tokens: 800
    });

    if (!llm.ok) {
        console.error("[pattern-critic] LLM call failed:", {
            evalId: evalRow.id,
            patternId: evalRow.pattern_id,
            error: llm.error
        });
        return { scored: false, errored: true, skipped: false, cost_usd: 0 };
    }

    const parsed = parseCriticOutput(llm.text);
    if (parsed === null) {
        console.error("[pattern-critic] critic output parse failed:", {
            evalId: evalRow.id,
            preview: llm.text.slice(0, 200)
        });
        return { scored: false, errored: true, skipped: false, cost_usd: llm.cost_usd };
    }

    const update = await sb
        .from("briefing_pattern_eval")
        .update({
            critic_score: parsed.score,
            critic_notes: {
                voice_concerns: parsed.voice_concerns,
                banned_vocabulary: parsed.banned_vocabulary,
                hedging_concerns: parsed.hedging_concerns,
                strengths: parsed.strengths,
                summary: parsed.summary,
                prompt_version: CRITIC_PROMPT_VERSION
            },
            critic_model: CRITIC_MODEL_ID,
            scored_at: new Date().toISOString()
        })
        .eq("id", evalRow.id);

    if (update.error) {
        console.error("[pattern-critic] UPDATE failed:", {
            evalId: evalRow.id,
            error: update.error
        });
        return { scored: false, errored: true, skipped: false, cost_usd: llm.cost_usd };
    }
    return { scored: true, errored: false, skipped: false, cost_usd: llm.cost_usd };
}

async function critiqueForWorkspace(
    sb: SupabaseClient,
    workspaceId: string
): Promise<WorkspaceReport> {
    const rows = await loadUnscoredForWorkspace(sb, workspaceId, CRITIC_BATCH_SIZE);
    let scored = 0;
    let errored = 0;
    let skipped = 0;
    let cost_usd = 0;
    for (const row of rows) {
        const r = await critiqueOne(sb, row);
        if (r.scored) scored += 1;
        if (r.errored) errored += 1;
        if (r.skipped) skipped += 1;
        cost_usd = Math.round((cost_usd + r.cost_usd) * 10000) / 10000;
    }
    return { workspace_id: workspaceId, scored, errored, skipped, cost_usd };
}

// ─── HTTP serve loop ──────────────────────────────────────────────

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

    const sb = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const started = new Date();
    const workspaces = await loadActiveWorkspaces(sb);
    const perWorkspace: WorkspaceReport[] = [];
    let totalScored = 0;
    let totalErrored = 0;
    let totalSkipped = 0;
    let totalCost = 0;

    for (const ws of workspaces) {
        try {
            const wsReport = await critiqueForWorkspace(sb, ws);
            perWorkspace.push(wsReport);
            totalScored += wsReport.scored;
            totalErrored += wsReport.errored;
            totalSkipped += wsReport.skipped;
            totalCost = Math.round((totalCost + wsReport.cost_usd) * 10000) / 10000;
        } catch (err) {
            console.error("[pattern-critic] workspace failed:", { workspaceId: ws, err });
            perWorkspace.push({
                workspace_id: ws,
                scored: 0,
                errored: 1,
                skipped: 0,
                cost_usd: 0
            });
            totalErrored += 1;
        }
    }

    const ended = new Date();
    const report: CriticReport = {
        ok: true,
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        duration_ms: ended.getTime() - started.getTime(),
        workspaces: workspaces.length,
        totals: {
            scored: totalScored,
            errored: totalErrored,
            skipped: totalSkipped,
            cost_usd: totalCost
        },
        perWorkspace
    };

    return new Response(JSON.stringify(report), {
        status: 200,
        headers: { "content-type": "application/json" }
    });
});
