import { describe, expect, it } from "vitest";
import { chicagoTodayIso, isUpcoming } from "./world-events";

describe("isUpcoming", () => {
    const today = "2026-11-04";
    it("drops an event whose start date has passed and has no end date", () => {
        expect(isUpcoming({ start_date: "2026-09-15" }, today)).toBe(false);
    });
    it("keeps a multi-day event that is still running", () => {
        expect(isUpcoming({ start_date: "2026-11-02", end_date: "2026-11-05" }, today)).toBe(true);
    });
    it("keeps today's and future events", () => {
        expect(isUpcoming({ start_date: today }, today)).toBe(true);
        expect(isUpcoming({ start_date: "2027-01-10" }, today)).toBe(true);
    });
    it("keeps undated events", () => {
        expect(isUpcoming({}, today)).toBe(true);
    });
});

describe("chicagoTodayIso", () => {
    it("uses the Chicago calendar date, not UTC", () => {
        // 03:00 UTC on Nov 5 is still Nov 4 in Chicago.
        expect(chicagoTodayIso(new Date("2026-11-05T03:00:00Z"))).toBe("2026-11-04");
    });
});
