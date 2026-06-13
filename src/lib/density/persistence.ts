import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import { densityState, setDensityState } from "./signal";
import { DEFAULT_DENSITY_STATE, isDensityState, type DensityState } from "./types";

/**
 * Density persistence (spec 02 §2.5). The state lives on
 * `workspace_profile.density_state` (one row per workspace). Boot
 * seeds the signal from it and subscribes to Realtime so a change in
 * one tab/device reaches the others within the channel latency window.
 * Settings + the Phase F apply path are the two write call sites.
 *
 * Defensive throughout — a missing profile row, an absent column, or
 * an offline client never throws into a room; the signal falls back to
 * the walked-through default.
 */

interface ProfileRow {
    readonly workspace_id?: string;
    readonly density_state?: string | null;
}

async function readWorkspaceId(data: DataClient): Promise<string | null> {
    try {
        const ws = await data.currentWorkspace();
        return ws?.id ?? null;
    } catch {
        return null;
    }
}

/** Read the persisted state, seed the signal, and wire realtime. */
export async function bootDensity(
    client?: DataClient
): Promise<{ readonly state: DensityState; readonly stop: () => void }> {
    const noop = { state: densityState.value, stop: () => undefined };
    let data: DataClient;
    try {
        data = client ?? createDataClient();
    } catch {
        return noop;
    }
    try {
        const rows = (await data.workspaceProfile.list()) as ProfileRow[];
        const row = rows[0];
        if (row && isDensityState(row.density_state)) {
            setDensityState(row.density_state);
        }
        const channel = data.workspaceProfile.subscribe((payload) => {
            const next = (payload.new as ProfileRow | null)?.density_state;
            if (isDensityState(next)) setDensityState(next);
        });
        return {
            state: densityState.value,
            stop: () => {
                try {
                    void channel?.unsubscribe?.();
                } catch {
                    /* ignore */
                }
            }
        };
    } catch (err) {
        reportError(err, { op: "density.bootDensity" });
        return noop;
    }
}

/**
 * Persist a density choice (Settings write path). Optimistic: flips
 * the signal immediately so the surface re-renders on next paint, then
 * writes through. A failed write reverts the signal and surfaces the
 * error to the caller.
 */
export async function saveDensityState(
    next: DensityState,
    client?: DataClient
): Promise<{ readonly ok: boolean; readonly error: string | null }> {
    const previous = densityState.value;
    setDensityState(next);
    let data: DataClient;
    try {
        data = client ?? createDataClient();
    } catch {
        return { ok: false, error: "Cloud sync is unavailable right now." };
    }
    const workspaceId = await readWorkspaceId(data);
    if (!workspaceId) {
        setDensityState(previous);
        return { ok: false, error: "No workspace to save against." };
    }
    try {
        await data.workspaceProfile.update(workspaceId, {
            density_state: next
        } as never);
        return { ok: true, error: null };
    } catch (err) {
        setDensityState(previous);
        reportError(err, { op: "density.saveDensityState" });
        return { ok: false, error: "Couldn't save — your choice didn't stick." };
    }
}

export { DEFAULT_DENSITY_STATE };
