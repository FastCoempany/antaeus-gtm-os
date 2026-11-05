/**
 * "Re-check saved searches automatically" — the per-workspace switch for
 * the weekly automatic re-check of Prospecting Desk saved searches.
 *
 * Real workspaces: stored in workspace_profile.prospecting_auto_rerun_enabled
 * (default off). The daily schedule calls the prospecting-research function,
 * which only spends when this switch AND the server switch
 * (PROSPECTING_AUTO_RERUN=on) are both on.
 *
 * Demo: stored in localStorage (default on) and simulated in the browser
 * from the demo's sample companies — no web search, nothing billed.
 */

import { signal, type Signal } from "@preact/signals";
import { createDataClient, type DataClient } from "@/lib/data-client";
import { isDemoModeActive } from "@/lib/data-client-demo-local";
import { reportError } from "@/lib/observability";

export const DEMO_AUTO_RERUN_KEY = "gtmos_prospecting_auto_rerun";
export const AUTO_RERUN_INTERVAL_DAYS = 7;

/** null until loaded. */
export const autoRerunEnabled: Signal<boolean | null> = signal(null);

interface Opts {
    readonly data?: DataClient;
    readonly demo?: boolean;
    readonly storage?: Pick<Storage, "getItem" | "setItem"> | null;
}

function demoStore(opts: Opts): Pick<Storage, "getItem" | "setItem"> | null {
    if (opts.storage !== undefined) return opts.storage;
    try {
        return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
        return null;
    }
}

export async function loadAutoRerun(opts: Opts = {}): Promise<boolean> {
    const demo = opts.demo ?? isDemoModeActive();
    if (demo) {
        let v = true;
        try {
            const raw = demoStore(opts)?.getItem(DEMO_AUTO_RERUN_KEY);
            if (raw === "off") v = false;
        } catch {
            /* default on */
        }
        autoRerunEnabled.value = v;
        return v;
    }
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.workspaceProfile.list({ limit: 1 });
        const row = (Array.isArray(rows) ? rows[0] : null) as
            | { prospecting_auto_rerun_enabled?: boolean | null }
            | null
            | undefined;
        const v = row?.prospecting_auto_rerun_enabled === true;
        autoRerunEnabled.value = v;
        return v;
    } catch (err) {
        reportError(err, { op: "prospecting.loadAutoRerun" });
        autoRerunEnabled.value = false;
        return false;
    }
}

export interface SaveAutoRerunResult {
    readonly ok: boolean;
    readonly error: string | null;
}

export async function saveAutoRerun(enabled: boolean, opts: Opts = {}): Promise<SaveAutoRerunResult> {
    const demo = opts.demo ?? isDemoModeActive();
    const previous = autoRerunEnabled.value;
    autoRerunEnabled.value = enabled;
    if (demo) {
        try {
            demoStore(opts)?.setItem(DEMO_AUTO_RERUN_KEY, enabled ? "on" : "off");
        } catch {
            /* the signal still reflects the choice for this visit */
        }
        return { ok: true, error: null };
    }
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.workspaceProfile.list({ limit: 1 });
        if (!Array.isArray(rows) || rows.length === 0) {
            autoRerunEnabled.value = previous;
            return { ok: false, error: "Your workspace profile isn't set up yet. Complete onboarding first." };
        }
        const row = rows[0] as unknown as { workspace_id: string };
        await data.workspaceProfile.update(row.workspace_id, { prospecting_auto_rerun_enabled: enabled });
        return { ok: true, error: null };
    } catch (err) {
        reportError(err, { op: "prospecting.saveAutoRerun" });
        autoRerunEnabled.value = previous;
        return { ok: false, error: "Couldn't save that just now. Try again in a moment." };
    }
}

/** Never checked, or last checked a week or more ago. */
export function isDueForRecheck(lastCheckedAt: string | undefined, now: number): boolean {
    if (!lastCheckedAt) return true;
    const at = Date.parse(lastCheckedAt);
    if (!Number.isFinite(at)) return true;
    return now - at >= AUTO_RERUN_INTERVAL_DAYS * 86_400_000;
}
