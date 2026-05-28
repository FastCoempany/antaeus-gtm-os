import { describe, it, expect } from "vitest";
import {
    COMPOSE_PROMPT_VERSION,
    COMPOSE_SYSTEM_PROMPT,
    MAX_LEAD_LEN,
    type ComposeDraft,
    type ComposeInput,
    buildComposePrompt,
    extractJsonBlock,
    parseComposeResponse,
    runComposeGate
} from "./lead";

/**
 * B.9a — Briefing Compose pure logic. The gate's role is to keep the
 * top-of-briefing line plain — no hedging, no startup-jargon nouns
 * doing sentence work. False-positive leads would erode operator
 * trust faster than no lead at all, so refusal is a feature.
 */

function input(over: Partial<ComposeInput> = {}): ComposeInput {
    return {
        patterns: [
            {
                pattern_type: "standard",
                title: "EOR category is repricing upward.",
                summary: "Three competitors raised funding at higher multiples in May.",
                confidence: 0.82
            },
            {
                pattern_type: "contrarian",
                title: "Your watchlist names Deel but Atlas HXM is moving faster.",
                summary: "Atlas raised $40M and is publicly expanding into APAC EOR.",
                confidence: 0.75
            }
        ],
        trigger_fires: [
            {
                trigger_natural_language: "2+ EOR competitors launch a product in 30 days",
                fire_summary: "4 product_launch events across the set in 30d",
                evidence_count: 4
            }
        ],
        ...over
    };
}

function draft(over: Partial<ComposeDraft> = {}): ComposeDraft {
    return {
        refused: false,
        refusal_reason: null,
        lead: "Three EOR competitors are repricing upward and Atlas HXM is moving faster than anyone on your watchlist.",
        ...over
    };
}

describe("COMPOSE_PROMPT_VERSION + system prompt", () => {
    it("has a stable version string", () => {
        expect(COMPOSE_PROMPT_VERSION).toMatch(/^compose-/);
    });

    it("system prompt names the one-or-two-sentence constraint", () => {
        expect(COMPOSE_SYSTEM_PROMPT).toMatch(/ONE OR TWO sentences/);
    });

    it("system prompt names refusal as a feature", () => {
        expect(COMPOSE_SYSTEM_PROMPT).toMatch(/Silence is a feature/);
    });

    it("system prompt bans this-week throat-clearing", () => {
        expect(COMPOSE_SYSTEM_PROMPT).toMatch(/this week/);
    });
});

describe("buildComposePrompt", () => {
    it("lists every pattern with kind + confidence + summary", () => {
        const p = buildComposePrompt(input());
        expect(p).toMatch(/\[STANDARD\] \(confidence 0\.82\)/);
        expect(p).toMatch(/\[CONTRARIAN\] \(confidence 0\.75\)/);
        expect(p).toContain("Atlas HXM");
    });

    it("lists every trigger fire with NL + summary + evidence count", () => {
        const p = buildComposePrompt(input());
        expect(p).toContain("2+ EOR competitors launch a product in 30 days");
        expect(p).toContain("4 product_launch events");
        expect(p).toContain("(4 items)");
    });

    it("uses '(none synthesized)' for empty pattern list", () => {
        const p = buildComposePrompt(input({ patterns: [] }));
        expect(p).toContain("(none synthesized this run)");
    });

    it("uses '(no triggers fired)' for empty trigger list", () => {
        const p = buildComposePrompt(input({ trigger_fires: [] }));
        expect(p).toContain("(no triggers fired this run)");
    });

    it("specifies both 'refused' and 'not refused' output shapes", () => {
        const p = buildComposePrompt(input());
        expect(p).toContain('"refused": false');
        expect(p).toContain('"refused": true');
    });
});

describe("extractJsonBlock + parseComposeResponse", () => {
    it("parses a lead response", () => {
        const json = JSON.stringify({
            refused: false,
            refusal_reason: null,
            lead: "Three EOR competitors are repricing upward."
        });
        const d = parseComposeResponse(json);
        expect(d?.refused).toBe(false);
        expect(d?.lead).toBe("Three EOR competitors are repricing upward.");
    });

    it("parses a refusal response", () => {
        const json = JSON.stringify({
            refused: true,
            refusal_reason: "Zero patterns + zero fires this run.",
            lead: null
        });
        const d = parseComposeResponse(json);
        expect(d?.refused).toBe(true);
        expect(d?.refusal_reason).toContain("Zero patterns");
        expect(d?.lead).toBeNull();
    });

    it("trims whitespace from the lead and treats empty strings as null", () => {
        const json1 = JSON.stringify({ refused: false, refusal_reason: null, lead: "   " });
        expect(parseComposeResponse(json1)?.lead).toBeNull();
        const json2 = JSON.stringify({
            refused: false,
            refusal_reason: null,
            lead: "  Real lead with leading whitespace.  "
        });
        expect(parseComposeResponse(json2)?.lead).toBe("Real lead with leading whitespace.");
    });

    it("strips code fences / leading prose", () => {
        const raw =
            "Here's my response:\n```json\n" +
            JSON.stringify({ refused: false, refusal_reason: null, lead: "x" }) +
            "\n```";
        const block = extractJsonBlock(raw);
        expect(block).toBeTruthy();
        expect(JSON.parse(block!).lead).toBe("x");
    });

    it("returns null on garbage", () => {
        expect(parseComposeResponse("nope")).toBeNull();
        expect(parseComposeResponse("{ broken json")).toBeNull();
    });
});

describe("runComposeGate", () => {
    it("passes a refused draft (refusal is valid)", () => {
        const r = runComposeGate({
            refused: true,
            refusal_reason: "Nothing rose to the bar.",
            lead: null
        });
        expect(r.passes).toBe(true);
        expect(r.failures).toEqual([]);
    });

    it("passes a clean declarative lead", () => {
        expect(runComposeGate(draft()).passes).toBe(true);
    });

    it("fails when lead is missing on a non-refused draft", () => {
        const r = runComposeGate({ refused: false, refusal_reason: null, lead: null });
        expect(r.failures).toContain("missing_lead");
    });

    it("fails when lead exceeds MAX_LEAD_LEN", () => {
        const r = runComposeGate(draft({ lead: "x".repeat(MAX_LEAD_LEN + 10) }));
        expect(r.failures).toContain("lead_too_long");
    });

    it("fails on hedging words (might, perhaps, could be argued)", () => {
        expect(runComposeGate(draft({ lead: "Deel might be repricing upward." })).failures)
            .toContain("weakening_language");
        expect(runComposeGate(draft({ lead: "Perhaps Atlas is moving fast." })).failures)
            .toContain("weakening_language");
    });

    it("fails on 'in today's market' / 'this week' throat-clearing", () => {
        expect(runComposeGate(draft({ lead: "In today's EOR landscape, Deel is repricing." })).failures)
            .toContain("weakening_language");
        expect(runComposeGate(draft({ lead: "This week, Deel is repricing." })).failures)
            .toContain("weakening_language");
    });

    it("fails on manifesto-shape nouns (the wedge, the verdict, decision-grade)", () => {
        expect(runComposeGate(draft({ lead: "The wedge is closing — Atlas moves ahead." })).failures)
            .toContain("manifesto_fragments");
        expect(runComposeGate(draft({ lead: "Decision-grade proof is on the table." })).failures)
            .toContain("manifesto_fragments");
    });

    it("MAX_LEAD_LEN is meaningful (two sentences fit comfortably)", () => {
        expect(MAX_LEAD_LEN).toBeGreaterThanOrEqual(200);
        expect(MAX_LEAD_LEN).toBeLessThanOrEqual(400);
    });
});
