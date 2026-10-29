/**
 * Outdoors Events discovery Edge Function (ADR-016 PR 2).
 *
 * Finds real, currently scheduled offline events relevant to a workspace's
 * product category or target buyer roles and stores them in outdoors_events.
 * The model must ground every returned event in a live source URL.
 *
 * Two invocation modes:
 *   - Cron (no body / {action:"run_all"}): enumerate active workspaces,
 *     run discovery for each. The pg_cron job calls this weekly.
 *   - On-demand ({action:"run_one", workspaceId}): run discovery for a
 *     single workspace.
 *
 * Per run, an outdoors_events_runs ledger row tracks status, cost,
 * search count, and events written. Events upsert on dedupe_key so the
 * same event does not surface twice across runs.
 */

// deno-lint-ignore-file no-explicit-any

import {
    createClient,
    SupabaseClient
} from "https://esm.sh/@supabase/supabase-js@2";
import { callWithWebSearch } from "./anthropic.ts";
import {
    buildDedupeKey,
    extractJsonArray,
    parseDiscoveredEvents,
    type DiscoveredEvent
} from "./_shared.ts";

// ─── Cost ceiling ──────────────────────────────────────────────────

const WEEKLY_CEILING_USD = 2.0;
const THROTTLE_AT = 1.0;
const PAUSE_AT = WEEKLY_CEILING_USD * 1.5;

// ─── Workspace profile ─────────────────────────────────────────────

interface WorkspaceProfile {
    readonly product_category: string | null;
    readonly what_we_sell: string | null;
    readonly value_prop: string | null;
}

async function readProfile(
    sb: SupabaseClient,
    workspaceId: string
): Promise<WorkspaceProfile> {
    try {
        const res = await sb
            .from("workspace_profile")
            .select("product_category, what_we_sell, value_prop")
            .eq("workspace_id", workspaceId)
            .maybeSingle();
        if (res.error || !res.data) {
            return { product_category: null, what_we_sell: null, value_prop: null };
        }
        return {
            product_category: res.data.product_category ?? null,
            what_we_sell: res.data.what_we_sell ?? null,
            value_prop: res.data.value_prop ?? null
        };
    } catch {
        return { product_category: null, what_we_sell: null, value_prop: null };
    }
}

// ─── Weekly spend so far (cost ceiling) ────────────────────────────

async function weeklySpend(
    sb: SupabaseClient,
    workspaceId: string
): Promise<number> {
    try {
        const weekAgo = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        const res = await sb
            .from("outdoors_events_runs")
            .select("total_cost_usd")
            .eq("workspace_id", workspaceId)
            .gte("started_at", weekAgo);
        if (res.error || !Array.isArray(res.data)) return 0;
        return res.data.reduce(
            (sum: number, r: any) => sum + (Number(r.total_cost_usd) || 0),
            0
        );
    } catch {
        return 0;
    }
}

// ─── Prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a research assistant for a B2B go-to-market operator. Find real, currently scheduled conferences, trade shows, summits, mixers, meetups, and similar events that are relevant to the operator's product category or target buyer roles.

You MUST use web search to find real events with real, currently live registration or information pages. Never invent an event, date, location, or URL. If you are not confident an event is real and upcoming, leave it out.

Classify each event into exactly one relevance tier:
- "direct": the event is focused directly on the operator's product category or market.
- "adjacent": the event is focused on the buyer roles, functions, or business problems the operator targets, even when the event is not about the operator's category itself.
- "indirect": the event is broader but related to the operator's market, territory, or buyer context. Include it only when the relationship is specific enough to explain in one sentence.

For relevance_reason, state the concrete relationship between the event and the operator's category or buyer context. Use complete sentences. Do not claim that a buyer will attend unless a source supports that claim. Avoid buzzwords and promotional language.

Return ONLY a JSON array, no prose around it. Each element:
{
  "name": "string (the event name)",
  "kind": "string (conference | trade show | summit | mixer | meetup | ...)",
  "where_at": "string (city, venue, or 'Online')",
  "start_date": "YYYY-MM-DD or null if unknown",
  "end_date": "YYYY-MM-DD or null",
  "tags": ["persona or topic tags"],
  "source_url": "https://... (REQUIRED — the real event page)",
  "relevance_tier": "direct | adjacent | indirect",
  "relevance_reason": "one plain sentence"
}

