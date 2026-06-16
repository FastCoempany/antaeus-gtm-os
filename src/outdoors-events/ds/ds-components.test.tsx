import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import {
    allEvents,
    composerOpen,
    latestRun,
    loaded,
    setEvents
} from "../state";
import type { OutdoorsEvent } from "../lib/types";
import { relativeTime, runStatusLabel, runStatusTone, tierTone } from "./lib/adapters";
import { DiscoveryConsoleDS } from "./components/DiscoveryConsoleDS";
import { EventListDS } from "./components/EventListDS";
import { EventComposerDS } from "./components/EventComposerDS";
import { OutdoorsEventsDS } from "./OutdoorsEventsDS";

function ev(over: Partial<OutdoorsEvent> = {}): OutdoorsEvent {
    return {
        id: "e1",
        name: "RSA Conference 2026",
        kind: "conference",
        whereAt: "San Francisco, CA",
        startDate: "2026-04-20",
        endDate: "2026-04-23",
        status: "watching",
        tags: ["security"],
        notes: null,
        sourceUrl: "https://example.com",
        createdAt: "",
        updatedAt: "",
        relevanceTier: "direct",
        relevanceReason: "About your exact category.",
        discoveredAt: "",
        sourceKind: "discovery_run",
        ...over
    };
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    allEvents.value = [];
    loaded.value = false;
    latestRun.value = null;
    composerOpen.value = false;
});

describe("adapters", () => {
    it("tones the relevance tiers", () => {
        expect(tierTone("direct")).toBe("amber");
        expect(tierTone("adjacent")).toBe("blue");
        expect(tierTone("indirect")).toBe("green");
    });
    it("labels + tones the run status", () => {
        expect(runStatusLabel("completed")).toBe("Last run");
        expect(runStatusLabel("failed")).toBe("Last run failed");
        expect(runStatusTone("completed")).toBe("green");
        expect(runStatusTone("failed")).toBe("red");
    });
    it("formats relative time", () => {
        expect(relativeTime(null)).toBe("");
        expect(relativeTime(new Date().toISOString())).toBe("just now");
    });
});

describe("DiscoveryConsoleDS", () => {
    it("renders the run action; shows the last-run summary when present", () => {
        const first = render(<DiscoveryConsoleDS />);
        expect(first.getByText("Run discovery now")).not.toBeNull();
        cleanup();

        latestRun.value = {
            id: "r1",
            status: "completed",
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            eventsWritten: 5,
            totalCostUsd: 0.42,
            errorSummary: null
        };
        const second = render(<DiscoveryConsoleDS />);
        expect(second.container.querySelector(".oed-console__run")).not.toBeNull();
        expect(second.getByText("Last run")).not.toBeNull();
    });
});

describe("EventListDS", () => {
    it("renders the directional empty state when discovery hasn't run", () => {
        loaded.value = true;
        const { container } = render(<EventListDS />);
        expect(container.querySelector(".ds-empty")).not.toBeNull();
    });

    it("groups events by relevance tier with a Ribbon per tier", () => {
        loaded.value = true;
        setEvents([
            ev({ id: "e1", relevanceTier: "direct" }),
            ev({ id: "e2", name: "FinTech Mixer", relevanceTier: "adjacent" }),
            ev({ id: "e3", name: "Local meetup", relevanceTier: null })
        ]);
        const { container, getAllByText } = render(<EventListDS />);
        const ribbons = container.querySelectorAll(".ds-ribbon");
        // Direct + Adjacent + "Added by hand" (the untiered)
        expect(ribbons.length).toBe(3);
        expect(getAllByText("Direct").length).toBeGreaterThan(0);
    });
});

describe("EventComposerDS", () => {
    it("is demoted to a closed add-by-hand affordance, then opens the form", () => {
        const { getByText, container } = render(<EventComposerDS />);
        expect(getByText("+ Add one by hand")).not.toBeNull();
        expect(container.querySelector(".oed-composer__grid")).toBeNull();
        fireEvent.click(getByText("+ Add one by hand"));
        expect(composerOpen.value).toBe(true);
    });
});

describe("OutdoorsEventsDS", () => {
    it("mounts the wayfinder, the console, the list, and the composer — no pulling cell", () => {
        loaded.value = true;
        setEvents([ev()]);
        const { container } = render(<OutdoorsEventsDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        // the dominant action is in-room (Run discovery), not a cross-room pull
        expect(container.querySelector(".ds-wayfinder__pulling")).toBeNull();
        expect(container.querySelector(".oed-console")).not.toBeNull();
        expect(container.querySelector(".oed-list")).not.toBeNull();
        expect(container.querySelector(".oed-composer__closed")).not.toBeNull();
    });
});
