import { describe, it, expect } from "vitest";
import {
    TRIGGER_PARSE_PROMPT_VERSION,
    buildTriggerParsePrompt,
    parseDisposition,
    parseTriggerResponse
} from "./parser";

function inputs(nl: string) {
    return {
        natural_language: nl,
        watchlist_companies: ["Deel", "Rippling", "Remote"],
        competitors: ["Deel", "Rippling"],
        icp_categories: ["B2B SaaS"],
        active_triggers_summary: []
    };
}

describe("buildTriggerParsePrompt", () => {
    it("includes the five types, frequent-mover examples, input, and context", () => {
        const p = buildTriggerParsePrompt(inputs("Alert me when Deel hires a VP of Sales"));
        expect(p).toContain("single_event");
        expect(p).toContain("aggregation");
        expect(p).toContain("silence");
        // Frequent movers foregrounded, not pricing
        expect(p).toContain("hires a VP of Sales");
        expect(p).toContain("launches a new product module");
        expect(p).toContain("Alert me when Deel hires a VP of Sales");
        expect(p).toContain("Watchlist companies: Deel, Rippling, Remote");
    });
});

describe("parseTriggerResponse", () => {
    it("parses a clean single_event", () => {
        const json = JSON.stringify({
            parse_succeeded: true,
            parse_failure_reason: null,
            trigger_type: "single_event",
            parsed_query: {
                type: "single_event",
                event: { category: "product_launch" },
                target: { type: "company", name: "Deel" },
                fire_once: false
            },
            parse_confidence: 0.92,
            ambiguities: [],
            rephrased_for_confirmation: "Deel's product launches.",
            suggested_split: null,
            notes: null
        });
        const r = parseTriggerResponse(json);
        expect(r.parse_succeeded).toBe(true);
        expect(r.trigger_type).toBe("single_event");
        expect(r.parse_confidence).toBe(0.92);
        expect(r.rephrased_for_confirmation).toContain("Deel");
        expect((r.parsed_query as { type: string }).type).toBe("single_event");
    });

    it("forces parsed_query.type to agree with trigger_type", () => {
        const json = JSON.stringify({
            parse_succeeded: true,
            trigger_type: "aggregation",
            parsed_query: { type: "single_event", min_count: 2 }, // disagreeing discriminant
            parse_confidence: 0.9
        });
        const r = parseTriggerResponse(json);
        expect((r.parsed_query as { type: string }).type).toBe("aggregation");
    });

    it("demotes a success claim with no usable query to failure", () => {
        const json = JSON.stringify({
            parse_succeeded: true,
            trigger_type: "single_event",
            parsed_query: null,
            parse_confidence: 0.9
        });
        const r = parseTriggerResponse(json);
        expect(r.parse_succeeded).toBe(false);
        expect(r.parsed_query).toBeNull();
    });

    it("carries ambiguities + suggested_split for compound/vague input", () => {
        const json = JSON.stringify({
            parse_succeeded: false,
            parse_failure_reason: "compound",
            trigger_type: null,
            parsed_query: null,
            parse_confidence: 0.4,
            ambiguities: [
                { field: "event", question: "Which event?", suggested_clarification: "hiring?" }
            ],
            suggested_split: ["Alert me when Deel hires", "Alert me when Deel launches"]
        });
        const r = parseTriggerResponse(json);
        expect(r.parse_succeeded).toBe(false);
        expect(r.ambiguities).toHaveLength(1);
        expect(r.suggested_split).toHaveLength(2);
    });

    it("clamps confidence to [0,1]", () => {
        const r = parseTriggerResponse(
            JSON.stringify({ parse_succeeded: false, parse_confidence: 5 })
        );
        expect(r.parse_confidence).toBe(1);
    });

    it("fails gracefully on non-JSON", () => {
        const r = parseTriggerResponse("not json");
        expect(r.parse_succeeded).toBe(false);
        expect(r.parse_failure_reason).not.toBeNull();
    });
});

describe("parseDisposition", () => {
    const ok = (c: number) => ({
        parse_succeeded: true,
        parse_failure_reason: null,
        trigger_type: "single_event" as const,
        parsed_query: { type: "single_event" } as never,
        parse_confidence: c,
        ambiguities: [],
        rephrased_for_confirmation: "",
        suggested_split: null,
        notes: null
    });

    it("arms cleanly at 0.95+", () => {
        expect(parseDisposition(ok(0.96))).toBe("arm_ready");
    });
    it("confirms with minor ambiguity 0.80-0.94", () => {
        expect(parseDisposition(ok(0.85))).toBe("confirm_minor");
    });
    it("requires resolution 0.70-0.79", () => {
        expect(parseDisposition(ok(0.74))).toBe("resolve_first");
    });
    it("clarify-only below 0.70", () => {
        expect(parseDisposition(ok(0.5))).toBe("clarify_only");
    });
    it("clarify-only when parse failed regardless of confidence", () => {
        expect(parseDisposition({ ...ok(0.99), parse_succeeded: false })).toBe("clarify_only");
    });
});

describe("TRIGGER_PARSE_PROMPT_VERSION", () => {
    it("is stable", () => {
        expect(TRIGGER_PARSE_PROMPT_VERSION).toBe("trigger-parse-1.0");
    });
});
