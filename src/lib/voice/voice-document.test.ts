import { describe, expect, it } from "vitest";
import {
    BANNED_CORPORATE_VOCAB,
    BANNED_HEDGE_CONSTRUCTIONS,
    BANNED_PRODUCT_JARGON,
    MAX_HEDGE_ADVERBS,
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
    it("catches case-insensitive 'leverage'", () => {
        const v = validateObservation("Use this to leverage your wins.");
        expect(v.valid).toBe(false);
        const banned = v.violations.find(
            (x) => x.code === "banned_corporate_vocab"
        );
        expect(banned?.offender).toBe("leverage");
    });

    it("catches mid-sentence 'transformative'", () => {
        const v = validateObservation("A transformative shift in the data.");
        expect(v.valid).toBe(false);
    });

    it("does not false-positive on substring 'leverages' inside another word", () => {
        // "leveraged" is a banned form too, but "preleverage" isn't a
        // real word and shouldn't match. The whole-word rule should hit
        // "leverage" + "leveraged" but not strings where the letters
        // appear inside something else.
        // For this test, just check that 'overage' (substring of
        // 'leverage') doesn't trip the rule.
        const v = validateObservation("There's an overage in usage this week.");
        expect(v.valid).toBe(true);
    });

    it("respects waiver list", () => {
        const v = validateObservation(
            "Acme uses the Synergy product line.",
            ["synergy"]
        );
        // 'synergy' is in the waiver; should pass.
        expect(v.valid).toBe(true);
    });

    it("collects all violations, not just the first", () => {
        const v = validateObservation(
            "Leverage this seamless ecosystem to unlock value."
        );
        // Banned: leverage, seamless, ecosystem, unlock
        expect(v.valid).toBe(false);
        const offenders = v.violations
            .filter((x) => x.code === "banned_corporate_vocab")
            .map((x) => x.offender);
        expect(offenders).toContain("leverage");
        expect(offenders).toContain("seamless");
        expect(offenders).toContain("ecosystem");
        expect(offenders).toContain("unlock");
    });
});

describe("validateObservation — banned product jargon (canon §11)", () => {
    it("catches 'wedge'", () => {
        const v = validateObservation("That's the wedge.");
        expect(v.valid).toBe(false);
        const banned = v.violations.find(
            (x) => x.code === "banned_product_jargon"
        );
        expect(banned?.offender).toBe("wedge");
    });

    it("catches multi-word jargon 'decision-grade'", () => {
        const v = validateObservation(
            "Cast a decision-grade proof for the deal."
        );
        expect(v.valid).toBe(false);
        const banned = v.violations.find(
            (x) => x.offender === "decision-grade"
        );
        expect(banned).toBeDefined();
    });

    it("catches 'main risk' (the audit-doc jargon Part III §11 explicitly names)", () => {
        const v = validateObservation(
            "Main risk: the watch-ring accounts are idle."
        );
        expect(v.valid).toBe(false);
    });
});

describe("validateObservation — banned hedge constructions", () => {
    it("catches 'it's worth noting'", () => {
        const v = validateObservation(
            "It's worth noting that Acme has been quiet."
        );
        expect(v.valid).toBe(false);
        const banned = v.violations.find(
            (x) => x.code === "banned_hedge_construction"
        );
        expect(banned?.offender).toBe("it's worth noting that");
    });

    it("catches 'one could argue'", () => {
        const v = validateObservation(
            "One could argue that the deal is stalling."
        );
        expect(v.valid).toBe(false);
    });
});

describe("validateObservation — hedge adverb count", () => {
    it("allows up to MAX_HEDGE_ADVERBS", () => {
        const sentence = "The deal may stall, could slip, and might churn.";
        // Three adverbs (may, could, might) = at threshold.
        const v = validateObservation(sentence);
        expect(v.valid).toBe(true);
    });

    it("flags above the threshold", () => {
        const sentence =
            "The deal may stall, could slip, might churn, and seems weak.";
        // Four adverbs (may, could, might, seems) > 3.
        const v = validateObservation(sentence);
        expect(v.valid).toBe(false);
        const banned = v.violations.find(
            (x) => x.code === "too_many_hedge_adverbs"
        );
        expect(banned).toBeDefined();
    });
});

describe("validateObservation — passes for canon-correct prose", () => {
    it("approves a plain, declarative observation", () => {
        const v = validateObservation(
            "Acme has been stalled at negotiation for 21 days with no dated next step."
        );
        expect(v.valid).toBe(true);
    });

    it("approves a per-Briefing-exemplar Pattern fragment", () => {
        const v = validateObservation(
            "Three competitors moved down-market in 14 days. The window to reposition is shorter than it looks."
        );
        expect(v.valid).toBe(true);
    });
});

describe("formatViolations", () => {
    it("returns a passing string when valid", () => {
        const v = validateObservation("Plain prose.");
        expect(formatViolations(v)).toMatch(/passes/i);
    });

    it("joins multiple violations with a pipe", () => {
        const v = validateObservation("Leverage the verdict.");
        const formatted = formatViolations(v);
        expect(formatted).toContain("|");
        expect(formatted).toContain("leverage");
        expect(formatted).toContain("verdict");
    });
});

describe("registry shape sanity", () => {
    it("exposes non-empty banned lists", () => {
        expect(BANNED_CORPORATE_VOCAB.length).toBeGreaterThan(20);
        expect(BANNED_PRODUCT_JARGON.length).toBeGreaterThan(10);
        expect(BANNED_HEDGE_CONSTRUCTIONS.length).toBeGreaterThan(5);
    });

    it("PREFERRED_REPLACEMENTS suggests substitutions for top banned words", () => {
        expect(PREFERRED_REPLACEMENTS["leverage"]).toBe("use");
        expect(PREFERRED_REPLACEMENTS["unlock"]).toBe("enable");
    });

    it("MAX_HEDGE_ADVERBS is the Briefing §7.3 value", () => {
        expect(MAX_HEDGE_ADVERBS).toBe(3);
    });
});
