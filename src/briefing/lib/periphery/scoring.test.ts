import { describe, it, expect } from "vitest";
import {
    computeCoOccurrence,
    computeVocabOverlap,
    normalizeEntity,
    rankCandidates
} from "./scoring";
import type { ScoringItem } from "./types";

/**
 * B.4a — periphery scoring math.
 *
 * Tests cover the contract the pipeline depends on: a known off-watchlist
 * entity that appears alongside watched ones gets surfaced, and ones that
 * don't reach the co-occurrence floor don't.
 */

function item(over: Partial<ScoringItem> = {}): ScoringItem {
    return {
        id: `it-${Math.random().toString(36).slice(2, 8)}`,
        entities: [],
        pain_tags: [],
        topic_tags: [],
        ...over
    };
}

describe("normalizeEntity", () => {
    it("lowercases + trims", () => {
        expect(normalizeEntity("  Deel Inc ")).toBe("deel inc");
        expect(normalizeEntity("VENSURE")).toBe("vensure");
    });
});

describe("computeCoOccurrence", () => {
    const watched = new Set(["deel", "rippling"]);

    it("counts each item where an off-watchlist entity sits next to a watched one", () => {
        const items: ScoringItem[] = [
            item({ id: "a", entities: ["Deel", "Vensure"] }),
            item({ id: "b", entities: ["Rippling", "Vensure"] }),
            item({ id: "c", entities: ["Deel", "Vensure", "Multiplier"] })
        ];
        const co = computeCoOccurrence(items, watched);
        expect(co.get("vensure")?.count).toBe(3);
        expect(co.get("multiplier")?.count).toBe(1);
        expect(co.get("deel")).toBeUndefined();
        expect(co.get("rippling")).toBeUndefined();
    });

    it("does not count items with no watched entity present", () => {
        const items: ScoringItem[] = [
            item({ entities: ["Vensure", "Multiplier"] }),
            item({ entities: ["Gusto"] })
        ];
        const co = computeCoOccurrence(items, watched);
        expect(co.size).toBe(0);
    });

    it("records aliases for the canonical normalized name", () => {
        const items: ScoringItem[] = [
            item({ entities: ["Deel", "Vensure Inc"] }),
            item({ entities: ["Deel", "Vensure inc"] })
        ];
        const co = computeCoOccurrence(items, watched);
        const entry = co.get("vensure inc");
        expect(entry?.count).toBe(2);
        expect(Array.from(entry?.aliases ?? [])).toEqual(
            expect.arrayContaining(["Vensure Inc", "Vensure inc"])
        );
    });

    it("dedupes a candidate appearing twice in the same item", () => {
        const items: ScoringItem[] = [
            item({ id: "x", entities: ["Deel", "Vensure", "Vensure"] })
        ];
        const co = computeCoOccurrence(items, watched);
        expect(co.get("vensure")?.count).toBe(2); // counted twice — fine, both list mentions count
        expect(co.get("vensure")?.supporting_item_ids.size).toBe(1);
    });
});

describe("computeVocabOverlap", () => {
    const watched = new Set(["deel"]);

    it("counts shared pain/topic tags between non-watched items and the watched-tag set", () => {
        const items: ScoringItem[] = [
            // Watched item — establishes the watched-tag set
            item({
                entities: ["Deel"],
                pain_tags: ["compliance_burden", "global_payroll"],
                topic_tags: ["product_expansion"]
            }),
            // Off-watchlist item with full overlap (3 shared tags)
            item({
                entities: ["Vensure"],
                pain_tags: ["compliance_burden"],
                topic_tags: ["global_payroll", "product_expansion"]
            }),
            // Off-watchlist item with no overlap
            item({
                entities: ["UnrelatedCo"],
                pain_tags: ["pricing_pressure"],
                topic_tags: ["m_a"]
            })
        ];
        const vocab = computeVocabOverlap(items, watched);
        expect(vocab.get("vensure")?.overlap).toBe(3);
        expect(vocab.get("unrelatedco")).toBeUndefined();
    });

    it("returns an empty map when no items mention a watched entity", () => {
        const items: ScoringItem[] = [
            item({ entities: ["Vensure"], pain_tags: ["x"] })
        ];
        const vocab = computeVocabOverlap(items, watched);
        expect(vocab.size).toBe(0);
    });

    it("attributes overlap to every off-watchlist entity in the contributing item", () => {
        const items: ScoringItem[] = [
            item({ entities: ["Deel"], pain_tags: ["a", "b"] }),
            item({ entities: ["Vensure", "Multiplier"], pain_tags: ["a"], topic_tags: ["b"] })
        ];
        const vocab = computeVocabOverlap(items, watched);
        expect(vocab.get("vensure")?.overlap).toBe(2);
        expect(vocab.get("multiplier")?.overlap).toBe(2);
    });
});

