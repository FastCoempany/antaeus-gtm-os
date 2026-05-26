import { describe, expect, it } from "vitest";
import {
    clusterItems,
    computeItemWeight,
    evaluateCluster,
    groupIntoCandidates,
    inverseVolumeFactor,
    recencyFactor,
    sourceConfig,
    type ClusterableItem
} from "./core";

const NOW = "2026-05-23T12:00:00Z";

function item(overrides: Partial<ClusterableItem> = {}): ClusterableItem {
    return {
        enriched_id: `e-${Math.random().toString(36).slice(2, 8)}`,
        source_id: "techcrunch_rss",
        published_date: "2026-05-22T12:00:00Z",
        fetched_at: "2026-05-22T12:00:00Z",
        companies: ["Acme"],
        exec_move_company: null,
        event_category: "funding",
        topic_tags: ["funding"],
        pain_tags: [],
        user_relevance_score: 0.5,
        is_noise: false,
        ...overrides
    };
}

describe("sourceConfig", () => {
    it("returns config for known sources", () => {
        expect(sourceConfig("techcrunch_rss").src_conf).toBe(0.78);
        expect(sourceConfig("pr_newswire_personnel").src_conf).toBe(0.86);
    });

    it("falls back to default for unknown sources", () => {
        expect(sourceConfig("nonexistent").src_conf).toBe(0.6);
    });

    it("routes sc:<outlet> source ids to the curated high-confidence config", () => {
        expect(sourceConfig("sc:reuters").src_conf).toBe(0.82);
        expect(sourceConfig("sc:reuters").baseline_volume_per_day).toBe(0.6);
        expect(sourceConfig("sc:techcrunch")).toBe(sourceConfig("sc:bloomberg"));
        // A recent curated signal carries strong weight: three of them
        // clear the Σ≥3.0 pain/narrative evidence gate.
        const cfg = sourceConfig("sc:pe-hub");
        expect(cfg.src_conf).toBeGreaterThan(0.7);
    });
});

describe("inverseVolumeFactor", () => {
    it("clamps high-volume sources to the floor", () => {
        // baseline 12/day → log(1 + 5/12) ≈ 0.35 → at the floor
        expect(inverseVolumeFactor(12)).toBeCloseTo(0.35, 2);
    });

    it("clamps low-volume sources to the ceiling", () => {
        // baseline 0.2/day → log(1 + 25) ≈ 3.26 → clamped to 3.0
        expect(inverseVolumeFactor(0.2)).toBe(3.0);
    });

    it("produces mid-range values for moderate baselines", () => {
        // baseline 0.3/day → log(1 + 16.67) ≈ 2.87
        expect(inverseVolumeFactor(0.3)).toBeCloseTo(2.87, 1);
    });

    it("guards against zero baseline", () => {
        expect(inverseVolumeFactor(0)).toBe(3.0); // huge factor, clamped
    });
});

describe("recencyFactor", () => {
    it("is near 1.0 for items published now", () => {
        expect(recencyFactor(NOW, NOW)).toBeCloseTo(1.0, 2);
    });

    it("decays with age (half-life ~9.7 days at tau=14)", () => {
        const sevenDaysAgo = "2026-05-16T12:00:00Z";
        // exp(-7/14) = exp(-0.5) ≈ 0.607
        expect(recencyFactor(sevenDaysAgo, NOW)).toBeCloseTo(0.607, 2);
    });

    it("falls back to ~1-week-old assumption for null date", () => {
        expect(recencyFactor(null, NOW)).toBeCloseTo(Math.exp(-0.5), 2);
    });

    it("handles malformed dates gracefully", () => {
        expect(recencyFactor("not-a-date", NOW)).toBeCloseTo(Math.exp(-0.5), 2);
    });

    it("clamps negative age (future-dated items) to recency 1.0", () => {
        const future = "2026-06-01T12:00:00Z";
        expect(recencyFactor(future, NOW)).toBe(1);
    });
});

describe("computeItemWeight", () => {
    it("matches the walkthrough's PR Newswire exec-move weight (~1.33)", () => {
        // From walkthrough §2.5 CL-002: SRC_CONF 0.86, baseline 0.5,
        // snr 0.74, item published 2 days before now.
        const prItem = item({
            source_id: "pr_newswire_personnel",
            published_date: "2026-05-21T12:00:00Z" // 2 days before NOW
        });
        const weight = computeItemWeight(prItem, NOW);
        // 0.86 × ~2.40 × 0.74 × exp(-2/14) ≈ 1.32
        expect(weight).toBeCloseTo(1.32, 1);
    });

    it("high-volume low-conf sources produce small weights", () => {
        const hnItem = item({
            source_id: "hn_algolia",
            published_date: NOW
        });
        // 0.62 × 0.35 × 0.58 × 1.0 ≈ 0.126
        expect(computeItemWeight(hnItem, NOW)).toBeLessThan(0.2);
    });
});

