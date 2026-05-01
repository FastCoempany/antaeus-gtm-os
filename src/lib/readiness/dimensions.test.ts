import { describe, expect, it } from "vitest";
import {
    EMPTY_READINESS_INPUT,
    type ReadinessInput
} from "./types";
import {
    scoreAllDimensions,
    scoreDeals,
    scoreDiscovery,
    scoreIcp,
    scoreOutreach,
    scoreProof
} from "./dimensions";

function input(over: Partial<ReadinessInput> = {}): ReadinessInput {
    return { ...EMPTY_READINESS_INPUT, ...over };
}

describe("scoreIcp", () => {
    it("scores 0 on empty input", () => {
        const s = scoreIcp(EMPTY_READINESS_INPUT);
        expect(s.id).toBe("icp");
        expect(s.score).toBe(0);
        expect(s.evidence).toEqual([]);
        expect(s.gaps.length).toBeGreaterThan(0);
    });

    it("awards 6 the moment an ICP exists", () => {
        const s = scoreIcp(input({ icpCount: 1 }));
        expect(s.score).toBeGreaterThanOrEqual(6);
        expect(s.evidence.some((e) => e.includes("1 ICP defined"))).toBe(
            true
        );
    });

    it("saturates territory at 30 accounts", () => {
        const a = scoreIcp(input({ icpCount: 1, territoryAccountCount: 30 }));
        const b = scoreIcp(input({ icpCount: 1, territoryAccountCount: 60 }));
        expect(a.score).toBe(b.score);
    });

    it("awards full 20 on full inputs", () => {
        const s = scoreIcp(
            input({
                icpCount: 1,
                bestIcpQualityScore: 100,
                territoryAccountCount: 30,
                sourcingProspectsReady: 10
            })
        );
        expect(s.score).toBe(20);
        expect(s.gaps).toEqual([]);
    });
});

describe("scoreOutreach", () => {
    it("scores 0 on empty", () => {
        const s = scoreOutreach(EMPTY_READINESS_INPUT);
        expect(s.score).toBe(0);
    });

    it("rewards channel diversity, not just touches", () => {
        const onlyTouches = scoreOutreach(
            input({ outboundTouches: 30, distinctAccountsTouched: 1 })
        );
        const allChannels = scoreOutreach(
            input({
                outboundTouches: 10,
                coldCallsLogged: 5,
                linkedinCues: 4,
                distinctAccountsTouched: 5
            })
        );
        expect(allChannels.score).toBeGreaterThan(onlyTouches.score);
    });

    it("caps at 20 even with extreme inputs", () => {
        const s = scoreOutreach(
            input({
                outboundTouches: 1000,
                coldCallsLogged: 1000,
                linkedinCues: 1000,
                distinctAccountsTouched: 1000
            })
        );
        expect(s.score).toBe(20);
    });
});

describe("scoreDiscovery", () => {
    it("treats advanced calls as the strongest signal", () => {
        const planned = scoreDiscovery(input({ callPlannerSessions: 8 }));
        const advanced = scoreDiscovery(input({ discoveryAdvancedCalls: 6 }));
        expect(advanced.score).toBeGreaterThan(planned.score);
    });

    it("awards 20 with all three components saturated", () => {
        const s = scoreDiscovery(
            input({
                callPlannerSessions: 8,
                discoveryAdvancedCalls: 6,
                discoveryStudioSessions: 5
            })
        );
        expect(s.score).toBe(20);
    });
});

describe("scoreDeals", () => {
    it("counts both wins and losses-analyzed", () => {
        const winsOnly = scoreDeals(
            input({
                activeDeals: 6,
                dealsWithNextStep: 5,
                closedWonDeals: 3
            })
        );
        const winsAndLearning = scoreDeals(
            input({
                activeDeals: 6,
                dealsWithNextStep: 5,
                closedWonDeals: 3,
                closedLostDealsAnalyzed: 3
            })
        );
        expect(winsAndLearning.score).toBeGreaterThan(winsOnly.score);
    });

    it("flags missing next-step as a gap", () => {
        const s = scoreDeals(input({ activeDeals: 4 }));
        expect(
            s.gaps.some((g) => g.toLowerCase().includes("next-step"))
        ).toBe(true);
    });
});

describe("scoreProof", () => {
    it("rewards memory artifacts heavily", () => {
        const noArtifacts = scoreProof(EMPTY_READINESS_INPUT);
        const withArtifacts = scoreProof(
            input({
                castProofs: 3,
                futureAutopsiesRun: 3,
                advisorDeployments: 3,
                handoffSectionsReady: 5
            })
        );
        expect(noArtifacts.score).toBe(0);
        expect(withArtifacts.score).toBe(20);
    });

    it("flags handoff gap with prescriptive copy", () => {
        const s = scoreProof(EMPTY_READINESS_INPUT);
        expect(
            s.gaps.some((g) => g.includes("Founding GTM"))
        ).toBe(true);
    });
});

describe("scoreAllDimensions", () => {
    it("returns 5 dimensions in canonical order", () => {
        const all = scoreAllDimensions(EMPTY_READINESS_INPUT);
        expect(all.map((d) => d.id)).toEqual([
            "icp",
            "outreach",
            "discovery",
            "deals",
            "proof"
        ]);
    });

    it("sums to <= 100 always", () => {
        const all = scoreAllDimensions(
            input({
                icpCount: 1000,
                bestIcpQualityScore: 100,
                territoryAccountCount: 1000,
                sourcingProspectsReady: 1000,
                outboundTouches: 1000,
                coldCallsLogged: 1000,
                linkedinCues: 1000,
                distinctAccountsTouched: 1000,
                callPlannerSessions: 1000,
                discoveryAdvancedCalls: 1000,
                discoveryStudioSessions: 1000,
                activeDeals: 1000,
                dealsWithNextStep: 1000,
                closedWonDeals: 1000,
                closedLostDealsAnalyzed: 1000,
                castProofs: 1000,
                futureAutopsiesRun: 1000,
                advisorDeployments: 1000,
                handoffSectionsReady: 7
            })
        );
        const total = all.reduce((sum, d) => sum + d.score, 0);
        expect(total).toBe(100);
    });
});