describe("rankCandidates", () => {
    const watched = new Set(["deel", "rippling"]);

    function manyItems(entity: string, count: number, withWatched: string = "Deel"): ScoringItem[] {
        return Array.from({ length: count }, (_, i) =>
            item({ id: `${entity}-${i}`, entities: [withWatched, entity] })
        );
    }

    it("surfaces an entity above the co_min floor, hides one below", () => {
        const items: ScoringItem[] = [
            ...manyItems("Vensure", 4),
            ...manyItems("Multiplier", 2) // below default co_min=3
        ];
        const ranked = rankCandidates(items, watched);
        const names = ranked.map((c) => c.entity_name);
        expect(names).toContain("vensure");
        expect(names).not.toContain("multiplier");
    });

    it("orders by total_score desc, breaks ties by entity_name", () => {
        const items: ScoringItem[] = [
            ...manyItems("Vensure", 3),
            ...manyItems("Multiplier", 5),
            ...manyItems("Atlas", 3)
        ];
        const ranked = rankCandidates(items, watched);
        expect(ranked[0]?.entity_name).toBe("multiplier"); // highest count
        // Vensure + Atlas tie at 3 — alphabetical tiebreak: atlas before vensure
        expect(ranked[1]?.entity_name).toBe("atlas");
        expect(ranked[2]?.entity_name).toBe("vensure");
    });

    it("caps at max_candidates", () => {
        const items: ScoringItem[] = [
            ...manyItems("Vensure", 3),
            ...manyItems("Multiplier", 3),
            ...manyItems("Atlas", 3),
            ...manyItems("Gusto", 3),
            ...manyItems("Papaya", 3),
            ...manyItems("Velocity", 3)
        ];
        const ranked = rankCandidates(items, watched, { max_candidates: 3 });
        expect(ranked).toHaveLength(3);
    });

    it("includes a reasoning line that names the co-occurrence count", () => {
        const items: ScoringItem[] = manyItems("Vensure", 4);
        const [c] = rankCandidates(items, watched);
        expect(c?.reasoning).toMatch(/Appeared in 4 items alongside/);
    });

    it("mentions vocab overlap in the reasoning only when it meets vocab_min", () => {
        const items: ScoringItem[] = [
            item({ entities: ["Deel"], pain_tags: ["a", "b"] }),
            item({ entities: ["Deel", "Vensure"], pain_tags: ["a"] }),
            item({ entities: ["Deel", "Vensure"], topic_tags: ["b"] }),
            item({ entities: ["Deel", "Vensure"], pain_tags: ["a"] })
        ];
        const [c] = rankCandidates(items, watched);
        expect(c?.entity_name).toBe("vensure");
        expect(c?.vocab_overlap_score).toBeGreaterThanOrEqual(2);
        expect(c?.reasoning).toMatch(/Shares \d+ pain\/topic tag/);
    });

    it("returns [] when no candidate reaches the floor", () => {
        const items: ScoringItem[] = manyItems("Vensure", 2); // below default 3
        expect(rankCandidates(items, watched)).toEqual([]);
    });

    it("ignores empty entity strings without exploding", () => {
        const items: ScoringItem[] = [
            item({ entities: ["Deel", "", "Vensure"] }),
            item({ entities: ["Deel", "", "Vensure"] }),
            item({ entities: ["Deel", "Vensure"] })
        ];
        const ranked = rankCandidates(items, watched);
        expect(ranked.map((c) => c.entity_name)).toEqual(["vensure"]);
    });
});
