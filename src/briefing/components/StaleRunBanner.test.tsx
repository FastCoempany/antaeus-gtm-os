import { describe, it, expect } from "vitest";
import { isStaleRun } from "./StaleRunBanner";

describe("isStaleRun", () => {
    const now = new Date("2026-06-15T12:00:00Z");

    it("returns false on null/undefined", () => {
        expect(isStaleRun(null, now)).toBe(false);
        expect(isStaleRun(undefined, now)).toBe(false);
    });

    it("returns false on garbage string", () => {
        expect(isStaleRun("not a date", now)).toBe(false);
    });

    it("returns false on a same-day run", () => {
        expect(isStaleRun("2026-06-15T08:00:00Z", now)).toBe(false);
    });

    it("returns false on a 1-week-old run", () => {
        expect(isStaleRun("2026-06-08T12:00:00Z", now)).toBe(false);
    });

    it("returns true on a 9-day-old run", () => {
        expect(isStaleRun("2026-06-06T12:00:00Z", now)).toBe(true);
    });

    it("returns true on a 30-day-old run", () => {
        expect(isStaleRun("2026-05-15T12:00:00Z", now)).toBe(true);
    });
});
