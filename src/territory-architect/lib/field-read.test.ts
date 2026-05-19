import { describe, expect, it } from "vitest";
import { computeFieldRead } from "./field-read";
import {
    ACCOUNT_CEILING,
    TIER_DEFAULTS,
    TIER_IDS,
    type AllocationReadout,
    type Approach,
    type DispositionState,
    type TerritoryAccount,
    type Focus,
    type TierId
} from "./types";

function makeAllocation(
    partial: Partial<AllocationReadout> = {}
): AllocationReadout {
    return {
        perTier: TIER_IDS.map((tier) => ({
            tier,
            count: 0,
            target: TIER_DEFAULTS[tier],
            delta: -TIER_DEFAULTS[tier]
        })),
        total: 0,
        ceiling: ACCOUNT_CEILING,
        remaining: ACCOUNT_CEILING,
        status: "headroom",
        ...partial
    };
}

const ISO = "2026-05-18T00:00:00Z";

function focus(id: string, title: string = id): Focus {
    return {
        id,
        title,
        tier: "t1",
        pressure: "",
        segment: "",
        whyUs: "",
        accountIds: [],
        createdAt: ISO,
        updatedAt: ISO
    };
}

function approach(id: string, focusId: string): Approach {
    return {
        id,
        focusId,
        name: id,
        trigger: "",
        script: "",
        bridge: "",
        createdAt: ISO,
        updatedAt: ISO
    };
}

function account(
    id: string,
    disposition: DispositionState,
    tier: TierId = "t2"
): TerritoryAccount {
    return {
        id,
        name: id,
        tier,
        focusId: "th-1",
        approachId: "",
        notes: "",
        disposition,
        createdAt: ISO,
        updatedAt: ISO
    };
}

describe("computeFieldRead — empty board", () => {
    it("returns empty band when no focuses exist", () => {
        const r = computeFieldRead({
            accounts: [],
            focuses: [],
            approaches: [],
            allocation: makeAllocation()
        });
        expect(r.band).toBe("empty");
        expect(r.mainRisk.toLowerCase()).toContain("no focuses");
        expect(r.operatorMove.toLowerCase()).toContain("start with one focus");
    });

    it("returns empty band when focuses exist but no active accounts", () => {
        const r = computeFieldRead({
            accounts: [],
            focuses: [focus("th-1")],
            approaches: [],
            allocation: makeAllocation()
        });
        expect(r.band).toBe("empty");
        expect(r.operatorMove.toLowerCase()).toContain("approach");
    });
});

describe("computeFieldRead — next-move priority chain", () => {
    it("prescribes approaches before adding accounts", () => {
        const r = computeFieldRead({
            accounts: [account("a-1", "active")],
            focuses: [focus("th-1")],
            approaches: [],
            allocation: makeAllocation({ total: 1, remaining: 299 })
        });
        expect(r.operatorMove.toLowerCase()).toContain("approach");
    });

    it("prescribes retier when over cap", () => {
        const r = computeFieldRead({
            accounts: Array.from({ length: 5 }, (_, i) =>
                account(`a-${i}`, "active")
            ),
            focuses: [focus("th-1")],
            approaches: [approach("ap-1", "th-1")],
            allocation: makeAllocation({
                total: 305,
                remaining: -5,
                status: "over"
            })
        });
        expect(r.operatorMove.toLowerCase()).toContain("retier");
    });

    it("prescribes removing closed-lost rows when drift is heavy", () => {
        const r = computeFieldRead({
            accounts: [
                account("a-1", "active"),
                account("l-1", "closed-lost"),
                account("l-2", "closed-lost"),
                account("l-3", "closed-lost")
            ],
            focuses: [focus("th-1")],
            approaches: [approach("ap-1", "th-1")],
            allocation: makeAllocation({ total: 1, remaining: 299 })
        });
        expect(r.operatorMove.toLowerCase()).toContain("closed-lost");
    });
});

describe("computeFieldRead — what-is-loose priority chain", () => {
    it("flags single-focus monoculture", () => {
        const r = computeFieldRead({
            accounts: [account("a-1", "active")],
            focuses: [focus("th-1")],
            approaches: [approach("ap-1", "th-1")],
            allocation: makeAllocation({ total: 1, remaining: 299 })
        });
        expect(r.mainRisk.toLowerCase()).toContain("single focus");
    });

    it("flags watch-ring (>=5 paused) when no higher risk fires", () => {
        const r = computeFieldRead({
            accounts: [
                account("a-1", "active"),
                account("a-2", "active"),
                account("p-1", "paused"),
                account("p-2", "paused"),
                account("p-3", "paused"),
                account("p-4", "paused"),
                account("p-5", "paused")
            ],
            focuses: [focus("th-1"), focus("th-2")],
            approaches: [approach("ap-1", "th-1")],
            allocation: makeAllocation({ total: 2, remaining: 298 })
        });
        expect(r.mainRisk.toLowerCase()).toContain("watch-ring");
    });
});

describe("computeFieldRead — replacement pressure", () => {
    it("returns the no-backfill copy when nothing is in drift", () => {
        const r = computeFieldRead({
            accounts: [account("a-1", "active"), account("a-2", "active")],
            focuses: [focus("th-1")],
            approaches: [approach("ap-1", "th-1")],
            allocation: makeAllocation({ total: 2, remaining: 298 })
        });
        expect(r.replacement.toLowerCase()).toContain("no backfill");
    });

    it("counts closed-lost + half of paused as backfill pressure", () => {
        const r = computeFieldRead({
            accounts: [
                account("l-1", "closed-lost"),
                account("l-2", "closed-lost"),
                account("p-1", "paused"),
                account("p-2", "paused"),
                account("p-3", "paused"),
                account("p-4", "paused")
            ],
            focuses: [focus("th-1")],
            approaches: [approach("ap-1", "th-1")],
            allocation: makeAllocation()
        });
        // 2 lost + floor(4/2) = 4 replacements needed
        expect(r.replacement).toContain("4");
    });
});

describe("computeFieldRead — score bands", () => {
    it("scores empty board near 30 floor and bands empty", () => {
        const r = computeFieldRead({
            accounts: [],
            focuses: [],
            approaches: [],
            allocation: makeAllocation()
        });
        expect(r.score).toBeLessThan(40);
        expect(r.band).toBe("empty");
    });

    it("scores a populated territory into the tight/runnable bands", () => {
        const accounts: TerritoryAccount[] = [];
        for (let i = 0; i < 32; i++) {
            accounts.push(account(`a-${i}`, "active"));
        }
        const r = computeFieldRead({
            accounts,
            focuses: [focus("th-1"), focus("th-2"), focus("th-3")],
            approaches: [
                approach("ap-1", "th-1"),
                approach("ap-2", "th-2"),
                approach("ap-3", "th-3")
            ],
            allocation: makeAllocation({ total: 32, remaining: 268 })
        });
        expect(r.score).toBeGreaterThanOrEqual(55);
        expect(["tight", "runnable"]).toContain(r.band);
    });
});
