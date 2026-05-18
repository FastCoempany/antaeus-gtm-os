import { reportError } from "@/lib/observability";

/**
 * Stamp — the "Week N / Day N" affordance the Launch Folio · Commission
 * Lock variant carries on the Hero. Reads as authored, file-like, "this
 * mandate has been live for {N} days."
 *
 * Derivation:
 *   - read `gtmos_onboarding.completedAt` (ISO string written by the
 *     onboarding seed step on completion)
 *   - if missing or malformed → fall back to "Week 1 · Day 1"
 *   - else compute `daysSince = floor((now - completedAt) / day)`
 *     and `week = floor(daysSince / 7) + 1`, `day = daysSince + 1`
 *     (1-indexed Day so Day 1 = "the day the file opened")
 *
 * Caps at "Week 99 · Day 999" so very old workspaces don't read as
 * absurd; below that the labels are honest.
 */

const DAY_MS = 86400000;

export interface StampValue {
    readonly week: number;
    readonly day: number;
    readonly label: string;
}

interface OnboardingShape {
    readonly completedAt?: unknown;
}

interface StorageLike {
    getItem(key: string): string | null;
}

export function loadStamp(
    storage: StorageLike | null = safeStorage(),
    now: Date = new Date()
): StampValue {
    if (!storage) return DEFAULT_STAMP;
    const raw = storage.getItem("gtmos_onboarding");
    if (!raw) return DEFAULT_STAMP;
    let parsed: OnboardingShape | null = null;
    try {
        parsed = JSON.parse(raw) as OnboardingShape;
    } catch (err) {
        reportError(err, { op: "welcome.loadStamp" });
        return DEFAULT_STAMP;
    }
    const completedAt =
        typeof parsed?.completedAt === "string" ? parsed.completedAt : null;
    if (!completedAt) return DEFAULT_STAMP;
    const startedAt = Date.parse(completedAt);
    if (!Number.isFinite(startedAt)) return DEFAULT_STAMP;
    const elapsed = Math.max(0, now.getTime() - startedAt);
    const daysSince = Math.min(998, Math.floor(elapsed / DAY_MS));
    const day = daysSince + 1;
    const week = Math.min(99, Math.floor(daysSince / 7) + 1);
    return {
        week,
        day,
        label: `Week ${week} · Day ${day}`
    };
}

const DEFAULT_STAMP: StampValue = {
    week: 1,
    day: 1,
    label: "Week 1 · Day 1"
};

function safeStorage(): StorageLike | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}
