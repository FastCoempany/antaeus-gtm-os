import { describe, it, expect } from "vitest";
import {
    CONTRARIAN_PROMPT_VERSION,
    CONTRARIAN_SYSTEM_PROMPT,
    MIN_CONFIDENCE,
    MIN_EVIDENCE_IDS,
    type ContrarianDraft,
    type ContrarianEvidenceItem,
    type ContrarianInput,
    type ContrarianStatedPositions,
    buildContrarianPrompt,
    extractJsonBlock,
    parseContrarianResponse,
    runContrarianGate
} from "./contrarian";

/**
 * B.5 — contrarian synthesis pure logic. The high-stakes piece is the
 * quality gate: we want false-positive contrarian Patterns (the system
 * "challenging" a position the operator never stated, or doing it with
 * thin evidence) to be impossible. The tests anchor those rejections.
 */

function positions(over: Partial<ContrarianStatedPositions> = {}): ContrarianStatedPositions {
    return {
        product_category: "Global employment & payroll platform (EOR)",
        what_we_sell:
            "We let companies hire full-time employees in 150+ countries without setting up a local entity.",
        value_prop:
            "Hire anyone, anywhere, in days instead of months — without the legal entity or compliance gamble.",
        watchlist_companies: ["Deel", "Rippling", "Remote", "Vensure Employer Solutions"],
        icp_statement: "Mid-market B2B SaaS, 50-500 employees, hiring globally.",
        ...over
    };
}

function evidence(id: string, over: Partial<ContrarianEvidenceItem> = {}): ContrarianEvidenceItem {
    return {
        enriched_id: id,
        source_id: "techcrunch_rss",
        summary: "Atlas HXM raised $40M Series B, doubling down on EOR in APAC.",
        companies: ["Atlas HXM"],
        event_category: "funding_round",
        topic_tags: ["funding", "geographic_expansion"],
        pain_tags: ["global_hiring"],
        user_relevance_score: 0.8,
        published_date: "2026-05-22T12:00:00Z",
        ...over
    };
}

function input(over: Partial<ContrarianInput> = {}): ContrarianInput {
    return {
        run_id: "run-1",
        stated_positions: positions(),
        evidence: [evidence("a"), evidence("b"), evidence("c"), evidence("d")],
        ...over
    };
}

function draft(over: Partial<ContrarianDraft> = {}): ContrarianDraft {
    return {
        found_contradiction: true,
        no_contradiction_reason: null,
        target_position: {
            kind: "watchlist",
            source: "watchlist_companies",
            // quoted_text MUST come from the operator's stated input. The
            // challenge is "you named Deel as a watched competitor, but
            // Atlas HXM is moving faster than Deel this run."
            quoted_text: "Deel"
        },
        title: "Your watchlist names Deel but the evidence puts Atlas HXM ahead.",
        analysis: "Atlas HXM raised $40M in May and is publicly expanding into APAC EOR. Your watchlist names Deel, Rippling, Remote, and Vensure — Atlas isn't on it, yet it produced more category-relevant signals this run than any name you track.",
        six_questions: {
            what_changed: "Atlas appears in 4 funding + expansion items this run.",
            evidence: "4 items, 2 sources.",
            confidence_rationale: "Funding round confirmed by two outlets.",
            why_it_matters: "Their APAC focus overlaps your stated growth markets.",
            who_needs_to_know: "Founder + first AE.",
            what_next: "Add Atlas HXM to the watchlist; pull their last 6 months of news."
        },
        confidence: 0.75,
        recommended_moves: [
            {
                label: "Add Atlas HXM to the watchlist.",
                rationale: "Their funding + APAC push matches your ICP geography.",
                destination: "Briefing · Watch list · Add entity · Atlas HXM"
            }
        ],
        evidence_ids: ["a", "b", "c"],
        ...over
    };
}

describe("CONTRARIAN_PROMPT_VERSION + SYSTEM_PROMPT", () => {
    it("has a stable version string for cost telemetry", () => {
        expect(CONTRARIAN_PROMPT_VERSION).toMatch(/^contrarian-/);
    });

    it("system prompt names refusal as a feature", () => {
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/Refusing is a feature/);
    });

    it("system prompt bans hedging language", () => {
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/might/);
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/declaratively/i);
    });
});

