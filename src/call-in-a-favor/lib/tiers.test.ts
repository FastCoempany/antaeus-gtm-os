import { describe, expect, it } from "vitest";
import { TIERS, findTier } from "./tiers";

describe("TIERS data", () => {
    it("has the four canonical tiers with correct cooldownDays", () => {
        expect(TIERS.t1).toMatchObject({
            label: "Board / Investor",
            cooldownDays: 90
        });
        expect(TIERS.t2).toMatchObject({
            label: "Strategic Advisor",
            cooldownDays: 30
        });
        expect(TIERS.t3).toMatchObject({
            label: "Angel / Portfolio",
            cooldownDays: 14
        });
        expect(TIERS.t4).toMatchObject({
            label: "Customer Reference",
            cooldownDays: 30
        });
    });
});

describe("findTier", () => {
    it("returns each tier by id", () => {
        expect(findTier("t1").cooldownDays).toBe(90);
        expect(findTier("t3").cooldownDays).toBe(14);
    });

    it("falls back to t2 when id is unknown / null / undefined", () => {
        expect(findTier(null).id).toBe("t2");
        expect(findTier(undefined).id).toBe("t2");
        expect(findTier("ghost").id).toBe("t2");
        expect(findTier("").id).toBe("t2");
    });
});
