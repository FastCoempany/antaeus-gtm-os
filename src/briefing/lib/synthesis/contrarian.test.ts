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
            quoted_text: "Deel"
        },
        title: "Current evidence suggests Atlas HXM deserves review alongside Deel.",
        analysis:
            "Atlas HXM raised $40M in May and announced APAC EOR expansion. Those items are more frequent in this run than evidence tied to several named watchlist companies, so the current watchlist may be missing a relevant competitor.",
        six_questions: {
            what_changed: "Atlas appears in 4 funding and expansion items this run.",
            evidence: "4 items from 2 sources.",
            confidence_rationale: "The funding round is confirmed by two sources; the competitive implication is an assessment.",
            why_it_matters: "Their APAC focus overlaps the operator's stated growth markets.",
            who_needs_to_know: "Founder and first AE.",
            what_next: "Review Atlas HXM and decide whether to add it to the watchlist."
        },
        confidence: 0.75,
        recommended_moves: [
            {
                label: "Review Atlas HXM for the watchlist.",
                rationale: "Recent funding and APAC expansion overlap the stated market.",
                destination: "Briefing · Watch list · Review entity · Atlas HXM"
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

    it("requires refusing unsupported conflicts", () => {
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/Do not manufacture a disagreement/i);
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/found_contradiction=false/);
    });

    it("requires evidence/interpretation separation and calibrated certainty", () => {
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/Separate evidence from interpretation/i);
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/Calibrate certainty to the evidence/i);
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/Do not claim that correlation proves causation/i);
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/at least 3 enriched_ids/i);
    });

    it("allows uncertainty language when it is more accurate", () => {
        expect(CONTRARIAN_SYSTEM_PROMPT).toMatch(/Use words such as "may", "suggests"/i);
    });
});

describe("buildContrarianPrompt", () => {
    it("includes stated positions and evidence", () => {
        const p = buildContrarianPrompt(input());
        expect(p).toContain("product_category");
        expect(p).toContain("what_we_sell");
        expect(p).toContain("watchlist_companies");
        expect(p).toMatch(/\[a\]\s+\(techcrunch_rss/);
        expect(p).toMatch(/relevance=0\.80/);
    });

    it("specifies both found and not-found output shapes", () => {
        const p = buildContrarianPrompt(input());
        expect(p).toContain('"found_contradiction": true');
        expect(p).toContain('"found_contradiction": false');
    });

    it("asks for evidence first and interpretation second", () => {
        expect(buildContrarianPrompt(input())).toMatch(/observed evidence first, interpretation second/i);
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
            title: "Your watchlist may be missing Atlas HXM.",
            analysis: "Atlas raised $40M and is expanding into APAC.",
            six_questions: {
                what_changed: "Atlas appeared in 4 items.",
                evidence: "4 items.",
                confidence_rationale: "Confirmed sources.",
                why_it_matters: "Matches your ICP.",
                who_needs_to_know: "You.",
                what_next: "Review them."
            },
            confidence: 0.8,
            recommended_moves: [
                { label: "Review Atlas HXM.", rationale: "Why.", destination: "Watch list" }
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
            no_contradiction_reason: "Stated positions are consistent with the current evidence.",
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

    it("extracts JSON from surrounding text", () => {
        const raw =
            "Here is the answer:\n```json\n" +
            JSON.stringify({
                found_contradiction: false,
                no_contradiction_reason: "no conflict",
                target_position: null,
                title: null,
                analysis: null,
                six_questions: null,
                confidence: null,
                recommended_moves: [],
                evidence_ids: []
            }) +
            "\n```";
        const block = extractJsonBlock(raw);
        expect(block).toBeTruthy();
        expect(JSON.parse(block!).found_contradiction).toBe(false);
    });

    it("returns null on invalid JSON", () => {
        expect(parseContrarianResponse("nope")).toBeNull();
        expect(parseContrarianResponse("{ this is not json }")).toBeNull();
    });
});

describe("runContrarianGate", () => {
    it("passes a found=false draft", () => {
        const d: ContrarianDraft = {
            found_contradiction: false,
            no_contradiction_reason: "Nothing cleared the evidence bar.",
            target_position: null,
            title: null,
            analysis: null,
            six_questions: null,
            confidence: null,
            recommended_moves: [],
            evidence_ids: []
        };
        expect(runContrarianGate(d, input())).toEqual({ passes: true, failures: [] });
    });

    it("passes a complete, well-cited draft", () => {
        const r = runContrarianGate(draft(), input());
        expect(r.passes).toBe(true);
        expect(r.failures).toEqual([]);
    });

    it("fails when the quoted text is not in stated input", () => {
        const r = runContrarianGate(
            draft({
                target_position: {
                    kind: "watchlist",
                    source: "watchlist_companies",
                    quoted_text: "Salesforce"
                }
            }),
            input()
        );
        expect(r.failures).toContain("quoted_text_not_in_inputs");
    });

    it("fails on thin or unknown evidence", () => {
        expect(
            runContrarianGate(draft({ evidence_ids: ["a", "b"] }), input()).failures
        ).toContain("thin_evidence");
        expect(
            runContrarianGate(draft({ evidence_ids: ["a", "b", "ghost"] }), input()).failures
        ).toContain("evidence_ids_not_in_run");
    });

    it("fails on low confidence", () => {
        expect(
            runContrarianGate(draft({ confidence: MIN_CONFIDENCE - 0.01 }), input()).failures
        ).toContain("low_confidence");
    });

    it("does not reject calibrated uncertainty merely because it uses 'might' or 'may'", () => {
        const r = runContrarianGate(
            draft({
                title: "Atlas HXM may be relevant to the watchlist.",
                analysis: "The current evidence might justify reviewing Atlas HXM, but it does not prove they are a top competitor."
            }),
            input()
        );
        expect(r.failures).not.toContain("weakening_language");
        expect(r.passes).toBe(true);
    });

    it("fails when target_position is missing", () => {
        expect(
            runContrarianGate(draft({ target_position: null }), input()).failures
        ).toContain("missing_target_position");
    });

    it("keeps documented evidence/confidence floors", () => {
        expect(MIN_EVIDENCE_IDS).toBe(3);
        expect(MIN_CONFIDENCE).toBeGreaterThanOrEqual(0.5);
        expect(MIN_CONFIDENCE).toBeLessThan(0.8);
    });
});
