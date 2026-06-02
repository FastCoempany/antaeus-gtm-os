import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/preact";
import { DiscoveryConsole } from "./DiscoveryConsole";
import {
    discoveryBusy,
    discoveryError,
    latestRun,
    __resetOutdoorsEventsStateForTests
} from "../state";

describe("DiscoveryConsole", () => {
    beforeEach(() => {
        __resetOutdoorsEventsStateForTests();
    });

    it("renders the run-now button and a directional hint", () => {
        const { container } = render(<DiscoveryConsole />);
        const btn = container.querySelector(
            ".oe-console__run-btn"
        ) as HTMLButtonElement | null;
        expect(btn).not.toBeNull();
        expect(btn!.textContent).toContain("Run discovery now");
        expect(container.textContent).toContain("product category");
    });

    it("disables the button + shows progress copy while discovery is running", () => {
        discoveryBusy.value = true;
        const { container } = render(<DiscoveryConsole />);
        const btn = container.querySelector(
            ".oe-console__run-btn"
        ) as HTMLButtonElement | null;
        expect(btn).not.toBeNull();
        expect(btn!.disabled).toBe(true);
        expect(btn!.textContent).toContain("Searching the world");
    });

    it("surfaces the latest run summary when one is loaded", () => {
        latestRun.value = {
            id: "r1",
            status: "completed",
            startedAt: "2026-06-01T10:00:00Z",
            completedAt: "2026-06-01T10:00:42Z",
            eventsWritten: 9,
            totalCostUsd: 0.18,
            errorSummary: null
        };
        const { container } = render(<DiscoveryConsole />);
        expect(container.textContent).toContain("9 events");
        expect(container.textContent).toContain("$0.18");
    });

    it("surfaces a paused-state label when weekly budget is reached", () => {
        latestRun.value = {
            id: "r1",
            status: "paused",
            startedAt: "2026-06-01T10:00:00Z",
            completedAt: "2026-06-01T10:00:00Z",
            eventsWritten: 0,
            totalCostUsd: 0,
            errorSummary: "Weekly cost ceiling reached"
        };
        const { container } = render(<DiscoveryConsole />);
        expect(container.textContent).toContain(
            "Paused — weekly budget reached"
        );
        expect(container.textContent).toContain("Weekly cost ceiling reached");
    });

    it("surfaces an inline error when triggerDiscovery sets discoveryError", () => {
        discoveryError.value = "Function not found";
        const { container } = render(<DiscoveryConsole />);
        const err = container.querySelector(
            ".oe-console__error"
        ) as HTMLElement | null;
        expect(err).not.toBeNull();
        expect(err!.textContent).toContain("Function not found");
    });
});
