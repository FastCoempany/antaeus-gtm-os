import { describe, expect, it } from "vitest";
import { rankNextMove, shouldFlagOtherRoom } from "./ranker";
import type { DealForRanking, HotAccount, RankerInputs } from "./ranker";
import type { ObservationView } from "@/lib/observations/types";

function obs(over: Partial<ObservationView> = {}): ObservationView {
    return {
        id: "o_1",
        workspaceId: "ws-1",
        writtenAt: "2026-05-31",
        observationText: "Acme has been stalled at negotiation for 21 days with no dated next step.",
        relatedObjectType: over.relatedObjectType ?? "deal",
        relatedObjectId: over.relatedObjectId ?? "d_1",
        sourceGenerator: over.sourceGenerator ?? "phase-b/deal-decay",
        confidence: over.confidence ?? "high",
        status: over.status ?? "active",
        supersededBy: null,
        dismissedAt: null,
        dismissedReason: null,
        ...over
    };
}

function deal(over: Partial<DealForRanking> = {}): DealForRanking {
    return {
        id: "d_1",
        account_name: "Acme",
        stage: "negotiation",
        recovery_rank: 60,
        next_step_date: null,
        ...over
    };
}

function hot(over: Partial<HotAccount> = {}): HotAccount {
    return {
        id: "a_1",
        account_name: "Hot Co",
        heat: 80,
        ...over
    };
}

function input(over: Partial<RankerInputs> = {}): RankerInputs {
    return {
        observations: [],
        deals: [],
        hotAccounts: [],
        ...over
    };
}

describe("rankNextMove — empty + filters", () => {
    it("returns no-candidates when everything is empty", () => {
        const r = rankNextMove(input());
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.reason).toBe("no-candidates");
    });

    it("ignores dismissed observations", () => {
        const r = rankNextMove(
            input({
                observations: [obs({ dismissedAt: "2026-05-30T10:00:00.000Z" })]
            })
        );
        expect(r.ok).toBe(false);
    });

    it("ignores non-active observations", () => {
        const r = rankNextMove(
            input({
                observations: [obs({ status: "superseded" })]
            })
        );
        expect(r.ok).toBe(false);
    });

    it("ignores closed deals", () => {
        const r = rankNextMove(
            input({
                deals: [
                    deal({ id: "won", stage: "closed-won", recovery_rank: 90 }),
                    deal({ id: "lost", stage: "closed-lost", recovery_rank: 95 })
                ]
            })
        );
        expect(r.ok).toBe(false);
    });

    it("ignores zero-rank deals + zero-heat accounts", () => {
        const r = rankNextMove(
            input({
                deals: [deal({ id: "low", recovery_rank: 0 })],
                hotAccounts: [hot({ heat: 0 })]
            })
        );
        expect(r.ok).toBe(false);
    });
});

describe("rankNextMove — picks the highest-pressure candidate", () => {
    it("picks the observation when it scores highest", () => {
        const r = rankNextMove(
            input({
                observations: [obs({ confidence: "high" })],
                deals: [deal({ recovery_rank: 40 })],
                hotAccounts: [hot({ heat: 30 })]
            })
        );
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.move.sourceKind).toBe("observation");
    });

    it("picks the deal when its recovery_rank beats observations", () => {
        const r = rankNextMove(
            input({
                observations: [obs({ confidence: "low" })], // score 60
                deals: [deal({ recovery_rank: 90 })], // score 90 (or 95 with bonus)
                hotAccounts: [hot({ heat: 70 })]
            })
        );
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.move.sourceKind).toBe("deal-pressure");
    });

    it("picks the hot account only when observations + deals are quiet", () => {
        const r = rankNextMove(
            input({
                hotAccounts: [hot({ heat: 100 })] // score 70
            })
        );
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.move.sourceKind).toBe("hot-signal-account");
    });

    it("breaks ties by source priority (observation > deal > hot)", () => {
        // Engineer a tie by hand: observation score 60, deal 60.
        // observation wins on source-priority tiebreak.
        const r = rankNextMove(
            input({
                observations: [obs({ confidence: "low" })], // 60
                deals: [
                    deal({
                        id: "tied",
                        recovery_rank: 60,
                        next_step_date: "2027-01-01T00:00:00.000Z" // no missing-step bonus
                    })
                ]
            })
        );
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.move.sourceKind).toBe("observation");
    });
});

