import { describe, expect, it, beforeEach } from "vitest";
import type { Prospect, ProspectStage } from "../../lib/types";
import { resetSession, setProspects } from "../../state";
import { bandTone, qualityTone, stageTone, toPulling, workbenchRead } from "./adapters";

function prospect(over: Partial<Prospect> = {}): Prospect {
    return {
        id: `pr_${Math.random().toString(36).slice(2)}`,
        accountName: "Acme Industries",
        contactName: "Sarah Chen",
        contactTitle: "CFO",
        sourceQueryId: "",
        leverage: "existing-proof-point",
        stage: "captured" as ProspectStage,
        entryPoint: "Warm intro via investor",
        approach: "",
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...over
    };
}

beforeEach(() => {
    resetSession();
});

describe("tone maps", () => {
    it("bands the read (green shipping → amber loose → neutral empty)", () => {
        expect(bandTone("shipping")).toBe("green");
        expect(bandTone("working")).toBe("blue");
        expect(bandTone("loose")).toBe("amber");
        expect(bandTone("empty")).toBeUndefined();
    });
    it("tones the stages (ready green, dropped red, pushed neutral)", () => {
        expect(stageTone("captured")).toBe("amber");
        expect(stageTone("researched")).toBe("blue");
        expect(stageTone("ready")).toBe("green");
        expect(stageTone("pushed")).toBeUndefined();
        expect(stageTone("dropped")).toBe("red");
    });
    it("tones the quality bands", () => {
        expect(qualityTone("ready")).toBe("green");
        expect(qualityTone("researched")).toBe("blue");
        expect(qualityTone("captured")).toBe("amber");
    });
});

describe("workbenchRead", () => {
    it("reads empty with no prospects", () => {
        const r = workbenchRead();
        expect(r.band).toBe("empty");
        expect(r.operatorMove.toLowerCase()).toContain("capture");
    });
    it("scores up as prospects reach ready", () => {
        setProspects([
            prospect({ stage: "ready" }),
            prospect({ id: "p2", stage: "ready" }),
            prospect({ id: "p3", stage: "researched" })
        ]);
        const r = workbenchRead();
        expect(r.band).not.toBe("empty");
        expect(r.score).toBeGreaterThan(30);
    });
});

describe("toPulling", () => {
    it("is absent while nothing is ready", () => {
        setProspects([prospect({ stage: "captured" })]);
        expect(toPulling("")).toBeUndefined();
    });
    it("pushes the ready prospect into Signal Console", () => {
        setProspects([prospect({ accountName: "Cascadia", stage: "ready" })]);
        const p = toPulling("");
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Push to Signal");
        expect(p!.object).toBe("Cascadia");
        expect(p!.href).toContain("/signal-console/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
