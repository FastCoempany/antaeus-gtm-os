import { describe, expect, it } from "vitest";
import { hnAlgoliaUrl, parseHnAlgoliaResponse } from "./hn-algolia";

describe("hnAlgoliaUrl", () => {
    it("includes query, tags=story, numericFilters, and hitsPerPage", () => {
        const url = hnAlgoliaUrl("pricing", 1700000000, 25);
        expect(url).toContain("query=pricing");
        expect(url).toContain("tags=story");
        expect(url).toContain("numericFilters=created_at_i%3E1700000000");
        expect(url).toContain("hitsPerPage=25");
    });

    it("URL-encodes multi-word queries", () => {
        const url = hnAlgoliaUrl("customer data platform", 0, 5);
        expect(url).toContain("query=customer+data+platform");
    });

    it("targets the canonical search_by_date endpoint", () => {
        const url = hnAlgoliaUrl("test", 0);
        expect(url).toMatch(/^https:\/\/hn\.algolia\.com\/api\/v1\/search_by_date\?/);
    });
});

describe("parseHnAlgoliaResponse", () => {
    it("normalizes a typical response into typed hits", () => {
        const body = {
            hits: [
                {
                    objectID: "42022198",
                    title: "Anyone else seeing Segment's sales motion shift to mid-market?",
                    url: null,
                    author: "rstack-watcher",
                    created_at: "2026-05-16T23:00:00.000Z",
                    points: 87,
                    num_comments: 41,
                    story_text: "Asking because we just got a..."
                },
                {
                    objectID: "42022199",
                    title: "TechCrunch: Acme Industries raises $50M",
                    url: "https://techcrunch.com/2026/05/13/acme",
                    author: "newsbot",
                    created_at: "2026-05-13T10:00:00.000Z",
                    points: 134,
                    num_comments: 23,
                    story_text: null
                }
            ],
            nbHits: 2
        };
        const hits = parseHnAlgoliaResponse(body);
        expect(hits).toHaveLength(2);
        expect(hits[0]?.objectID).toBe("42022198");
        expect(hits[1]?.url).toBe("https://techcrunch.com/2026/05/13/acme");
    });

    it("skips entries missing objectID", () => {
        const body = {
            hits: [
                { title: "no id", url: "https://x" },
                { objectID: "valid", title: "kept" }
            ]
        };
        const hits = parseHnAlgoliaResponse(body);
        expect(hits).toHaveLength(1);
        expect(hits[0]?.objectID).toBe("valid");
    });

    it("skips entries missing title", () => {
        const body = {
            hits: [
                { objectID: "no-title", url: "https://x" },
                { objectID: "valid", title: "kept" }
            ]
        };
        expect(parseHnAlgoliaResponse(body)).toHaveLength(1);
    });

    it("returns empty array when hits is absent", () => {
        expect(parseHnAlgoliaResponse({})).toEqual([]);
    });

    it("returns empty array when hits is not an array", () => {
        expect(
            parseHnAlgoliaResponse({ hits: "not an array" as unknown as never })
        ).toEqual([]);
    });

    it("returns empty array on null input", () => {
        expect(parseHnAlgoliaResponse(null as unknown as never)).toEqual([]);
    });

    it("coerces missing optional fields to null", () => {
        const body = { hits: [{ objectID: "1", title: "T" }] };
        const hits = parseHnAlgoliaResponse(body);
        expect(hits[0]?.url).toBeNull();
        expect(hits[0]?.points).toBeNull();
        expect(hits[0]?.author).toBeNull();
    });

    it("rejects non-string objectID values", () => {
        const body = { hits: [{ objectID: 42, title: "T" }] };
        expect(parseHnAlgoliaResponse(body)).toHaveLength(0);
    });

    it("trims whitespace-only strings to null", () => {
        const body = {
            hits: [{ objectID: "1", title: "T", url: "   ", author: "" }]
        };
        const hits = parseHnAlgoliaResponse(body);
        expect(hits[0]?.url).toBeNull();
        expect(hits[0]?.author).toBeNull();
    });
});
