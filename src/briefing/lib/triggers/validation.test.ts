import { describe, it, expect } from "vitest";
import { normalizeParsedQuery } from "./parser";
import {
    aggregationItemMatches,
    matchAdjacency,
    matchSingleEvent,
    type MatchableItem
} from "./matchers";
import type { AdjacencyQuery, AggregationQuery, SingleEventQuery } from "./types";

/**
 * B.3c validation — the parser↔matcher contract.
 *
 * The parser (Sonnet) is smart but improvises near-miss field names.
 * normalizeParsedQuery must coerce whatever it emits into the exact
 * shape the matchers read, so a trigger actually fires. These cases
 * cover the real off-spec output we saw in production + the common
 * variants across the five types. The live "does the LLM pick the right
 * type for each of the 32 grammar inputs" eval is run against the
 * deployed parser; this suite locks the deterministic half.
 */

function item(over: Partial<MatchableItem> = {}): MatchableItem {
    return {
        enriched_id: `e-${Math.random().toString(36).slice(2, 8)}`,
        companies: ["Deel"],
        exec_move_company: null,
        exec_move_role: null,
        event_category: "product_launch",
        topic_tags: ["product_expansion"],
        user_relevance_score: 0.9,
        text: "deel launched a new module",
        published_date: "2026-05-25T12:00:00Z",
        ...over
    };
}

describe("normalizer — the exact production off-spec aggregation output", () => {
    // This is verbatim the shape the deployed parser produced for
    // "Alert me when 2+ EOR competitors launch a new product in 30 days":
    // flat event_category + targets buried in filters.resolved_targets.
    const raw = {
        type: "aggregation",
        event_category: "product_launch",
        filters: {
            target_group: "EOR_competitors",
            resolved_targets: ["Deel", "Rippling", "Remote", "Vensure Employer Solutions"],
            category_tag: "EOR"
        },
        min_count: 2,
        window_days: 30,
        window_type: "rolling",
        fire_once_per_window: true
    };

    it("coerces to canonical, matcher-conformant aggregation", () => {
        const q = normalizeParsedQuery(raw, "aggregation") as AggregationQuery;
        expect(q.type).toBe("aggregation");
        expect(q.event.category).toBe("product_launch");
        expect(q.min_count).toBe(2);
        expect(q.window_days).toBe(30);
        expect(q.target?.type).toBe("companies");
        const names = (q.target as unknown as { names: string[] }).names;
        expect(names).toContain("Deel");
        expect(names).toContain("Rippling");
    });

    it("then fires on a Deel + a Rippling product-launch item", () => {
        const q = normalizeParsedQuery(raw, "aggregation") as AggregationQuery;
        const deel = item({ companies: ["Deel"] });
        const rippling = item({ companies: ["Rippling"] });
        expect(aggregationItemMatches(deel, q)).toBe(true);
        expect(aggregationItemMatches(rippling, q)).toBe(true);
        // And an off-target company does not count
        expect(aggregationItemMatches(item({ companies: ["Gusto"] }), q)).toBe(false);
    });
});

describe("normalizer — single_event variants", () => {
    it("flat event_category + bare-string target", () => {
        const q = normalizeParsedQuery(
            { type: "single_event", event_category: "exec_move", target: "Deel" },
            "single_event"
        ) as SingleEventQuery;
        expect(q.event.category).toBe("exec_move");
        expect(q.target).toEqual({ type: "company", name: "Deel" });
        expect(q.fire_once).toBe(false);
        const hit = item({ event_category: "exec_move", companies: ["Deel"] });
        expect(matchSingleEvent(hit, q)).toBe(true);
    });

    it("unknown event category falls back to 'any'", () => {
        const q = normalizeParsedQuery(
            { type: "single_event", event: { category: "frobnicated" }, target: { type: "any" } },
            "single_event"
        ) as SingleEventQuery;
        expect(q.event.category).toBe("any");
    });

    it("names array as target → companies", () => {
        const q = normalizeParsedQuery(
            { type: "single_event", event: { category: "m_a_event" }, target: ["Deel", "Rippling"] },
            "single_event"
        ) as SingleEventQuery;
        expect(q.target.type).toBe("companies");
    });
});

describe("normalizer — adjacency variants", () => {
    it("scope.context only + default relevance_threshold/digest", () => {
        const q = normalizeParsedQuery(
            { type: "adjacency", target: { type: "company", name: "Deel" }, scope: { context: "device management" } },
            "adjacency"
        ) as AdjacencyQuery;
        expect(q.relevance_threshold).toBe(0.6);
        expect(q.digest_mode).toBe(true);
        expect(q.scope?.context).toBe("device management");
        expect(matchAdjacency(item({ companies: ["Deel"] }), q)).toBe(true);
    });
});

describe("normalizer — threshold + silence shape guarantees", () => {
    it("threshold gets metric/comparison/value/baseline", () => {
        const q = normalizeParsedQuery(
            {
                type: "threshold",
                metric: { source: "wikipedia_pageviews", target: "Agentic_workflow", metric_type: "growth_pct" },
                comparison: "greater_than_or_equal",
                value: 0.5,
                window_days: 60
            },
            "threshold"
        );
        expect(q).toMatchObject({
            type: "threshold",
            comparison: "greater_than_or_equal",
            value: 0.5,
            window_days: 60
        });
        expect((q as { baseline: { type: string } }).baseline.type).toBe("previous_window");
    });

    it("silence gets target/silence_days/reset_on_activity", () => {
        const q = normalizeParsedQuery(
            { type: "silence", target: { type: "source", source_type: "company_blog", company: "Rippling" }, silence_days: 30 },
            "silence"
        );
        expect(q).toMatchObject({ type: "silence", silence_days: 30, reset_on_activity: true });
    });
});

describe("normalizer — robustness", () => {
    it("returns null for non-objects / null type", () => {
        expect(normalizeParsedQuery(null, "aggregation")).toBeNull();
        expect(normalizeParsedQuery({ type: "aggregation" }, null)).toBeNull();
    });

    it("aggregation defaults: min_count 1, window 30, rolling, fire_once_per_window true", () => {
        const q = normalizeParsedQuery({ type: "aggregation", event: { category: "funding_round" } }, "aggregation") as AggregationQuery;
        expect(q.min_count).toBe(1);
        expect(q.window_days).toBe(30);
        expect(q.window_type).toBe("rolling");
        expect(q.fire_once_per_window).toBe(true);
        expect(q.target?.type).toBe("any");
    });
});
