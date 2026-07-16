import { signal } from "@preact/signals";

/**
 * Live Edge display preference — per-device (the schedule-float prefs
 * pattern), mirrored by the Settings "Show the live edge" row.
 *
 * Doctrine: edge off ≠ capture off. This preference only hides the
 * wire; every capture lane and the day's count keep running.
 */

export const EDGE_PREFS_KEY = "gtmos_live_edge_prefs_v1";

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function store(): StorageLike | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

export function readEdgeOn(s?: StorageLike | null): boolean {
    const st = s !== undefined ? s : store();
    if (!st) return true;
    try {
        const raw = st.getItem(EDGE_PREFS_KEY);
        if (!raw) return true; // default ON
        const parsed = JSON.parse(raw) as { on?: unknown };
        return parsed.on !== false;
    } catch {
        return true;
    }
}

/** Live signal every mounted rail + the Settings row share. */
export const liveEdgeOn = signal<boolean>(readEdgeOn());

export function setLiveEdgeOn(on: boolean, s?: StorageLike | null): void {
    liveEdgeOn.value = on;
    const st = s !== undefined ? s : store();
    try {
        st?.setItem(EDGE_PREFS_KEY, JSON.stringify({ on }));
    } catch {
        // Storage unavailable — the in-memory signal still governs.
    }
}
