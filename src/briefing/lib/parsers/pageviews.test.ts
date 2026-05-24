import { describe, expect, it } from "vitest";
import {
    detectSignificantDelta,
    pageviewsUrl,
    type PageviewsResponse
} from "./pageviews";

describe("pageviewsUrl", () => {
    it("URL-encodes the article title", () => {
        const start = new Date(Date.UTC(2026, 4, 1));
        const end = new Date(Date.UTC(2026, 4, 14));
        const url = pageviewsUrl("Customer data platform", start, end);
        expect(url).toContain("Customer_data_platform");
        expect(url).toContain("/daily/20260501/20260514");
    });

    it("converts spaces to underscores before encoding", () => {
        const start = new Date(Date.UTC(2026, 0, 1));
        const end = new Date(Date.UTC(2026, 0, 7));
        const url = pageviewsUrl("Vector database", start, end);
        expect(url).toContain("Vector_database");
        expect(url).not.toContain("Vector%20database");
    });

    it("preserves the canonical endpoint shape", () => {
        const url = pageviewsUrl(
            "Test",
            new Date(Date.UTC(2026, 0, 1)),
            new Date(Date.UTC(2026, 0, 7))
        );
        expect(url).toMatch(
            /^https:\/\/wikimedia\.org\/api\/rest_v1\/metrics\/pageviews\/per-article\/en\.wikipedia\/all-access\/all-agents\/Test\/daily\/20260101\/20260107$/
        );
    });
});

describe("detectSignificantDelta", () => {
    function makeResponse(article: string, dailyViews: number[]): PageviewsResponse {
        // Anchor at 2026-05-01 UTC and step one day per entry so the
        // YYYYMMDDHH timestamps sort lexically in chronological order
        // — which is the invariant detectSignificantDelta relies on
        // when it splits prior vs recent windows.
        const startUtc = Date.UTC(2026, 4, 1);
        return {
            items: dailyViews.map((v, i) => {
                const d = new Date(startUtc + i * 24 * 60 * 60 * 1000);
                const y = d.getUTCFullYear();
                const m = String(d.getUTCMonth() + 1).padStart(2, "0");
                const day = String(d.getUTCDate()).padStart(2, "0");
                return {
                    article,
                    timestamp: `${y}${m}${day}00`,
                    views: v
                };
            })
        };
    }

    it("returns null when there's not enough data for two windows", () => {
        // 7-day default window needs 14 data points.
        const response = makeResponse("Test", [100, 100, 100, 100, 100]);
        expect(detectSignificantDelta(response)).toBeNull();
    });

    it("detects a significant upward spike", () => {
        const dailyViews = [
            ...Array(7).fill(200), // prior week
            ...Array(7).fill(500) // recent week (150% jump)
        ];
        const result = detectSignificantDelta(makeResponse("Customer data platform", dailyViews));
        expect(result).not.toBeNull();
        expect(result?.is_significant).toBe(true);
        expect(result?.direction).toBe("up");
        expect(result?.recent_avg).toBe(500);
        expect(result?.prior_avg).toBe(200);
        expect(result?.delta_pct).toBeCloseTo(1.5);
    });

    it("detects a significant downward spike", () => {
        const dailyViews = [...Array(7).fill(500), ...Array(7).fill(150)];
        const result = detectSignificantDelta(makeResponse("Test", dailyViews));
        expect(result?.is_significant).toBe(true);
        expect(result?.direction).toBe("down");
    });

    it("does NOT fire on small relative changes above the noise floor", () => {
        // 200 → 220 is a 10% change; below 50% threshold.
        const dailyViews = [...Array(7).fill(200), ...Array(7).fill(220)];
        const result = detectSignificantDelta(makeResponse("Test", dailyViews));
        expect(result?.is_significant).toBe(false);
    });

    it("returns null on low-volume articles (both windows below baseline)", () => {
        // 50 views/day is below the 100-view absolute baseline.
        const dailyViews = [...Array(7).fill(10), ...Array(7).fill(50)];
        const result = detectSignificantDelta(makeResponse("Test", dailyViews));
        expect(result).toBeNull();
    });

    it("fires when the baseline rises out of low-volume into significant volume", () => {
        // Prior week noise (5/day), recent week meaningful (200/day).
        const dailyViews = [...Array(7).fill(5), ...Array(7).fill(200)];
        const result = detectSignificantDelta(makeResponse("Test", dailyViews));
        expect(result).not.toBeNull();
        expect(result?.is_significant).toBe(true);
        expect(result?.direction).toBe("up");
    });

    it("classifies a flat profile as 'flat'", () => {
        // Identical windows.
        const dailyViews = [...Array(7).fill(300), ...Array(7).fill(300)];
        const result = detectSignificantDelta(makeResponse("Test", dailyViews));
        expect(result?.direction).toBe("flat");
        expect(result?.is_significant).toBe(false);
    });

    it("handles divide-by-zero (prior_avg=0) without throwing", () => {
        const dailyViews = [...Array(7).fill(0), ...Array(7).fill(150)];
        const result = detectSignificantDelta(makeResponse("Test", dailyViews));
        expect(result?.is_significant).toBe(true);
        expect(result?.direction).toBe("up");
        // No NaN / Infinity in the report.
        expect(Number.isFinite(result?.delta_pct ?? Infinity)).toBe(true);
    });

    it("respects a custom window size", () => {
        // 3-day windows: 6 data points total. First 3 = 100, last 3 = 250.
        const dailyViews = [100, 100, 100, 250, 250, 250];
        const result = detectSignificantDelta(makeResponse("Test", dailyViews), 3);
        expect(result?.is_significant).toBe(true);
        expect(result?.recent_avg).toBe(250);
        expect(result?.prior_avg).toBe(100);
    });
});
