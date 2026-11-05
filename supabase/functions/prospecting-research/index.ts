/**
 * Prospecting Desk research Edge Function.
 *
 * Runs Antaeus's own cited web research for the Prospecting Desk room
 * (canon §4.6). On demand only — there is no cron.
 *
 * Two actions:
 *   - find:     the seller describes who they are after; returns up to 8
 *               matching companies, each with sources from web search.
 *   - research: the seller names 1-5 companies; returns a sourced brief
 *               for each, with SUGGESTED answers to the three
 *               qualification questions (the room never treats them as
 *               answered until the seller confirms them).
 *
 * Request:
 *   POST { action: "find", workspaceId, description, icp?, focus?, exclude?: string[] }
 *   POST { action: "research", workspaceId, companies: string[], description?, icp?, focus? }
 *
 * Auth: a user JWT whose owner is a member of workspaceId, or the
 * service-role key. The function writes with its service-role client, so
 * membership is checked before any paid call or ledger write.
 *
 * Cost: per-workspace weekly ceiling read from prospecting_research_runs.
 * warn at 80%, throttle (fewer searches + results) at 100%, pause (no
 * paid call) at 150%.
 */

// deno-lint-ignore-file no-explicit-any

import {
    createClient,
    SupabaseClient
} from "https://esm.sh/@supabase/supabase-js@2";
import { callWithWebSearch } from "./anthropic.ts";
import {
    budgetStateFor,
    buildAllowedUrlSet,
    buildFindPrompt,
    buildResearchPrompt,
    cleanNameList,
    cleanText,
    extractJsonArray,
    FIND_SYSTEM_PROMPT,
    MAX_CONTEXT_CHARS,
    MAX_DESCRIPTION_CHARS,
    MAX_EXCLUDE,
    MAX_FIND_RESULTS,
    MAX_RESEARCH_COMPANIES,
    parseFoundCompanies,
    parseResearchedCompanies,
    RESEARCH_SYSTEM_PROMPT,
    WEEKLY_CEILING_USD,
    type BudgetState,
    type SellerContext
} from "./_shared.ts";

type Action = "find" | "research";

interface RunOutcome {
    readonly ok: boolean;
    readonly status: "completed" | "throttled" | "failed" | "paused";
    readonly companies: ReadonlyArray<unknown>;
    readonly not_found: ReadonlyArray<string>;
    readonly budget: { readonly state: BudgetState; readonly spent_usd: number; readonly ceiling_usd: number };
    readonly cost_usd: number;
    readonly search_count: number;
    readonly run_id: string | null;
    readonly error: string | null;
}

async function weeklySpend(sb: SupabaseClient, workspaceId: string): Promise<number> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await sb
        .from("prospecting_research_runs")
        .select("total_cost_usd")
        .eq("workspace_id", workspaceId)
        .gte("started_at", weekAgo);
    if (res.error) throw new Error(`Cost lookup failed: ${res.error.message}`);
    if (!Array.isArray(res.data)) throw new Error("Cost lookup returned an invalid result");
    return res.data.reduce((sum: number, r: any) => sum + (Number(r.total_cost_usd) || 0), 0);
}

async function closeRun(sb: SupabaseClient, runId: string, patch: Record<string, unknown>): Promise<void> {
    const { error } = await sb
        .from("prospecting_research_runs")
        .update({ ...patch, completed_at: new Date().toISOString() })
        .eq("id", runId);
    if (error) throw new Error(error.message);
}

