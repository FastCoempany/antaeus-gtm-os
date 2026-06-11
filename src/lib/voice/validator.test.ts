import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateString } from "./validator";
import { isBlessedLabel, STATE_VOCABULARY } from "./blessed-labels";
import {
    ALL_BANNED_TERMS,
    BANNED_BUSINESS_METAPHORS,
} from "./banned-vocabulary";
import { FAMILY_TEMPERATURES } from "./family-temperatures";

describe("banned vocabulary registry", () => {
    it("carries the 2026-06-07 founder bans", () => {
        for (const term of ["spine", "earned", "earns", "verdict", "wedge"]) {
            expect(ALL_BANNED_TERMS).toContain(term);
        }
    });

    it("business-metaphor list is exactly the founder-retired set", () => {
        expect(BANNED_BUSINESS_METAPHORS).toEqual([
            "spine",
            "spines",
            "earned",
            "earns",
            "earn",
        ]);
    });
});

describe("lexicon sync — the readable form and the enforcement agree", () => {
    it("the lexicon (07) names every founder-banned metaphor this registry enforces", () => {
        const lexicon = readFileSync(
            resolve(
                __dirname,
                "../../../deliverables/design-system/07-lexicon-2026-06-07.md",
            ),
            "utf8",
        ).toLowerCase();
        for (const word of ["spine", "earned", "verdict", "ai-powered"]) {
            expect(lexicon, `lexicon must name the ban "${word}"`).toContain(
                word,
            );
        }
    });
});

describe("labels", () => {
    it("accepts a clean imperative label", () => {
        expect(validateString("Send it now", { class: "label" }).ok).toBe(true);
    });

    it("accepts every canon §10 state as pre-blessed", () => {
        for (const state of STATE_VOCABULARY) {
            expect(isBlessedLabel(state)).toBe(true);
            expect(validateString(state, { class: "label" }).ok).toBe(true);
        }
    });

    it("rejects a banned word in a label", () => {
        const r = validateString("Earned health", { class: "label" });
        expect(r.ok).toBe(false);
        expect(r.violations[0]?.rule).toBe("banned-vocabulary");
    });

    it("does not false-positive on words containing banned substrings", () => {
        // "learn" contains "earn"; word boundaries must keep it clean.
        expect(validateString("Learn the room", { class: "label" }).ok).toBe(
            true,
        );
    });

    it("rejects a bare completion label", () => {
        const r = validateString("All done", { class: "label" });
        expect(r.ok).toBe(false);
        expect(r.violations.some((v) => v.rule === "completion-label")).toBe(
            true,
        );
    });

    it("rejects labels over six words", () => {
        const r = validateString(
            "Open the deal workspace to review everything",
            { class: "label" },
        );
        expect(r.ok).toBe(false);
        expect(r.violations.some((v) => v.rule === "label-length")).toBe(true);
    });
});

describe("body prose", () => {
    it("accepts a plain peer sentence", () => {
        const r = validateString("Champion quiet for twelve days.", {
            class: "body",
        });
        expect(r.ok).toBe(true);
    });

    it("rejects completion without a forward loop", () => {
        const r = validateString("All done.", { class: "body" });
        expect(r.ok).toBe(false);
        expect(
            r.violations.some((v) => v.rule === "completion-without-loop"),
        ).toBe(true);
    });

    it("accepts completion paired with a forward loop", () => {
        const r = validateString(
            "Done. The pilot results are queued for Sarah next.",
            { class: "body" },
        );
        expect(r.violations.some((v) => v.rule === "completion-without-loop"))
            .toBe(false);
    });

    it("enforces the family sentence-length threshold", () => {
        const long =
            "This is a deliberately overlong sentence that keeps adding clauses and qualifications and asides until it has clearly sailed past the live instrument register threshold for spoken language.";
        const live = validateString(long, {
            class: "body",
            family: "live-instrument",
        });
        expect(live.ok).toBe(false);
        expect(live.violations.some((v) => v.rule === "sentence-length")).toBe(
            true,
        );
        // The same sentence passes nowhere it exceeds the cap; the
        // system-ledger threshold (30) is the loosest.
        expect(
            FAMILY_TEMPERATURES["live-instrument"].maxSentenceWords,
        ).toBeLessThan(FAMILY_TEMPERATURES["system-ledger"].maxSentenceWords);
    });

    it("warns (not errors) on manifesto fragments", () => {
        const r = validateString(
            "Signals are time-limited. Heat ranks them. Motion follows heat.",
            { class: "body" },
        );
        const fragment = r.violations.find(
            (v) => v.rule === "manifesto-fragments",
        );
        expect(fragment?.severity).toBe("warning");
        expect(r.ok).toBe(true); // warnings do not fail the gate
    });
});

describe("authored prose", () => {
    it("rejects banned hedge constructions", () => {
        const r = validateString(
            "It's worth noting that the deal may be slipping.",
            { class: "authored", family: "system-ledger" },
        );
        expect(r.ok).toBe(false);
        expect(r.violations.some((v) => v.rule === "hedge-construction")).toBe(
            true,
        );
    });

    it("rejects hedge-adverb pileups", () => {
        const r = validateString(
            "This is possibly relevant, perhaps urgent, potentially big, and arguably the one to take.",
            { class: "authored", family: "system-ledger" },
        );
        expect(r.ok).toBe(false);
        expect(r.violations.some((v) => v.rule === "hedge-density")).toBe(true);
    });

    it("accepts a committed, evidence-anchored read", () => {
        const r = validateString(
            "Procurement re-opened pricing on the 3rd; the champion never walked it up to the CFO.",
            { class: "authored", family: "command-chamber" },
        );
        expect(r.ok).toBe(true);
    });
});

describe("the visitor register", () => {
    it("exists as the eighth family with the loosest-but-bounded cap", () => {
        expect(FAMILY_TEMPERATURES.visitor.maxSentenceWords).toBe(30);
    });

    it("still bans deck-speak for visitors", () => {
        const r = validateString(
            "A seamless, AI-powered revenue platform.",
            { class: "body", family: "visitor" },
        );
        expect(r.ok).toBe(false);
    });
});
