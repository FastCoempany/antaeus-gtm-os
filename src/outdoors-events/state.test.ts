import { describe, it, expect, beforeEach } from "vitest";
import {
    allEvents,
    composerError,
    composerOpen,
    draft,
    eventsByStatus,
    eventsByTier,
    openComposer,
    closeComposer,
    patchDraft,
    setEvents,
    __resetOutdoorsEventsStateForTests
} from "./state";
import type { OutdoorsEvent } from "./lib/types";

function mkEvent(over: Partial<OutdoorsEvent> = {}): OutdoorsEvent {
    return {
        id: over.id ?? "e1",
        name: over.name ?? "RSA Conference",
        kind: over.kind ?? "conference",
        whereAt: over.whereAt ?? "San Francisco, CA",
        startDate: over.startDate ?? "2026-05-01",
        endDate: over.endDate ?? "2026-05-04",
        status: over.status ?? "watching",
        tags: over.tags ?? ["security"],
        notes: over.notes ?? null,
        sourceUrl: over.sourceUrl ?? null,
        createdAt: "2026-06-01T00:00:00Z",
        updatedAt: "2026-06-01T00:00:00Z",
        relevanceTier: over.relevanceTier ?? null,
        relevanceReason: over.relevanceReason ?? null,
        discoveredAt: over.discoveredAt ?? null,
        sourceKind: over.sourceKind ?? null
    };
}

describe("outdoors-events state", () => {
    beforeEach(() => {
        __resetOutdoorsEventsStateForTests();
    });

    it("setEvents populates + marks loaded", () => {
        setEvents([mkEvent()]);
        expect(allEvents.value.length).toBe(1);
    });

    it("eventsByStatus groups in lifecycle order, skips nothing", () => {
        setEvents([
            mkEvent({ id: "a", status: "watching" }),
            mkEvent({ id: "b", status: "attended" }),
            mkEvent({ id: "c", status: "watching" })
        ]);
        const groups = eventsByStatus.value;
        // order: watching, planning, attending, attended, passed, archived
        expect(groups[0]!.status).toBe("watching");
        expect(groups[0]!.events.length).toBe(2);
        expect(groups[3]!.status).toBe("attended");
        expect(groups[3]!.events.length).toBe(1);
        // empty buckets still present in the computed (filtered at render)
        expect(groups[1]!.events.length).toBe(0);
    });

    it("openComposer resets draft + opens", () => {
        patchDraft({ name: "stale" });
        openComposer();
        expect(composerOpen.value).toBe(true);
        expect(draft.value.name).toBe("");
    });

    it("closeComposer clears state", () => {
        openComposer();
        patchDraft({ name: "x" });
        closeComposer();
        expect(composerOpen.value).toBe(false);
        expect(draft.value.name).toBe("");
        expect(composerError.value).toBeNull();
    });

    it("patchDraft merges fields", () => {
        patchDraft({ name: "Mixer", kind: "mixer" });
        patchDraft({ whereAt: "Austin" });
        expect(draft.value.name).toBe("Mixer");
        expect(draft.value.kind).toBe("mixer");
        expect(draft.value.whereAt).toBe("Austin");
    });

    // ── ADR-016 PR 2: tier grouping is the primary organizing axis ──

    it("eventsByTier groups in direct/adjacent/indirect order", () => {
        setEvents([
            mkEvent({ id: "a", relevanceTier: "adjacent" }),
            mkEvent({ id: "b", relevanceTier: "direct" }),
            mkEvent({ id: "c", relevanceTier: "indirect" }),
            mkEvent({ id: "d", relevanceTier: "direct" })
        ]);
        const { tiers } = eventsByTier.value;
        expect(tiers.map((t) => t.tier)).toEqual([
            "direct",
            "adjacent",
            "indirect"
        ]);
        expect(tiers[0]!.events.length).toBe(2);
        expect(tiers[1]!.events.length).toBe(1);
        expect(tiers[2]!.events.length).toBe(1);
    });

    it("eventsByTier routes untiered events to the trailing bucket", () => {
        setEvents([
            mkEvent({ id: "a", relevanceTier: "direct" }),
            mkEvent({ id: "b", relevanceTier: null }),
            mkEvent({ id: "c", relevanceTier: null })
        ]);
        const { tiers, untiered } = eventsByTier.value;
        expect(tiers[0]!.events.length).toBe(1);
        expect(untiered.length).toBe(2);
    });

    it("eventsByTier returns empty buckets when nothing is loaded", () => {
        setEvents([]);
        const { tiers, untiered } = eventsByTier.value;
        expect(tiers.every((t) => t.events.length === 0)).toBe(true);
        expect(untiered).toEqual([]);
    });
});
