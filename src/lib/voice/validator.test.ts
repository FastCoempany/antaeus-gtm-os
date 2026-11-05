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

    it("business-metaphor list remains the founder-retired set", () => {
        expect(BANNED_BUSINESS_METAPHORS).toEqual([
            "spine",
            "spines",
            "earned",
            "earns",
            "earn",
        ]);
    });
});

describe("lexicon sync", () => {
    it("the readable lexicon names the founder-banned metaphors", () => {
        const lexicon = readFileSync(
            resolve(__dirname, "../../../deliverables/design-system/07-lexicon-2026-06-07.md"),
            "utf8",
        ).toLowerCase();
        for (const word of ["spine", "earned", "verdict", "ai-powered"]) {
            expect(lexicon).toContain(word);
        }
    });
});

describe("labels", () => {
    it("accepts a clean imperative label", () => {
        expect(validateString("Send it now", { class: "label" }).ok).toBe(true);
    });

    it("accepts pre-blessed states", () => {
        for (const state of STATE_VOCABULARY) {
            expect(isBlessedLabel(state)).toBe(true);
            expect(validateString(state, { class: "label" }).ok).toBe(true);
        }
    });

    it("rejects banned vocabulary and bare completion labels", () => {
        expect(validateString("Earned health", { class: "label" }).ok).toBe(false);
        const completion = validateString("All done", { class: "label" });
        expect(completion.violations.some((v) => v.rule === "completion-label")).toBe(true);
    });

    it("does not false-positive on banned substrings inside another word", () => {
        expect(validateString("Learn the room", { class: "label" }).ok).toBe(true);
    });

    it("rejects labels over six words", () => {
        const r = validateString("Open the deal workspace to review everything", { class: "label" });
        expect(r.violations.some((v) => v.rule === "label-length")).toBe(true);
    });
});

describe("body prose", () => {
    it("accepts a plain observation", () => {
        expect(validateString("No buyer activity has been recorded for twelve days.", { class: "body" }).ok).toBe(true);
    });

    it("rejects completion without a forward loop", () => {
        const r = validateString("All done.", { class: "body" });
        expect(r.violations.some((v) => v.rule === "completion-without-loop")).toBe(true);
    });

    it("accepts completion paired with the next state", () => {
        const r = validateString("Done. The pilot results are queued for Sarah next.", { class: "body" });
        expect(r.violations.some((v) => v.rule === "completion-without-loop")).toBe(false);
    });

    it("keeps sentence length as a warning, not a hard error", () => {
        const long = "This is a deliberately overlong sentence that keeps adding clauses and qualifications and asides until it has clearly sailed past the live instrument register threshold for spoken language.";
        const live = validateString(long, { class: "body", family: "live-instrument" });
        expect(live.violations.find((v) => v.rule === "sentence-length")?.severity).toBe("warning");
        expect(live.ok).toBe(true);
        expect(FAMILY_TEMPERATURES["live-instrument"].maxSentenceWords).toBeLessThan(
            FAMILY_TEMPERATURES["system-ledger"].maxSentenceWords,
        );
    });

    it("warns rather than errors on manifesto fragments", () => {
        const r = validateString(
            "Signals are recent. Accounts are ranked. Actions are listed.",
            { class: "body" },
        );
        expect(r.violations.find((v) => v.rule === "manifesto-fragments")?.severity).toBe("warning");
        expect(r.ok).toBe(true);
    });
});

describe("authored prose", () => {
    it("rejects metadiscursive qualification", () => {
        const r = validateString(
            "It's worth noting that the deal may be slipping.",
            { class: "authored", family: "system-ledger" },
        );
        expect(r.ok).toBe(false);
        expect(r.violations.some((v) => v.rule === "hedge-construction")).toBe(true);
    });

    it("accepts calibrated uncertainty when the assessment is stated directly", () => {
        const r = validateString(
            "Twenty-one days without buyer activity may indicate that the opportunity is no longer a priority, but the inactivity does not prove that.",
            { class: "authored", family: "system-ledger" },
        );
        expect(r.ok).toBe(true);
    });

    it("turns stacked uncertainty terms into a warning rather than a truthfulness failure", () => {
        const r = validateString(
            "This may be temporary, could reflect timing, might reverse, and appears limited to one segment.",
            { class: "authored", family: "system-ledger" },
        );
        const density = r.violations.find((v) => v.rule === "uncertainty-density");
        expect(density?.severity).toBe("warning");
        expect(r.ok).toBe(true);
    });

    it("accepts a direct observed fact without unnecessary qualification", () => {
        const r = validateString(
            "Procurement re-opened pricing on the 3rd; no CFO meeting is recorded.",
            { class: "authored", family: "command-chamber" },
        );
        expect(r.ok).toBe(true);
    });
});

describe("the visitor register", () => {
    it("keeps the loosest-but-bounded sentence cap", () => {
        expect(FAMILY_TEMPERATURES.visitor.maxSentenceWords).toBe(30);
    });

    it("still bans deck-speak for visitors", () => {
        expect(
            validateString("A seamless, AI-powered revenue platform.", { class: "body", family: "visitor" }).ok,
        ).toBe(false);
    });
});
