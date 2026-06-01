import { describe, expect, it } from "vitest";
import {
    cadenceToJson,
    nextFireAt,
    parseCadence,
    type Cadence
} from "./scheduling";

// Cadence times are Chicago wall-clock (app operates on Central per
// founder decision 2026-06-01). 2026 DST: CDT (UTC-5) Mar 8 → Nov 1;
// CST (UTC-6) otherwise. So 9am Chicago = 14:00 UTC in summer, 15:00
// UTC in winter. All assertions below reflect that.

// A summer reference instant: 2026-06-01T13:00:00Z = 08:00 CDT Monday.
const SUMMER_8AM_CT = new Date("2026-06-01T13:00:00.000Z");

describe("cadenceToJson + parseCadence", () => {
    it("round-trips a daily cadence", () => {
        const c: Cadence = { kind: "daily", hour: 9, minute: 0 };
        const json = cadenceToJson(c);
        expect(json).toEqual({ hour: 9, minute: 0 });
        expect(parseCadence("daily", json)).toEqual(c);
    });

    it("round-trips a weekly cadence", () => {
        const c: Cadence = {
            kind: "weekly",
            hour: 9,
            minute: 30,
            dayOfWeek: "fri"
        };
        const json = cadenceToJson(c);
        expect(json).toMatchObject({
            hour: 9,
            minute: 30,
            day_of_week: "fri"
        });
        expect(parseCadence("weekly", json)).toEqual(c);
    });

    it("round-trips a monthly cadence", () => {
        const c: Cadence = {
            kind: "monthly",
            hour: 8,
            minute: 15,
            dayOfMonth: 15
        };
        const json = cadenceToJson(c);
        expect(json).toMatchObject({
            hour: 8,
            minute: 15,
            day_of_month: 15
        });
        expect(parseCadence("monthly", json)).toEqual(c);
    });

    it("rejects malformed JSON", () => {
        expect(parseCadence("daily", null)).toBeNull();
        expect(parseCadence("daily", "string")).toBeNull();
        expect(parseCadence("daily", [])).toBeNull();
        expect(parseCadence("daily", { hour: 25, minute: 0 })).toBeNull();
        expect(parseCadence("daily", { hour: 9, minute: 60 })).toBeNull();
    });

    it("rejects unknown cadence kind", () => {
        expect(parseCadence("yearly", { hour: 9, minute: 0 })).toBeNull();
    });

    it("rejects weekly without a valid day_of_week", () => {
        expect(
            parseCadence("weekly", { hour: 9, minute: 0, day_of_week: "fro" })
        ).toBeNull();
    });

    it("rejects monthly with day_of_month out of range", () => {
        expect(
            parseCadence("monthly", { hour: 9, minute: 0, day_of_month: 0 })
        ).toBeNull();
        expect(
            parseCadence("monthly", { hour: 9, minute: 0, day_of_month: 32 })
        ).toBeNull();
    });
});

describe("nextFireAt — daily (Chicago wall-clock)", () => {
    it("fires today at 9am Central when that's still ahead", () => {
        // from = 08:00 CT. 9am CT today = 14:00 UTC, which is ahead.
        const next = nextFireAt({ kind: "daily", hour: 9, minute: 0 }, SUMMER_8AM_CT);
        expect(next.toISOString()).toBe("2026-06-01T14:00:00.000Z");
    });

    it("rolls to tomorrow when 9am Central has already passed", () => {
        // from = 10:00 CT (15:00 UTC). 9am CT today already gone.
        const from = new Date("2026-06-01T15:00:00.000Z");
        const next = nextFireAt({ kind: "daily", hour: 9, minute: 0 }, from);
        expect(next.toISOString()).toBe("2026-06-02T14:00:00.000Z");
    });

    it("interprets the hour as Central in WINTER too (CST, UTC-6)", () => {
        // Jan 15 2026 06:00 CT = 12:00 UTC. 9am CST = 15:00 UTC, ahead.
        const from = new Date("2026-01-15T12:00:00.000Z");
        const next = nextFireAt({ kind: "daily", hour: 9, minute: 0 }, from);
        expect(next.toISOString()).toBe("2026-01-15T15:00:00.000Z");
    });
});

describe("nextFireAt — weekly (Chicago wall-clock)", () => {
    it("fires later today when target day = today (Central) and time ahead", () => {
        // SUMMER_8AM_CT is Monday 08:00 CT. Weekly Mon 9am → today 14:00 UTC.
        const next = nextFireAt(
            { kind: "weekly", hour: 9, minute: 0, dayOfWeek: "mon" },
            SUMMER_8AM_CT
        );
        expect(next.toISOString()).toBe("2026-06-01T14:00:00.000Z");
    });

    it("rolls +7 days when target day = today but the time has passed", () => {
        // Monday 10:00 CT (15:00 UTC); Mon 9am already gone → next Mon.
        const from = new Date("2026-06-01T15:00:00.000Z");
        const next = nextFireAt(
            { kind: "weekly", hour: 9, minute: 0, dayOfWeek: "mon" },
            from
        );
        expect(next.toISOString()).toBe("2026-06-08T14:00:00.000Z");
    });

    it("finds the next upcoming target weekday", () => {
        // Monday → next Friday is +4 days.
        const next = nextFireAt(
            { kind: "weekly", hour: 9, minute: 0, dayOfWeek: "fri" },
            SUMMER_8AM_CT
        );
        expect(next.toISOString()).toBe("2026-06-05T14:00:00.000Z");
    });
});

describe("nextFireAt — monthly (Chicago wall-clock)", () => {
    it("fires later this month when the day is ahead", () => {
        const next = nextFireAt(
            { kind: "monthly", hour: 9, minute: 0, dayOfMonth: 15 },
            SUMMER_8AM_CT
        );
        expect(next.toISOString()).toBe("2026-06-15T14:00:00.000Z");
    });

    it("rolls to next month when the day has passed", () => {
        // from is Jun 1 08:00 CT; schedule the 1st → already today/past →
        // next month. (9am CT Jun 1 = 14:00 UTC > from 13:00 UTC, so the
        // 1st is actually still ahead today.) Use a from later in the day.
        const from = new Date("2026-06-01T20:00:00.000Z"); // 15:00 CT Jun 1
        const next = nextFireAt(
            { kind: "monthly", hour: 9, minute: 0, dayOfMonth: 1 },
            from
        );
        expect(next.toISOString()).toBe("2026-07-01T14:00:00.000Z");
    });

    it("clamps to the last day when the target exceeds month length", () => {
        // Schedule 31st in February (28 days, 2026). Winter = CST = UTC-6,
        // so 9am CST = 15:00 UTC.
        const feb = new Date("2026-02-15T12:00:00.000Z");
        const next = nextFireAt(
            { kind: "monthly", hour: 9, minute: 0, dayOfMonth: 31 },
            feb
        );
        expect(next.toISOString()).toBe("2026-02-28T15:00:00.000Z");
    });

    it("Jan-31 schedule fired on Jan 31 rolls to Feb 28, NOT Mar 31", () => {
        // Codex-flagged regression, now in Central. Jan 31 2026 is CST.
        // Fire moment: Jan 31 09:00 CST = 15:00 UTC.
        const janFire = new Date("2026-01-31T15:00:00.000Z");
        const next = nextFireAt(
            { kind: "monthly", hour: 9, minute: 0, dayOfMonth: 31 },
            janFire
        );
        // Feb 28 09:00 CST = 15:00 UTC. NOT March.
        expect(next.toISOString()).toBe("2026-02-28T15:00:00.000Z");
    });
});
