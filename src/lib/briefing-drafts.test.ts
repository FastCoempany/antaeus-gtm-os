import { describe, it, expect, beforeEach } from "vitest";
import {
    BRIEFING_DRAFTS_KEY,
    clearAllBriefingDrafts,
    clearBriefingDraft,
    loadBriefingDrafts,
    roomLabelForPath,
    type BriefingDraftBreadcrumb
} from "./briefing-drafts";

describe("briefing-drafts", () => {
    beforeEach(() => {
        window.localStorage.removeItem(BRIEFING_DRAFTS_KEY);
    });

    it("loadBriefingDrafts: returns [] on empty storage", () => {
        expect(loadBriefingDrafts()).toEqual([]);
    });

    it("loadBriefingDrafts: returns [] on malformed JSON", () => {
        window.localStorage.setItem(BRIEFING_DRAFTS_KEY, "{not json");
        expect(loadBriefingDrafts()).toEqual([]);
    });

    it("loadBriefingDrafts: skips malformed rows but keeps valid ones", () => {
        const valid: BriefingDraftBreadcrumb = {
            label: "Refresh Phase 4",
            rationale: "AI fallback policy required",
            section: "Phase 4",
            action: "refresh",
            targetId: null,
            patternId: "pat_abc",
            roomPath: "/discovery-studio/",
            acknowledgedAt: "2026-06-01T15:00:00Z"
        };
        window.localStorage.setItem(
            BRIEFING_DRAFTS_KEY,
            JSON.stringify([
                valid,
                {},
                { label: "", roomPath: "/x", acknowledgedAt: "z" },
                "not an object"
            ])
        );
        const out = loadBriefingDrafts();
        expect(out).toHaveLength(1);
        expect(out[0]!.label).toBe("Refresh Phase 4");
    });

    it("loadBriefingDrafts: returns newest first", () => {
        window.localStorage.setItem(
            BRIEFING_DRAFTS_KEY,
            JSON.stringify([
                {
                    label: "Older",
                    roomPath: "/x",
                    acknowledgedAt: "2026-05-01T00:00:00Z"
                },
                {
                    label: "Newer",
                    roomPath: "/x",
                    acknowledgedAt: "2026-06-01T00:00:00Z"
                }
            ])
        );
        const out = loadBriefingDrafts();
        expect(out[0]!.label).toBe("Newer");
        expect(out[1]!.label).toBe("Older");
    });

    it("clearBriefingDraft: removes by (roomPath, label, acknowledgedAt)", () => {
        const a = {
            label: "A",
            roomPath: "/x",
            acknowledgedAt: "2026-06-01T01:00:00Z"
        };
        const b = {
            label: "B",
            roomPath: "/x",
            acknowledgedAt: "2026-06-01T02:00:00Z"
        };
        window.localStorage.setItem(
            BRIEFING_DRAFTS_KEY,
            JSON.stringify([a, b])
        );
        clearBriefingDraft("/x", "A", "2026-06-01T01:00:00Z");
        const out = loadBriefingDrafts();
        expect(out).toHaveLength(1);
        expect(out[0]!.label).toBe("B");
    });

    it("clearAllBriefingDrafts: removes everything", () => {
        window.localStorage.setItem(
            BRIEFING_DRAFTS_KEY,
            JSON.stringify([
                {
                    label: "x",
                    roomPath: "/y",
                    acknowledgedAt: "2026-06-01T00:00:00Z"
                }
            ])
        );
        clearAllBriefingDrafts();
        expect(loadBriefingDrafts()).toEqual([]);
    });

    it("roomLabelForPath: maps known rooms", () => {
        expect(roomLabelForPath("/discovery-studio/")).toBe("Discovery Studio");
        expect(roomLabelForPath("/call-planner/")).toBe("Call Planner");
        expect(roomLabelForPath("/outbound-studio/")).toBe("Outbound Studio");
        expect(roomLabelForPath("/deal-workspace/")).toBe("Deal Workspace");
    });

    it("roomLabelForPath: falls back to a sensible label for unknown paths", () => {
        expect(roomLabelForPath("/some-other-room/")).toBe("some other room/");
    });
});
