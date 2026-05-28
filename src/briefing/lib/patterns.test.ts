import { describe, it, expect } from "vitest";
import { latestRunPatterns, parsePatternRow, type BriefingPattern } from "./patterns";

function row(over: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: "pat-1",
        run_id: "run-1",
        title: "Deel and Remote are widening beyond payroll.",
        body: "A real analysis paragraph about what the evidence means for the operator.",
        six_questions: {
            what_changed: "Two competitors launched suite-adjacent modules.",
            evidence: "4 items across 2 sources.",
            confidence_rationale: "Same-direction, same month; vendor blogs though.",
            why_it_matters: "Your mid-market deals now overlap their story.",
            who_needs_to_know: "You and the founding AE.",
            what_next: "Refresh the Deel battlecard."
        },
        recommended_moves: [
            {
                label: "Refresh the Deel battlecard.",
                rationale: "It predates the IT bundle.",
                destination: "Asset Builder · Battlecard · Deel · refresh existing",
                draft_payload: null,
                leverage: 0
            }
        ],
        confidence: 0.6,
        evidence_count: 4,
        source_count: 2,
        trajectory: "stable",
        surfaced_at: "2026-05-27T17:25:00Z",
        ...over
    };
}

describe("parsePatternRow", () => {
    it("parses a full row", () => {
        const p = parsePatternRow(row());
        expect(p).not.toBeNull();
        expect(p?.title).toBe("Deel and Remote are widening beyond payroll.");
        expect(p?.six_questions.why_it_matters).toContain("mid-market");
        expect(p?.recommended_moves).toHaveLength(1);
        expect(p?.recommended_moves[0]?.destination).toContain("Asset Builder");
        expect(p?.confidence).toBe(0.6);
        expect(p?.trajectory).toBe("stable");
    });

    it("maps body → analysis", () => {
        const p = parsePatternRow(row({ body: "the read" }));
        expect(p?.analysis).toBe("the read");
    });

    it("tolerates a move stored under `action` instead of `label`", () => {
        const p = parsePatternRow(
            row({ recommended_moves: [{ action: "Do X.", destination: "Call Planner · new" }] })
        );
        expect(p?.recommended_moves[0]?.label).toBe("Do X.");
    });

    it("drops empty moves and defaults missing six-question slots", () => {
        const p = parsePatternRow(row({ recommended_moves: [{}, "junk"], six_questions: {} }));
        expect(p?.recommended_moves).toHaveLength(0);
        expect(p?.six_questions.what_changed).toBe("");
    });

    it("normalizes an invalid trajectory to null", () => {
        expect(parsePatternRow(row({ trajectory: "sideways" }))?.trajectory).toBeNull();
    });

    it("returns null when required fields are missing", () => {
        expect(parsePatternRow(row({ title: "" }))).toBeNull();
        expect(parsePatternRow(row({ body: "" }))).toBeNull();
        expect(parsePatternRow(null)).toBeNull();
        expect(parsePatternRow("nope")).toBeNull();
    });

    it("coerces non-numeric confidence/counts to 0", () => {
        const p = parsePatternRow(row({ confidence: "high", evidence_count: null }));
        expect(p?.confidence).toBe(0);
        expect(p?.evidence_count).toBe(0);
    });

    it("standard patterns have target_position=null", () => {
        expect(parsePatternRow(row())?.target_position).toBeNull();
    });

    it("reads target_position from attribute_grid (contrarian shape)", () => {
        const p = parsePatternRow(row({
            attribute_grid: {
                target_position: {
                    kind: "watchlist",
                    source: "watchlist_companies",
                    quoted_text: "Deel"
                }
            }
        }));
        expect(p?.target_position).toEqual({
            kind: "watchlist",
            source: "watchlist_companies",
            quoted_text: "Deel"
        });
    });

    it("rejects target_position with invalid kind", () => {
        const p = parsePatternRow(row({
            attribute_grid: {
                target_position: { kind: "mystery", source: "x", quoted_text: "y" }
            }
        }));
        expect(p?.target_position).toBeNull();
    });

    it("rejects target_position with empty quoted_text", () => {
        const p = parsePatternRow(row({
            attribute_grid: {
                target_position: { kind: "watchlist", source: "watchlist_companies", quoted_text: "  " }
            }
        }));
        expect(p?.target_position).toBeNull();
    });
});

describe("latestRunPatterns", () => {
    function mk(id: string, runId: string): BriefingPattern {
        return parsePatternRow(row({ id, run_id: runId }))!;
    }

    it("keeps only the first run_id (latest, since input is desc-ordered)", () => {
        const result = latestRunPatterns([
            mk("a", "run-2"),
            mk("b", "run-2"),
            mk("c", "run-1") // older run
        ]);
        expect(result).toHaveLength(2);
        expect(result.every((p) => p.run_id === "run-2")).toBe(true);
    });

    it("returns [] for no patterns", () => {
        expect(latestRunPatterns([])).toEqual([]);
    });

    it("keeps all when they share a run", () => {
        expect(latestRunPatterns([mk("a", "r"), mk("b", "r"), mk("c", "r")])).toHaveLength(3);
    });
});
