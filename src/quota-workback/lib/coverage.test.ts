import { beforeEach, describe, expect, it } from "vitest";
import { computeCoverage } from "./coverage";

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
}

describe("computeCoverage", () => {
    let store: FakeStorage;
    beforeEach(() => {
        store = new FakeStorage();
    });

    it("returns empty when quota is zero", () => {
        const c = computeCoverage(0, store);
        expect(c.ratio).toBe(0);
        expect(c.weighted).toBe(0);
        expect(c.hasDeals).toBe(false);
    });

    it("returns empty when no deals stored", () => {
        const c = computeCoverage(100_000, store);
        expect(c.ratio).toBe(0);
        expect(c.hasDeals).toBe(false);
    });

    it("ignores closed deals", () => {
        store.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { value: 100_000, stage: "won" },
                { value: 50_000, stage: "lost" }
            ])
        );
        const c = computeCoverage(100_000, store);
        expect(c.hasDeals).toBe(true);
        expect(c.ratio).toBe(0);
    });

    it("weights pipeline by stage probability", () => {
        store.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { value: 100_000, stage: "prospect" }, // 0.1
                { value: 100_000, stage: "discovery" }, // 0.3
                { value: 100_000, stage: "negotiation" } // 0.8
            ])
        );
        const c = computeCoverage(100_000, store);
        expect(c.raw).toBe(300_000);
        expect(c.weighted).toBe(120_000); // 100k*0.1 + 100k*0.3 + 100k*0.8
        // ratio = round(120k / 100k * 10) / 10 = 1.2
        expect(c.ratio).toBe(1.2);
        expect(c.needed).toBe(0); // weighted is over quota? no, weighted=120k vs quota=100k → no gap
    });

    it("computes gap when weighted < quota (default targetMultiple = 1)", () => {
        store.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([{ value: 100_000, stage: "discovery" }])
        );
        const c = computeCoverage(100_000, store);
        expect(c.weighted).toBe(30_000);
        expect(c.needed).toBe(70_000);
    });

    it("targetMultiple compares against quota * multiple, not just quota", () => {
        // Mid-Market benchmark = 3.5x. Weighted hits 1.2x of quota →
        // panel says "1.2x / 3.5x needed" so the gap should be
        // (3.5 * 100k) - 120k = 230k, not 0.
        store.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { value: 100_000, stage: "prospect" },
                { value: 100_000, stage: "discovery" },
                { value: 100_000, stage: "negotiation" }
            ])
        );
        const c = computeCoverage(100_000, store, 3.5);
        expect(c.weighted).toBe(120_000);
        expect(c.ratio).toBe(1.2);
        expect(c.needed).toBe(230_000);
    });

    it("on-target reads zero gap only when weighted ≥ quota * targetMultiple", () => {
        store.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([{ value: 500_000, stage: "negotiation" }])
        );
        const c = computeCoverage(100_000, store, 3.5);
        expect(c.weighted).toBe(400_000);
        expect(c.needed).toBe(0);
    });

    it("targetMultiple of 1 reproduces the default behavior", () => {
        store.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([{ value: 100_000, stage: "discovery" }])
        );
        const a = computeCoverage(100_000, store);
        const b = computeCoverage(100_000, store, 1);
        expect(a).toEqual(b);
    });

    it("supports object-of-deals shape", () => {
        store.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify({
                deals: [{ value: 50_000, stage: "discovery" }]
            })
        );
        const c = computeCoverage(50_000, store);
        expect(c.hasDeals).toBe(true);
        expect(c.weighted).toBe(15_000);
    });

    it("falls back to amount/dealValue field aliases", () => {
        store.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { amount: 60_000, stage: "discovery" },
                { dealValue: 40_000, stage: "discovery" }
            ])
        );
        const c = computeCoverage(50_000, store);
        expect(c.raw).toBe(100_000);
    });

    it("does not throw on malformed JSON", () => {
        store.setItem("gtmos_deal_workspaces", "{not json");
        expect(() => computeCoverage(100_000, store)).not.toThrow();
    });
});
