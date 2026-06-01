/**
 * Briefing view state (ADR-014).
 *
 * The Briefing room carries two views the operator toggles between:
 * Workspace (heartbeat observations about their own deals/signals/proofs)
 * and World (the Recipe-Layer Patterns / Contrarian / Periphery surface).
 *
 * The choice persists per device in localStorage. Defaults to Workspace —
 * the daily-fresh stream gets first reach.
 */

const STORAGE_KEY = "gtmos_briefing_view_v1";

export type BriefingView = "workspace" | "world";

export const DEFAULT_VIEW: BriefingView = "workspace";

function readStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function loadView(): BriefingView {
    const s = readStorage();
    if (!s) return DEFAULT_VIEW;
    try {
        const raw = s.getItem(STORAGE_KEY);
        if (raw === "workspace" || raw === "world") return raw;
        return DEFAULT_VIEW;
    } catch {
        return DEFAULT_VIEW;
    }
}

export function saveView(view: BriefingView): void {
    const s = readStorage();
    if (!s) return;
    try {
        s.setItem(STORAGE_KEY, view);
    } catch {
        // Quota or disabled — non-blocking. The default applies next load.
    }
}
