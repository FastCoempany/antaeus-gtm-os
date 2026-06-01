/**
 * Skill scheduling — cadence/next-fire computation (Phase E core).
 *
 * Per ADR-012 (2026-05-31). Pure functions that turn an operator's
 * stated schedule ("every Friday at 9am") into a concrete
 * `next_fire_at` timestamp. The heartbeat polls `next_fire_at <= now`
 * to find due schedules; this module computes what to write.
 *
 * v1 cadences: daily / weekly / monthly. Times are stored as
 * hour+minute in a named timezone. The cron-expression layer is
 * internal — operators never see it.
 */

import { chicagoWallParts, chicagoWallToUtc } from "@/lib/time/chicago";

export type CadenceKind = "daily" | "weekly" | "monthly";

export type DayOfWeek =
    | "sun"
    | "mon"
    | "tue"
    | "wed"
    | "thu"
    | "fri"
    | "sat";

const DAY_INDEX: Record<DayOfWeek, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
};

export interface DailyCadence {
    readonly kind: "daily";
    readonly hour: number;
    readonly minute: number;
}

export interface WeeklyCadence {
    readonly kind: "weekly";
    readonly hour: number;
    readonly minute: number;
    readonly dayOfWeek: DayOfWeek;
}

export interface MonthlyCadence {
    readonly kind: "monthly";
    readonly hour: number;
    readonly minute: number;
    /** 1-31. Months with fewer days fire on the last day. */
    readonly dayOfMonth: number;
}

export type Cadence = DailyCadence | WeeklyCadence | MonthlyCadence;

/**
 * Serialize a cadence to the JSONB shape stored in
 * `scheduled_skills.cadence_data`. The heartbeat reads this back.
 */
export function cadenceToJson(c: Cadence): Record<string, unknown> {
    if (c.kind === "daily") {
        return { hour: c.hour, minute: c.minute };
    }
    if (c.kind === "weekly") {
        return {
            hour: c.hour,
            minute: c.minute,
            day_of_week: c.dayOfWeek
        };
    }
    return {
        hour: c.hour,
        minute: c.minute,
        day_of_month: c.dayOfMonth
    };
}

/**
 * Parse the JSONB shape back to a Cadence. Returns null on any shape
 * mismatch; caller treats null as "schedule is corrupt, skip it."
 */
export function parseCadence(
    kind: string,
    data: unknown
): Cadence | null {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const o = data as Record<string, unknown>;
    const hour = typeof o.hour === "number" ? o.hour : null;
    const minute = typeof o.minute === "number" ? o.minute : null;
    if (hour === null || minute === null) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    if (kind === "daily") {
        return { kind: "daily", hour, minute };
    }
    if (kind === "weekly") {
        const dow = typeof o.day_of_week === "string" ? o.day_of_week : null;
        if (!dow || !(dow in DAY_INDEX)) return null;
        return {
            kind: "weekly",
            hour,
            minute,
            dayOfWeek: dow as DayOfWeek
        };
    }
    if (kind === "monthly") {
        const dom =
            typeof o.day_of_month === "number" ? o.day_of_month : null;
        if (dom === null || dom < 1 || dom > 31) return null;
        return { kind: "monthly", hour, minute, dayOfMonth: dom };
    }
    return null;
}

/**
 * Compute the next-fire timestamp after `from`. All times are
 * interpreted in UTC for v1 — timezone handling is a follow-up.
 *
 * Caller passes `from` so tests are deterministic; runtime passes
 * `new Date()`.
 */
export function nextFireAt(c: Cadence, from: Date): Date {
    // The cadence hour/minute are CHICAGO wall-clock time (app operates
    // on Central per founder decision 2026-06-01). We do all calendar
    // arithmetic in a "floating" Date whose UTC fields mirror Chicago
    // wall fields, then convert to the real UTC instant only when
    // comparing against `from` or returning. This keeps DST out of the
    // calendar math — the single tz conversion at the boundary (via
    // chicagoWallToUtc) handles it.
    const w = chicagoWallParts(from);
    const wall = new Date(
        Date.UTC(w.year, w.month - 1, w.day, c.hour, c.minute, 0)
    );

    if (c.kind === "daily") {
        if (toRealUtc(wall).getTime() <= from.getTime()) {
            wall.setUTCDate(wall.getUTCDate() + 1);
        }
        return toRealUtc(wall);
    }

    if (c.kind === "weekly") {
        const targetDow = DAY_INDEX[c.dayOfWeek];
        const currentDow = wall.getUTCDay(); // floating-UTC day = Chicago weekday
        let daysAhead = (targetDow - currentDow + 7) % 7;
        if (daysAhead === 0 && toRealUtc(wall).getTime() <= from.getTime()) {
            daysAhead = 7;
        }
        wall.setUTCDate(wall.getUTCDate() + daysAhead);
        return toRealUtc(wall);
    }

    // monthly
    setFloatingMonthlyDay(wall, c.dayOfMonth);
    if (toRealUtc(wall).getTime() <= from.getTime()) {
        // Roll to next month. Reset date to 1 BEFORE incrementing the
        // month so a current date of 31 doesn't overflow into the
        // month-after-next when the next month is shorter.
        wall.setUTCDate(1);
        wall.setUTCMonth(wall.getUTCMonth() + 1);
        setFloatingMonthlyDay(wall, c.dayOfMonth);
    }
    return toRealUtc(wall);
}

/**
 * Convert a floating wall-date (whose UTC fields ARE the Chicago
 * wall-clock fields) to the real UTC instant.
 */
function toRealUtc(floatingWall: Date): Date {
    return chicagoWallToUtc(
        floatingWall.getUTCFullYear(),
        floatingWall.getUTCMonth() + 1,
        floatingWall.getUTCDate(),
        floatingWall.getUTCHours(),
        floatingWall.getUTCMinutes()
    );
}

function setFloatingMonthlyDay(d: Date, targetDom: number): void {
    // Go to the 1st so setUTCDate doesn't underflow, then clamp the
    // target day to the last day of that (Chicago) month.
    d.setUTCDate(1);
    const month = d.getUTCMonth();
    const year = d.getUTCFullYear();
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(targetDom, lastDay));
}
