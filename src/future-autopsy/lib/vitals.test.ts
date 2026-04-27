import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, computeRisk, computeVitals, qualScore } from "./vitals";
import type { Deal } from "@/deal-workspace/lib/deal-shape";

const NOW = new Date("2026-04-26T12:00:00Z").getTime();

function daysAgo(days: number): string {
    return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();
}

function future(days: number): string {
    const d = new Date(NOW + days * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
}

function past(days: number): string {
    const d = new Date(NOW - days * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
}

function deal(partial: Partial<Deal>): Deal {
    return {
        id: partial.id ?? "d",
        accountName: partial.accountName ?? "Acme",
        value: partial.value ?? 50000,
        stage: partial.stage ?? "discovery",
        ...partial
    };
}

describe("qualScore", () => {
    it("scores all-missing as 0", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: null });
        expect(qualScore(v.gates)).toBe(0);
    });

    it("scores one full-length field at 2 (present)", () => {
        const v = computeVitals(
            deal({
                champion: "Jane is the procurement lead and has decision authority"
            }),
            { now: NOW, storage: null }
        );
        expect(qualScore(v.gates)).toBe(2);
    });

    it("scores a short field at 1 (weak)", () => {
        const v = computeVitals(deal({ champion: "Jane" }), { now: NOW, storage: null });
        expect(qualScore(v.gates)).toBe(1);
    });

    it("caps at 18 across the 9 gates", () => {
        // The 'timeline' gate reads closeDate, which is a date string like
        // "2026-05-06" (10 chars) and falls under the 20-char threshold for
        // "present" — scores 1 (weak) in normal usage. The 18 ceiling is
        // theoretical; realistic max is 17 (8 long-text fields × 2 + 1).
        const filled = "x".repeat(40);
        const v = computeVitals(
            deal({
                champion: filled,
                economicBuyer: filled,
                useCase: filled,
                pain: filled,
                decisionProcess: filled,
                closeDate: future(10),
                competition: filled,
                notes: filled,
                nextStep: filled
            }),
            { now: NOW, storage: null }
        );
        expect(qualScore(v.gates)).toBeLessThanOrEqual(18);
        expect(qualScore(v.gates)).toBe(17);
    });
});

describe("computeVitals", () => {
    it("emits stale days from updated_at", () => {
        const v = computeVitals(deal({ updated_at: daysAgo(10) }), {
            now: NOW,
            storage: null
        });
        expect(v.staleDays).toBe(10);
    });

    it("infers momentum from staleness when none is set", () => {
        const fresh = computeVitals(deal({ updated_at: daysAgo(2) }), {
            now: NOW,
            storage: null
        });
        const mid = computeVitals(deal({ updated_at: daysAgo(5) }), {
            now: NOW,
            storage: null
        });
        const stale = computeVitals(deal({ updated_at: daysAgo(20) }), {
            now: NOW,
            storage: null
        });
        expect(fresh.momentum).toBe("strong");
        expect(mid.momentum).toBe("neutral");
        expect(stale.momentum).toBe("stalling");
    });

    it("honors an explicit momentum", () => {
        const v = computeVitals(
            deal({ updated_at: daysAgo(20), momentum: "strong" }),
            { now: NOW, storage: null }
        );
        expect(v.momentum).toBe("strong");
    });

    it("computes nextStepDaysAway as negative when overdue", () => {
        const v = computeVitals(deal({ nextStepDate: past(3) }), {
            now: NOW,
            storage: null
        });
        expect(v.nextStepDaysAway !== null && v.nextStepDaysAway < 0).toBe(true);
    });

    it("returns null nextStepDaysAway when no date", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: null });
        expect(v.nextStepDaysAway).toBeNull();
    });

    it("flags closed deals", () => {
        const v = computeVitals(deal({ stage: "closed-won" }), {
            now: NOW,
            storage: null
        });
        expect(v.isClosed).toBe(true);
    });

    it("counts threading from stakeholders + champion + EB", () => {
        const v = computeVitals(
            deal({
                champion: "Jane",
                economicBuyer: "Sarah",
                stakeholders: [
                    { name: "Tech Eval", role: "technical", engaged: true }
                ]
            }),
            { now: NOW, storage: null }
        );
        expect(v.threading.engaged).toBeGreaterThanOrEqual(3);
    });
});

describe("computeRisk", () => {
    it("returns 0 for closed deals", () => {
        const v = computeVitals(deal({ stage: "closed-won" }), {
            now: NOW,
            storage: null
        });
        expect(computeRisk(v, DEFAULT_PREFS)).toBe(0);
    });

    it("rises with staleness", () => {
        const fresh = computeVitals(deal({ updated_at: daysAgo(1) }), {
            now: NOW,
            storage: null
        });
        const stale = computeVitals(deal({ updated_at: daysAgo(30) }), {
            now: NOW,
            storage: null
        });
        expect(stale.riskScore).toBeGreaterThan(fresh.riskScore);
    });

    it("amplifies on high-value deals", () => {
        const small = computeVitals(deal({ value: 30000 }), {
            now: NOW,
            storage: null
        });
        const big = computeVitals(deal({ value: 200000 }), {
            now: NOW,
            storage: null
        });
        expect(big.riskScore).toBeGreaterThan(small.riskScore);
    });

    it("clamps to 0-100", () => {
        const v = computeVitals(
            deal({
                value: 1_000_000,
                stage: "negotiation",
                updated_at: daysAgo(100),
                closeDate: past(60)
            }),
            { now: NOW, storage: null }
        );
        expect(v.riskScore).toBeLessThanOrEqual(100);
        expect(v.riskScore).toBeGreaterThanOrEqual(0);
    });

    it("hits late-stage fragility when EB or process missing in a late stage", () => {
        const filled = "x".repeat(40);
        const fragile = computeVitals(
            deal({ stage: "negotiation", champion: filled, value: 80000 }),
            { now: NOW, storage: null }
        );
        const robust = computeVitals(
            deal({
                stage: "negotiation",
                champion: filled,
                economicBuyer: filled,
                decisionProcess: filled,
                value: 80000
            }),
            { now: NOW, storage: null }
        );
        expect(fragile.riskScore).toBeGreaterThan(robust.riskScore);
    });
});
