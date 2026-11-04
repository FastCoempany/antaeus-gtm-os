/**
 * Outdoors Events discovery client (ADR-016 PR 2).
 *
 * Invokes the outdoors-events-discovery Edge Function for the current
 * workspace ("Run discovery now") and reads the most recent run from
 * the outdoors_events_runs ledger for the cost/status footer.
 *
 * All operations defensive — errors flow through reportError + resolve
 * to a safe value rather than throwing.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";

export type DiscoveryRunStatus =
    | "running"
    | "completed"
    | "failed"
    | "throttled"
    | "paused";

export interface DiscoveryRun {
    readonly id: string;
    readonly status: DiscoveryRunStatus;
    readonly startedAt: string;
    readonly completedAt: string | null;
    readonly eventsWritten: number;
    readonly totalCostUsd: number;
    readonly errorSummary: string | null;
}

function parseStatus(v: unknown): DiscoveryRunStatus {
    if (
        v === "running" ||
        v === "completed" ||
        v === "failed" ||
        v === "throttled" ||
        v === "paused"
    ) {
        return v;
    }
    return "completed";
}

/**
 * Read the most recent discovery run for the workspace. Returns null
 * when none exist or on any failure.
 */
export async function loadLatestRun(
    opts: { readonly data?: DataClient } = {}
): Promise<DiscoveryRun | null> {
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.outdoorsEventsRuns.list({
            orderBy: { column: "started_at", ascending: false },
            limit: 1
        });
        if (rows.length === 0) return null;
        const r = rows[0] as unknown as {
            id: string;
            status: string;
            started_at: string;
            completed_at: string | null;
            events_written: number;
            total_cost_usd: number;
            error_summary: string | null;
        };
        return {
            id: r.id,
            status: parseStatus(r.status),
            startedAt: r.started_at,
            completedAt: r.completed_at,
            eventsWritten: Number(r.events_written) || 0,
            totalCostUsd: Number(r.total_cost_usd) || 0,
            errorSummary: r.error_summary
        };
    } catch (err) {
        reportError(err, { op: "outdoors-events.loadLatestRun" });
        return null;
    }
}

export interface TriggerResult {
    readonly ok: boolean;
    readonly error: string | null;
}

/**
 * Invoke the discovery Edge Function for the operator's current
 * workspace. The function authenticates the operator via their JWT,
 * resolves their workspace, runs discovery, and writes events + a run
 * ledger row. Returns when the function responds (the function runs
 * synchronously — discovery is a single LLM call so it's seconds, not
 * minutes).
 *
 * `opts.data` is test-only — production callers omit it.
 */
/** Plain messages for the operator; the raw detail goes to error reporting. */
export const DISCOVERY_MESSAGES = {
    noWorkspace: "Sign in to a workspace to search for events.",
    paused: "This week's search budget is used up. Event search will be available again next week.",
    failed: "The event search didn't finish. Try again in a few minutes.",
    unavailable: "Event search isn't available in this copy of the app."
} as const;

export async function triggerDiscovery(
    opts: { readonly data?: DataClient } = {}
): Promise<TriggerResult> {
    try {
        const sb = getSupabaseClient();
        const data = opts.data ?? createDataClient();
        const workspace = await data.currentWorkspace();
        if (!workspace) {
            return { ok: false, error: DISCOVERY_MESSAGES.noWorkspace };
        }
        const { data: res, error } = await sb.functions.invoke(
            "outdoors-events-discovery",
            {
                body: { action: "run_one", workspaceId: workspace.id }
            }
        );
        if (error) {
            reportError(error, { op: "outdoors-events.triggerDiscovery.invoke" });
            return { ok: false, error: DISCOVERY_MESSAGES.failed };
        }
        const ok =
            res && typeof res === "object" && (res as { ok?: unknown }).ok === true;
        if (!ok) {
            const status =
                res && typeof res === "object"
                    ? (res as { result?: { status?: unknown } }).result?.status
                    : undefined;
            if (status === "paused") return { ok: false, error: DISCOVERY_MESSAGES.paused };
            return { ok: false, error: DISCOVERY_MESSAGES.failed };
        }
        return { ok: true, error: null };
    } catch (err) {
        reportError(err, { op: "outdoors-events.triggerDiscovery" });
        // Missing configuration (e.g. a demo or local copy with no database)
        // and any other thrown error get a plain message, never the raw text.
        const raw = err instanceof Error ? err.message : String(err);
        return {
            ok: false,
            error: /VITE_SUPABASE|Supabase client/i.test(raw)
                ? DISCOVERY_MESSAGES.unavailable
                : DISCOVERY_MESSAGES.failed
        };
    }
}
