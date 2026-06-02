/**
 * Outdoors Events discovery Edge Function (ADR-016 PR 2).
 *
 * Finds offline gatherings relevant to a workspace's product category
 * and auto-populates the outdoors_events table — the Signal Console
 * pattern applied to events. Web-search-grounded LLM discovery: the
 * model issues real web searches, grounds its answer in live results,
 * and returns typed events with relevance tiers + real source URLs.
 *
 * Two invocation modes:
 *   - Cron (no body / {action:"run_all"}): enumerate active workspaces,
 *     run discovery for each. The pg_cron job calls this weekly.
 *   - On-demand ({action:"run_one", workspaceId}): the room's "Run
 *     discovery now" button invokes this for a single workspace.
 *
 * Per run, an outdoors_events_runs ledger row tracks status, cost,
 * search count, and events written. Events upsert on dedupe_key so the
 * same gathering doesn't surface twice across runs.
 *
 * Runtime: Deno (Supabase Edge Functions). Self-contained — types
 * duplicated from src/ on purpose, mirroring the briefing-pipeline +
 * heartbeat pattern.
 *
 * Auth: invoked by pg_cron via net.http_post with the service-role
 * key, or by the client via supabase.functions.invoke() (the user's
 * JWT — RLS lets a workspace member trigger their own run, the
 * function then uses the service role to write the ledger + events).
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.
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

// Per-workspace weekly LLM + search ceiling. Throttle drops adjacent +
// indirect tiers; pause stops the run. Mirrors the Briefing's posture.
const WEEKLY_CEILING_USD = 2.0;
const THROTTLE_AT = 1.0; // 100% of a softer working budget
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

const SYSTEM_PROMPT = `You are a research assistant for a B2B go-to-market operator. Your job is to find real, currently-scheduled offline gatherings (conferences, trade shows, summits, mixers, meetups) where the operator's buyers might be — and classify each by how relevant it is to what they sell.

You MUST use web search to find real events with real, currently-live registration or info pages. Never invent an event, a date, or a URL. If you are not confident an event is real and upcoming, leave it out.

Classify each event into exactly one relevance tier:
- "direct": the gathering is specifically about the operator's product category.
- "adjacent": the gathering is for the buyer personas the operator sells INTO, even if it isn't about the category itself.
- "indirect": the operator's ideal buyer might plausibly show up, though the event isn't category- or persona-direct.

Voice rules for the relevance_reason field: write one plain sentence a peer would say out loud. No buzzwords (no "synergy", "best-in-class", "game-changing", "supercharge", "world-class"). No manifesto fragments. Just say why this event matters for this seller.

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

Aim for 6-12 events spread across the three tiers. Prefer events in the next 6 months. Quality over quantity — every event must be real and have a working URL.`;

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
            "BUDGET NOTE: keep this lean — focus on DIRECT-tier events only (gatherings specifically about the product category). Skip adjacent and indirect this run."
        );
    } else {
        lines.push(
            "Find gatherings across all three tiers (direct, adjacent, indirect). Use web search to confirm each is real and upcoming."
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
    // Cost ceiling check.
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

    // Open the ledger row.
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

        // Discovery LLM call (web-search-grounded).
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
        const msg = err instanceof Error ? err.message : String(err);
        if (runId) {
            await closeRun(sb, runId, {
                status: "failed",
                events_written: 0,
                total_cost_usd: 0,
                llm_call_count: 0,
                error_summary: msg
            }).catch(() => {});
        }
        return {
            workspaceId,
            status: "failed",
            eventsWritten: 0,
            cost: 0,
            searchCount: 0,
            error: msg
        };
    }
}

async function closeRun(
    sb: SupabaseClient,
    runId: string,
    fields: {
        status: string;
        events_written: number;
        total_cost_usd: number;
        llm_call_count: number;
        error_summary: string | null;
    }
): Promise<void> {
    await sb
        .from("outdoors_events_runs")
        .update({
            ...fields,
            completed_at: new Date().toISOString()
        })
        .eq("id", runId);
}

async function upsertEvents(
    sb: SupabaseClient,
    workspaceId: string,
    runId: string,
    events: ReadonlyArray<DiscoveredEvent>
): Promise<number> {
    if (events.length === 0) return 0;
    const nowIso = new Date().toISOString();

    // Build dedupe keys + dedupe within this batch (the model can
    // return the same event twice).
    const byKey = new Map<string, DiscoveredEvent>();
    for (const e of events) {
        const key = buildDedupeKey(e.name, e.start_date, e.where_at);
        if (!byKey.has(key)) byKey.set(key, e);
    }
    const keys = Array.from(byKey.keys());

    // Which of these already exist for this workspace? We must NOT
    // clobber the operator's status on those — a full upsert would
    // reset an "attending" event back to "watching" on re-discovery.
    const existing = await sb
        .from("outdoors_events")
        .select("dedupe_key")
        .eq("workspace_id", workspaceId)
        .in("dedupe_key", keys);
    if (existing.error) {
        throw new Error(`dedupe lookup failed: ${existing.error.message}`);
    }
    const existingKeys = new Set<string>(
        (existing.data ?? []).map((r: any) => r.dedupe_key as string)
    );

    let written = 0;

    // Insert the genuinely-new events (status defaults to "watching").
    const newRows = keys
        .filter((k) => !existingKeys.has(k))
        .map((k) => {
            const e = byKey.get(k)!;
            return {
                workspace_id: workspaceId,
                created_by: null,
                name: e.name,
                kind: e.kind,
                where_at: e.where_at,
                start_date: e.start_date,
                end_date: e.end_date,
                status: "watching",
                tags: e.tags,
                notes: null,
                source_url: e.source_url,
                relevance_tier: e.relevance_tier,
                relevance_reason: e.relevance_reason,
                discovered_at: nowIso,
                source_kind: "discovery_run",
                dedupe_key: k,
                run_id: runId
            };
        });
    if (newRows.length > 0) {
        const ins = await sb
            .from("outdoors_events")
            .insert(newRows)
            .select("id");
        if (ins.error) throw new Error(`insert failed: ${ins.error.message}`);
        written += Array.isArray(ins.data) ? ins.data.length : 0;
    }

    // Refresh the discovery columns on events we already know about —
    // WITHOUT touching status or notes (operator-owned).
    for (const k of keys) {
        if (!existingKeys.has(k)) continue;
        const e = byKey.get(k)!;
        const upd = await sb
            .from("outdoors_events")
            .update({
                relevance_tier: e.relevance_tier,
                relevance_reason: e.relevance_reason,
                source_url: e.source_url,
                kind: e.kind,
                where_at: e.where_at,
                start_date: e.start_date,
                end_date: e.end_date,
                discovered_at: nowIso,
                run_id: runId
            })
            .eq("workspace_id", workspaceId)
            .eq("dedupe_key", k);
        if (!upd.error) written += 1;
    }

    return written;
}

// ─── Active-workspace enumeration (cron mode) ──────────────────────

async function activeWorkspaceIds(sb: SupabaseClient): Promise<string[]> {
    // A workspace is "active" if it has a commercial profile with a
    // product category set — no category means discovery has nothing
    // to anchor on.
    try {
        const res = await sb
            .from("workspace_profile")
            .select("workspace_id, product_category")
            .not("product_category", "is", null);
        if (res.error || !Array.isArray(res.data)) return [];
        return res.data
            .filter(
                (r: any) =>
                    typeof r.product_category === "string" &&
                    r.product_category.trim().length > 0
            )
            .map((r: any) => r.workspace_id as string);
    } catch {
        return [];
    }
}

// ─── CORS ──────────────────────────────────────────────────────────

// This function is called from the browser via supabase.functions.invoke()
// (unlike the heartbeat + briefing-pipeline which are cron-invoked
// server-side). Browser calls trigger a CORS preflight OPTIONS request,
// so the handler must answer OPTIONS with the right headers AND echo
// them on every response.
//
// We echo the browser's Access-Control-Request-Headers value back in
// Access-Control-Allow-Headers so any custom header the supabase-js
// client adds (apikey, authorization, x-client-info, x-antaeus-client,
// or any future addition) is automatically permitted. Authorization
// is always listed explicitly because the CORS spec requires it —
// "*" wildcard never matches Authorization.
const DEFAULT_ALLOWED_HEADERS =
    "authorization, content-type, apikey, x-client-info, x-antaeus-client";

function corsHeaders(req: Request): Record<string, string> {
    const requested = req.headers.get("access-control-request-headers");
    return {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": requested ?? DEFAULT_ALLOWED_HEADERS,
        "access-control-max-age": "86400"
    };
}

// ─── HTTP handler ──────────────────────────────────────────────────

interface RequestBody {
    readonly action?: "run_all" | "run_one";
    readonly workspaceId?: string;
}

// @ts-ignore - Deno global resolved at deploy time
Deno.serve(async (req: Request): Promise<Response> => {
    const cors = corsHeaders(req);
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: cors });
    }
    if (req.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405, cors);
    }

    // @ts-ignore - Deno.env
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-ignore - Deno.env
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
        return json(
            { ok: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" },
            500,
            cors
        );
    }

    let body: RequestBody = {};
    try {
        const text = await req.text();
        if (text.trim().length > 0) body = JSON.parse(text) as RequestBody;
    } catch (err) {
        return json(
            {
                ok: false,
                error: `Invalid JSON body: ${err instanceof Error ? err.message : String(err)}`
            },
            400,
            cors
        );
    }

    const sb = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const action = body.action ?? "run_all";

    try {
        if (action === "run_one") {
            const ws = (body.workspaceId ?? "").trim();
            if (ws.length === 0) {
                return json(
                    { ok: false, error: "run_one requires workspaceId" },
                    400,
                    cors
                );
            }
            const result = await runForWorkspace(sb, ws);
            return json(
                { ok: result.status !== "failed", result },
                200,
                cors
            );
        }

        // run_all (cron).
        const ids = await activeWorkspaceIds(sb);
        const results: RunResult[] = [];
        for (const id of ids) {
            results.push(await runForWorkspace(sb, id));
        }
        return json(
            {
                ok: true,
                workspaces: ids.length,
                totals: {
                    eventsWritten: results.reduce(
                        (s, r) => s + r.eventsWritten,
                        0
                    ),
                    cost:
                        Math.round(
                            results.reduce((s, r) => s + r.cost, 0) * 10_000
                        ) / 10_000,
                    failed: results.filter((r) => r.status === "failed").length
                },
                results
            },
            200,
            cors
        );
    } catch (err) {
        return json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            500,
            cors
        );
    }
});

function json(
    payload: unknown,
    status = 200,
    cors: Record<string, string> = {}
): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "content-type": "application/json", ...cors }
    });
}
