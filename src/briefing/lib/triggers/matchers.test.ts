import { describe, it, expect } from "vitest";
import {
    aggregationFires,
    aggregationItemMatches,
    evaluateSilence,
    evaluateThreshold,
    eventCategoryMatches,
    matchAdjacency,
    matchSingleEvent,
    rolePatternMatches,
    targetMatches,
    withinWindow,
    type MatchableItem
} from "./matchers";
import type {
    AdjacencyQuery,
    AggregationQuery,
    SilenceQuery,
    SingleEventQuery,
    ThresholdQuery
} from "./types";

const NOW = "2026-05-27T12:00:00Z";

function item(over: Partial<MatchableItem> = {}): MatchableItem {
    return {
        enriched_id: `e-${Math.random().toString(36).slice(2, 8)}`,
        companies: ["Deel"],
        exec_move_company: null,
        exec_move_role: null,
        event_category: "product_launch",
        topic_tags: ["product_expansion"],
        user_relevance_score: 0.9,
        text: "deel launched deel it for device provisioning",
        published_date: "2026-05-25T12:00:00Z",
        ...over
    };
}

describe("targetMatches", () => {
    it("matches a single company (case-insensitive)", () => {
        expect(targetMatches(item({ companies: ["Deel"] }), { type: "company", name: "deel" })).toBe(true);
    });
    it("matches via exec_move_company", () => {
        expect(
            targetMatches(item({ companies: [], exec_move_company: "Rippling" }), {
                type: "company",
                name: "Rippling"
            })
        ).toBe(true);
    });
    it("companies/any matches if one is present", () => {
        expect(
            targetMatches(item({ companies: ["Remote"] }), {
                type: "companies",
                names: ["Deel", "Remote"],
                logic: "any"
            })
        ).toBe(true);
    });
    it("companies/all requires every name", () => {
        expect(
            targetMatches(item({ companies: ["Deel"] }), {
                type: "companies",
                names: ["Deel", "Rippling"],
                logic: "all"
            })
        ).toBe(false);
    });
    it("category matches on topic tag substring", () => {
        expect(
            targetMatches(item({ topic_tags: ["employer of record"] }), {
                type: "category",
                category_descriptor: "Employer of Record"
            })
        ).toBe(true);
    });
    it("any always matches", () => {
        expect(targetMatches(item(), { type: "any" })).toBe(true);
        expect(targetMatches(item(), undefined)).toBe(true);
    });
});

describe("eventCategoryMatches", () => {
    it("matches exact + wildcard", () => {
        expect(eventCategoryMatches(item({ event_category: "funding_round" }), "funding_round")).toBe(true);
        expect(eventCategoryMatches(item({ event_category: "funding_round" }), "any")).toBe(true);
        expect(eventCategoryMatches(item({ event_category: "funding_round" }), "exec_move")).toBe(false);
    });
});

describe("rolePatternMatches", () => {
    it("matches a regex against the exec-move role", () => {
        expect(rolePatternMatches(item({ exec_move_role: "VP of Sales" }), "vp.*sales")).toBe(true);
        expect(rolePatternMatches(item({ exec_move_role: "Engineer" }), "vp.*sales")).toBe(false);
    });
    it("passes when no pattern is set", () => {
        expect(rolePatternMatches(item(), undefined)).toBe(true);
    });
    it("fails when a pattern is set but the item has no role", () => {
        expect(rolePatternMatches(item({ exec_move_role: null }), "vp")).toBe(false);
    });
});

describe("matchSingleEvent", () => {
    const q: SingleEventQuery = {
        type: "single_event",
        event: { category: "product_launch" },
        target: { type: "company", name: "Deel" },
        fire_once: false
    };
    it("matches a Deel product launch", () => {
        expect(matchSingleEvent(item(), q)).toBe(true);
    });
    it("rejects the wrong company", () => {
        expect(matchSingleEvent(item({ companies: ["Gusto"] }), q)).toBe(false);
    });
    it("rejects the wrong category", () => {
        expect(matchSingleEvent(item({ event_category: "layoff_event" }), q)).toBe(false);
    });
    it("applies a freeform qualifier against item text", () => {
        const qq: SingleEventQuery = { ...q, event: { category: "product_launch", qualifier: "device provisioning" } };
        expect(matchSingleEvent(item(), qq)).toBe(true);
        expect(matchSingleEvent(item({ text: "deel raised money" }), qq)).toBe(false);
    });
});

