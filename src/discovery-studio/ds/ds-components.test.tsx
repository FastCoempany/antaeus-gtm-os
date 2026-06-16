import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import {
    compressionMode,
    focusedAccount,
    nextStepLock,
    resetSession,
    setNextStepField
} from "../state";
import { docketLabel, docketStatus, docketTone } from "./lib/adapters";
import { CompressionToggleDS } from "./components/CompressionToggleDS";
import { NextStepDocketDS } from "./components/NextStepDocketDS";
import { HandoffStripDS } from "./components/HandoffStripDS";

/**
 * The DS-chrome components are hook-free and render in vitest. The
 * DiscoveryStudioDS root composes the hook-using control-face components
 * (SkipAheadTray etc.) that can't transform under
 * preact:transform-hook-names — so the root is exercised by the ?ds=1
 * Playwright smoke instead. No clock / no pull (founder direction
 * 2026-06-16) — those adapters were removed.
 */

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
    focusedAccount.value = "";
});

describe("adapters", () => {
    it("statuses + tones the docket lock", () => {
        expect(docketStatus({ date: "", owner: "", attendees: "", purpose: "", reason: "" })).toBe("empty");
        expect(docketStatus({ date: "2026-05-01", owner: "", attendees: "", purpose: "", reason: "" })).toBe("partial");
        expect(docketStatus({ date: "2026-05-01", owner: "Jamie", attendees: "", purpose: "Sign", reason: "" })).toBe("locked");
        expect(docketTone("locked")).toBe("green");
        expect(docketTone("partial")).toBe("amber");
        expect(docketLabel("locked")).toBe("Locked");
    });
});

describe("CompressionToggleDS", () => {
    it("drives compressionMode through the library SegmentedControl — including the rescue (Emergency) state", () => {
        const { container, getByText } = render(<CompressionToggleDS />);
        expect(container.querySelector(".ds-seg")).not.toBeNull();
        expect(compressionMode.value).toBe("off");
        fireEvent.click(getByText("Essentials"));
        expect(compressionMode.value).toBe("essentials");
        fireEvent.click(getByText("Emergency"));
        expect(compressionMode.value).toBe("emergency");
    });
});

describe("NextStepDocketDS", () => {
    it("reads empty, then locked once date + owner + purpose are filled", () => {
        const first = render(<NextStepDocketDS />);
        expect(first.getByText("No lock yet")).not.toBeNull();
        cleanup();
        setNextStepField("date", "2026-05-01");
        setNextStepField("owner", "Jamie Lin");
        setNextStepField("purpose", "Sign the order form");
        const locked = render(<NextStepDocketDS />);
        expect(locked.getByText("Locked")).not.toBeNull();
    });

    it("writes a field through the library TextInput", () => {
        const { container } = render(<NextStepDocketDS />);
        const owner = container.querySelectorAll(".ds-input")[1] as HTMLInputElement;
        fireEvent.input(owner, { target: { value: "Sarah Chen" } });
        expect(nextStepLock.value.owner).toBe("Sarah Chen");
    });
});

describe("HandoffStripDS", () => {
    it("renders the three routes; the primary pushes to the deal", () => {
        focusedAccount.value = "Northwind";
        const { container } = render(<HandoffStripDS />);
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
        const primary = container.querySelector(
            '[data-handoff="deal-workspace"]'
        ) as HTMLAnchorElement;
        expect(primary).not.toBeNull();
        expect(primary.getAttribute("href")).toContain("/deal-workspace/");
        expect(container.querySelector('[data-handoff="future-autopsy"]')).not.toBeNull();
        expect(container.querySelector('[data-handoff="call-planner"]')).not.toBeNull();
    });
});
