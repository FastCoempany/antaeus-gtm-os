import { describe, expect, it } from "vitest";
import { computeImpact } from "./impact";
import type { Advisor, AdvisorDeal, Deployment } from "./types";

function makeAdvisor(p: Partial<Advisor>): Advisor {
    return {
        id: p.id ?? "a",
        name: "Sarah",
        title: "",
        tier: "t2",
        expertise: "",
        equity: "",
        companies: p.companies ?? [],
        notes: "",
        relationship: "active",
        createdAt: "2026-01-01"
    };
}

function makeDeal(p: Partial<AdvisorDeal>): AdvisorDeal {
    return {
        id: p.id ?? "d",
        accountName: p.accountName ?? "Acme",
        stage: p.stage ?? "discovery",
        value: 0,
        nextStep: "",
        nextStepDate: null,
        champion: "",
        economicBuyer: "",
        primaryContact: "",
        buyer: "",
        decisionProcess: "",
        advisorHistory: []
    };
}

function makeDep(p: Partial<Deployment>): Deployment {
    return {
        id: p.id ?? "x",
        dealId: "",
        dealName: "",
        dealStage: "",
        advisorId: "",
        advisorName: "",
        momentId: "intro",
        momentName: "",
        ask: "",
        forwardableNote: "",
        outcome: p.outcome ?? "pending",
        notes: "",
        createdAt: "2026-04-27T00:00:00Z",
        outcomeDate: null
    };
}

describe("computeImpact", () => {
    it("4 cells in canonical order: carriers / coverage / open loops / success rate", () => {
        const out = computeImpact({
            advisors: [],
            deployments: [],
            activeDeals: []
        });
        expect(out.cells.map((c) => c.label)).toEqual([
            "registered carriers",
            "live deal coverage",
            "open loops",
            "success read"
        ]);
    });

    it("empty registry surfaces 'Registry first' (red)", () => {
        const out = computeImpact({
            advisors: [],
            deployments: [],
            activeDeals: []
        });
        const titles = out.rows.map((r) => r.title);
        expect(titles).toContain("Registry first");
        const reg = out.rows.find((r) => r.title === "Registry first");
        expect(reg?.tone).toBe("red");
    });

    it("coverage gap surfaces when some active deals have no advisor", () => {
        const advisors = [makeAdvisor({ companies: ["Acme"] })];
        const activeDeals = [
            makeDeal({ id: "1", accountName: "Acme" }),
            makeDeal({ id: "2", accountName: "Beta" })
        ];
        const out = computeImpact({
            advisors,
            deployments: [],
            activeDeals
        });
        const gap = out.rows.find((r) => r.title === "Coverage gap");
        expect(gap).toBeDefined();
        expect(gap?.copy).toContain("1 live deal");
        expect(gap?.tone).toBe("orange");
    });

    it("follow-through surfaces when pending+engaged deployments exist", () => {
        const out = computeImpact({
            advisors: [makeAdvisor({})],
            deployments: [
                makeDep({ outcome: "pending" }),
                makeDep({ outcome: "engaged" }),
                makeDep({ outcome: "successful" })
            ],
            activeDeals: []
        });
        const ft = out.rows.find((r) => r.title === "Follow-through");
        expect(ft).toBeDefined();
        expect(ft?.copy).toContain("2 advisor loop");
        expect(ft?.tone).toBe("blue");
    });

    it("compounding row appears when successful loops > 0", () => {
        const out = computeImpact({
            advisors: [makeAdvisor({})],
            deployments: [makeDep({ outcome: "successful" })],
            activeDeals: []
        });
        const c = out.rows.find((r) => r.title === "Compounding");
        expect(c?.tone).toBe("green");
    });

    it("'Clean desk' fallthrough when nothing weak shows", () => {
        const out = computeImpact({
            advisors: [makeAdvisor({ companies: ["Acme"] })],
            deployments: [makeDep({ outcome: "declined" })],
            activeDeals: [makeDeal({ accountName: "Acme" })]
        });
        const titles = out.rows.map((r) => r.title);
        expect(titles).toContain("Clean desk");
    });

    it("success rate is round-to-int %", () => {
        const out = computeImpact({
            advisors: [makeAdvisor({})],
            deployments: [
                makeDep({ outcome: "successful" }),
                makeDep({ outcome: "successful" }),
                makeDep({ outcome: "declined" })
            ],
            activeDeals: []
        });
        // 2 / 3 → 67%
        expect(out.cells[3]?.value).toBe("67%");
    });
});
