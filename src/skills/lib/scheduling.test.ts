import { describe, expect, it } from "vitest";
import {
    cadenceToJson,
    nextFireAt,
    parseCadence,
    type Cadence
} from "./scheduling";

const FRIDAY_2026_05_29_NOON = new Date("2026-05-29T12:00:00.000Z");
// 2026-05-29 is a Friday.

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

describe("nextFireAt — daily", () => {
    it("next fire is the same day if time hasn't passed yet", () => {
        const c: Cadence = { kind: "daily", hour: 18, minute: 0 };
        const next = nextFireAt(c, FRIDAY_2026_05_29_NOON);
        expect(next.toISOString()).toBe("2026-05-29T18:00:00.000Z");
    });

    it("next fire is the next day if time has passed", () => {
        const c: Cadence = { kind: "daily", hour: 9, minute: 0 };
        const next = nextFireAt(c, FRIDAY_2026_05_29_NOON);
        expect(next.toISOString()).toBe("2026-05-30T09:00:00.000Z");
    });
});

describe("nextFireAt — weekly", () => {
    it("next fire is later today if target day = today and time later", () => {
        const c: Cadence = {
            kind: "weekly",
            hour: 18,
            minute: 0,
            dayOfWeek: "fri"
        };
        const next = nextFireAt(c, FRIDAY_2026_05_29_NOON);
        expect(next.toISOString()).toBe("2026-05-29T18:00:00.000Z");
    });

    it("next fire is +7 days if target day = today but time has passed", () => {
        const c: Cadence = {
            kind: "weekly",
            hour: 9,
            minute: 0,
            dayOfWeek: "fri"
        };
        const next = nextFireAt(c, FRIDAY_2026_05_29_NOON);
        expect(next.toISOString()).toBe("2026-06-05T09:00:00.000Z");
    });

    it("next fire is the closest upcoming target day", () => {
        const c: Cadence = {
            kind: "weekly",
            hour: 9,
            minute: 0,
            dayOfWeek: "mon"
        };
        // Friday → Monday is 3 days.
        const next = nextFireAt(c, FRIDAY_2026_05_29_NOON);
        expect(next.toISOString()).toBe("2026-06-01T09:00:00.000Z");
    });
});

describe("nextFireAt — monthly", () => {
    it("next fire is later this month if day hasn't passed", () => {
        const c: Cadence = {
            kind: "monthly",
            hour: 9,
            minute: 0,
            dayOfMonth: 30
        };
        const next = nextFireAt(c, FRIDAY_2026_05_29_NOON);
        expect(next.toISOString()).toBe("2026-05-30T09:00:00.000Z");
    });

    it("rolls to next month if day has passed", () => {
        const c: Cadence = {
            kind: "monthly",
            hour: 9,
            minute: 0,
            dayOfMonth: 1
        };
        const next = nextFireAt(c, FRIDAY_2026_05_29_NOON);
        expect(next.toISOString()).toBe("2026-06-01T09:00:00.000Z");
    });

    it("clamps to last day when target day exceeds month length", () => {
        // Schedule 31st; February 2026 has 28 days.
        const c: Cadence = {
            kind: "monthly",
            hour: 9,
            minute: 0,
            dayOfMonth: 31
        };
        const feb = new Date("2026-02-15T12:00:00.000Z");
        const next = nextFireAt(c, feb);
        expect(next.toISOString()).toBe("2026-02-28T09:00:00.000Z");
    });
});