describe("groupIntoCandidates", () => {
    it("groups items by shared pain_tag", () => {
        const items = [
            item({ pain_tags: ["pricing-pressure"] }),
            item({ pain_tags: ["pricing-pressure"] }),
            item({ pain_tags: ["other"] })
        ];
        const candidates = groupIntoCandidates(items);
        const painClusters = candidates.filter((c) => c.cluster_type === "pain_tag");
        const pressureCluster = painClusters.find((c) => c.anchor === "pricing-pressure");
        expect(pressureCluster?.items).toHaveLength(2);
    });

    it("groups exec_move items by company", () => {
        const items = [
            item({ exec_move_company: "Hightouch" }),
            item({ exec_move_company: "Hightouch" }),
            item({ exec_move_company: null })
        ];
        const candidates = groupIntoCandidates(items);
        const execClusters = candidates.filter((c) => c.cluster_type === "exec_move");
        expect(execClusters).toHaveLength(1);
        expect(execClusters[0]?.items).toHaveLength(2);
    });

    it("groups narrative_shift by topic tag only when >= 2 items share it", () => {
        const items = [
            item({ topic_tags: ["funding"] }),
            item({ topic_tags: ["funding"] }),
            item({ topic_tags: ["solo-topic"] })
        ];
        const candidates = groupIntoCandidates(items);
        const narrative = candidates.filter((c) => c.cluster_type === "narrative_shift");
        expect(narrative).toHaveLength(1);
        expect(narrative[0]?.anchor).toBe("funding");
    });

    it("excludes noise items from all clusters", () => {
        const items = [
            item({ pain_tags: ["x"], is_noise: true }),
            item({ pain_tags: ["x"], is_noise: false })
        ];
        const candidates = groupIntoCandidates(items);
        const painCluster = candidates.find(
            (c) => c.cluster_type === "pain_tag" && c.anchor === "x"
        );
        expect(painCluster?.items).toHaveLength(1);
    });

    it("returns empty when no items have clusterable axes", () => {
        const items = [item({ pain_tags: [], topic_tags: [], exec_move_company: null })];
        expect(groupIntoCandidates(items)).toEqual([]);
    });
});

describe("evaluateCluster — exec_move", () => {
    it("qualifies a single high-confidence-source exec_move (PR Newswire)", () => {
        const candidate = {
            cluster_type: "exec_move" as const,
            anchor: "hightouch",
            items: [
                item({
                    source_id: "pr_newswire_personnel",
                    exec_move_company: "Hightouch",
                    published_date: "2026-05-21T12:00:00Z"
                })
            ]
        };
        const evalResult = evaluateCluster(candidate, {
            nowIso: NOW,
            workspaceConfigured: false
        });
        expect(evalResult.qualifies).toBe(true);
        expect(evalResult.weighted_evidence).toBeGreaterThanOrEqual(1.0);
    });

    it("rejects a single low-confidence-source exec_move on the evidence gate", () => {
        // An HN item (SRC_CONF 0.62, baseline 12 → vol factor floored
        // at 0.35) can't reach the 1.0 evidence bar, so it fails on
        // evidence before the source-conf gate even applies. This is
        // the real-config behavior: low-conf sources are also high-
        // volume, so their per-item weight is structurally small.
        const candidate = {
            cluster_type: "exec_move" as const,
            anchor: "acme",
            items: [
                item({
                    source_id: "hn_algolia", // SRC_CONF 0.62 < 0.7
                    exec_move_company: "Acme",
                    published_date: NOW
                })
            ]
        };
        const evalResult = evaluateCluster(candidate, {
            nowIso: NOW,
            workspaceConfigured: false
        });
        expect(evalResult.qualifies).toBe(false);
        expect(evalResult.reason).toContain("evidence");
        expect(evalResult.reason).toContain("< 1");
    });
});

