import { describe, expect, it } from "vitest";
import { buildHero, laneGroups, rankedAssessments, nineFields, horizonPercent } from "./views";
import type { Deal } from "../../lib/deal-shape";

function deal(p: Partial<Deal>): Deal {
    return {
        id: p.id ?? "d",
        accountName: p.accountName ?? "Acme",
        value: p.value ?? 40000,
        stage: p.stage ?? "discovery",
        ...p
    } as Deal;
}

// A deal with no next step + stale → critical; a fresh deal with a dated
// next step → healthy. (Exact lane math lives in the shared recovery
// engine; these tests pin the view MODEL, not the engine.)
const stale = deal({
    id: "stale",
    accountName: "Northwind",
    value: 120000,
    stage: "negotiation",
    nextStep: "",
    nextStepDate: "",
    updated_at: new Date(Date.now() - 40 * 86400000).toISOString()
});
const healthy = deal({
    id: "ok",
    accountName: "Brex",
    value: 60000,
    stage: "verbal",
    nextStep: "Sign Tuesday",
    nextStepDate: "2099-01-01",
    champion: "Dana",
    momentum: "strong",
    updated_at: new Date().toISOString()
});

describe("buildHero", () => {
    it("counts at-risk deals + their value", () => {
        const hero = buildHero([stale, healthy]);
        expect(hero.liveCount).toBe(2);
        expect(hero.pipelineValue).toBe(180000);
        // stale is not healthy → at risk
        expect(hero.atRiskCount).toBeGreaterThanOrEqual(1);
        expect(hero.atRiskValue).toBeGreaterThanOrEqual(120000);
        expect(hero.calm).toBe(false);
    });

    it("reads calm when nothing is at risk", () => {
        const hero = buildHero([healthy]);
        expect(hero.calm).toBe(true);
        expect(hero.atRiskValue).toBe(0);
    });
});

describe("laneGroups + rankedAssessments", () => {
    it("groups by lane and ranks critical-first", () => {
        const groups = laneGroups([stale, healthy]);
        expect(groups.critical.length + groups["at-risk"].length).toBeGreaterThanOrEqual(1);
        const ranked = rankedAssessments([stale, healthy]);
        // highest-pressure first
        expect(ranked[0]!.deal.id).toBe("stale");
    });
});

describe("nineFields", () => {
    it("marks unnamed fields as gaps (empty value)", () => {
        const fields = nineFields(stale);
        expect(fields).toHaveLength(8);
        const champion = fields.find((f) => f.k === "Champion");
        expect(champion?.v).toBe(""); // gap
        const nextStep = fields.find((f) => f.k === "Next step");
        expect(nextStep?.v).toBe(""); // no next step → gap
    });
});

describe("horizonPercent", () => {
    it("places higher-pressure deals further left (sooner)", () => {
        const ranked = rankedAssessments([stale, healthy]);
        const staleA = ranked.find((a) => a.deal.id === "stale")!;
        const okA = ranked.find((a) => a.deal.id === "ok")!;
        expect(horizonPercent(staleA)).toBeLessThan(horizonPercent(okA));
    });
});
