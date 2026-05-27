import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/preact";
import { afterEach } from "vitest";
import { PatternCard } from "./PatternCard";
import { parsePatternRow, type BriefingPattern } from "../lib/patterns";

afterEach(cleanup);

function pattern(over: Record<string, unknown> = {}): BriefingPattern {
    return parsePatternRow({
        id: "pat-1",
        run_id: "run-1",
        title: "Deel and Remote are widening beyond payroll.",
        body: "Two competitors announced suite-adjacent launches within a month.",
        six_questions: {
            what_changed: "Two competitors launched new modules.",
            evidence: "4 items across 2 sources.",
            confidence_rationale: "Same direction, same month.",
            why_it_matters: "Your mid-market deals now overlap their story.",
            who_needs_to_know: "You and the founding AE.",
            what_next: "Pre-stage the bundle objection before Friday's call."
        },
        recommended_moves: [
            {
                label: "Refresh the Deel battlecard.",
                rationale: "It predates the IT bundle.",
                destination: "Asset Builder · Battlecard · Deel · refresh existing"
            }
        ],
        confidence: 0.6,
        evidence_count: 4,
        source_count: 2,
        trajectory: "rising",
        surfaced_at: "2026-05-27T17:25:00Z",
        ...over
    })!;
}

describe("PatternCard", () => {
    it("renders the title, analysis, and a recommended move", () => {
        render(<PatternCard pattern={pattern()} />);
        expect(screen.getByText("Deel and Remote are widening beyond payroll.")).toBeTruthy();
        expect(screen.getByText(/suite-adjacent launches/)).toBeTruthy();
        expect(screen.getByText("Refresh the Deel battlecard.")).toBeTruthy();
        expect(screen.getByText(/Asset Builder · Battlecard/)).toBeTruthy();
    });

    it("renders the six-question labels + values", () => {
        render(<PatternCard pattern={pattern()} />);
        expect(screen.getByText("Why it matters")).toBeTruthy();
        expect(screen.getByText(/mid-market deals now overlap/)).toBeTruthy();
        expect(screen.getByText("What next")).toBeTruthy();
    });

    it("shows confidence as a percentage and the trajectory chip", () => {
        render(<PatternCard pattern={pattern()} />);
        expect(screen.getByText("Confidence 60%")).toBeTruthy();
        expect(screen.getByText("Rising")).toBeTruthy();
    });

    it("labels a null trajectory as New", () => {
        render(<PatternCard pattern={pattern({ trajectory: null })} />);
        expect(screen.getByText("New")).toBeTruthy();
    });

    it("omits the moves block when there are no moves", () => {
        render(<PatternCard pattern={pattern({ recommended_moves: [] })} />);
        expect(screen.queryByText("Recommended moves")).toBeNull();
    });
});
