import { describe, expect, it, beforeEach } from "vitest";
import { patchDraft, resetSession } from "../../state";
import { bandTone, moldTone, quality, toPulling } from "./adapters";

beforeEach(() => {
    resetSession();
});

describe("tone maps", () => {
    it("tones the quality bands", () => {
        expect(bandTone("ready")).toBe("green");
        expect(bandTone("workable")).toBe("amber");
        expect(bandTone("thin")).toBe("red");
    });
    it("tones the mold states", () => {
        expect(moldTone("cast")).toBe("green");
        expect(moldTone("hot")).toBe("amber");
        expect(moldTone("cold")).toBeUndefined();
        expect(moldTone("red")).toBe("red");
    });
});

describe("quality", () => {
    it("is thin with an empty forge", () => {
        expect(quality().band).toBe("thin");
    });
    it("climbs as the molds fill in", () => {
        patchDraft({
            account: "Acme Industries",
            vendor: "Antaeus",
            readoutOwner: "Sarah Chen",
            successCriteria: "Cut cycle time 30%\nReduce manual steps\nPass SOC2 review",
            boundaries: "No measurable lift by day 10\nChampion leaves"
        });
        const q = quality();
        expect(q.score).toBeGreaterThan(60);
        expect(q.band === "ready" || q.band === "workable").toBe(true);
    });
});

describe("toPulling", () => {
    it("is absent until the account is named", () => {
        expect(toPulling()).toBeUndefined();
    });
    it("routes to the Deal Workspace once an account is named", () => {
        patchDraft({ account: "Acme Industries" });
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Carry the evidence");
        expect(p!.object).toBe("Acme Industries");
        expect(p!.href).toContain("/deal-workspace/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
