import { describe, expect, it } from "vitest";
import { EMPTY_ICP_DRAFT, type IcpDraft } from "../../lib/types";
import {
    buildLiveOutputs,
    checkIcon,
    checkTone,
    tierTone,
    toPulling
} from "./adapters";

const SHARP: IcpDraft = {
    role: "founder",
    industry: "Software (B2B SaaS)",
    industryCustom: "",
    size: "50-200 employees",
    geo: "US",
    buyer: "CFO",
    buyerCustom: "",
    pain: "Cost control / spend leakage",
    trigger: "Cost reduction mandate",
    proofWindow: "14 days",
    engineActive: "60"
};

describe("tierTone", () => {
    it("greens sharp, blues workable, ambers forming, reds broad", () => {
        expect(tierTone("sharp")).toBe("green");
        expect(tierTone("workable")).toBe("blue");
        expect(tierTone("forming")).toBe("amber");
        expect(tierTone("broad")).toBe("red");
    });
});

describe("check tone + icon", () => {
    it("maps the three check tones to role + glyph", () => {
        expect(checkTone("good")).toBe("green");
        expect(checkTone("warn")).toBe("amber");
        expect(checkTone("risk")).toBe("red");
        expect(checkIcon("good")).toBe("ready");
        expect(checkIcon("warn")).toBe("attention");
        expect(checkIcon("risk")).toBe("at-risk");
    });
});

describe("buildLiveOutputs", () => {
    it("composes the statement + quality + outputs from a sharp draft", () => {
        const out = buildLiveOutputs(SHARP);
        expect(out.industry).toBe("Software (B2B SaaS)");
        expect(out.statement).toContain("We win with Software (B2B SaaS)");
        expect(out.quality.score).toBeGreaterThanOrEqual(85);
        expect(out.quality.tier).toBe("sharp");
        expect(out.buyingGroup.length).toBeGreaterThan(0);
        expect(out.evidence.length).toBeGreaterThan(0);
        expect(out.focus.length).toBeGreaterThan(0);
    });

    it("honors the custom-industry fallback", () => {
        const out = buildLiveOutputs({
            ...SHARP,
            industry: "custom",
            industryCustom: "Robotics"
        });
        expect(out.industry).toBe("Robotics");
    });
});

describe("toPulling", () => {
    it("is absent while the ICP is too soft to inherit", () => {
        expect(toPulling(EMPTY_ICP_DRAFT)).toBeUndefined();
    });
    it("routes a sharp ICP into the territory build", () => {
        const p = toPulling(SHARP);
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Build the territory");
        expect(p!.object).toBe("Software (B2B SaaS)");
        expect(p!.href).toContain("/territory-architect/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
