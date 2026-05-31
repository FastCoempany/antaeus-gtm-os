import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    DEFAULT_DECAY_THRESHOLD,
    DEAL_DECAY_GENERATOR_ID,
    THRESHOLD_STORAGE_KEY,
    filterByDecayThreshold,
    loadStoredThreshold,
    parseDealDecayDays,
    saveStoredThreshold
} from "./week-reads-filter";
import type { ObservationView } from "@/lib/observations/types";

function obs(over: Partial<ObservationView> = {}): ObservationView {
    return {
        id: over.id ?? "o_1",
        workspaceId: "ws-1",
        writtenAt: "2026-05-31",
        observationText:
            over.observationText ??
            "Acme has been at negotiation for 21 days with no dated next step.",
        relatedObjectType: over.relatedObjectType ?? "deal",
        relatedObjectId: over.relatedObjectId ?? "d_1",
        sourceGenerator: over.sourceGenerator ?? DEAL_DECAY_GENERATOR_ID,
        confidence: "high",
        status: "active",
        supersededBy: null,
        dismissedAt: null,
        dismissedReason: null
    };
}

describe("parseDealDecayDays", () => {
    it("extracts day count from canonical phrasing", () => {
        expect(
            parseDealDecayDays("Acme has been at negotiation for 21 days …")
        ).toBe(21);
    });

    it("handles singular 'day' too", () => {
        expect(parseDealDecayDays("Acme has been at prospect for 1 day …")).toBe(
            1
        );
    });

    it("returns null when no match", () => {
        expect(parseDealDecayDays("No day count here.")).toBeNull();
    });
});

describe("filterByDecayThreshold", () => {
    it("keeps deal-decay rows at or above the threshold", () => {
        const rows = [
            obs({ id: "a", observationText: "Acme … for 21 days …" }),
            obs({ id: "b", observationText: "Acme … for 14 days …" })
        ];
        expect(filterByDecayThreshold(rows, 14).map((r) => r.id)).toEqual([
            "a",
            "b"
        ]);
    });

    it("drops deal-decay rows below the threshold", () => {
        const rows = [
            obs({ id: "a", observationText: "Acme … for 10 days …" }),
            obs({ id: "b", observationText: "Acme … for 14 days …" })
        ];
        expect(filterByDecayThreshold(rows, 14).map((r) => r.id)).toEqual(["b"]);
    });

    it("toggle to 7 lets through more rows", () => {
        const rows = [
            obs({ id: "a", observationText: "Acme … for 7 days …" }),
            obs({ id: "b", observationText: "Acme … for 21 days …" })
        ];
        expect(filterByDecayThreshold(rows, 7).map((r) => r.id)).toEqual([
            "a",
            "b"
        ]);
    });

    it("never filters non-deal-decay generators", () => {
        const rows = [
            obs({
                id: "sig",
                sourceGenerator: "phase-b/signal-decay",
                observationText: "Acme has been silent for 30 days …"
            }),
            obs({
                id: "rhy",
                sourceGenerator: "phase-b/discovery-rhythm",
                observationText: "No discovery calls in the last 7 days. …"
            })
        ];
        expect(filterByDecayThreshold(rows, 14).map((r) => r.id)).toEqual([
            "sig",
            "rhy"
        ]);
    });

    it("keeps deal-decay rows when the day count is unparseable (defensive)", () => {
        const rows = [
            obs({
                id: "weird",
                observationText: "A deal stalled — something happened."
            })
        ];
        expect(filterByDecayThreshold(rows, 14).map((r) => r.id)).toEqual([
            "weird"
        ]);
    });
});

describe("loadStoredThreshold / saveStoredThreshold", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns DEFAULT_DECAY_THRESHOLD when nothing is stored", () => {
        expect(loadStoredThreshold()).toBe(DEFAULT_DECAY_THRESHOLD);
    });

    it("round-trips 7 and 14", () => {
        saveStoredThreshold(7);
        expect(loadStoredThreshold()).toBe(7);
        saveStoredThreshold(14);
        expect(loadStoredThreshold()).toBe(14);
    });

    it("ignores garbage stored values", () => {
        localStorage.setItem(THRESHOLD_STORAGE_KEY, "garbage");
        expect(loadStoredThreshold()).toBe(DEFAULT_DECAY_THRESHOLD);
    });

    it("ignores numeric values outside the allowed set", () => {
        localStorage.setItem(THRESHOLD_STORAGE_KEY, "30");
        expect(loadStoredThreshold()).toBe(DEFAULT_DECAY_THRESHOLD);
    });
});
