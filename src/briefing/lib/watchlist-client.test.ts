import { describe, it, expect } from "vitest";
import {
    type ParseTriggerResponse,
    canArm,
    parseArmedTriggerRow,
    parseTriggerFireRow,
    shortFireDate,
    triggerTypeLabel
} from "./watchlist-client";
import type { TriggerParseResult } from "./triggers/types";

/**
 * B.3b — the front-end shaping of armed triggers + fires.
 *
 * The Supabase reads themselves are thin; the logic worth locking is
 * how we coerce whatever the row contains into the shapes the Watch
 * List UI renders, including the embedded trigger join on a fire (which
 * Supabase returns as an object OR a single-element array).
 */

describe("parseArmedTriggerRow", () => {
    it("shapes a full row", () => {
        const t = parseArmedTriggerRow({
            id: "t-1",
            natural_language: "Tell me when 2+ EOR competitors launch a product in 30 days",
            trigger_type: "aggregation",
            status: "armed",
            fire_count: 3,
            last_fired_at: "2026-05-25T12:00:00Z"
        });
        expect(t).not.toBeNull();
        expect(t?.trigger_type).toBe("aggregation");
        expect(t?.fire_count).toBe(3);
        expect(t?.last_fired_at).toBe("2026-05-25T12:00:00Z");
    });

    it("defaults status to armed and last_fired_at to null", () => {
        const t = parseArmedTriggerRow({ id: "t-2", natural_language: "watch Deel" });
        expect(t?.status).toBe("armed");
        expect(t?.last_fired_at).toBeNull();
        expect(t?.fire_count).toBe(0);
    });

    it("coerces a non-numeric fire_count to 0", () => {
        expect(parseArmedTriggerRow({ id: "t-3", fire_count: "lots" })?.fire_count).toBe(0);
    });

    it("returns null without a usable id", () => {
        expect(parseArmedTriggerRow({ id: "" })).toBeNull();
        expect(parseArmedTriggerRow(null)).toBeNull();
        expect(parseArmedTriggerRow("nope")).toBeNull();
    });
});

describe("parseTriggerFireRow", () => {
    it("shapes a fire with the trigger join as an object", () => {
        const f = parseTriggerFireRow({
            id: "f-1",
            summary: "4 product_launch events across the set in 30d",
            fired_at: "2026-05-26T09:00:00Z",
            evidence_item_ids: ["a", "b", "c", "d"],
            trigger: { natural_language: "two EOR competitors launch a product" }
        });
        expect(f?.summary).toContain("product_launch");
        expect(f?.evidence_count).toBe(4);
        expect(f?.trigger_natural_language).toBe("two EOR competitors launch a product");
    });

    it("handles the trigger join arriving as a single-element array", () => {
        const f = parseTriggerFireRow({
            id: "f-2",
            summary: "fired",
            fired_at: "2026-05-26T09:00:00Z",
            evidence_item_ids: [],
            trigger: [{ natural_language: "Deel exec move" }]
        });
        expect(f?.trigger_natural_language).toBe("Deel exec move");
        expect(f?.evidence_count).toBe(0);
    });

    it("tolerates a missing trigger join", () => {
        const f = parseTriggerFireRow({
            id: "f-3",
            summary: "fired",
            fired_at: "2026-05-26T09:00:00Z",
            evidence_item_ids: ["x"]
        });
        expect(f?.trigger_natural_language).toBe("");
        expect(f?.evidence_count).toBe(1);
    });

    it("returns null without a usable id", () => {
        expect(parseTriggerFireRow({ summary: "no id" })).toBeNull();
        expect(parseTriggerFireRow(null)).toBeNull();
    });
});

describe("triggerTypeLabel", () => {
    it("labels each known type", () => {
        expect(triggerTypeLabel("single_event")).toBe("Event");
        expect(triggerTypeLabel("aggregation")).toBe("Aggregation");
        expect(triggerTypeLabel("threshold")).toBe("Threshold");
        expect(triggerTypeLabel("adjacency")).toBe("Adjacency");
        expect(triggerTypeLabel("silence")).toBe("Silence");
    });
    it("passes through an unknown type", () => {
        expect(triggerTypeLabel("mystery")).toBe("mystery");
    });
});

describe("shortFireDate", () => {
    it("formats a valid ISO date", () => {
        expect(shortFireDate("2026-05-26T09:00:00Z")).toMatch(/\w+ \d+/);
    });
    it("returns empty string for an unparseable date", () => {
        expect(shortFireDate("not-a-date")).toBe("");
    });
});

describe("canArm", () => {
    function parse(over: Partial<TriggerParseResult> = {}): TriggerParseResult {
        return {
            parse_succeeded: true,
            parse_failure_reason: null,
            trigger_type: "aggregation",
            parsed_query: null,
            parse_confidence: 0.88,
            ambiguities: [],
            rephrased_for_confirmation: "two EOR competitors launch a product in 30 days",
            suggested_split: null,
            notes: null,
            ...over
        };
    }
    function resp(over: Partial<ParseTriggerResponse> = {}): ParseTriggerResponse {
        return { ok: true, parse: parse(), disposition: "confirm_minor", error: null, ...over };
    }

    it("allows arming a clear parse", () => {
        expect(canArm(resp({ disposition: "arm_ready" }))).toBe(true);
        expect(canArm(resp({ disposition: "confirm_minor" }))).toBe(true);
        expect(canArm(resp({ disposition: "resolve_first" }))).toBe(true);
    });

    it("blocks arming a clarify_only parse", () => {
        expect(canArm(resp({ disposition: "clarify_only" }))).toBe(false);
    });

    it("blocks arming a failed or empty parse", () => {
        expect(canArm(resp({ ok: false }))).toBe(false);
        expect(canArm(resp({ parse: null }))).toBe(false);
        expect(canArm(resp({ parse: parse({ parse_succeeded: false }) }))).toBe(false);
    });
});
