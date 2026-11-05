/**
 * Outdoors Events discovery Edge Function (ADR-016 PR 2).
 *
 * Finds real, currently scheduled offline events relevant to a workspace's
 * product category or target buyer roles and stores them in outdoors_events.
 * The model must ground every returned event in a live source URL.
 *
 * Two invocation modes:
 *   - Admin ({action:"run_all"}): enumerate profiles with a product category.
 *     This is an explicit service-role operation; there is no scheduled cron.
 *   - On-demand ({action:"run_one", workspaceId}): run discovery for a
 *     single workspace.
 *
 * Per run, an outdoors_events_runs ledger row tracks status, cost,
 * and events written. Events deduplicate by dedupe_key so the
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
    const res = await sb
        .from("workspace_profile")
        .select("product_category, what_we_sell, value_prop")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
    if (res.error) throw new Error(`Workspace profile lookup failed: ${res.error.message}`);
    if (!res.data) {
        return { product_category: null, what_we_sell: null, value_prop: null };
    }
    return {
        product_category: res.data.product_category ?? null,
        what_we_sell: res.data.what_we_sell ?? null,
        value_prop: res.data.value_prop ?? null
    };
}

// ─── Weekly spend so far (cost ceiling) ────────────────────────────

async function weeklySpend(
    sb: SupabaseClient,
    workspaceId: string
): Promise<number> {
    const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const res = await sb
        .from("outdoors_events_runs")
        .select("total_cost_usd")
        .eq("workspace_id", workspaceId)
        .gte("started_at", weekAgo);
    if (res.error) throw new Error(`Cost lookup failed: ${res.error.message}`);
    if (!Array.isArray(res.data)) throw new Error("Cost lookup returned an invalid result");
    return res.data.reduce(
        (sum: number, r: any) => sum + (Number(r.total_cost_usd) || 0),
        0
    );
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
    let cost = 0;
    let searchCount = 0;
    let callCount = 0;
    let written = 0;
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
        cost = call.cost_usd;
        searchCount = call.search_count;
        callCount = 1;

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
        written = await upsertEvents(sb, workspaceId, runId, parsed, count => { written = count; });

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
        let message = err instanceof Error ? err.message : String(err);
        if (runId) {
            try {
                await closeRun(sb, runId, {
                    status: "failed",
                    events_written: written,
                    total_cost_usd: cost,
                    llm_call_count: callCount,
                    error_summary: message
                });
            } catch (ledgerError) {
                message += `; run ledger update failed: ${ledgerError instanceof Error ? ledgerError.message : String(ledgerError)}`;
            }
        }
        return {
            workspaceId,
            status: "failed",
            eventsWritten: written,
            cost,
            searchCount,
            error: message
        };
    }
}

async function closeRun(
    sb: SupabaseClient,
    runId: string,
    patch: Record<string, unknown>
): Promise<void> {
    const { error } = await sb
        .from("outdoors_events_runs")
        .update({ ...patch, completed_at: new Date().toISOString() })
        .eq("id", runId);
    if (error) throw new Error(error.message);
}

async function upsertEvents(
    sb: SupabaseClient,
    workspaceId: string,
    runId: string,
    events: ReadonlyArray<DiscoveredEvent>,
    recordWritten: (count: number) => void
): Promise<number> {
    const byKey = new Map<string, DiscoveredEvent>();
    for (const event of events) {
        const key = buildDedupeKey(event.name, event.start_date, event.where_at);
        if (!byKey.has(key)) byKey.set(key, event);
    }
    let written = 0;
    const now = new Date().toISOString();
    for (const [key, event] of byKey) {
        // Do not use a generic upsert: the database's dedupe index is partial,
        // and operator-owned fields must survive rediscovery and insert races.
        const discovery = {
            relevance_tier: event.relevance_tier,
            relevance_reason: event.relevance_reason,
            source_url: event.source_url,
            kind: event.kind,
            where_at: event.where_at,
            start_date: event.start_date,
            end_date: event.end_date,
            discovered_at: now,
            run_id: runId
        };
        const refresh = () => sb.from("outdoors_events")
            .update(discovery)
            .eq("workspace_id", workspaceId)
            .eq("dedupe_key", key)
            .select("id");
        const updated = await refresh();
        if (updated.error) throw new Error(`Event refresh failed: ${updated.error.message}`);
        if (updated.data?.length) {
            written += updated.data.length;
            recordWritten(written);
            continue;
        }
        const inserted = await sb.from("outdoors_events").insert({
            ...discovery,
            workspace_id: workspaceId,
            created_by: null,
            name: event.name,
            status: "watching",
            notes: null,
            tags: event.tags,
            source_kind: "discovery_run",
            dedupe_key: key
        }).select("id");
        if (inserted.error?.code === "23505") {
            // A concurrent discovery may have inserted this key after refresh.
            // Refresh only the discovery fields on the winning row.
            const raced = await refresh();
            if (raced.error || !raced.data?.length) {
                throw new Error(`Event refresh after concurrent insert failed: ${raced.error?.message ?? "row not found"}`);
            }
            written += raced.data.length;
        } else if (inserted.error) {
            throw new Error(`Event insert failed: ${inserted.error.message}`);
        } else {
            written += inserted.data?.length ?? 0;
        }
        recordWritten(written);
    }
    return written;
}

async function activeWorkspaceIds(sb: SupabaseClient): Promise<string[]> {
    const { data, error } = await sb.from("workspace_profile")
        .select("workspace_id, product_category")
        .not("product_category", "is", null);
    if (error) throw new Error(`Workspace lookup failed: ${error.message}`);
    return [...new Set((data ?? [])
        .filter((row: any) => typeof row.product_category === "string" && row.product_category.trim())
        .map((row: any) => row.workspace_id as string))];
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
    if (body.action !== "run_one" && body.action !== "run_all") {
        return json({ ok: false, error: "action must be run_one or run_all" }, 400, cors);
    }
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
    if (body.action === "run_one" && !workspaceId) {
        return json({ ok: false, error: "run_one requires workspaceId" }, 400, cors);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRole) {
        return json({ ok: false, error: "Server configuration missing" }, 500, cors);
    }
    const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
    if (!token) return json({ ok: false, error: "Authentication required" }, 401, cors);
    const isAdmin = token === serviceRole;
    if (body.action === "run_all" && !isAdmin) {
        return json({ ok: false, error: "run_all requires service-role authorization" }, 403, cors);
    }
    const sb = createClient(supabaseUrl, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    try {
        if (!isAdmin) {
            // Service-role writes bypass RLS; validate the caller's JWT and
            // membership before starting a paid run or touching its ledger.
            const { data: auth, error: authError } = await sb.auth.getUser(token);
            if (authError || !auth.user) return json({ ok: false, error: "Invalid authentication" }, 401, cors);
            const membership = await sb.from("workspace_members")
                .select("workspace_id").eq("workspace_id", workspaceId)
                .eq("user_id", auth.user.id).maybeSingle();
            if (membership.error) throw new Error("Could not verify workspace membership");
            if (!membership.data) return json({ ok: false, error: "Workspace access denied" }, 403, cors);
        }
        if (body.action === "run_one") {
            const result = await runForWorkspace(sb, workspaceId);
            // A paused run did nothing, so it is not "ok" for the caller —
            // otherwise the button click looks like it silently succeeded.
            const ranOk = result.status === "completed" || result.status === "throttled";
            return json({ ok: ranOk, result, error: result.error }, 200, cors);
        }
        const ids = await activeWorkspaceIds(sb);
        const results: RunResult[] = [];
        for (const id of ids) results.push(await runForWorkspace(sb, id));
        return json({
            ok: true,
            workspaces: ids.length,
            totals: {
                eventsWritten: results.reduce((sum, r) => sum + r.eventsWritten, 0),
                cost: Math.round(results.reduce((sum, r) => sum + r.cost, 0) * 10_000) / 10_000,
                failed: results.filter((r) => r.status === "failed").length
            },
            results
        }, 200, cors);
    } catch (err) {
        return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500, cors);
    }
});
