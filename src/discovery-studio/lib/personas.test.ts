import { describe, expect, it } from "vitest";
import {
    PERSONA_KEYS,
    PERSONA_LABELS,
    QUESTION_BANK,
    questionsFor,
    unquoteQuestion
} from "./personas";

describe("persona question bank (absorbed from the retired Call Planner)", () => {
    it("carries three questions for each of the six buyer lenses", () => {
        expect(PERSONA_KEYS).toHaveLength(6);
        for (const key of PERSONA_KEYS) {
            expect(QUESTION_BANK[key]).toHaveLength(3);
            expect(PERSONA_LABELS[key].length).toBeGreaterThan(0);
        }
    });

    it("looks up questions for a persona", () => {
        expect(questionsFor("finance")).toBe(QUESTION_BANK.finance);
    });

    it("strips the wrapping quotes for display", () => {
        expect(unquoteQuestion('"How are you measuring it?"')).toBe(
            "How are you measuring it?"
        );
    });
});