describe("matchAdjacency", () => {
    const q: AdjacencyQuery = {
        type: "adjacency",
        target: { type: "company", name: "Deel" },
        relevance_threshold: 0.6
    };
    it("matches on target + relevance", () => {
        expect(matchAdjacency(item(), q)).toBe(true);
    });
    it("rejects below the relevance threshold", () => {
        expect(matchAdjacency(item({ user_relevance_score: 0.4 }), q)).toBe(false);
    });
    it("excludes configured event categories", () => {
        const qq: AdjacencyQuery = { ...q, exclude_event_categories: ["product_launch"] };
        expect(matchAdjacency(item(), qq)).toBe(false);
    });
    it("respects scope topics", () => {
        const qq: AdjacencyQuery = { ...q, scope: { topics: ["it_operations"] } };
        expect(matchAdjacency(item({ topic_tags: ["billing"] }), qq)).toBe(false);
        expect(matchAdjacency(item({ topic_tags: ["it_operations"] }), qq)).toBe(true);
    });
});

describe("aggregation", () => {
    const q: AggregationQuery = {
        type: "aggregation",
        event: { category: "product_launch" },
        min_count: 2,
        window_days: 30,
        window_type: "rolling",
        filters: {},
        target: { type: "companies", names: ["Deel", "Rippling", "Remote"], logic: "any" }
    };
    it("counts matching items, distinct by id, and fires at min_count", () => {
        const items = [
            item({ enriched_id: "a", companies: ["Deel"] }),
            item({ enriched_id: "b", companies: ["Rippling"] })
        ];
        expect(items.every((i) => aggregationItemMatches(i, q))).toBe(true);
        expect(aggregationFires(items, q)).toEqual({ count: 2, fires: true });
    });
    it("does not double-count the same enriched id", () => {
        const dup = item({ enriched_id: "a" });
        expect(aggregationFires([dup, dup], q).count).toBe(1);
    });
    it("excludes companies in the exclude filter", () => {
        const qq: AggregationQuery = { ...q, filters: { exclude_companies: ["Deel"] } };
        expect(aggregationItemMatches(item({ companies: ["Deel"] }), qq)).toBe(false);
    });
    it("respects a role_pattern filter for exec aggregations", () => {
        const qq: AggregationQuery = {
            ...q,
            event: { category: "exec_move" },
            filters: { role_pattern: "vp.*sales" }
        };
        const hit = item({ event_category: "exec_move", exec_move_role: "VP of Sales", exec_move_company: "Deel" });
        const miss = item({ event_category: "exec_move", exec_move_role: "Designer", exec_move_company: "Deel" });
        expect(aggregationItemMatches(hit, qq)).toBe(true);
        expect(aggregationItemMatches(miss, qq)).toBe(false);
    });
});

describe("withinWindow", () => {
    it("includes recent items and excludes old ones", () => {
        expect(withinWindow(item({ published_date: "2026-05-20T12:00:00Z" }), 30, NOW)).toBe(true);
        expect(withinWindow(item({ published_date: "2026-01-01T12:00:00Z" }), 30, NOW)).toBe(false);
    });
    it("counts undated items conservatively", () => {
        expect(withinWindow(item({ published_date: null }), 30, NOW)).toBe(true);
    });
});

describe("evaluateThreshold", () => {
    it("growth_pct against baseline", () => {
        const q: ThresholdQuery = {
            type: "threshold",
            metric: { source: "wikipedia_pageviews", target: "x", metric_type: "growth_pct" },
            comparison: "greater_than_or_equal",
            value: 0.5,
            window_days: 60,
            baseline: { type: "previous_window", window_days: 60 }
        };
        expect(evaluateThreshold(150, 100, q)).toBe(true); // +50%
        expect(evaluateThreshold(120, 100, q)).toBe(false); // +20%
    });
    it("raw_count comparison", () => {
        const q: ThresholdQuery = {
            type: "threshold",
            metric: { source: "hn_algolia_count", target: "x", metric_type: "raw_count" },
            comparison: "greater_than_or_equal",
            value: 10,
            window_days: 7,
            baseline: { type: "fixed_value", value: 0 }
        };
        expect(evaluateThreshold(12, 0, q)).toBe(true);
        expect(evaluateThreshold(8, 0, q)).toBe(false);
    });
});

describe("evaluateSilence", () => {
    const q: SilenceQuery = {
        type: "silence",
        target: { type: "source", source_type: "company_blog", company: "Rippling" },
        silence_days: 30,
        reset_on_activity: true
    };
    it("fires when quiet past the threshold", () => {
        expect(evaluateSilence(45, q)).toBe(true);
        expect(evaluateSilence(20, q)).toBe(false);
    });
    it("fires when there's never been activity", () => {
        expect(evaluateSilence(null, q)).toBe(true);
    });
});
