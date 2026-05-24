import { describe, expect, it } from "vitest";
import {
    buildEnrichPrompt,
    ENRICH_SYSTEM_PROMPT,
    PROMPT_VERSION,
    type EnrichPromptInputs
} from "./prompts";

const MINIMAL: EnrichPromptInputs = {
    source_id: "techcrunch_rss",
    title: "Acme launches new product",
    body: "Acme Industries today announced a new product.",
    published_date: "2026-05-23T14:00:00Z",
    watchlist_companies: [],
    competitive_set: [],
    active_deals: [],
    watchlist_triggers: [],
    available_pain_tags: [],
    corporate_ownership_map: []
};

describe("PROMPT_VERSION", () => {
    it("is set", () => {
        expect(PROMPT_VERSION).toBe("enrich-1.0");
    });
});

describe("ENRICH_SYSTEM_PROMPT", () => {
    it("instructs the model to respond with only JSON", () => {
        expect(ENRICH_SYSTEM_PROMPT).toContain("ONLY valid JSON");
        expect(ENRICH_SYSTEM_PROMPT).toContain("must be '{'");
    });

    it("sets voice constraints", () => {
        expect(ENRICH_SYSTEM_PROMPT).toContain("factual");
        expect(ENRICH_SYSTEM_PROMPT).toContain("Do not editorialize");
    });
});

describe("buildEnrichPrompt — minimal context", () => {
    it("includes the source + title + body verbatim", () => {
        const prompt = buildEnrichPrompt(MINIMAL);
        expect(prompt).toContain("Source type: techcrunch_rss");
        expect(prompt).toContain("Title: Acme launches new product");
        expect(prompt).toContain("Body: Acme Industries today announced a new product.");
    });

    it("includes the publish date when provided", () => {
        const prompt = buildEnrichPrompt(MINIMAL);
        expect(prompt).toContain("Published: 2026-05-23T14:00:00Z");
    });

    it("omits the Body line when body is null", () => {
        const prompt = buildEnrichPrompt({ ...MINIMAL, body: null });
        expect(prompt).not.toContain("Body:");
    });

    it("omits the Body line when body is whitespace-only", () => {
        const prompt = buildEnrichPrompt({ ...MINIMAL, body: "   " });
        expect(prompt).not.toContain("Body:");
    });

    it("includes a graceful 'workspace has not declared context' clause when everything empty", () => {
        const prompt = buildEnrichPrompt(MINIMAL);
        expect(prompt).toContain("Workspace has not yet declared");
        expect(prompt).toContain("Score user_relevance_score conservatively");
    });

    it("includes the EXTRACTION RULES schema", () => {
        const prompt = buildEnrichPrompt(MINIMAL);
        expect(prompt).toContain("EXTRACTION RULES");
        expect(prompt).toContain('"summary":');
        expect(prompt).toContain('"user_relevance_score":');
        expect(prompt).toContain('"is_noise":');
    });

    it("does NOT include the corporate ownership block when map is empty", () => {
        const prompt = buildEnrichPrompt(MINIMAL);
        expect(prompt).not.toContain("CORPORATE OWNERSHIP MAP");
        expect(prompt).not.toContain("ADDITIONAL RULE");
    });
});

describe("buildEnrichPrompt — with workspace context", () => {
    const WITH_CONTEXT: EnrichPromptInputs = {
        ...MINIMAL,
        watchlist_companies: ["Segment", "RudderStack"],
        competitive_set: ["Segment", "Hightouch"],
        active_deals: [
            {
                deal_id: "dl_001",
                account_name: "Acme",
                competitive_set: ["Segment"],
                watch_for: ["pricing", "AI"]
            }
        ],
        watchlist_triggers: [
            {
                trigger_id: "trg_001",
                natural_language: "Alert me when Segment changes pricing"
            }
        ],
        available_pain_tags: ["cdp-entry-pricing-pressure", "plg-vs-sales-led"]
    };

    it("serializes the watchlist as JSON", () => {
        const prompt = buildEnrichPrompt(WITH_CONTEXT);
        expect(prompt).toContain('Watchlist companies: ["Segment","RudderStack"]');
    });

    it("serializes active deals with id + competitive_set + watch_for", () => {
        const prompt = buildEnrichPrompt(WITH_CONTEXT);
        expect(prompt).toContain("dl_001: Acme vs [Segment]");
        expect(prompt).toContain("watch_for=[pricing, AI]");
    });

    it("serializes triggers as id + natural language", () => {
        const prompt = buildEnrichPrompt(WITH_CONTEXT);
        expect(prompt).toContain(
            "trg_001: Alert me when Segment changes pricing"
        );
    });

    it("serializes available pain tags as JSON array", () => {
        const prompt = buildEnrichPrompt(WITH_CONTEXT);
        expect(prompt).toContain(
            'Available pain tags: ["cdp-entry-pricing-pressure","plg-vs-sales-led"]'
        );
    });

    it("does NOT include the empty-context fallback when context exists", () => {
        const prompt = buildEnrichPrompt(WITH_CONTEXT);
        expect(prompt).not.toContain("Workspace has not yet declared");
    });
});

describe("buildEnrichPrompt — corporate ownership map", () => {
    it("includes the map block when relationships are provided", () => {
        const prompt = buildEnrichPrompt({
            ...MINIMAL,
            corporate_ownership_map: [
                {
                    parent: "Twilio",
                    child: "Segment",
                    relationship_type: "owns",
                    since: "2020-11-01"
                }
            ]
        });
        expect(prompt).toContain("CORPORATE OWNERSHIP MAP");
        expect(prompt).toContain("Twilio owns Segment (since 2020-11-01)");
    });

    it("includes the ADDITIONAL RULE clause when map is non-empty", () => {
        const prompt = buildEnrichPrompt({
            ...MINIMAL,
            corporate_ownership_map: [
                {
                    parent: "Microsoft",
                    child: "LinkedIn",
                    relationship_type: "owns",
                    since: "2016-12-08"
                }
            ]
        });
        expect(prompt).toContain("ADDITIONAL RULE");
        expect(prompt).toContain("Segment (Twilio-owned)");
    });
});
