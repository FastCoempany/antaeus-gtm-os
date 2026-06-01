/**
 * ScheduleFloat operator preferences — local persistence.
 *
 * Per ADR-013. Workspace-local for v1; reads/writes localStorage under
 * a single key. All operations are defensive — corrupt or missing data
 * resolves to defaults.
 */

const STORAGE_KEY = "gtmos_schedule_float_prefs_v1";

export type FloatMode = "expanded" | "minimized" | "hidden";

export type SnoozeUntil = null | string;

export interface FloatPrefs {
    readonly mode: FloatMode;
    readonly showInSessionNotifications: boolean;
    readonly showTooltipHints: boolean;
    readonly surfaceVisible: boolean;
    readonly snoozeUntilIso: SnoozeUntil;
}

export const DEFAULT_PREFS: FloatPrefs = {
    mode: "expanded",
    showInSessionNotifications: true,
    showTooltipHints: true,
    surfaceVisible: true,
    snoozeUntilIso: null
};

function readStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function loadPrefs(): FloatPrefs {
    const s = readStorage();
    if (!s) return DEFAULT_PREFS;
    try {
        const raw = s.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_PREFS;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return {
            mode: parseMode(parsed.mode),
            showInSessionNotifications: parseBool(
                parsed.showInSessionNotifications,
                DEFAULT_PREFS.showInSessionNotifications
            ),
            showTooltipHints: parseBool(
                parsed.showTooltipHints,
                DEFAULT_PREFS.showTooltipHints
            ),
            surfaceVisible: parseBool(
                parsed.surfaceVisible,
                DEFAULT_PREFS.surfaceVisible
            ),
            snoozeUntilIso: parseSnooze(parsed.snoozeUntilIso)
        };
    } catch {
        return DEFAULT_PREFS;
    }
}

export function savePrefs(prefs: FloatPrefs): void {
    const s = readStorage();
    if (!s) return;
    try {
        s.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // Quota or serialization failure — swallow; prefs revert to
        // defaults on next load.
    }
}

function parseMode(v: unknown): FloatMode {
    if (v === "expanded" || v === "minimized" || v === "hidden") return v;
    return DEFAULT_PREFS.mode;
}

function parseBool(v: unknown, fallback: boolean): boolean {
    if (typeof v === "boolean") return v;
    return fallback;
}

function parseSnooze(v: unknown): SnoozeUntil {
    if (typeof v !== "string") return null;
    const t = Date.parse(v);
    if (!Number.isFinite(t)) return null;
    return v;
}

/**
 * True when the snooze window is currently in effect — i.e. the
 * stored ISO timestamp is in the future relative to `now`. Expired
 * snoozes return false (and the caller is expected to clear).
 */
export function isSnoozed(prefs: FloatPrefs, now: Date = new Date()): boolean {
    if (!prefs.snoozeUntilIso) return false;
    const until = Date.parse(prefs.snoozeUntilIso);
    if (!Number.isFinite(until)) return false;
    return until > now.getTime();
}

/**
 * Compute the ISO timestamp for a snooze window of N hours from now.
 * Used by the settings panel ("snooze 1h", "snooze 4h"). "today"
 * snoozes until midnight Central — handled by the caller (uses the
 * chicago helper) since this module stays pure.
 */
export function snoozeForHours(hours: number, now: Date = new Date()): string {
    const ms = hours * 60 * 60 * 1000;
    return new Date(now.getTime() + ms).toISOString();
}
