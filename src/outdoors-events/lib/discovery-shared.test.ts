import { describe, it, expect } from "vitest";
import {
    buildDedupeKey,
    computeCost,
    extractJsonArray,
    isRelevanceTier,
    parseDiscoveredEvents,
    passesVoiceLite,
    roundCost,
    WEB_SEARCH_COST_PER_USE_USD
} from "../../../supabase/functions/outdoors-events-discovery/_shared";

/**
 * Unit tests for the discovery Edge Function's pure helpers
 * (ADR-016 PR 2). The Deno orchestrator + Anthropic wrapper aren't
 * importable from Node; this suite covers the parse + dedupe + voice
 * + cost surface, which is where the bugs would actually live.
 */

describe("outdoors-events-discovery / _shared", () => {
    // ─── Cost ───────────────────────────────────────────────────

    it("computeCost combines input + output token costs (sonnet)", () => {
        const cost = computeCost("sonnet_4_6", {
            input_tokens: 1_000_000,
            output_tokens: 0
        });
        expect(cost).toBeCloseTo(3.0, 5);
    });

    it("roundCost truncates to 4 decimal places", () => {
        expect(roundCost(0.123456)).toBe(0.1235);
        expect(roundCost(0.0001234)).toBe(0.0001);
    });

    it("WEB_SEARCH_COST_PER_USE_USD is exposed for run-ledger cost", () => {
        expect(WEB_SEARCH_COST_PER_USE_USD).toBeGreaterThan(0);
    });

    // ─── Voice-lite gate ────────────────────────────────────────

    it("passesVoiceLite accepts plain operator-grade copy", () => {
        expect(
            passesVoiceLite(
                "Major security industry gathering — your category."
            )
        ).toBe(true);
    });

    it("passesVoiceLite rejects banned-vocab strings", () => {
        expect(passesVoiceLite("Best-in-class summit")).toBe(false);
        expect(passesVoiceLite("Decision-grade event")).toBe(false);
        expect(passesVoiceLite("Supercharge your pipeline")).toBe(false);
        expect(passesVoiceLite("World-class summit")).toBe(false);
        expect(passesVoiceLite("Game-changing meetup")).toBe(false);
    });

    it("passesVoiceLite rejects empty / whitespace strings", () => {
        expect(passesVoiceLite("")).toBe(false);
        expect(passesVoiceLite("   ")).toBe(false);
    });

    it("passesVoiceLite enforces a length sanity bound (no walls of text)", () => {
        expect(passesVoiceLite("x".repeat(321))).toBe(false);
        expect(passesVoiceLite("x".repeat(200))).toBe(true);
    });

    // ─── Dedupe key ─────────────────────────────────────────────

    it("buildDedupeKey is stable across phrasing tweaks", () => {
        const k1 = buildDedupeKey(
            "RSA Conference 2026",
            "2026-05-04",
            "San Francisco, CA"
        );
        const k2 = buildDedupeKey(
            "RSA  Conference  2026",
            "2026-05-04",
            "San Francisco CA"
        );
        // Same month, same city slug, near-identical name slug.
        expect(k1).toBe(k2);
    });

    it("buildDedupeKey differs when dates differ", () => {
        const a = buildDedupeKey("DEF CON", "2026-08-06", "Las Vegas");
        const b = buildDedupeKey("DEF CON", "2027-08-06", "Las Vegas");
        expect(a).not.toBe(b);
    });

    it("buildDedupeKey handles missing date + city", () => {
        const k = buildDedupeKey("Local meetup", null, null);
        expect(k).toContain("nodate");
        expect(k).toContain("nowhere");
    });

    // ─── isRelevanceTier ────────────────────────────────────────

    it("isRelevanceTier accepts only the three canon tiers", () => {
        expect(isRelevanceTier("direct")).toBe(true);
        expect(isRelevanceTier("adjacent")).toBe(true);
        expect(isRelevanceTier("indirect")).toBe(true);
        expect(isRelevanceTier("DIRECT")).toBe(false);
        expect(isRelevanceTier("unknown")).toBe(false);
        expect(isRelevanceTier(null)).toBe(false);
    });

    // ─── parseDiscoveredEvents ──────────────────────────────────

    it("parseDiscoveredEvents accepts a well-formed event", () => {
        const out = parseDiscoveredEvents([
            {
                name: "RSA Conference 2026",
                kind: "conference",
                where_at: "San Francisco, CA",
                start_date: "2026-05-04",
                end_date: "2026-05-07",
                tags: ["security", "CISO"],
                source_url: "https://rsaconference.com/usa",
                relevance_tier: "direct",
                relevance_reason:
                    "The major US security industry gathering — direct to the category."
            }
        ]);
        expect(out.length).toBe(1);
        expect(out[0]!.name).toBe("RSA Conference 2026");
        expect(out[0]!.tags).toEqual(["security", "CISO"]);
    });

    it("parseDiscoveredEvents drops events without a real URL (hallucination guard)", () => {
        const out = parseDiscoveredEvents([
            {
                name: "Fake Con",
                source_url: "tbd",
                relevance_tier: "direct",
                relevance_reason: "Plausible-sounding reason."
            }
        ]);
        expect(out).toEqual([]);
    });

    it("parseDiscoveredEvents drops events whose reason fails voice gate", () => {
        const out = parseDiscoveredEvents([
            {
                name: "Real Con",
                source_url: "https://example.com/real-con",
                relevance_tier: "direct",
                relevance_reason: "Best-in-class summit for thought-leaders."
            }
        ]);
        expect(out).toEqual([]);
    });

    it("parseDiscoveredEvents drops events with no/invalid tier", () => {
        const out = parseDiscoveredEvents([
            {
                name: "Real Con",
                source_url: "https://example.com",
                relevance_tier: "unknown",
                relevance_reason: "Plain sentence."
            }
        ]);
        expect(out).toEqual([]);
    });

    it("parseDiscoveredEvents normalizes dates + drops bad ones", () => {
        const out = parseDiscoveredEvents([
            {
                name: "Real Con",
                source_url: "https://example.com",
                start_date: "2026-05-04T00:00:00Z",
                end_date: "not a date",
                relevance_tier: "direct",
                relevance_reason: "Plain sentence."
            }
        ]);
        expect(out.length).toBe(1);
        expect(out[0]!.start_date).toBe("2026-05-04");
        expect(out[0]!.end_date).toBeNull();
    });

    it("parseDiscoveredEvents handles non-array input gracefully", () => {
        expect(parseDiscoveredEvents(null)).toEqual([]);
        expect(parseDiscoveredEvents({})).toEqual([]);
        expect(parseDiscoveredEvents("nope")).toEqual([]);
    });

    // ─── extractJsonArray ──────────────────────────────────────

    it("extractJsonArray pulls the array out of a fenced response", () => {
        const text = 'Here are the events:\n```json\n[{"name":"x"}]\n```';
        expect(extractJsonArray(text)).toEqual([{ name: "x" }]);
    });

    it("extractJsonArray pulls the array out of inline prose", () => {
        const text = 'I found these: [{"name":"a"},{"name":"b"}] — enjoy';
        expect(extractJsonArray(text)).toEqual([{ name: "a" }, { name: "b" }]);
    });

    it("extractJsonArray returns [] when no array is present", () => {
        expect(extractJsonArray("just prose, no JSON")).toEqual([]);
        expect(extractJsonArray("")).toEqual([]);
    });
});
