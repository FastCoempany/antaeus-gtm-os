import { describe, expect, it } from "vitest";
import { transitionedToLost } from "./state";

describe("transitionedToLost", () => {
    it("returns true on first transition into closed-lost", () => {
        expect(transitionedToLost("negotiation", "closed-lost")).toBe(true);
        expect(transitionedToLost("verbal", "closed-lost")).toBe(true);
        expect(transitionedToLost("prospect", "closed-lost")).toBe(true);
    });

    it("returns false when prev was already closed-lost (re-edit)", () => {
        expect(transitionedToLost("closed-lost", "closed-lost")).toBe(false);
    });

    it("returns false when next is not closed-lost", () => {
        expect(transitionedToLost("discovery", "evaluation")).toBe(false);
        expect(transitionedToLost("negotiation", "closed-won")).toBe(false);
        expect(transitionedToLost(null, "discovery")).toBe(false);
    });

    it("returns true even when prev is null (deal landed straight in lost)", () => {
        expect(transitionedToLost(null, "closed-lost")).toBe(true);
    });
});
