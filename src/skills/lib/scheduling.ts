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
    const next = new Date(from.getTime());
    next.setUTCHours(c.hour, c.minute, 0, 0);

    if (c.kind === "daily") {
        if (next.getTime() <= from.getTime()) {
            next.setUTCDate(next.getUTCDate() + 1);
        }
        return next;
    }

    if (c.kind === "weekly") {
        const targetDow = DAY_INDEX[c.dayOfWeek];
        const currentDow = next.getUTCDay();
        let daysAhead = (targetDow - currentDow + 7) % 7;
        if (daysAhead === 0 && next.getTime() <= from.getTime()) {
            daysAhead = 7;
        }
        next.setUTCDate(next.getUTCDate() + daysAhead);
        return next;
    }

    // monthly
    const targetDom = c.dayOfMonth;
    // Set to target day of the current month (or last day if short).
    setMonthlyDay(next, targetDom);
    if (next.getTime() <= from.getTime()) {
        // Roll to next month.
        next.setUTCMonth(next.getUTCMonth() + 1);
        setMonthlyDay(next, targetDom);
    }
    return next;
}

function setMonthlyDay(d: Date, targetDom: number): void {
    // First go to the 1st of the month so setUTCDate doesn't underflow.
    d.setUTCDate(1);
    // Compute the last day of the current month.
    const month = d.getUTCMonth();
    const year = d.getUTCFullYear();
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(targetDom, lastDay));
}
