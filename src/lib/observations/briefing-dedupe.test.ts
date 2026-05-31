import { describe, expect, it } from "vitest";
import {
    EMPTY_BRIEFING_PATTERN_INDEX,
    filterShadowedByBriefing,
    isShadowedByBriefing,
    type BriefingPatternIndex
} from "./briefing-dedupe";
import type { ObservationView } from "./types";

function obs(
    sourceGenerator: string,
    relatedObjectType: ObservationView["relatedObjectType"] = "account",
    relatedObjectId: string | null = "a_1"
): ObservationView {
    return {
        id: "o_1",
        workspaceId: "ws-1",
        writtenAt: "2026-05-31",
        observationText: "...",
        relatedObjectType,
        relatedObjectId,
        sourceGenerator,
        confidence: "high",
        status: "active",
        supersededBy: null,
        dismissedAt: null,
        dismissedReason: null
    };
}

describe("filterShadowedByBriefing", () => {
    it("is a no-op when the pattern index is empty (production today)", () => {
        const rows = [obs("phase-b/signal-decay")];
        const out = filterShadowedByBriefing(rows, EMPTY_BRIEFING_PATTERN_INDEX);
        expect(out.length).toBe(1);
    });

    it("suppresses signal_decay when a silence Pattern names the same account", () => {
        const index: BriefingPatternIndex = {
            patterns: [
                {
                    id: "p_1",
                    entityType: "account",
                    entityId: "a_1",
                    triggerClass: "silence"
                }
            ]
        };
        const out = filterShadowedByBriefing(
            [obs("phase-b/signal-decay", "account", "a_1")],
            index
        );
        expect(out.length).toBe(0);
    });

    it("does NOT suppress signal_decay when the Pattern names a different account", () => {
        const index: BriefingPatternIndex = {
            patterns: [
                {
                    id: "p_1",
                    entityType: "account",
                    entityId: "a_OTHER",
                    triggerClass: "silence"
                }
            ]
        };
        const out = filterShadowedByBriefing(
            [obs("phase-b/signal-decay", "account", "a_1")],
            index
        );
        expect(out.length).toBe(1);
    });

    it("does NOT suppress signal_decay when the Pattern has a non-shadowing trigger class", () => {
        const index: BriefingPatternIndex = {
            patterns: [
                {
                    id: "p_1",
                    entityType: "account",
                    entityId: "a_1",
                    triggerClass: "single_event" // not 'silence' — doesn't shadow
                }
            ]
        };
        const out = filterShadowedByBriefing(
            [obs("phase-b/signal-decay", "account", "a_1")],
            index
        );
        expect(out.length).toBe(1);
    });

    it("does NOT suppress deal_decay observations (Briefing doesn't shadow them)", () => {
        const index: BriefingPatternIndex = {
            patterns: [
                {
                    id: "p_1",
                    entityType: "deal",
                    entityId: "d_1",
                    triggerClass: "silence"
                }
            ]
        };
        const out = filterShadowedByBriefing(
            [obs("phase-b/deal-decay", "deal", "d_1")],
            index
        );
        expect(out.length).toBe(1);
    });

    it("does NOT suppress workspace-scoped observations (no related entity)", () => {
        const index: BriefingPatternIndex = {
            patterns: [
                {
                    id: "p_1",
                    entityType: null,
                    entityId: null,
                    triggerClass: "silence"
                }
            ]
        };
        const out = filterShadowedByBriefing(
            [obs("phase-b/discovery-rhythm", null, null)],
            index
        );
        expect(out.length).toBe(1);
    });
});

describe("isShadowedByBriefing — per-row truth", () => {
    it("returns true when generator + entity + trigger class all align", () => {
        const idx: BriefingPatternIndex = {
            patterns: [
                {
                    id: "p_1",
                    entityType: "account",
                    entityId: "a_match",
                    triggerClass: "silence"
                }
            ]
        };
        expect(
            isShadowedByBriefing(
                obs("phase-b/signal-decay", "account", "a_match"),
                idx
            )
        ).toBe(true);
    });

    it("returns false when generator isn't in the shadow map", () => {
        const idx: BriefingPatternIndex = {
            patterns: [
                {
                    id: "p_1",
                    entityType: "deal",
                    entityId: "d_match",
                    triggerClass: "silence"
                }
            ]
        };
        expect(
            isShadowedByBriefing(
                obs("phase-b/deal-decay", "deal", "d_match"),
                idx
            )
        ).toBe(false);
    });
});
