import { describe, expect, it, beforeEach } from "vitest";
import {
    __setHottestAccountForTests,
    resetSession
} from "../../state";
import {
    activeCueResolved,
    cueTone,
    motion,
    motionTone,
    outcomeTone,
    toPulling
} from "./adapters";

beforeEach(() => {
    resetSession();
});

describe("tone maps", () => {
    it("tones the cue ladder (watch warm → ask earned-red)", () => {
        expect(cueTone(0)).toBe("amber");
        expect(cueTone(1)).toBe("blue");
        expect(cueTone(2)).toBe("green");
        expect(cueTone(4)).toBe("red");
    });
    it("tones the motion keys", () => {
        expect(motionTone("warm_signal_account")).toBe("red");
        expect(motionTone("convert_connection")).toBe("green");
        expect(motionTone("add_air_cover")).toBe("blue");
        expect(motionTone("credibility")).toBe("amber");
    });
    it("tones the outcomes", () => {
        expect(outcomeTone("accepted")).toBe("green");
        expect(outcomeTone("replied")).toBe("green");
        expect(outcomeTone("no_response")).toBe("amber");
        expect(outcomeTone("declined")).toBe("red");
        expect(outcomeTone(null)).toBeUndefined();
    });
});

describe("motion + active cue", () => {
    it("defaults to a credibility play with no context", () => {
        expect(motion().key).toBe("credibility");
        // the resolved cue is a valid rung
        const r = activeCueResolved();
        expect(r.index).toBeGreaterThanOrEqual(0);
        expect(r.index).toBeLessThanOrEqual(4);
    });
    it("shifts to a warm-account play when a hot account is in context", () => {
        __setHottestAccountForTests({ name: "Acme Industries", heat: 85 });
        expect(motion().key).toBe("warm_signal_account");
        expect(motion().accountName).toBe("Acme Industries");
    });
});

describe("toPulling", () => {
    it("is absent until the context names an account", () => {
        expect(toPulling()).toBeUndefined();
    });
    it("routes to Outbound Studio to compose the line", () => {
        __setHottestAccountForTests({ name: "Acme Industries", heat: 85 });
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Compose the line");
        expect(p!.object).toBe("Acme Industries");
        expect(p!.href).toContain("/outbound-studio/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
