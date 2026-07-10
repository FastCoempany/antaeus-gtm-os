import { describe, it, expect } from "vitest";
import {
    readBulkCounts,
    bulkOutreachByDayThisMonth,
    logBulkOutreach,
    bulkOutreachThisMonth,
    bulkOutreachToday,
    BULK_OUTREACH_KEY,
    localDay
} from "./bulk-outreach";

function mem(): { getItem(k: string): string | null; setItem(k: string, v: string): void; data: Record<string, string> } {
    const data: Record<string, string> = {};
    return {
        data,
        getItem: (k) => (k in data ? data[k]! : null),
        setItem: (k, v) => {
            data[k] = v;
        }
    };
}

describe("bulk outreach counts", () => {
    it("empty storage reads as no counts", () => {
        expect(readBulkCounts(mem())).toEqual({});
    });

    it("logging replaces the day's number, not appends", () => {
        const s = mem();
        const now = new Date(2026, 6, 9);
        logBulkOutreach(30, s, now);
        logBulkOutreach(42, s, now);
        expect(readBulkCounts(s)[localDay(now)]).toBe(42);
    });

    it("zero and negative counts are ignored", () => {
        const s = mem();
        logBulkOutreach(0, s);
        logBulkOutreach(-5, s);
        expect(readBulkCounts(s)).toEqual({});
    });

    it("sums only the current month", () => {
        const s = mem();
        logBulkOutreach(40, s, new Date(2026, 6, 8));
        logBulkOutreach(25, s, new Date(2026, 6, 9));
        logBulkOutreach(99, s, new Date(2026, 5, 30));
        expect(bulkOutreachThisMonth(s, new Date(2026, 6, 10))).toBe(65);
    });

    it("per-day month map filters to the current month", () => {
        const s = mem();
        logBulkOutreach(40, s, new Date(2026, 6, 8));
        logBulkOutreach(99, s, new Date(2026, 5, 30));
        expect(bulkOutreachByDayThisMonth(s, new Date(2026, 6, 10))).toEqual({
            "2026-07-08": 40
        });
    });

    it("today's count reads back for the face", () => {
        const s = mem();
        const now = new Date(2026, 6, 9);
        expect(bulkOutreachToday(s, now)).toBe(0);
        logBulkOutreach(12, s, now);
        expect(bulkOutreachToday(s, now)).toBe(12);
    });

    it("malformed storage reads defensively", () => {
        const s = mem();
        s.data[BULK_OUTREACH_KEY] = "{not json";
        expect(readBulkCounts(s)).toEqual({});
        s.data[BULK_OUTREACH_KEY] = JSON.stringify({ "2026-07-09": "abc", "bad-key": 5, "2026-07-08": 7 });
        expect(readBulkCounts(s)).toEqual({ "2026-07-08": 7 });
    });

    it("counts clamp at a sane ceiling", () => {
        const s = mem();
        const now = new Date(2026, 6, 9);
        logBulkOutreach(999999, s, now);
        expect(bulkOutreachToday(s, now)).toBe(2000);
    });
});