Aim for 6-12 events across the applicable tiers. Prefer events in the next 6 months. Every returned event must have a working source URL.`;

function buildUserPrompt(profile: WorkspaceProfile, throttled: boolean): string {
    const category =
        profile.product_category?.trim() || "(product category not set)";
    const sell = profile.what_we_sell?.trim();
    const value = profile.value_prop?.trim();
    const lines: string[] = [
        `Product category: ${category}`
    ];
    if (sell) lines.push(`What they sell: ${sell}`);
    if (value) lines.push(`Value proposition: ${value}`);
    lines.push("");
    if (throttled) {
        lines.push(
            "BUDGET NOTE: focus on direct-tier events only. Skip adjacent and indirect events for this run."
        );
    } else {
        lines.push(
            "Find events across the applicable direct, adjacent, and indirect tiers. Use web search to confirm each event is real and upcoming."
        );
    }
    return lines.join("\n");
}

// ─── Per-workspace run ─────────────────────────────────────────────

interface RunResult {
    readonly workspaceId: string;
    readonly status: "completed" | "failed" | "throttled" | "paused";
    readonly eventsWritten: number;
    readonly cost: number;
    readonly searchCount: number;
    readonly error: string | null;
}

async function runForWorkspace(
    sb: SupabaseClient,
    workspaceId: string
): Promise<RunResult> {
    const spent = await weeklySpend(sb, workspaceId);
    if (spent >= PAUSE_AT) {
        return {
            workspaceId,
            status: "paused",
            eventsWritten: 0,
            cost: 0,
            searchCount: 0,
            error: `Weekly cost ceiling reached ($${spent.toFixed(2)} >= $${PAUSE_AT.toFixed(2)})`
        };
    }
    const throttled = spent >= THROTTLE_AT;

    let runId: string | null = null;
    try {
        const profile = await readProfile(sb, workspaceId);
        const insertRun = await sb
            .from("outdoors_events_runs")
            .insert({
                workspace_id: workspaceId,
                status: throttled ? "throttled" : "running",
                inputs: {
                    product_category: profile.product_category,
                    throttled
                }
            })
            .select("id")
            .single();
        if (insertRun.error || !insertRun.data) {
            return {
                workspaceId,
                status: "failed",
                eventsWritten: 0,
                cost: 0,
                searchCount: 0,
                error: insertRun.error?.message ?? "Could not open run ledger row"
            };
        }
        runId = insertRun.data.id as string;

        const call = await callWithWebSearch({
            model: "sonnet_4_6",
            system_prompt: SYSTEM_PROMPT,
            user_prompt: buildUserPrompt(profile, throttled),
            max_tokens: 4096,
            max_searches: throttled ? 3 : 6
        });

        if (!call.ok) {
            await closeRun(sb, runId, {
                status: "failed",
                events_written: 0,
                total_cost_usd: call.cost_usd,
                llm_call_count: 1,
                error_summary: call.error
            });
            return {
                workspaceId,
                status: "failed",
                eventsWritten: 0,
                cost: call.cost_usd,
                searchCount: call.search_count,
                error: call.error
            };
        }

        const parsed = parseDiscoveredEvents(extractJsonArray(call.text));
        const written = await upsertEvents(sb, workspaceId, runId, parsed);

        await closeRun(sb, runId, {
            status: throttled ? "throttled" : "completed",
            events_written: written,
            total_cost_usd: call.cost_usd,
            llm_call_count: 1,
            error_summary: null
        });

        return {
            workspaceId,
            status: throttled ? "throttled" : "completed",
            eventsWritten: written,
            cost: call.cost_usd,
            searchCount: call.search_count,
            error: null
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (runId) {
            await closeRun(sb, runId, {
                status: "failed",
                events_written: 0,
                total_cost_usd: 0,
                llm_call_count: 0,
                error_summary: message
            });
        }
        return {
            workspaceId,
            status: "failed",
            eventsWritten: 0,
            cost: 0,
            searchCount: 0,
            error: message
        };
    }
}

async function closeRun(
    sb: SupabaseClient,
    runId: string,
    patch: Record<string, unknown>
): Promise<void> {
    await sb
        .from("outdoors_events_runs")
        .update({ ...patch, finished_at: new Date().toISOString() })
        .eq("id", runId);
}

async function upsertEvents(
    sb: SupabaseClient,
    workspaceId: string,
    runId: string,
    events: ReadonlyArray<DiscoveredEvent>
): Promise<number> {
    if (events.length === 0) return 0;
    const rows = events.map((event) => ({
        workspace_id: workspaceId,
        run_id: runId,
        name: event.name,
        kind: event.kind,
        where_at: event.where_at,
        start_date: event.start_date,
        end_date: event.end_date,
        tags: event.tags,
        source_url: event.source_url,
        relevance_tier: event.relevance_tier,
        relevance_reason: event.relevance_reason,
        dedupe_key: buildDedupeKey(event),
        discovered_at: new Date().toISOString()
    }));

    const { data, error } = await sb
        .from("outdoors_events")
        .upsert(rows, { onConflict: "workspace_id,dedupe_key" })
        .select("id");
    if (error) throw error;
    return Array.isArray(data) ? data.length : 0;
}

// ─── Request handling ───────────────────────────────────────────────

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRole) {
        return new Response(
            JSON.stringify({ error: "Server configuration missing" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    const sb = createClient(supabaseUrl, serviceRole, {
        auth: { persistSession: false }
    });

    let body: any = {};
    try {
        body = await req.json();
    } catch {
        body = {};
    }

    const action = body?.action === "run_one" ? "run_one" : "run_all";

    if (action === "run_one") {
        const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";
        if (!workspaceId) {
            return new Response(
                JSON.stringify({ error: "workspaceId required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
        const result = await runForWorkspace(sb, workspaceId);
        return new Response(JSON.stringify(result), {
            status: result.status === "failed" ? 500 : 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const { data: workspaces, error: wsError } = await sb
        .from("workspace_members")
        .select("workspace_id")
        .eq("status", "active");
    if (wsError) {
        return new Response(
            JSON.stringify({ error: wsError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const ids = Array.from(
        new Set((workspaces ?? []).map((row: any) => row.workspace_id).filter(Boolean))
    ) as string[];
    const results: RunResult[] = [];
    for (const id of ids) {
        results.push(await runForWorkspace(sb, id));
    }

    return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
});
