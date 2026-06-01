import { describe, expect, it } from "vitest";
import {
    APP_TIMEZONE,
    chicagoWallParts,
    chicagoWallToUtc
} from "./chicago";

describe("APP_TIMEZONE", () => {
    it("is America/Chicago", () => {
        expect(APP_TIMEZONE).toBe("America/Chicago");
    });
});

describe("chicagoWallParts", () => {
    it("reads summer (CDT, UTC-5) wall time", () => {
        // 14:00 UTC on Jun 1 2026 = 09:00 CDT.
        const p = chicagoWallParts(new Date("2026-06-01T14:00:00.000Z"));
        expect(p.year).toBe(2026);
        expect(p.month).toBe(6);
        expect(p.day).toBe(1);
        expect(p.hour).toBe(9);
        expect(p.minute).toBe(0);
    });

    it("reads winter (CST, UTC-6) wall time", () => {
        // 15:00 UTC on Jan 15 2026 = 09:00 CST.
        const p = chicagoWallParts(new Date("2026-01-15T15:00:00.000Z"));
        expect(p.month).toBe(1);
        expect(p.day).toBe(15);
        expect(p.hour).toBe(9);
    });

    it("reports the correct Chicago weekday", () => {
        // 2026-06-01 is a Monday.
        const p = chicagoWallParts(new Date("2026-06-01T14:00:00.000Z"));
        expect(p.weekday).toBe(1); // Mon
    });

    it("handles a UTC instant that's a different calendar day in Chicago", () => {
        // 2026-06-02T02:00:00Z = 2026-06-01 21:00 CDT (still the 1st).
        const p = chicagoWallParts(new Date("2026-06-02T02:00:00.000Z"));
        expect(p.day).toBe(1);
        expect(p.hour).toBe(21);
    });
});

describe("chicagoWallToUtc", () => {
    it("9am CDT (summer) → 14:00 UTC", () => {
        const utc = chicagoWallToUtc(2026, 6, 1, 9, 0);
        expect(utc.toISOString()).toBe("2026-06-01T14:00:00.000Z");
    });

    it("9am CST (winter) → 15:00 UTC", () => {
        const utc = chicagoWallToUtc(2026, 1, 15, 9, 0);
        expect(utc.toISOString()).toBe("2026-01-15T15:00:00.000Z");
    });

    it("round-trips: wall → UTC → wall", () => {
        const utc = chicagoWallToUtc(2026, 6, 1, 9, 30);
        const back = chicagoWallParts(utc);
        expect(back.hour).toBe(9);
        expect(back.minute).toBe(30);
        expect(back.day).toBe(1);
    });

    it("midnight Chicago maps correctly", () => {
        // 00:00 CDT Jun 1 = 05:00 UTC Jun 1.
        const utc = chicagoWallToUtc(2026, 6, 1, 0, 0);
        expect(utc.toISOString()).toBe("2026-06-01T05:00:00.000Z");
    });
});
