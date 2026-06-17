import { describe, expect, it, beforeEach } from "vitest";
import {
    __setAdvisorsForTests,
    __setDealOptionsForTests,
    resetSession,
    setAdvisorId,
    setDealId
} from "../../state";
import type { Advisor, AdvisorDeal } from "../../lib/types";
import {
    impactTone,
    outcomeTone,
    spendRead,
    spendTone,
    toPulling
} from "./adapters";

function advisor(over: Partial<Advisor> = {}): Advisor {
    return {
        id: "adv1",
        name: "Sarah Chen",
        title: "Board member",
        tier: "t1",
        expertise: "Enterprise SaaS",
        equity: "",
        companies: ["Northwind Robotics"],
        notes: "",
        relationship: "active",
        createdAt: new Date().toISOString(),
        ...over
    };
}

function deal(over: Partial<AdvisorDeal> = {}): AdvisorDeal {
    return {
        id: "d1",
        accountName: "Northwind Robotics",
        stage: "negotiation",
        value: 80000,
        nextStep: "Procurement review",
        nextStepDate: new Date(Date.now() + 86400000).toISOString(),
        champion: "Jamie Lin",
        economicBuyer: "CFO",
        primaryContact: "Jamie Lin",
        buyer: "CFO",
        decisionProcess: "Board sign-off",
        advisorHistory: [],
        ...over
    };
}

beforeEach(() => {
    resetSession();
});

describe("tone maps", () => {
    it("tones the spend bands", () => {
        expect(spendTone("ask_ready")).toBe("green");
        expect(spendTone("narrow_first")).toBe("amber");
        expect(spendTone("not_ready")).toBe("red");
    });
    it("tones the deployment outcomes", () => {
        expect(outcomeTone("successful")).toBe("green");
        expect(outcomeTone("pending")).toBe("blue");
        expect(outcomeTone("hold")).toBe("amber");
        expect(outcomeTone("declined")).toBe("red");
    });
    it("tones the impact rows", () => {
        expect(impactTone("red")).toBe("red");
        expect(impactTone("orange")).toBe("amber");
        expect(impactTone("blue")).toBe("blue");
        expect(impactTone("green")).toBe("green");
    });
});

describe("spendRead", () => {
    it("is not_ready with an empty desk", () => {
        expect(spendRead().band).toBe("not_ready");
    });
    it("climbs as the desk is aimed at a real deal + carrier", () => {
        __setDealOptionsForTests([deal()]);
        __setAdvisorsForTests([advisor()]);
        setDealId("d1");
        setAdvisorId("adv1");
        const r = spendRead();
        expect(r.score).toBeGreaterThan(54);
        expect(r.band === "ask_ready" || r.band === "narrow_first").toBe(true);
    });
});

describe("toPulling", () => {
    it("is absent until a deal is on the desk", () => {
        expect(toPulling()).toBeUndefined();
    });
    it("routes back to the Deal Workspace once a deal is selected", () => {
        __setDealOptionsForTests([deal()]);
        setDealId("d1");
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Track the deal");
        expect(p!.object).toBe("Northwind Robotics");
        expect(p!.href).toContain("/deal-workspace/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
