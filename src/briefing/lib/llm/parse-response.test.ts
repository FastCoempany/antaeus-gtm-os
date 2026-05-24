import { describe, expect, it } from "vitest";
import { parseEnrichResponse } from "./parse-response";

describe("parseEnrichResponse — happy path", () => {
    const VALID = JSON.stringify({
        entities: {
            companies: ["Segment", "Twilio"],
            people: [],
            products: ["Segment Free for Devs"],
            technologies: ["customer data platform"]
        },
        exec_move: null,
        event_category: "pricing_change",
        topic_tags: ["pricing", "free-tier"],
        pain_tags: ["cdp-entry-pricing-pressure"],
        claim_type: "fact",
        summary: "Segment launched a Free for Devs tier.",
        what_changed: "Segment added a no-cost entry tier for the first time.",
        user_relevance_score: 0.94,
        matches_triggers: ["trg_001"],
        affects_deals: ["dl_001", "dl_002"],
        is_noise: false
    });

    it("parses a canonical valid response", () => {
        const result = parseEnrichResponse(VALID);
        expect(result.error).toBeNull();
        expect(result.enriched).not.toBeNull();
    });

    it("preserves every field correctly", () => {
        const { enriched } = parseEnrichResponse(VALID);
        expect(enriched?.summary).toBe("Segment launched a Free for Devs tier.");
        expect(enriched?.event_category).toBe("pricing_change");
        expect(enriched?.user_relevance_score).toBe(0.94);
        expect(enriched?.matches_triggers).toEqual(["trg_001"]);
        expect(enriched?.affects_deals).toEqual(["dl_001", "dl_002"]);
        expect(enriched?.entities.companies).toEqual(["Segment", "Twilio"]);
        expect(enriched?.is_noise).toBe(false);
    });
});

describe("parseEnrichResponse — markdown / preamble tolerance", () => {
    const BODY = `{"summary":"A short summary.","entities":{"companies":[]},"event_category":"other","topic_tags":[],"pain_tags":[],"claim_type":"fact","what_changed":"","user_relevance_score":0.5,"matches_triggers":[],"affects_deals":[],"is_noise":false}`;

    it("strips ```json ... ``` code fences", () => {
        const wrapped = "```json\n" + BODY + "\n```";
        const result = parseEnrichResponse(wrapped);
        expect(result.error).toBeNull();
        expect(result.enriched?.summary).toBe("A short summary.");
    });

    it("strips ``` (no language tag) code fences", () => {
        const wrapped = "```\n" + BODY + "\n```";
        const result = parseEnrichResponse(wrapped);
        expect(result.error).toBeNull();
    });

    it("tolerates 'Here's the analysis:' preamble", () => {
        const wrapped = "Here's the analysis:\n\n" + BODY;
        const result = parseEnrichResponse(wrapped);
        expect(result.error).toBeNull();
        expect(result.enriched?.summary).toBe("A short summary.");
    });

    it("tolerates trailing text after the JSON", () => {
        const wrapped = BODY + "\n\nLet me know if you need more detail.";
        const result = parseEnrichResponse(wrapped);
        expect(result.error).toBeNull();
    });
});

