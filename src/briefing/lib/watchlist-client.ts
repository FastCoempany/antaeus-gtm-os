/**
 * Watch List client (B.3b) — the front-end data layer for triggers.
 *
 * Reads armed triggers + recent fires for the room, calls the Edge
 * Function's parse_trigger action to turn natural language into a
 * structured query, and arms/disables triggers via Supabase (RLS
 * scopes everything to the operator's workspace). All reads degrade to
 * [] / null on failure so the room renders rather than throwing.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";
import { trackEvent } from "@/lib/observability";
import type { ParseDisposition, TriggerParseResult, TriggerType } from "./triggers/types";

export interface ArmedTrigger {
    readonly id: string;
    readonly natural_language: string;
    readonly trigger_type: string;
    readonly status: string;
    readonly fire_count: number;
    readonly last_fired_at: string | null;
}

export interface TriggerFire {
    readonly id: string;
    readonly trigger_natural_language: string;
    readonly summary: string;
    readonly fired_at: string;
    readonly evidence_count: number;
}

export interface ParseTriggerResponse {
    readonly ok: boolean;
    readonly parse: TriggerParseResult | null;
    readonly disposition: ParseDisposition | null;
    readonly error: string | null;
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Human label for a trigger type, for the armed-trigger chip. */
export function triggerTypeLabel(t: string): string {
    if (t === "single_event") return "Event";
    if (t === "aggregation") return "Aggregation";
    if (t === "threshold") return "Threshold";
    if (t === "adjacency") return "Adjacency";
    if (t === "silence") return "Silence";
    return t;
}

/** "May 26" style short date; "" if the ISO string doesn't parse. */
export function shortFireDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Whether a parse is clear enough to offer the Arm button. A failed
 * parse or a clarify_only disposition (confidence < 0.70) is not.
 */
export function canArm(resp: ParseTriggerResponse): boolean {
    if (!resp.ok || !resp.parse || !resp.parse.parse_succeeded) return false;
    return resp.disposition !== "clarify_only";
}

/** Shape one armed-trigger row. Returns null if it has no usable id. */
export function parseArmedTriggerRow(row: unknown): ArmedTrigger | null {
    if (row === null || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const id = asString(o["id"]);
    if (id.length === 0) return null;
    return {
        id,
        natural_language: asString(o["natural_language"]),
        trigger_type: asString(o["trigger_type"]),
        status: asString(o["status"], "armed"),
        fire_count: asNumber(o["fire_count"]),
        last_fired_at: typeof o["last_fired_at"] === "string" ? o["last_fired_at"] : null
    };
}

/**
 * Shape one trigger-fire row, including the embedded trigger join
 * (Supabase returns the relation as an object or a single-element
 * array depending on the query). Returns null if it has no usable id.
 */
export function parseTriggerFireRow(row: unknown): TriggerFire | null {
    if (row === null || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const id = asString(o["id"]);
    if (id.length === 0) return null;
    const trig = o["trigger"];
    const trigObj = Array.isArray(trig) ? trig[0] : trig;
    const ids = o["evidence_item_ids"];
    return {
        id,
        trigger_natural_language: asString(
            (trigObj as Record<string, unknown> | undefined)?.["natural_language"]
        ),
        summary: asString(o["summary"]),
        fired_at: asString(o["fired_at"]),
        evidence_count: Array.isArray(ids) ? ids.length : 0
    };
}

/** The user's workspace id — needed for the service-role parse call. */
export async function resolveWorkspaceId(): Promise<string | null> {
    try {
        const sb = getSupabaseClient();
        const r = await sb.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1);
        if (r.error || !r.data || r.data.length === 0) return null;
        return asString((r.data[0] as { id: unknown }).id) || null;
    } catch (err) {
        reportError(err, { scope: "watchlist.resolveWorkspaceId" });
        return null;
    }
}

export async function loadArmedTriggers(): Promise<ArmedTrigger[]> {
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("briefing_watchlist_triggers")
            .select("id, natural_language, trigger_type, status, fire_count, last_fired_at")
            .neq("status", "disabled")
            .order("created_at", { ascending: false })
            .limit(50);
        if (r.error) {
            reportError(r.error, { scope: "watchlist.loadArmedTriggers" });
            return [];
        }
        return (r.data ?? [])
            .map(parseArmedTriggerRow)
            .filter((t): t is ArmedTrigger => t !== null);
    } catch (err) {
        reportError(err, { scope: "watchlist.loadArmedTriggers" });
        return [];
    }
}

