/**
 * Phase F (ADR-017) toggle: per-workspace switch to disable proposals
 * entirely. Stored in workspace_profile.phase_f_proposals_enabled
 * (added in PR 1). Default null = enabled.
 *
 * Read and write helpers. Defensive — failures degrade to "enabled"
 * (the safer state from the operator's perspective is the doctrinal
 * default).
 */

import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";

export interface PhaseFToggleState {
    readonly enabled: boolean;
    readonly hasRow: boolean;
}

export const ENABLED_DEFAULT: PhaseFToggleState = {
    enabled: true,
    hasRow: false
};

/** Read the toggle from workspace_profile. Returns {enabled: true,
 * hasRow: false} on any failure or missing row. */
export async function loadPhaseFToggle(
    opts: { readonly data?: DataClient } = {}
): Promise<PhaseFToggleState> {
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.workspaceProfile.list({ limit: 1 });
        if (!Array.isArray(rows) || rows.length === 0) return ENABLED_DEFAULT;
        const row = rows[0] as unknown as {
            workspace_id?: string;
            phase_f_proposals_enabled?: boolean | null;
        };
        const v = row.phase_f_proposals_enabled;
        return {
            enabled: v === false ? false : true,
            hasRow: true
        };
    } catch (err) {
        reportError(err, { op: "settings.loadPhaseFToggle" });
        return ENABLED_DEFAULT;
    }
}

export interface SaveToggleResult {
    readonly ok: boolean;
    readonly error: string | null;
}

/** Write the toggle. Requires the workspace_profile row to exist
 * (created by ADR-007 onboarding); if it doesn't, returns ok:false
 * so the UI can surface the issue rather than silently swallowing. */
export async function savePhaseFToggle(
    enabled: boolean,
    opts: { readonly data?: DataClient } = {}
): Promise<SaveToggleResult> {
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.workspaceProfile.list({ limit: 1 });
        if (!Array.isArray(rows) || rows.length === 0) {
            return {
                ok: false,
                error: "Your workspace profile isn't set up yet. Complete onboarding first."
            };
        }
        const row = rows[0] as unknown as { workspace_id: string };
        await data.workspaceProfile.update(row.workspace_id, {
            phase_f_proposals_enabled: enabled
        });
        return { ok: true, error: null };
    } catch (err) {
        // Supabase/PostgREST errors are plain objects, not Error
        // instances — `String(err)` on them renders "[object Object]"
        // to the operator (canon §10 ban on cryptic UI errors). Keep the
        // real error in Sentry; show the operator a calm, recoverable line.
        reportError(err, { op: "settings.savePhaseFToggle" });
        return {
            ok: false,
            error: "Couldn't save that just now. Try again in a moment."
        };
    }
}
