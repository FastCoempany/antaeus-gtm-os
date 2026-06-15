import { describe, expect, it, beforeEach } from "vitest";
import {
    __setCoverageForTests,
    patchInputs,
    resetSession
} from "../../state";
import {
    coverageRatio,
    coverageTone,
    qualityTone,
    toPulling
} from "./adapters";

beforeEach(() => {
    resetSession();
});

describe("qualityTone", () => {
    it("maps the quality tone to a semantic accent", () => {
        expect(qualityTone("good")).toBe("green");
        expect(qualityTone("warn")).toBe("amber");
        expect(qualityTone("bad")).toBe("red");
    });
});

describe("coverageTone + coverageRatio", () => {
    it("is undefined with no quota", () => {
        expect(coverageTone()).toBeUndefined();
    });
    it("tones green at/over the benchmark target", () => {
        patchInputs({ quota: 1_000_000, acv: 50_000 });
        __setCoverageForTests({ ratio: 5, weighted: 5_000_000, raw: 6_000_000, needed: 0, hasDeals: true });
        expect(coverageTone()).toBe("green");
        expect(coverageRatio()).toBe(1);
    });
    it("tones red well below target", () => {
        patchInputs({ quota: 1_000_000, acv: 50_000 });
        __setCoverageForTests({ ratio: 0.5, weighted: 500_000, raw: 600_000, needed: 2_000_000, hasDeals: true });
        expect(coverageTone()).toBe("red");
    });
});

describe("toPulling", () => {
    it("is absent until a quota is set", () => {
        expect(toPulling()).toBeUndefined();
    });
    it("routes to Outbound Studio once a quota is set", () => {
        patchInputs({ quota: 1_200_000, acv: 50_000 });
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Run the outbound");
        expect(p!.object).toContain("touches/day");
        expect(p!.href).toContain("/outbound-studio/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
