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
        updatedAt: "2026-06-01T00:00:00Z"
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

    it("renders the directional empty state when nothing is tracked", () => {
        setEvents([]);
        const { container } = render(<EventList />);
        const empty = container.querySelector(".oe-list--empty");
        expect(empty).not.toBeNull();
        expect(empty!.textContent).toContain(
            "Name the first gathering worth knowing about."
        );
    });

    it("groups events by status with the group label + count", () => {
        setEvents([
            mkEvent({ id: "a", name: "RSA", status: "watching" }),
            mkEvent({ id: "b", name: "Local mixer", status: "planning" })
        ]);
        const { container } = render(<EventList />);
        const groups = container.querySelectorAll(".oe-list__group");
        expect(groups.length).toBe(2);
        expect(container.textContent).toContain("Watching");
        expect(container.textContent).toContain("Planning");
        expect(container.textContent).toContain("RSA");
        expect(container.textContent).toContain("Local mixer");
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