describe("parseEnrichResponse — defensive normalization", () => {
    it("coerces boolean-strings to booleans", () => {
        const body = JSON.stringify({
            summary: "x",
            is_noise: "true",
            entities: {},
            event_category: "other",
            topic_tags: [],
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            user_relevance_score: 0.5,
            matches_triggers: [],
            affects_deals: []
        });
        const { enriched } = parseEnrichResponse(body);
        expect(enriched?.is_noise).toBe(true);
    });

    it("clamps user_relevance_score to [0, 1]", () => {
        const high = JSON.stringify({
            summary: "x",
            user_relevance_score: 2.5,
            entities: {},
            event_category: "other",
            topic_tags: [],
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        expect(parseEnrichResponse(high).enriched?.user_relevance_score).toBe(1);

        const low = JSON.stringify({
            summary: "x",
            user_relevance_score: -0.3,
            entities: {},
            event_category: "other",
            topic_tags: [],
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        expect(parseEnrichResponse(low).enriched?.user_relevance_score).toBe(0);
    });

    it("defaults claim_type to 'claim' when value is unknown", () => {
        const body = JSON.stringify({
            summary: "x",
            claim_type: "fantasy",
            entities: {},
            event_category: "other",
            topic_tags: [],
            pain_tags: [],
            what_changed: "",
            user_relevance_score: 0.5,
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        expect(parseEnrichResponse(body).enriched?.claim_type).toBe("claim");
    });

    it("treats exec_move with missing person_name as null", () => {
        const body = JSON.stringify({
            summary: "x",
            exec_move: { company: "Acme", new_role: "CFO" },
            entities: {},
            event_category: "other",
            topic_tags: [],
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            user_relevance_score: 0.5,
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        expect(parseEnrichResponse(body).enriched?.exec_move).toBeNull();
    });

    it("preserves a fully-specified exec_move", () => {
        const body = JSON.stringify({
            summary: "x",
            exec_move: {
                person_name: "Bruce Felt",
                company: "Hightouch",
                new_role: "CFO",
                action: "joined",
                prior_company: "Cohesity",
                effective_date: "2026-05-15"
            },
            entities: {},
            event_category: "exec_move",
            topic_tags: [],
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            user_relevance_score: 0.9,
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        const { enriched } = parseEnrichResponse(body);
        expect(enriched?.exec_move?.person_name).toBe("Bruce Felt");
        expect(enriched?.exec_move?.action).toBe("joined");
        expect(enriched?.exec_move?.prior_company).toBe("Cohesity");
    });

    it("fills missing arrays with empty arrays", () => {
        const body = JSON.stringify({
            summary: "x",
            entities: {},
            event_category: "other",
            claim_type: "fact",
            what_changed: "",
            user_relevance_score: 0.5,
            is_noise: false
        });
        const { enriched } = parseEnrichResponse(body);
        expect(enriched?.topic_tags).toEqual([]);
        expect(enriched?.pain_tags).toEqual([]);
        expect(enriched?.matches_triggers).toEqual([]);
        expect(enriched?.affects_deals).toEqual([]);
    });

    it("filters non-string entries out of string arrays", () => {
        const body = JSON.stringify({
            summary: "x",
            topic_tags: ["valid", null, 42, "also valid"],
            entities: {},
            event_category: "other",
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            user_relevance_score: 0.5,
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        expect(parseEnrichResponse(body).enriched?.topic_tags).toEqual([
            "valid",
            "also valid"
        ]);
    });
});

describe("parseEnrichResponse — error cases", () => {
    it("rejects empty input", () => {
        const result = parseEnrichResponse("");
        expect(result.enriched).toBeNull();
        expect(result.error).toContain("no JSON object");
    });

    it("rejects pure prose (no JSON)", () => {
        const result = parseEnrichResponse("I'm not sure how to enrich this.");
        expect(result.enriched).toBeNull();
        expect(result.error).toBeTruthy();
    });

    it("rejects malformed JSON (matched braces, bad contents)", () => {
        const result = parseEnrichResponse("{not: valid json, foo bar}");
        expect(result.enriched).toBeNull();
        expect(result.error).toContain("JSON parse failed");
    });

    it("rejects input with no braces at all", () => {
        const result = parseEnrichResponse("just some text, no brackets");
        expect(result.enriched).toBeNull();
        expect(result.error).toContain("no JSON object");
    });

    it("rescues the inner object from a wrapping JSON array (permissive by design)", () => {
        // extractJsonObject finds first '{' through last '}', which
        // pulls the inner object out of '[{...}]'. This is intentional
        // — LLMs occasionally wrap their response in an array, and we'd
        // rather salvage the content than fail. If the inner object is
        // a valid EnrichedItem, we accept it.
        const wrapped = `[{"summary":"rescued","entities":{},"event_category":"other","topic_tags":[],"pain_tags":[],"claim_type":"fact","what_changed":"","user_relevance_score":0.5,"matches_triggers":[],"affects_deals":[],"is_noise":false}]`;
        const result = parseEnrichResponse(wrapped);
        expect(result.error).toBeNull();
        expect(result.enriched?.summary).toBe("rescued");
    });

    it("rejects a response missing the required 'summary' field", () => {
        const body = JSON.stringify({
            entities: {},
            event_category: "other",
            topic_tags: [],
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            user_relevance_score: 0.5,
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        const result = parseEnrichResponse(body);
        expect(result.enriched).toBeNull();
        expect(result.error).toContain("summary");
    });

    it("rejects a response with empty 'summary' field", () => {
        const body = JSON.stringify({
            summary: "",
            entities: {},
            event_category: "other",
            topic_tags: [],
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            user_relevance_score: 0.5,
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        expect(parseEnrichResponse(body).enriched).toBeNull();
    });

    it("rejects a response with whitespace-only 'summary'", () => {
        const body = JSON.stringify({
            summary: "   ",
            entities: {},
            event_category: "other",
            topic_tags: [],
            pain_tags: [],
            claim_type: "fact",
            what_changed: "",
            user_relevance_score: 0.5,
            matches_triggers: [],
            affects_deals: [],
            is_noise: false
        });
        expect(parseEnrichResponse(body).enriched).toBeNull();
    });
});
