/**
 * App operating timezone — America/Chicago (Central).
 *
 * Founder decision 2026-06-01: the app operates on Central time, not
 * UTC. Where a wall-clock time matters to the operator — most acutely
 * Phase E skill scheduling ("fire at 9am") — "9am" means 9am Chicago,
 * not 9am UTC.
 *
 * This module is the single source of truth for Chicago wall-clock ↔
 * UTC conversion. It's DST-aware via the Intl API (Chicago is CST /
 * UTC-6 in winter, CDT / UTC-5 in summer); no hardcoded offset, no
 * external dependency. Both the Node tree and the Deno heartbeat need
 * this logic — the Deno side carries a synced duplicate (see
 * supabase/functions/heartbeat/index.ts).
 *
 * Known limitation: within the 1-hour DST transition window (2am on
 * the two changeover days each year), wall→UTC conversion can be off
 * by an hour for a time that falls inside the skipped/repeated hour.
 * Scheduling fires at operator-chosen times (typically business
 * hours), so this is an accepted v1 edge — documented, not fixed.
 */

export const APP_TIMEZONE = "America/Chicago";

export interface ChicagoWallParts {
    readonly year: number;
    /** 1-12 (calendar month, not 0-indexed). */
    readonly month: number;
    readonly day: number;
    readonly hour: number;
    readonly minute: number;
    readonly second: number;
    /** 0 = Sunday … 6 = Saturday, in Chicago local time. */
    readonly weekday: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
};

const FORMATTER = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short"
});

/**
 * The Chicago wall-clock time at a given real instant.
 */
export function chicagoWallParts(at: Date): ChicagoWallParts {
    const parts = FORMATTER.formatToParts(at);
    const m: Record<string, string> = {};
    for (const p of parts) {
        if (p.type !== "literal") m[p.type] = p.value;
    }
    let hour = Number.parseInt(m.hour ?? "0", 10);
    // Some engines emit "24" for midnight; normalize to 0.
    if (hour === 24) hour = 0;
    return {
        year: Number.parseInt(m.year ?? "1970", 10),
        month: Number.parseInt(m.month ?? "1", 10),
        day: Number.parseInt(m.day ?? "1", 10),
        hour,
        minute: Number.parseInt(m.minute ?? "0", 10),
        second: Number.parseInt(m.second ?? "0", 10),
        weekday: WEEKDAY_INDEX[m.weekday ?? "Sun"] ?? 0
    };
}

/**
 * Chicago's offset from UTC, in milliseconds, at a given instant.
 * Negative (Chicago is behind UTC): -6h in winter, -5h in summer.
 */
function chicagoOffsetMs(at: Date): number {
    const p = chicagoWallParts(at);
    const wallAsUtc = Date.UTC(
        p.year,
        p.month - 1,
        p.day,
        p.hour,
        p.minute,
        p.second
    );
    return wallAsUtc - at.getTime();
}

/**
 * Convert a Chicago wall-clock time (year/month/day/hour/minute) to the
 * real UTC instant. month is 1-12.
 *
 * Example: chicagoWallToUtc(2026, 6, 1, 9, 0) → 2026-06-01T14:00:00Z
 * (9am CDT = 14:00 UTC). In winter: chicagoWallToUtc(2026, 1, 15, 9, 0)
 * → 2026-01-15T15:00:00Z (9am CST = 15:00 UTC).
 */
export function chicagoWallToUtc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number
): Date {
    // Treat the wall time as if it were UTC, then correct by Chicago's
    // offset at that approximate instant.
    const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
    const offsetMs = chicagoOffsetMs(new Date(guess));
    return new Date(guess - offsetMs);
}
