import { describe, expect, it, beforeEach } from "vitest";
import {
    __resetForTests,
    setCounterpartyName,
    setDealId,
    setLinkedDeals,
    setOpeningLine,
    setStartingPosition,
    setWalkawayPosition
} from "../../state";
import type { LinkedDealSummary } from "../../lib/types";
import {
    computePrepRead,
    costTone,
    outcomeTone,
    prepRead,
    prepTone,
    toPulling
} from "./adapters";
import { EMPTY_NEGOTIATION } from "../../lib/types";

function deal(over: Partial<LinkedDealSummary> = {}): LinkedDealSummary {
    return {
        id: "d1",
        accountName: "Northwind Robotics",
        stage: "negotiation",
        value: 80000,
        ...over
    };
}

const baseDraft = {
    ...EMPTY_NEGOTIATION,
    id: "",
    createdAt: "",
    updatedAt: "",
    concessionLadder: [],
    pushbacks: []
};

beforeEach(() => {
    __resetForTests();
});

describe("tone maps", () => {
    it("tones the concession costs ascending", () => {
        expect(costTone("free")).toBe("green");
        expect(costTone("low")).toBe("blue");
        expect(costTone("mid")).toBe("amber");
        expect(costTone("high")).toBe("red");
    });
    it("tones the outcomes — held green, lost red", () => {
        expect(outcomeTone("held_position")).toBe("green");
        expect(outcomeTone("moved_one_step")).toBe("blue");
        expect(outcomeTone("moved_two_plus")).toBe("amber");
        expect(outcomeTone("walked_away")).toBe("amber");
        expect(outcomeTone("lost_to_pricing")).toBe("red");
    });
    it("tones the prep bands", () => {
        expect(prepTone("improvising")).toBe("red");
        expect(prepTone("drafting")).toBe("amber");
        expect(prepTone("rehearsed")).toBe("green");
    });
});

describe("computePrepRead", () => {
    it("is improvising when the walkaway isn't set, even with everything else", () => {
        const r = computePrepRead({
            draft: {
                ...baseDraft,
                startingPosition: "List price, full terms.",
                openingLine: "Thanks for making time.",
                counterpartyName: "Jamie Lin"
            },
            dealLinked: true
        });
        expect(r.band).toBe("improvising");
        expect(r.gaps[0]).toContain("walkaway");
        expect(r.nextMove.toLowerCase()).toContain("walkaway");
    });

    it("is drafting once the walkaway is set but positions are incomplete", () => {
        const r = computePrepRead({
            draft: { ...baseDraft, walkawayPosition: "No below 15% off." },
            dealLinked: false
        });
        expect(r.band).toBe("drafting");
        // walkaway only = 35 < 80
        expect(r.score).toBe(35);
        expect(r.nextMove).toContain("starting position");
    });

    it("is rehearsed when walkaway + starting + opening are all decided", () => {
        const r = computePrepRead({
            draft: {
                ...baseDraft,
                walkawayPosition: "No below 15% off.",
                startingPosition: "List price, full terms.",
                openingLine: "Thanks for making time."
            },
            dealLinked: false
        });
        expect(r.band).toBe("rehearsed");
        expect(r.score).toBeGreaterThanOrEqual(80);
        expect(r.title).toContain("pre-decided");
        // no deal linked → nextMove nudges to link one
        expect(r.nextMove.toLowerCase()).toContain("link");
    });

    it("nudges the pushbacks when fully rehearsed and the deal is linked", () => {
        const r = computePrepRead({
            draft: {
                ...baseDraft,
                walkawayPosition: "No below 15% off.",
                startingPosition: "List price, full terms.",
                openingLine: "Thanks for making time.",
                counterpartyName: "Jamie Lin"
            },
            dealLinked: true
        });
        expect(r.band).toBe("rehearsed");
        expect(r.score).toBe(100);
        expect(r.nextMove.toLowerCase()).toContain("pushbacks");
        expect(r.gaps).toHaveLength(0);
    });
});

describe("prepRead (live)", () => {
    it("reads from the draft signals", () => {
        expect(prepRead().band).toBe("improvising");
        setWalkawayPosition("No below 15% off.");
        setStartingPosition("List price.");
        setOpeningLine("Thanks for making time.");
        expect(prepRead().band).toBe("rehearsed");
    });
});

describe("toPulling", () => {
    it("is absent until a deal is linked", () => {
        expect(toPulling()).toBeUndefined();
    });
    it("routes back to the Deal Workspace once a deal is linked", () => {
        setLinkedDeals([deal()]);
        setDealId("d1");
        setCounterpartyName("Jamie Lin");
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Update the deal");
        expect(p!.object).toBe("Northwind Robotics");
        expect(p!.href).toContain("/deal-workspace/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