describe("buildContrarianPrompt", () => {
    it("includes all stated positions when present", () => {
        const p = buildContrarianPrompt(input());
        expect(p).toContain("product_category");
        expect(p).toContain("what_we_sell");
        expect(p).toContain("value_prop");
        expect(p).toContain("watchlist_companies");
        expect(p).toContain("icp_statement");
        expect(p).toContain("Deel");
    });

    it("lists evidence items with id + source + relevance", () => {
        const p = buildContrarianPrompt(input());
        expect(p).toMatch(/\[a\]\s+\(techcrunch_rss/);
        expect(p).toMatch(/relevance=0\.80/);
    });

    it("specifies both 'found' and 'not found' output shapes", () => {
        const p = buildContrarianPrompt(input());
        expect(p).toContain('"found_contradiction": true');
        expect(p).toContain('"found_contradiction": false');
    });

    it("requires at least 3 evidence_ids", () => {
        expect(buildContrarianPrompt(input())).toMatch(/at least 3/);
    });
});

describe("extractJsonBlock + parseContrarianResponse", () => {
    it("parses a complete found_contradiction response", () => {
        const json = JSON.stringify({
            found_contradiction: true,
            no_contradiction_reason: null,
            target_position: {
                kind: "watchlist",
                source: "watchlist_companies",
                quoted_text: "Atlas HXM"
            },
            title: "Your watchlist is missing Atlas HXM.",
            analysis: "Atlas raised $40M and is expanding into APAC.",
            six_questions: {
                what_changed: "Atlas appeared in 4 items.",
                evidence: "4 items.",
                confidence_rationale: "Confirmed.",
                why_it_matters: "Matches your ICP.",
                who_needs_to_know: "You.",
                what_next: "Add them."
            },
            confidence: 0.8,
            recommended_moves: [
                { label: "Add Atlas HXM.", rationale: "Why.", destination: "Watch list" }
            ],
            evidence_ids: ["a", "b", "c"]
        });
        const d = parseContrarianResponse(json);
        expect(d?.found_contradiction).toBe(true);
        expect(d?.target_position?.quoted_text).toBe("Atlas HXM");
        expect(d?.evidence_ids).toEqual(["a", "b", "c"]);
        expect(d?.confidence).toBe(0.8);
    });

    it("parses a found_contradiction=false response", () => {
        const json = JSON.stringify({
            found_contradiction: false,
            no_contradiction_reason: "Stated positions consistent with evidence.",
            target_position: null,
            title: null,
            analysis: null,
            six_questions: null,
            confidence: null,
            recommended_moves: [],
            evidence_ids: []
        });
        const d = parseContrarianResponse(json);
        expect(d?.found_contradiction).toBe(false);
        expect(d?.no_contradiction_reason).toContain("consistent");
    });

    it("strips code fences / leading prose", () => {
        const raw = "Here is the answer:\n\n```json\n" +
            JSON.stringify({ found_contradiction: false, no_contradiction_reason: "nope",
                target_position: null, title: null, analysis: null, six_questions: null,
                confidence: null, recommended_moves: [], evidence_ids: [] }) +
            "\n```\n\nDone.";
        const block = extractJsonBlock(raw);
        expect(block).toBeTruthy();
        expect(JSON.parse(block!).found_contradiction).toBe(false);
    });

    it("returns null on garbage", () => {
        expect(parseContrarianResponse("nope")).toBeNull();
        expect(parseContrarianResponse("{ this is not json }")).toBeNull();
    });

    it("rejects an invalid target_position kind", () => {
        const json = JSON.stringify({
            found_contradiction: true,
            no_contradiction_reason: null,
            target_position: { kind: "MYSTERY", source: "commercial_profile", quoted_text: "x" },
            title: "t", analysis: "a", six_questions: null, confidence: 0.6,
            recommended_moves: [], evidence_ids: ["a", "b", "c"]
        });
        const d = parseContrarianResponse(json);
        expect(d?.target_position).toBeNull();
    });

    it("rejects a non-string in evidence_ids", () => {
        const json = JSON.stringify({
            found_contradiction: true, no_contradiction_reason: null,
            target_position: { kind: "watchlist", source: "watchlist_companies", quoted_text: "Deel" },
            title: "t", analysis: "a", six_questions: null, confidence: 0.6,
            recommended_moves: [], evidence_ids: ["a", 42, "c"]
        });
        const d = parseContrarianResponse(json);
        expect(d?.evidence_ids).toEqual(["a", "c"]);
    });
});

describe("runContrarianGate", () => {
    it("passes a found=false draft (refusal is valid)", () => {
        const d: ContrarianDraft = {
            found_contradiction: false,
            no_contradiction_reason: "Nothing strong rose to the bar.",
            target_position: null,
            title: null,
            analysis: null,
            six_questions: null,
            confidence: null,
            recommended_moves: [],
            evidence_ids: []
        };
        const r = runContrarianGate(d, input());
        expect(r.passes).toBe(true);
        expect(r.failures).toEqual([]);
    });

    it("passes a complete, well-cited contrarian draft", () => {
        const r = runContrarianGate(draft(), input());
        expect(r.failures).toEqual([]);
        expect(r.passes).toBe(true);
    });

    it("fails when the quoted_text isn't in any stated input", () => {
        const d = draft({
            target_position: {
                kind: "watchlist", source: "watchlist_companies",
                quoted_text: "Salesforce" // not in watchlist or anywhere
            }
        });
        const r = runContrarianGate(d, input());
        expect(r.failures).toContain("quoted_text_not_in_inputs");
        expect(r.passes).toBe(false);
    });

    it("fails on thin evidence (< 3 ids)", () => {
        const r = runContrarianGate(draft({ evidence_ids: ["a", "b"] }), input());
        expect(r.failures).toContain("thin_evidence");
    });

    it("fails when an evidence_id isn't in the run", () => {
        const r = runContrarianGate(
            draft({ evidence_ids: ["a", "b", "ghost"] }),
            input()
        );
        expect(r.failures).toContain("evidence_ids_not_in_run");
    });

    it("fails on low confidence", () => {
        const r = runContrarianGate(draft({ confidence: MIN_CONFIDENCE - 0.01 }), input());
        expect(r.failures).toContain("low_confidence");
    });

    it("fails on hedging language in title", () => {
        const r = runContrarianGate(
            draft({ title: "Atlas HXM might be moving in your space." }),
            input()
        );
        expect(r.failures).toContain("weakening_language");
    });

    it("fails on missing target_position when found=true", () => {
        const r = runContrarianGate(draft({ target_position: null }), input());
        expect(r.failures).toContain("missing_target_position");
    });

    it("MIN_EVIDENCE_IDS is the documented floor", () => {
        expect(MIN_EVIDENCE_IDS).toBe(3);
    });

    it("MIN_CONFIDENCE is documented + reasonable", () => {
        expect(MIN_CONFIDENCE).toBeGreaterThanOrEqual(0.5);
        expect(MIN_CONFIDENCE).toBeLessThan(0.8);
    });
});
