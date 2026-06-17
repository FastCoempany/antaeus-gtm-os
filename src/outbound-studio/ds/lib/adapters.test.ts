import { describe, expect, it, beforeEach } from "vitest";
import { resetSession, setAccount, setContact } from "../../state";
import { motionTone, outcomeTone, temperatureTone, toPulling } from "./adapters";

beforeEach(() => {
    resetSession();
});

describe("tone maps", () => {
    it("tones the temperature ladder", () => {
        expect(temperatureTone("ice_cold")).toBeUndefined();
        expect(temperatureTone("cool")).toBe("blue");
        expect(temperatureTone("warm")).toBe("amber");
        expect(temperatureTone("hot")).toBe("red");
        expect(temperatureTone("closing")).toBe("green");
    });
    it("tones the motion band", () => {
        expect(motionTone("ready")).toBe("green");
        expect(motionTone("workable")).toBe("amber");
        expect(motionTone("thin")).toBe("red");
    });
    it("tones touch outcomes", () => {
        expect(outcomeTone("meeting_booked")).toBe("green");
        expect(outcomeTone("replied")).toBe("green");
        expect(outcomeTone("referred")).toBe("blue");
        expect(outcomeTone("no_response")).toBe("amber");
        expect(outcomeTone("unsubscribed")).toBe("red");
        expect(outcomeTone(null)).toBeUndefined();
    });
});

describe("toPulling", () => {
    it("is absent until the rack can generate (account + contact)", () => {
        expect(toPulling()).toBeUndefined();
        setAccount("Acme Industries");
        expect(toPulling()).toBeUndefined();
    });
    it("routes to LinkedIn air cover once a line is routed", () => {
        setAccount("Acme Industries");
        setContact("Sarah Chen");
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Add air cover");
        expect(p!.object).toBe("Acme Industries");
        expect(p!.href).toContain("/linkedin-playbook/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
