import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import {
    compressionMode,
    focusedAccount,
    nextStepLock,
    resetSession,
    setNextStepField,
    startCallClock,
    stopCallClock
} from "../state";
import {
    clockRead,
    docketLabel,
    docketStatus,
    docketTone,
    toPulling
} from "./lib/adapters";
import { CompressionToggleDS } from "./components/CompressionToggleDS";
import { CallClockDS } from "./components/CallClockDS";
import { NextStepDocketDS } from "./components/NextStepDocketDS";
import { HandoffStripDS } from "./components/HandoffStripDS";

/**
 * The DS-chrome components are hook-free and render in vitest. The
 * DiscoveryStudioDS root composes the hook-using, primitive-faithful
 * control-face components (SkipAheadTray, CallClock-legacy) that can't
 * transform under preact:transform-hook-names — the same reason those
 * components carry no render tests. The root is exercised by the ?ds=1
 * Playwright smoke instead.
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

    it("clockRead is idle until the clock starts, then live", () => {
        expect(clockRead().live).toBe(false);
        expect(clockRead().mmss).toBe("00:00");
        startCallClock();
        expect(clockRead().live).toBe(true);
        stopCallClock();
        expect(clockRead().live).toBe(false);
    });

    it("toPulling is absent until an account is in focus, then pushes to the deal", () => {
        expect(toPulling()).toBeUndefined();
        focusedAccount.value = "Northwind Robotics";
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Push to the deal");
        expect(p!.object).toBe("Northwind Robotics");
        expect(p!.href).toContain("/deal-workspace/");
    });
});

describe("CompressionToggleDS", () => {
    it("drives compressionMode through the library SegmentedControl", () => {
        const { container, getByText } = render(<CompressionToggleDS />);
        expect(container.querySelector(".ds-seg")).not.toBeNull();
        expect(compressionMode.value).toBe("off");
        fireEvent.click(getByText("Essentials"));
        expect(compressionMode.value).toBe("essentials");
    });
});

describe("CallClockDS", () => {
    it("shows Start when idle and a live MM:SS + Stop when running", () => {
        const idle = render(<CallClockDS />);
        expect(idle.getByText("Start call")).not.toBeNull();
        cleanup();
        startCallClock();
        const live = render(<CallClockDS />);
        expect(live.container.querySelector(".dsd-clock__time")).not.toBeNull();
        expect(live.getByText("Stop")).not.toBeNull();
        stopCallClock();
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