export async function loadRecentFires(): Promise<TriggerFire[]> {
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("briefing_trigger_fires")
            .select("id, summary, fired_at, evidence_item_ids, trigger:briefing_watchlist_triggers(natural_language)")
            .order("fired_at", { ascending: false })
            .limit(10);
        if (r.error) {
            reportError(r.error, { scope: "watchlist.loadRecentFires" });
            return [];
        }
        return (r.data ?? [])
            .map(parseTriggerFireRow)
            .filter((f): f is TriggerFire => f !== null);
    } catch (err) {
        reportError(err, { scope: "watchlist.loadRecentFires" });
        return [];
    }
}

/** Call the Edge Function parse_trigger action. */
export async function parseTriggerNL(
    workspaceId: string,
    naturalLanguage: string
): Promise<ParseTriggerResponse> {
    try {
        const sb = getSupabaseClient();
        const { data, error } = await sb.functions.invoke("briefing-pipeline", {
            body: { action: "parse_trigger", workspaceId, natural_language: naturalLanguage }
        });
        if (error) {
            return { ok: false, parse: null, disposition: null, error: error.message };
        }
        const o = (data ?? {}) as Record<string, unknown>;
        if (o["ok"] !== true) {
            return { ok: false, parse: null, disposition: null, error: asString(o["error"], "parse failed") };
        }
        return {
            ok: true,
            parse: o["parse"] as TriggerParseResult,
            disposition: (o["disposition"] as ParseDisposition) ?? null,
            error: null
        };
    } catch (err) {
        reportError(err, { scope: "watchlist.parseTriggerNL" });
        return { ok: false, parse: null, disposition: null, error: err instanceof Error ? err.message : String(err) };
    }
}

/**
 * Arm a parsed trigger. workspace_id + created_by fill from the column
 * defaults (auth.uid()-derived); RLS gates the insert to the user's
 * workspace. Returns the new id or null.
 */
export async function armTrigger(parse: TriggerParseResult, naturalLanguage: string): Promise<string | null> {
    if (!parse.parse_succeeded || !parse.trigger_type || !parse.parsed_query) return null;
    try {
        const sb = getSupabaseClient();
        const r = await sb
            .from("briefing_watchlist_triggers")
            .insert({
                natural_language: naturalLanguage,
                trigger_type: parse.trigger_type as TriggerType,
                parsed_query: parse.parsed_query as unknown as never,
                parse_confidence: parse.parse_confidence,
                rephrased_for_confirmation: parse.rephrased_for_confirmation,
                status: "armed"
            })
            .select("id")
            .single();
        if (r.error || !r.data) {
            reportError(r.error ?? new Error("arm insert returned no row"), { scope: "watchlist.armTrigger" });
            return null;
        }
        trackEvent("briefing_trigger_armed", { trigger_type: parse.trigger_type });
        return asString((r.data as { id: unknown }).id) || null;
    } catch (err) {
        reportError(err, { scope: "watchlist.armTrigger" });
        return null;
    }
}

export async function disableTrigger(id: string): Promise<boolean> {
    try {
        const sb = getSupabaseClient();
        const r = await sb.from("briefing_watchlist_triggers").update({ status: "disabled" }).eq("id", id);
        if (r.error) {
            reportError(r.error, { scope: "watchlist.disableTrigger" });
            return false;
        }
        trackEvent("briefing_trigger_disabled", {});
        return true;
    } catch (err) {
        reportError(err, { scope: "watchlist.disableTrigger" });
        return false;
    }
}
