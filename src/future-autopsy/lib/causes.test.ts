import { describe, expect, it } from "vitest";
import { CAUSES, topCauses } from "./causes";
import { computeVitals, DEFAULT_PREFS } from "./vitals";
import type { Deal } from "@/deal-workspace/lib/deal-shape";

const NOW = new Date("2026-04-26T12:00:00Z").getTime();

function daysAgo(days: number): string {
    return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();
}

function past(days: number): string {
    return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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

describe("CAUSES table", () => {
    it("includes all 13 ported causes", () => {
        expect(CAUSES).toHaveLength(13);
    });

    it("each cause has the required shape", () => {
        for (const c of CAUSES) {
            expect(c.id).toBeDefined();
            expect(typeof c.severity).toBe("number");
            expect(c.text.length).toBeGreaterThan(0);
            expect(typeof c.when).toBe("function");
        }
    });
});

describe("topCauses", () => {
    it("returns empty for a fully-qualified, fresh, low-value deal", () => {
        const filled = "x".repeat(40);
        const v = computeVitals(
            deal({
                value: 10000,
                stage: "discovery",
                updated_at: daysAgo(1),
                champion: filled,
                economicBuyer: filled,
                useCase: filled,
                pain: filled,
                decisionProcess: filled,
                competition: filled,
                notes: filled,
                nextStep: "Demo scheduled with full agenda for Tuesday",
                nextStepDate: "2026-05-15",
                closeDate: "2026-06-15",
                stakeholders: [
                    { name: "Tech Eval", role: "technical", engaged: true },
                    { name: "End User", role: "end_user", engaged: true }
                ]
            }),
            { now: NOW, storage: null }
        );
        expect(topCauses(v, DEFAULT_PREFS, 5)).toHaveLength(0);
    });

    it("fires no_nextstep when next step is missing", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: null });
        const causes = topCauses(v, DEFAULT_PREFS, 10);
        expect(causes.some((c) => c.id === "no_nextstep")).toBe(true);
    });

    it("fires stale_thread when staleDays >= staleWarnDays (7)", () => {
        const v = computeVitals(deal({ updated_at: daysAgo(14) }), {
            now: NOW,
            storage: null
        });
        const causes = topCauses(v, DEFAULT_PREFS, 10);
        expect(causes.some((c) => c.id === "stale_thread")).toBe(true);
    });

    it("fires no_champion when champion is missing", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: null });
        const causes = topCauses(v, DEFAULT_PREFS, 10);
        expect(causes.some((c) => c.id === "no_champion")).toBe(true);
    });

    it("fires next_step_overdue when nextStepDate is in the past", () => {
        const v = computeVitals(
            deal({ nextStep: "Send proposal", nextStepDate: past(5) }),
            { now: NOW, storage: null }
        );
        const causes = topCauses(v, DEFAULT_PREFS, 10);
        expect(causes.some((c) => c.id === "next_step_overdue")).toBe(true);
    });

    it("fires single_threaded when engaged < 3 and value >= 50000", () => {
        const v = computeVitals(deal({ value: 100000 }), {
            now: NOW,
            storage: null
        });
        const causes = topCauses(v, DEFAULT_PREFS, 10);
        expect(causes.some((c) => c.id === "single_threaded")).toBe(true);
    });

    it("respects the limit", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: null });
        const out = topCauses(v, DEFAULT_PREFS, 3);
        expect(out.length).toBeLessThanOrEqual(3);
    });

    it("orders by severity desc", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: null });
        const out = topCauses(v, DEFAULT_PREFS, 5);
        for (let i = 1; i < out.length; i++) {
            expect(out[i]!.weight).toBeLessThanOrEqual(out[i - 1]!.weight);
        }
    });
});
