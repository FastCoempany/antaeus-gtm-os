/**
 * Phase A orchestration layer (ADR-004) — observation reader.
 *
 * Client-side reads of the observations ledger. Used by the Dashboard
 * ("this week's reads" card, Phase B), the birdseye strip (inline
 * observation kickers, Phase D), and Founding GTM (cross-room
 * synthesis surfaces).
 *
 * No writes from the client side — those go through the heartbeat
 * Edge Function with service-role credentials.
 *
 * Members CAN dismiss observations (status update), which is
 * exposed via `dismissObservation()` below. The DB enforces "members
 * can only update status, never the text" via RLS.
 */

import { reportError, trackEvent } from "@/lib/observability";
import { createDataClient, type DataClient } from "@/lib/data-client";
import type { FocusedObjectType } from "@/lib/session/types";
import {
    compareObservationsForDisplay,
    rowToObservation,
    type ObservationView
} from "./types";

export interface ListObservationsOptions {
    readonly data?: DataClient;
    /** Cap on rows returned. Default 20; max 100. */
    readonly limit?: number;
    /** When true, dismissed + superseded observations are included. Default false. */
    readonly includeInactive?: boolean;
}

/**
 * List the workspace's observations, newest first (high-confidence
 * boosted to the top). Workspace scoping happens at the RLS layer.
 */
export async function listObservations(
    opts: ListObservationsOptions = {}
): Promise<ReadonlyArray<ObservationView>> {
    const data = opts.data ?? createDataClient();
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    try {
        const where = opts.includeInactive
            ? {}
            : { status: "active" as const };
        const rows = await data.observations.list({
            where,
            orderBy: { column: "written_at", ascending: false },
            limit
        });
        const views = rows.map(rowToObservation);
        // Re-sort with our confidence-weighted comparator
        return views.slice().sort(compareObservationsForDisplay);
    } catch (err) {
        reportError(err, { op: "observations.list" });
        return [];
    }
}

/**
 * List the observations anchored to a specific object (account,
 * deal, etc.). Used by the birdseye strip + inline observation
 * kickers in rooms.
 */
export async function listObservationsForObject(
    objectType: FocusedObjectType,
    objectId: string,
    opts: ListObservationsOptions = {}
): Promise<ReadonlyArray<ObservationView>> {
    const data = opts.data ?? createDataClient();
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    try {
        const where = opts.includeInactive
            ? {
                  related_object_type: objectType,
                  related_object_id: objectId
              }
            : {
                  related_object_type: objectType,
                  related_object_id: objectId,
                  status: "active" as const
              };
        const rows = await data.observations.list({
            where,
            orderBy: { column: "written_at", ascending: false },
            limit
        });
        const views = rows.map(rowToObservation);
        return views.slice().sort(compareObservationsForDisplay);
    } catch (err) {
        reportError(err, {
            op: "observations.listForObject",
            objectType,
            objectId
        });
        return [];
    }
}

/**
 * Dismiss an observation. Sets status='dismissed', records the
 * timestamp + optional reason. Calls the SQL helper
 * `dismiss_observation(obs_id, reason)` so the policy + reason
 * capture stay consistent.
 *
 * Members can call this. The service role does not need to.
 */
export async function dismissObservation(
    observationId: string,
    reason: string | null = null,
    opts: { data?: DataClient } = {}
): Promise<boolean> {
    const data = opts.data ?? createDataClient();
    try {
        // The data-client doesn't expose an `rpc()` helper today, but the
        // raw Supabase client is reachable via `data.client`. We cast
        // through the lookup type to avoid the SDK's strict overload
        // narrowing the args to `undefined` when the Functions block
        // has a mix of arg-shapes — the contract is captured in
        // database.types.ts Functions.dismiss_observation.
        type RpcClient = {
            rpc: (
                fn: "dismiss_observation",
                args: { obs_id: string; reason: string | null }
            ) => Promise<{ data: unknown; error: { message: string } | null }>;
        };
        const rpcClient = data.client as unknown as RpcClient;
        const result = await rpcClient.rpc("dismiss_observation", {
            obs_id: observationId,
            reason
        });
        if (result.error) {
            reportError(result.error, {
                op: "observations.dismiss",
                observationId
            });
            return false;
        }
        trackEvent("observation_dismissed", { observation_id: observationId });
        return true;
    } catch (err) {
        reportError(err, { op: "observations.dismiss", observationId });
        return false;
    }
}
