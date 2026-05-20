import { describe, expect, it } from "vitest";
import {
    compareObservationsForDisplay,
    rowToObservation,
    type ObservationView
} from "./types";

function makeView(overrides: Partial<ObservationView> = {}): ObservationView {
    return {
        id: "obs-1",
        workspaceId: "ws-1",
        writtenAt: "2026-05-19T12:00:00Z",
        observationText: "Meridian is your most active account this week.",
        relatedObjectType: "account",
        relatedObjectId: "acct-1",
        sourceGenerator: "phase-b/signal-decay",
        confidence: "high",
        status: "active",
        supersededBy: null,
        dismissedAt: null,
        dismissedReason: null,
        ...overrides
    };
}

describe("rowToObservation", () => {
    it("converts a valid row to a typed view", () => {
        const out = rowToObservation({
            id: "obs-1",
            workspace_id: "ws-1",
            written_at: "2026-05-19T12:00:00Z",
            observation_text: "A real sentence the system wrote.",
            related_object_type: "deal",
            related_object_id: "deal-9",
            source_generator: "phase-b/champion-pattern",
            confidence: "medium",
            status: "active",
            superseded_by: null,
            dismissed_at: null,
            dismissed_reason: null
        });
        expect(out.workspaceId).toBe("ws-1");
        expect(out.relatedObjectType).toBe("deal");
        expect(out.confidence).toBe("medium");
        expect(out.status).toBe("active");
    });

    it("falls back to null relatedObjectType on invalid enum value", () => {
        const out = rowToObservation({
            id: "obs-1",
            workspace_id: "ws-1",
            written_at: "2026-05-19T12:00:00Z",
            observation_text: "x",
            related_object_type: "made-up-type",
            related_object_id: "x",
            source_generator: "g",
            confidence: null,
            status: "active",
            superseded_by: null,
            dismissed_at: null,
            dismissed_reason: null
        });
        expect(out.relatedObjectType).toBeNull();
    });

    it("falls back to active status on invalid status value (defensive)", () => {
        const out = rowToObservation({
            id: "obs-1",
            workspace_id: "ws-1",
            written_at: "2026-05-19T12:00:00Z",
            observation_text: "x",
            related_object_type: null,
            related_object_id: null,
            source_generator: "g",
            confidence: null,
            status: "made-up-status",
            superseded_by: null,
            dismissed_at: null,
            dismissed_reason: null
        });
        expect(out.status).toBe("active");
    });

    it("falls back to null confidence on invalid value", () => {
        const out = rowToObservation({
            id: "obs-1",
            workspace_id: "ws-1",
            written_at: "2026-05-19T12:00:00Z",
            observation_text: "x",
            related_object_type: null,
            related_object_id: null,
            source_generator: "g",
            confidence: "very-high",
            status: "active",
            superseded_by: null,
            dismissed_at: null,
            dismissed_reason: null
        });
        expect(out.confidence).toBeNull();
    });

    it("preserves dismissed_at + dismissed_reason on dismissed rows", () => {
        const out = rowToObservation({
            id: "obs-1",
            workspace_id: "ws-1",
            written_at: "2026-05-19T12:00:00Z",
            observation_text: "x",
            related_object_type: null,
            related_object_id: null,
            source_generator: "g",
            confidence: null,
            status: "dismissed",
            superseded_by: null,
            dismissed_at: "2026-05-20T08:00:00Z",
            dismissed_reason: "Not relevant anymore"
        });
        expect(out.status).toBe("dismissed");
        expect(out.dismissedAt).toBe("2026-05-20T08:00:00Z");
        expect(out.dismissedReason).toBe("Not relevant anymore");
    });
});

describe("compareObservationsForDisplay", () => {
    it("puts high-confidence before medium before low", () => {
        const high = makeView({ id: "h", confidence: "high" });
        const medium = makeView({ id: "m", confidence: "medium" });
        const low = makeView({ id: "l", confidence: "low" });
        const sorted = [low, high, medium].slice().sort(compareObservationsForDisplay);
        expect(sorted.map((o) => o.id)).toEqual(["h", "m", "l"]);
    });

    it("puts null confidence at the bottom", () => {
        const high = makeView({ id: "h", confidence: "high" });
        const noConfidence = makeView({ id: "n", confidence: null });
        const sorted = [noConfidence, high].slice().sort(compareObservationsForDisplay);
        expect(sorted.map((o) => o.id)).toEqual(["h", "n"]);
    });

    it("breaks confidence ties by writtenAt newest-first", () => {
        const a = makeView({
            id: "a",
            confidence: "high",
            writtenAt: "2026-05-19T12:00:00Z"
        });
        const b = makeView({
            id: "b",
            confidence: "high",
            writtenAt: "2026-05-20T12:00:00Z"
        });
        const sorted = [a, b].slice().sort(compareObservationsForDisplay);
        expect(sorted.map((o) => o.id)).toEqual(["b", "a"]);
    });
});