async function runResearch(
    sb: SupabaseClient,
    workspaceId: string,
    userId: string | null,
    action: Action,
    ctx: SellerContext,
    exclude: ReadonlyArray<string>,
    companiesAsked: ReadonlyArray<string>
): Promise<RunOutcome> {
    const spent = await weeklySpend(sb, workspaceId);
    const state = budgetStateFor(spent);
    const budget = { state, spent_usd: Math.round(spent * 100) / 100, ceiling_usd: WEEKLY_CEILING_USD };
    if (state === "paused") {
        return {
            ok: false, status: "paused", companies: [], not_found: [], budget,
            cost_usd: 0, search_count: 0, run_id: null,
            error: `Weekly research budget reached ($${spent.toFixed(2)})`
        };
    }
    const throttled = state === "throttled";

    const insertRun = await sb
        .from("prospecting_research_runs")
        .insert({
            workspace_id: workspaceId,
            created_by: userId,
            action,
            status: "running",
            inputs: {
                description: ctx.description,
                icp: ctx.icp,
                focus: ctx.focus,
                companies: companiesAsked,
                exclude_count: exclude.length,
                throttled
            }
        })
        .select("id")
        .single();
    if (insertRun.error || !insertRun.data) {
        return {
            ok: false, status: "failed", companies: [], not_found: [], budget,
            cost_usd: 0, search_count: 0, run_id: null,
            error: insertRun.error?.message ?? "Could not open run ledger row"
        };
    }
    const runId = insertRun.data.id as string;

    let cost = 0;
    let searchCount = 0;
    let callCount = 0;
    try {
        const limit = throttled ? 4 : MAX_FIND_RESULTS;
        const call = await callWithWebSearch({
            model: "sonnet_4_6",
            system_prompt: action === "find" ? FIND_SYSTEM_PROMPT : RESEARCH_SYSTEM_PROMPT,
            user_prompt: action === "find"
                ? buildFindPrompt(ctx, exclude, limit)
                : buildResearchPrompt(ctx, companiesAsked),
            max_tokens: action === "find" ? 6000 : 8000,
            max_searches: throttled ? 3 : action === "find" ? 8 : Math.min(10, 2 + companiesAsked.length * 2)
        });
        cost = call.cost_usd;
        searchCount = call.search_count;
        callCount = 1;
        if (!call.ok) {
            await closeRun(sb, runId, {
                status: "failed", results_count: 0, total_cost_usd: cost,
                search_count: searchCount, llm_call_count: 1, error_summary: call.error
            });
            return {
                ok: false, status: "failed", companies: [], not_found: [], budget,
                cost_usd: cost, search_count: searchCount, run_id: runId, error: call.error
            };
        }

        const allowed = buildAllowedUrlSet(call.result_urls);
        const raw = extractJsonArray(call.text);
        let companies: ReadonlyArray<unknown>;
        let notFound: ReadonlyArray<string> = [];
        if (action === "find") {
            companies = parseFoundCompanies(raw, allowed, exclude, limit);
        } else {
            const parsed = parseResearchedCompanies(raw, allowed, companiesAsked);
            companies = parsed.companies;
            notFound = parsed.not_found;
        }
        const status = throttled ? "throttled" : "completed";
        await closeRun(sb, runId, {
            status, results_count: companies.length, total_cost_usd: cost,
            search_count: searchCount, llm_call_count: 1, error_summary: null
        });
        return {
            ok: true, status, companies, not_found: notFound, budget,
            cost_usd: cost, search_count: searchCount, run_id: runId, error: null
        };
    } catch (err) {
        let message = err instanceof Error ? err.message : String(err);
        try {
            await closeRun(sb, runId, {
                status: "failed", results_count: 0, total_cost_usd: cost,
                search_count: searchCount, llm_call_count: callCount, error_summary: message
            });
        } catch (ledgerError) {
            message += `; run ledger update failed: ${ledgerError instanceof Error ? ledgerError.message : String(ledgerError)}`;
        }
        return {
            ok: false, status: "failed", companies: [], not_found: [], budget,
            cost_usd: cost, search_count: searchCount, run_id: runId, error: message
        };
    }
}

function corsHeaders(req: Request): Record<string, string> {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": req.headers.get("access-control-request-headers") ??
            "authorization, content-type, apikey, x-client-info, x-antaeus-client",
        "Access-Control-Max-Age": "86400"
    };
}

function json(payload: unknown, status: number, cors: Record<string, string>): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { ...cors, "Content-Type": "application/json" }
    });
}

Deno.serve(async (req: Request): Promise<Response> => {
    const cors = corsHeaders(req);
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);

    let body: Record<string, unknown>;
    try {
        const parsed = await req.json();
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        body = parsed;
    } catch {
        return json({ ok: false, error: "A JSON object with an explicit action is required" }, 400, cors);
    }
    const action = body.action;
    if (action !== "find" && action !== "research") {
        return json({ ok: false, error: "action must be find or research" }, 400, cors);
    }
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
    if (!workspaceId) return json({ ok: false, error: "workspaceId is required" }, 400, cors);

    const ctx: SellerContext = {
        description: cleanText(body.description, MAX_DESCRIPTION_CHARS),
        icp: cleanText(body.icp, MAX_CONTEXT_CHARS),
        focus: cleanText(body.focus, MAX_CONTEXT_CHARS)
    };
    const exclude = cleanNameList(body.exclude, MAX_EXCLUDE);
    let companies: string[] = [];
    if (action === "find") {
        if (ctx.description.length < 3) {
            return json({ ok: false, error: "find requires a description" }, 400, cors);
        }
    } else {
        if (Array.isArray(body.companies) && body.companies.length > MAX_RESEARCH_COMPANIES) {
            return json({ ok: false, error: `research accepts at most ${MAX_RESEARCH_COMPANIES} companies` }, 400, cors);
        }
        companies = cleanNameList(body.companies, MAX_RESEARCH_COMPANIES);
        if (companies.length === 0) {
            return json({ ok: false, error: "research requires at least one company name" }, 400, cors);
        }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRole) {
        return json({ ok: false, error: "Server configuration missing" }, 500, cors);
    }
    const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
    if (!token) return json({ ok: false, error: "Authentication required" }, 401, cors);
    const isAdmin = token === serviceRole;
    const sb = createClient(supabaseUrl, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    try {
        let userId: string | null = null;
        if (!isAdmin) {
            const { data: auth, error: authError } = await sb.auth.getUser(token);
            if (authError || !auth.user) return json({ ok: false, error: "Invalid authentication" }, 401, cors);
            userId = auth.user.id;
            const membership = await sb.from("workspace_members")
                .select("workspace_id").eq("workspace_id", workspaceId)
                .eq("user_id", userId).maybeSingle();
            if (membership.error) throw new Error("Could not verify workspace membership");
            if (!membership.data) return json({ ok: false, error: "Workspace access denied" }, 403, cors);
        }
        const outcome = await runResearch(sb, workspaceId, userId, action, ctx, exclude, companies);
        return json({ action, ...outcome }, 200, cors);
    } catch (err) {
        return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500, cors);
    }
});
