import { describe, it, expect } from "vitest";
import { joinTags, parseTags } from "./persistence";
import {
    EMPTY_DRAFT,
    isOutdoorsEventStatus,
    isOutdoorsEventTier,
    OUTDOORS_EVENT_STATUSES,
    OUTDOORS_EVENT_TIERS,
    STATUS_LABEL,
    TIER_LABEL,
    type OutdoorsEventStatus
} from "./types";

describe("outdoors-events types + helpers", () => {
    it("STATUS_LABEL covers every status", () => {
        for (const s of OUTDOORS_EVENT_STATUSES) {
            expect(STATUS_LABEL[s]).toBeTruthy();
        }
    });

    it("isOutdoorsEventStatus accepts valid + rejects invalid", () => {
        for (const s of OUTDOORS_EVENT_STATUSES) {
            expect(isOutdoorsEventStatus(s)).toBe(true);
        }
        expect(isOutdoorsEventStatus("not-a-status")).toBe(false);
        expect(isOutdoorsEventStatus("")).toBe(false);
        expect(isOutdoorsEventStatus(null)).toBe(false);
        expect(isOutdoorsEventStatus(undefined)).toBe(false);
        expect(isOutdoorsEventStatus(42)).toBe(false);
    });

    it("EMPTY_DRAFT defaults to watching", () => {
        const s: OutdoorsEventStatus = EMPTY_DRAFT.status;
        expect(s).toBe("watching");
        expect(EMPTY_DRAFT.tags).toEqual([]);
    });

    it("parseTags splits + trims + drops empties", () => {
        expect(parseTags("")).toEqual([]);
        expect(parseTags("   ")).toEqual([]);
        expect(parseTags("a")).toEqual(["a"]);
        expect(parseTags("a,b,c")).toEqual(["a", "b", "c"]);
        expect(parseTags("  a , b  , , c  ")).toEqual(["a", "b", "c"]);
        expect(parseTags("Chief Revenue Officer, Sales VP")).toEqual([
            "Chief Revenue Officer",
            "Sales VP"
        ]);
    });

    it("joinTags is the inverse round-trip", () => {
        expect(joinTags([])).toBe("");
        expect(joinTags(["a", "b"])).toBe("a, b");
        expect(parseTags(joinTags(["x", "y", "z"]))).toEqual(["x", "y", "z"]);
    });

    // ADR-016 — relevance tier helpers.

    it("OUTDOORS_EVENT_TIERS covers direct/adjacent/indirect", () => {
        expect(OUTDOORS_EVENT_TIERS).toEqual(["direct", "adjacent", "indirect"]);
        for (const t of OUTDOORS_EVENT_TIERS) {
            expect(TIER_LABEL[t]).toBeTruthy();
        }
    });

    it("isOutdoorsEventTier accepts valid + rejects invalid", () => {
        for (const t of OUTDOORS_EVENT_TIERS) {
            expect(isOutdoorsEventTier(t)).toBe(true);
        }
        expect(isOutdoorsEventTier("not-a-tier")).toBe(false);
        expect(isOutdoorsEventTier("")).toBe(false);
        expect(isOutdoorsEventTier(null)).toBe(false);
        expect(isOutdoorsEventTier(undefined)).toBe(false);
        expect(isOutdoorsEventTier(0)).toBe(false);
    });
});
