import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/preact";
import { EventList } from "./EventList";
import { setEvents, __resetOutdoorsEventsStateForTests } from "../state";
import type { OutdoorsEvent } from "../lib/types";

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

describe("EventList", () => {
    beforeEach(() => {
        __resetOutdoorsEventsStateForTests();
    });

    it("renders the loading state before load completes", () => {
        const { container } = render(<EventList />);
        expect(container.querySelector(".oe-list--loading")).not.toBeNull();
    });

    it("renders the directional empty state when nothing is tracked (ADR-016 reframe)", () => {
        setEvents([]);
        const { container } = render(<EventList />);
        const empty = container.querySelector(".oe-list--empty");
        expect(empty).not.toBeNull();
        expect(empty!.textContent).toContain(
            "The system will find events worth knowing about."
        );
        expect(empty!.textContent).toContain("DISCOVERY HASN'T RUN YET");
    });

    it("groups events by relevance tier (ADR-016)", () => {
        setEvents([
            mkEvent({ id: "a", name: "RSA", relevanceTier: "direct" }),
            mkEvent({ id: "b", name: "CISO Summit", relevanceTier: "adjacent" }),
            mkEvent({ id: "c", name: "Black Hat", relevanceTier: "direct" })
        ]);
        const { container } = render(<EventList />);
        const groups = container.querySelectorAll(".oe-list__group");
        // Two tiers present (direct x2, adjacent x1); indirect empty + skipped.
        expect(groups.length).toBe(2);
        expect(container.textContent).toContain("Direct");
        expect(container.textContent).toContain("Adjacent");
        expect(container.textContent).toContain("RSA");
        expect(container.textContent).toContain("CISO Summit");
        expect(container.textContent).toContain("Black Hat");
    });

    it("collects untiered events in the 'Added by hand' bucket, rendered last", () => {
        setEvents([
            mkEvent({ id: "a", name: "RSA", relevanceTier: "direct" }),
            mkEvent({ id: "b", name: "Private dinner", relevanceTier: null })
        ]);
        const { container } = render(<EventList />);
        expect(container.textContent).toContain("Direct");
        expect(container.textContent).toContain("Added by hand");
        expect(container.textContent).toContain("Private dinner");
    });

    it("renders the relevance tier chip + reason when present (ADR-016)", () => {
        setEvents([
            mkEvent({
                id: "a",
                name: "DEF CON",
                relevanceTier: "direct",
                relevanceReason: "Major security industry gathering — your category."
            })
        ]);
        const { container } = render(<EventList />);
        expect(container.querySelector(".oe-row__tier--direct")).not.toBeNull();
        expect(container.textContent).toContain("Direct");
        expect(container.textContent).toContain(
            "Major security industry gathering"
        );
    });

    it("renders no tier chip when relevance_tier is null (legacy/manual)", () => {
        setEvents([
            mkEvent({
                id: "a",
                name: "Local meetup",
                relevanceTier: null
            })
        ]);
        const { container } = render(<EventList />);
        expect(container.querySelector(".oe-row__tier")).toBeNull();
    });

    it("renders event detail — kind, where, tags", () => {
        setEvents([
            mkEvent({
                id: "a",
                name: "DEF CON",
                kind: "security con",
                whereAt: "Las Vegas",
                tags: ["infosec", "CISO"]
            })
        ]);
        const { container } = render(<EventList />);
        expect(container.textContent).toContain("security con");
        expect(container.textContent).toContain("Las Vegas");
        expect(container.textContent).toContain("infosec");
        expect(container.textContent).toContain("CISO");
    });
});
