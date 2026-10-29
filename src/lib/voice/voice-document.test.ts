import { describe, expect, it } from "vitest";
import {
    BANNED_CORPORATE_VOCAB,
    BANNED_HEDGE_CONSTRUCTIONS,
    BANNED_PRODUCT_JARGON,
    UNCERTAINTY_STACK_REVIEW_THRESHOLD,
    PREFERRED_REPLACEMENTS,
    formatViolations,
    validateObservation
} from "./voice-document";

describe("validateObservation — empty input", () => {
    it("flags empty string", () => {
        const v = validateObservation("");
        expect(v.valid).toBe(false);
        expect(v.violations[0]!.code).toBe("empty_text");
    });

    it("flags whitespace-only", () => {
        const v = validateObservation("   \n  ");
        expect(v.valid).toBe(false);
        expect(v.violations[0]!.code).toBe("empty_text");
    });
});

describe("validateObservation — banned corporate vocab", () => {
    it("catches case-insensitive corporate language", () => {
        const v = validateObservation("Use this to leverage your wins.");
        expect(v.valid).toBe(false);
        expect(v.violations.find((x) => x.code === "banned_corporate_vocab")?.offender).toBe("leverage");
    });

    it("does not false-positive on unrelated substrings", () => {
        expect(validateObservation("There's an overage in usage this week.").valid).toBe(true);
        expect(validateObservation("Best-in-classroom equipment.").valid).toBe(true);
    });

    it("catches listed inflections", () => {
        for (const [sentence, expected] of [
            ["We leveraged the data.", "leveraged"],
            ["We are leveraging the data.", "leveraging"],
            ["This leverages the data.", "leverages"]
        ] as const) {
            const v = validateObservation(sentence);
            expect(v.valid).toBe(false);
            expect(v.violations.map((x) => x.offender)).toContain(expected);
        }
    });

    it("respects a waiver for a literal product/company name", () => {
        expect(validateObservation("Acme uses the Synergy product line.", ["synergy"]).valid).toBe(true);
    });
});

describe("validateObservation — private product jargon", () => {
    it("rejects a compressed branded abstraction", () => {
        const v = validateObservation("That's the wedge.");
        expect(v.valid).toBe(false);
        expect(v.violations.find((x) => x.code === "banned_product_jargon")?.offender).toBe("wedge");
    });

    it("rejects multi-word product jargon", () => {
        expect(validateObservation("Cast a decision-grade proof for the deal.").valid).toBe(false);
        expect(validateObservation("Main risk: the watch-ring accounts are idle.").valid).toBe(false);
    });
});

describe("validateObservation — direct epistemic language", () => {
    it("rejects metadiscursive framing", () => {
        const v = validateObservation("It's worth noting that Acme has been quiet.");
        expect(v.valid).toBe(false);
        expect(v.violations.find((x) => x.code === "banned_hedge_construction")?.offender).toBe("it's worth noting that");
    });

    it("rejects indirect speaker framing such as 'one could argue'", () => {
        expect(validateObservation("One could argue that the deal is stalling.").valid).toBe(false);
    });

    it("allows calibrated uncertainty when it states the assessment directly", () => {
        const cases = [
            "The current evidence suggests this account may be deprioritized.",
            "The buyer's inactivity could increase loss risk, but it does not prove the project was cancelled.",
            "This pattern appears more often in the closed-won sample."
        ];
        for (const sentence of cases) {
            expect(validateObservation(sentence).valid, sentence).toBe(true);
        }
    });

    it("does not turn an uncertainty-term count into a truthfulness failure", () => {
        const sentence = "The change may be temporary, could reflect timing, might reverse, and appears limited to one segment.";
        expect(validateObservation(sentence).valid).toBe(true);
    });
});

describe("validateObservation — plain prose", () => {
    it("approves a directly observed fact", () => {
        expect(validateObservation("Acme has been at negotiation for 21 days with no dated next step.").valid).toBe(true);
    });

    it("still rejects multiple vocabulary problems at once", () => {
        const v = validateObservation("Leverage the verdict.");
        expect(v.valid).toBe(false);
        expect(v.violations.map((x) => x.offender)).toContain("leverage");
        expect(v.violations.map((x) => x.offender)).toContain("verdict");
    });
});

describe("formatViolations", () => {
    it("returns a passing string when valid", () => {
        expect(formatViolations(validateObservation("Plain prose."))).toMatch(/passes/i);
    });

    it("joins multiple violations", () => {
        const formatted = formatViolations(validateObservation("Leverage the verdict."));
        expect(formatted).toContain("|");
        expect(formatted).toContain("leverage");
        expect(formatted).toContain("verdict");
    });
});

describe("registry shape", () => {
    it("keeps substantive banned lists", () => {
        expect(BANNED_CORPORATE_VOCAB.length).toBeGreaterThan(20);
        expect(BANNED_PRODUCT_JARGON.length).toBeGreaterThan(10);
        expect(BANNED_HEDGE_CONSTRUCTIONS.length).toBeGreaterThan(5);
    });

    it("keeps preferred plain-language substitutions", () => {
        expect(PREFERRED_REPLACEMENTS["leverage"]).toBe("use");
        expect(PREFERRED_REPLACEMENTS["unlock"]).toBe("enable");
    });

    it("exposes an uncertainty stacking review threshold without making it a hard validity cap", () => {
        expect(UNCERTAINTY_STACK_REVIEW_THRESHOLD).toBe(3);
        const v = validateObservation("It may move, could stall, might change, and appears uncertain.");
        expect(v.valid).toBe(true);
    });
});
