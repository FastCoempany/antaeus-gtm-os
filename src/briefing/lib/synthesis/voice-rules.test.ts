import { describe, it, expect } from "vitest";
import {
    countHedgingAdverbs,
    countWholeWord,
    findBannedHedgeConstructions,
    findBannedVocabulary,
    findMarketingSoup,
    wordCount
} from "./voice-rules";

describe("countWholeWord", () => {
    it("matches whole words case-insensitively", () => {
        expect(countWholeWord("Seamless and SEAMLESS again", "seamless")).toBe(2);
    });
    it("respects word boundaries", () => {
        expect(countWholeWord("the platform performed", "transform")).toBe(0);
        expect(countWholeWord("Maya maybe stayed", "may")).toBe(0);
    });
    it("handles hyphenated terms", () => {
        expect(countWholeWord("a game-changing move", "game-changing")).toBe(1);
    });
    it("returns 0 for empty inputs", () => {
        expect(countWholeWord("", "may")).toBe(0);
        expect(countWholeWord("text", "")).toBe(0);
    });
});

describe("findBannedVocabulary", () => {
    it("finds multiple hits", () => {
        const hits = findBannedVocabulary("a seamless, robust, world-class result");
        expect(hits).toContain("seamless");
        expect(hits).toContain("robust");
        expect(hits).toContain("world-class");
    });
    it("returns empty for clean text", () => {
        expect(findBannedVocabulary("a direct, complete, effective result")).toEqual([]);
    });
});

describe("findBannedHedgeConstructions", () => {
    it("detects throat-clearing phrases", () => {
        expect(findBannedHedgeConstructions("It's worth noting that this is small")).toEqual([
            "it's worth noting that"
        ]);
    });
    it("returns empty when none present", () => {
        expect(findBannedHedgeConstructions("Confidence high. Multi-source.")).toEqual([]);
    });
});

describe("findMarketingSoup", () => {
    it("catches stock openers", () => {
        expect(findMarketingSoup("In today's market, things move fast").length).toBeGreaterThan(0);
    });
});

describe("countHedgingAdverbs", () => {
    it("sums across the adverb set", () => {
        expect(countHedgingAdverbs("This may or might possibly happen")).toBe(3);
    });
    it("does not count substrings", () => {
        expect(countHedgingAdverbs("Maya appears in the report")).toBe(1); // only "appears"
    });
});

describe("wordCount", () => {
    it("splits on whitespace", () => {
        expect(wordCount("one two three")).toBe(3);
    });
    it("handles leading/trailing whitespace and empties", () => {
        expect(wordCount("  hello   world  ")).toBe(2);
        expect(wordCount("")).toBe(0);
        expect(wordCount("   ")).toBe(0);
    });
});
