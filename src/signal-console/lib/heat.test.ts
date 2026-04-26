import { describe, expect, it } from "vitest";
import {
    heat,
    heatBand,
    heatCls,
    heatMetrics,
    rankByHeat,
    recency
} from "./heat";
import type { Account, Signal } from "./types";

const NOW = new Date("2026-04-26T00:00:00Z").getTime();

function sig(partial: Partial<Signal>): Signal {
    return {
        id: partial.id ?? "s",
        ...partial
    };
}

function acct(signals: Signal[], partial: Partial<Account> = {}): Account {
    return {
        id: partial.id ?? "a",
        name: partial.name ?? "Acme",
        signals,
        ...partial
    };
}

function daysAgo(days: number): string {
    return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("recency", () => {
    it("returns 1.0 for fresh signals (≤14 days)", () => {
        expect(recency(sig({ published_date: daysAgo(7) }), NOW)).toBe(1);
        expect(recency(sig({ published_date: daysAgo(14) }), NOW)).toBe(1);
    });

    it("step-decays through the 6 buckets", () => {
        expect(recency(sig({ published_date: daysAgo(20) }), NOW)).toBe(0.9);
        expect(recency(sig({ published_date: daysAgo(45) }), NOW)).toBe(0.75);
        expect(recency(sig({ published_date: daysAgo(75) }), NOW)).toBe(0.55);
        expect(recency(sig({ published_date: daysAgo(150) }), NOW)).toBe(0.3);
        expect(recency(sig({ published_date: daysAgo(365) }), NOW)).toBe(0.1);
    });

    it("falls back from published_date to fetched_at to capturedAt", () => {
        expect(recency(sig({ fetched_at: daysAgo(5) }), NOW)).toBe(1);
        expect(recency(sig({ capturedAt: daysAgo(5) }), NOW)).toBe(1);
    });

    it("returns 0.1 for unparseable timestamps", () => {
        expect(recency(sig({ published_date: "not a date" }), NOW)).toBe(0.1);
    });
});

describe("heat", () => {
    it("returns 0 for an account with no signals", () => {
        expect(heat(acct([]), NOW)).toBe(0);
    });

    it("scores 12 for one fresh non-AI low-confidence signal", () => {
        // 12 base * 1.0 recency = 12
        const a = acct([sig({ published_date: daysAgo(5), confidence: 0.5 })]);
        expect(heat(a, NOW)).toBe(12);
    });

    it("scores 18 for one fresh AI signal (no high-conf bonus)", () => {
        // 18 base * 1.0 recency = 18
        const a = acct([sig({ published_date: daysAgo(5), is_ai: true })]);
        expect(heat(a, NOW)).toBe(18);
    });

    it("adds +5 high-confidence bonus when confidence ≥ 0.9", () => {
        // (12 + 5) * 1.0 = 17
        const a = acct([sig({ published_date: daysAgo(5), confidence: 0.9 })]);
        expect(heat(a, NOW)).toBe(17);
    });

    it("multiplies by recency decay", () => {
        // (12 + 5) * 0.3 = 5.1 → round 5
        const a = acct([sig({ published_date: daysAgo(150), confidence: 0.9 })]);
        expect(heat(a, NOW)).toBe(5);
    });

    it("excludes flagged signals from the score", () => {
        const flagged = sig({
            published_date: daysAgo(5),
            is_ai: true,
            confidence: 0.95,
            status: "flagged"
        });
        const real = sig({ published_date: daysAgo(5), confidence: 0.5 });
        const a = acct([flagged, real]);
        // flagged drops out → only the 12-pt non-AI signal counts
        expect(heat(a, NOW)).toBe(12);
    });

    it("clamps at 99", () => {
        const sigs = Array.from({ length: 20 }, (_, i) =>
            sig({
                id: `s${i}`,
                published_date: daysAgo(1),
                is_ai: true,
                confidence: 0.95
            })
        );
        const a = acct(sigs);
        expect(heat(a, NOW)).toBe(99);
    });
});

describe("heatBand + heatCls", () => {
    it("Hot (≥91), Active (≥75), Watch (≥50), Low (<50)", () => {
        expect(heatBand(99)).toBe("Hot");
        expect(heatBand(91)).toBe("Hot");
        expect(heatBand(90)).toBe("Active");
        expect(heatBand(75)).toBe("Active");
        expect(heatBand(74)).toBe("Watch");
        expect(heatBand(50)).toBe("Watch");
        expect(heatBand(49)).toBe("Low");
        expect(heatBand(0)).toBe("Low");
    });

    it("CSS class mirrors the bands", () => {
        expect(heatCls(95)).toBe("h-hot");
        expect(heatCls(80)).toBe("h-warm");
        expect(heatCls(60)).toBe("h-med");
        expect(heatCls(20)).toBe("h-cool");
    });
});

describe("heatMetrics", () => {
    it("breaks down signal count, recent, high-conf, AI", () => {
        const a = acct([
            sig({ id: "1", published_date: daysAgo(5), is_ai: true, confidence: 0.95 }),
            sig({ id: "2", published_date: daysAgo(10), confidence: 0.5 }),
            sig({ id: "3", published_date: daysAgo(120), confidence: 0.92 }),
            sig({ id: "4", published_date: daysAgo(2), cat: "trigger_event" })
        ]);
        const m = heatMetrics(a, NOW);
        expect(m.signalCount).toBe(4);
        expect(m.recentCount).toBe(3); // 5, 10, 2 days are all >=0.75 recency
        expect(m.highConfidenceCount).toBe(2);
        expect(m.aiCount).toBe(1);
        expect(m.triggerCount).toBe(1);
        expect(m.heat).toBeGreaterThan(0);
        expect(m.band).toBeDefined();
    });

    it("excludes flagged signals from metrics", () => {
        const a = acct([
            sig({ id: "1", published_date: daysAgo(5), status: "flagged" }),
            sig({ id: "2", published_date: daysAgo(5) })
        ]);
        const m = heatMetrics(a, NOW);
        expect(m.signalCount).toBe(1);
    });

    it("returns zero metrics for empty signal list", () => {
        const m = heatMetrics(acct([]), NOW);
        expect(m.heat).toBe(0);
        expect(m.signalCount).toBe(0);
        expect(m.band).toBe("Low");
    });
});

describe("rankByHeat", () => {
    it("orders by heat desc, stable on ties", () => {
        const hotSig = sig({ published_date: daysAgo(5), is_ai: true, confidence: 0.95 });
        const coldSig = sig({ published_date: daysAgo(200), confidence: 0.5 });
        const accounts = [
            acct([coldSig], { id: "cold-1" }),
            acct([hotSig], { id: "hot-1" }),
            acct([coldSig], { id: "cold-2" })
        ];
        const ranked = rankByHeat(accounts, NOW);
        expect(ranked.map((a) => a.id)).toEqual(["hot-1", "cold-1", "cold-2"]);
    });

    it("returns empty array for empty input", () => {
        expect(rankByHeat([], NOW)).toEqual([]);
    });
});
