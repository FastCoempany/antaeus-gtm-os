import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { costSummary, costSummaryLoaded } from "../state";
import {
    __resetBriefingViewForTests,
    activeBriefingView
} from "../components/ViewToggle";
import { ViewToggleDS } from "./components/ViewToggleDS";
import { TopbarDS } from "./components/TopbarDS";
import { BriefingFooterDS } from "./components/BriefingFooterDS";

/**
 * The DS-chrome components are hook-free and render in vitest. The
 * BriefingDS root composes the hook-using, LLM-pipeline-governed stream
 * components (PeripheryRail, WatchList) which can't be transformed by
 * the preact:transform-hook-names plugin under the test transform — the
 * same reason those legacy components (and the legacy Briefing root)
 * carry no render tests. The root is exercised by the Playwright smoke
 * (?ds=1) instead.
 */

beforeEach(() => {
    cleanup();
    localStorage.clear();
    __resetBriefingViewForTests();
    costSummary.value = null;
    costSummaryLoaded.value = false;
});

describe("ViewToggleDS", () => {
    it("defaults to Workspace and switches to World on the library SegmentedControl", () => {
        const { container, getByText } = render(<ViewToggleDS />);
        expect(container.querySelector(".ds-seg")).not.toBeNull();
        expect(activeBriefingView()).toBe("workspace");
        fireEvent.click(getByText("Your market"));
        expect(activeBriefingView()).toBe("world");
    });
});

describe("TopbarDS", () => {
    it("renders the thesis head on the library", () => {
        const { container } = render(<TopbarDS />);
        expect(container.querySelector(".ds-kicker")).not.toBeNull();
        expect(container.querySelector("[class*='ds-heading']")).not.toBeNull();
    });
});

describe("BriefingFooterDS", () => {
    it("renders nothing until the cost summary loads", () => {
        const { container } = render(<BriefingFooterDS />);
        expect(container.querySelector(".ds-meter")).toBeNull();
    });
    it("renders the cost as a library Meter once loaded", () => {
        costSummaryLoaded.value = true;
        costSummary.value = {
            weekly_cost_usd: 1.2,
            ceiling_usd: 3,
            fraction_of_ceiling: 0.4,
            state: "ok",
            window_start: ""
        };
        const { container } = render(<BriefingFooterDS />);
        expect(container.querySelector(".ds-meter")).not.toBeNull();
    });
});
