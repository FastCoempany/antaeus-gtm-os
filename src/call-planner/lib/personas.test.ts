import { describe, expect, it } from "vitest";
import { QUESTION_BANK, questionsFor, unquoteQuestion } from "./personas";
import { PERSONA_KEYS } from "./types";

describe("QUESTION_BANK", () => {
    it("has every persona populated with 3 questions", () => {
        for (const key of PERSONA_KEYS) {
            expect(QUESTION_BANK[key]).toHaveLength(3);
        }
    });

    it("each question is wrapped in literal double quotes (legacy parity)", () => {
        for (const key of PERSONA_KEYS) {
            for (const q of QUESTION_BANK[key]) {
                expect(q.startsWith('"')).toBe(true);
                expect(q.endsWith('"')).toBe(true);
            }
        }
    });

    it("cxo questions reference build-vs-buy + this-quarter framing", () => {
        const text = QUESTION_BANK.cxo.join(" ");
        expect(text).toContain("build vs. buy");
        expect(text).toContain("this quarter");
    });

    it("it questions reference architecture + integration + security", () => {
        const text = QUESTION_BANK.it.join(" ");
        expect(text).toContain("architecture");
        expect(text).toContain("integration");
        expect(text).toContain("security");
    });
});

describe("questionsFor", () => {
    it("returns the persona's question list", () => {
        expect(questionsFor("ops")).toBe(QUESTION_BANK.ops);
    });

    it("falls back to cxo for unknown personas", () => {
        // @ts-expect-error — testing the runtime fallback
        expect(questionsFor("ghost")).toBe(QUESTION_BANK.cxo);
    });
});

describe("unquoteQuestion", () => {
    it("strips leading + trailing double quotes", () => {
        expect(unquoteQuestion('"What does success look like?"')).toBe(
            "What does success look like?"
        );
    });

    it("leaves interior double quotes untouched", () => {
        expect(unquoteQuestion('"It is "build" we are picking?"')).toBe(
            'It is "build" we are picking?'
        );
    });

    it("is a no-op for unquoted strings", () => {
        expect(unquoteQuestion("plain")).toBe("plain");
    });
});