describe("rankNextMove — voice gate", () => {
    it("drops candidates whose labels would fail the voice rules", () => {
        // Hot account with a name that would force a banned-vocab into
        // the reason (e.g. "synergy"). Ranker should drop it.
        const r = rankNextMove(
            input({
                hotAccounts: [hot({ id: "synergy_x", account_name: "Synergy" })]
            })
        );
        expect(r.ok).toBe(false);
        if (r.ok) return;
        expect(r.reason).toBe("all-voice-failed");
    });
});

describe("rankNextMove — currentRoomHref filter", () => {
    it("prefers candidates that target rooms OTHER than the current one", () => {
        const r = rankNextMove(
            input({
                observations: [
                    obs({
                        id: "in-room",
                        relatedObjectType: "deal", // routes to /deal-workspace/
                        confidence: "high"
                    })
                ],
                deals: [deal({ recovery_rank: 50 })], // routes to /deal-workspace/
                hotAccounts: [hot({ heat: 100 })], // routes to /outbound-studio/
                currentRoomHref: "/deal-workspace/"
            })
        );
        // The hot account is the only candidate not in /deal-workspace/.
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.move.sourceKind).toBe("hot-signal-account");
    });

    it("falls back to in-room candidates when no out-of-room options exist", () => {
        const r = rankNextMove(
            input({
                observations: [obs({ confidence: "high" })],
                currentRoomHref: "/deal-workspace/"
            })
        );
        expect(r.ok).toBe(true);
        // Falls back even though target is in-room.
        if (!r.ok) return;
        expect(r.move.targetUrl).toContain("/deal-workspace/");
    });
});

describe("targetUrl shape", () => {
    it("builds a deal target with focusObject + fromSurface", () => {
        const r = rankNextMove(
            input({
                deals: [deal({ id: "d_specific", recovery_rank: 70 })]
            })
        );
        if (!r.ok) throw new Error("expected ok");
        expect(r.move.targetUrl).toContain("/deal-workspace/");
        expect(r.move.targetUrl).toContain("focusObject=d_specific");
        expect(r.move.targetUrl).toContain("fromSurface=birdseye");
    });

    it("builds a hot-account target on /outbound-studio/ with account param", () => {
        const r = rankNextMove(
            input({
                hotAccounts: [hot({ account_name: "Acme Corp", heat: 90 })]
            })
        );
        if (!r.ok) throw new Error("expected ok");
        expect(r.move.targetUrl).toContain("/outbound-studio/");
        // encodeURIComponent uses %20 for space.
        expect(r.move.targetUrl).toContain("account=Acme%20Corp");
    });

    it("routes a proof observation to /poc-framework/", () => {
        const r = rankNextMove(
            input({
                observations: [
                    obs({
                        id: "proof-obs",
                        sourceGenerator: "phase-b/proof-staleness",
                        relatedObjectType: "proof",
                        relatedObjectId: "p_1"
                    })
                ]
            })
        );
        if (!r.ok) throw new Error("expected ok");
        expect(r.move.targetUrl).toContain("/poc-framework/");
    });
});

describe("shouldFlagOtherRoom", () => {
    it("returns false when there's no current room context", () => {
        expect(
            shouldFlagOtherRoom(input({ observations: [obs()] }))
        ).toBe(false);
    });

    it("returns true when the top move targets a different room than current", () => {
        expect(
            shouldFlagOtherRoom(
                input({
                    observations: [obs()], // deal target
                    currentRoomHref: "/dashboard/"
                })
            )
        ).toBe(true);
    });

    it("returns false when the top move targets the current room", () => {
        expect(
            shouldFlagOtherRoom(
                input({
                    observations: [obs()], // deal target
                    currentRoomHref: "/deal-workspace/"
                })
            )
        ).toBe(false);
    });
});