describe("evaluateCluster — pain_tag / narrative_shift", () => {
    it("rejects a single-source cluster on distinct_sources gate", () => {
        // 4 TC items — strong evidence but all one source.
        const items = Array.from({ length: 4 }, () =>
            item({
                source_id: "techcrunch_rss",
                pain_tags: ["x"],
                published_date: NOW,
                user_relevance_score: 0.9
            })
        );
        const candidate = { cluster_type: "pain_tag" as const, anchor: "x", items };
        const evalResult = evaluateCluster(candidate, {
            nowIso: NOW,
            workspaceConfigured: false
        });
        expect(evalResult.qualifies).toBe(false);
        expect(evalResult.reason).toContain("sources 1 < 2");
    });

    it("qualifies a multi-source high-evidence cluster (waived relevance gate)", () => {
        // Mix of low-volume high-weight sources to clear the 3.0 evidence bar.
        const items = [
            item({ source_id: "html_diff", companies: ["A"], pain_tags: ["x"], published_date: NOW }),
            item({ source_id: "wikipedia_pageviews", companies: ["B"], pain_tags: ["x"], published_date: NOW }),
            item({ source_id: "pr_newswire_personnel", companies: ["C"], pain_tags: ["x"], published_date: NOW })
        ];
        const candidate = { cluster_type: "pain_tag" as const, anchor: "x", items };
        const evalResult = evaluateCluster(candidate, {
            nowIso: NOW,
            workspaceConfigured: false
        });
        expect(evalResult.distinct_sources).toBe(3);
        expect(evalResult.distinct_accounts).toBe(3);
        expect(evalResult.weighted_evidence).toBeGreaterThanOrEqual(3.0);
        expect(evalResult.qualifies).toBe(true);
    });

    it("applies the 0.7 relevance gate when workspace IS configured", () => {
        const items = [
            item({ source_id: "html_diff", companies: ["A"], pain_tags: ["x"], published_date: NOW, user_relevance_score: 0.5 }),
            item({ source_id: "wikipedia_pageviews", companies: ["B"], pain_tags: ["x"], published_date: NOW, user_relevance_score: 0.5 }),
            item({ source_id: "pr_newswire_personnel", companies: ["C"], pain_tags: ["x"], published_date: NOW, user_relevance_score: 0.5 })
        ];
        const candidate = { cluster_type: "pain_tag" as const, anchor: "x", items };
        const evalResult = evaluateCluster(candidate, {
            nowIso: NOW,
            workspaceConfigured: true
        });
        // All relevance 0.5 < 0.7 gate → rejected even though evidence + sources pass.
        expect(evalResult.qualifies).toBe(false);
        expect(evalResult.reason).toContain("max relevance 0.50 < 0.7");
    });

    it("rejects on distinct_accounts when all items share one company", () => {
        const items = [
            item({ source_id: "html_diff", companies: ["OnlyCo"], pain_tags: ["x"], published_date: NOW }),
            item({ source_id: "wikipedia_pageviews", companies: ["OnlyCo"], pain_tags: ["x"], published_date: NOW }),
            item({ source_id: "pr_newswire_personnel", companies: ["OnlyCo"], pain_tags: ["x"], published_date: NOW })
        ];
        const candidate = { cluster_type: "pain_tag" as const, anchor: "x", items };
        const evalResult = evaluateCluster(candidate, {
            nowIso: NOW,
            workspaceConfigured: false
        });
        expect(evalResult.qualifies).toBe(false);
        expect(evalResult.reason).toContain("accounts 1 < 2");
    });
});

describe("clusterItems — end to end", () => {
    it("returns evaluations for every candidate (qualifying + rejected)", () => {
        const items = [
            item({ source_id: "pr_newswire_personnel", exec_move_company: "Hightouch", companies: ["Hightouch"], published_date: NOW }),
            item({ source_id: "techcrunch_rss", topic_tags: ["funding"], companies: ["A"], published_date: NOW }),
            item({ source_id: "techcrunch_rss", topic_tags: ["funding"], companies: ["B"], published_date: NOW })
        ];
        const evals = clusterItems(items, { nowIso: NOW, workspaceConfigured: false });
        // At least the exec_move + the funding narrative candidate.
        expect(evals.length).toBeGreaterThanOrEqual(2);
        const execEval = evals.find((e) => e.cluster_type === "exec_move");
        expect(execEval?.qualifies).toBe(true);
        const narrativeEval = evals.find((e) => e.cluster_type === "narrative_shift");
        // Single-source funding narrative → rejected on distinct_sources.
        expect(narrativeEval?.qualifies).toBe(false);
    });

    it("returns empty for an all-noise item set", () => {
        const items = [item({ is_noise: true }), item({ is_noise: true })];
        expect(clusterItems(items, { nowIso: NOW, workspaceConfigured: false })).toEqual([]);
    });
});
