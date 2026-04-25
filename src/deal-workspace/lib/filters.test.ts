import { describe, expect, it } from "vitest";
import { filterAssessments } from "./filters";
import type { RecoveryAssessment } from "./recovery";
import type { Deal } from "./deal-shape";

function makeDeal(partial: Partial<Deal>): Deal {
    return {
        id: partial.id ?? "x",
        accountName: partial.accountName ?? "Acme",
        value: partial.value ?? 1000,
        stage: partial.stage ?? "discovery",
        ...partial
    };
}

function assess(
    deal: Deal,
    lane: RecoveryAssessment["lane"],
    causes: string[] = [],
    score = 100
): RecoveryAssessment {
    return {
        deal,
        score,
        lane,
        causes,
        nextMove: "do something"
    };
}

describe("filterAssessments", () => {
    const NOW = new Date("2026-05-15T12:00:00Z");

    const a = assess(makeDeal({ id: "a" }), "critical", ["Stalled 40 days"]);
    const b = assess(makeDeal({ id: "b" }), "at-risk", [
        "12 days since last activity"
    ]);
    const c = assess(makeDeal({ id: "c" }), "healthy", []);
    const inQuarter = assess(
        makeDeal({ id: "d", closeDate: "2026-06-01" }),
        "healthy",
        []
    );
    const outOfQuarter = assess(
        makeDeal({ id: "e", closeDate: "2026-09-15" }),
        "healthy",
        []
    );

    it("returns the input unchanged for filter=all", () => {
        const result = filterAssessments([a, b, c], "all", NOW);
        expect(result).toHaveLength(3);
    });

    it("drops healthy lane for filter=at-risk", () => {
        const result = filterAssessments([a, b, c], "at-risk", NOW);
        expect(result.map((x) => x.deal.id)).toEqual(["a", "b"]);
    });

    it("returns only assessments with stall/inactivity causes for filter=stalled", () => {
        const result = filterAssessments([a, b, c], "stalled", NOW);
        expect(result.map((x) => x.deal.id)).toEqual(["a", "b"]);
    });

    it("returns only assessments closing in the current quarter", () => {
        const result = filterAssessments(
            [inQuarter, outOfQuarter],
            "this-quarter",
            NOW
        );
        expect(result.map((x) => x.deal.id)).toEqual(["d"]);
    });

    it("excludes assessments without a close date from this-quarter", () => {
        const noCloseDate = assess(makeDeal({ id: "f" }), "at-risk", []);
        const result = filterAssessments([noCloseDate], "this-quarter", NOW);
        expect(result).toHaveLength(0);
    });
});
