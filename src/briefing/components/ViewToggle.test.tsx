import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/preact";
import {
    ViewToggle,
    activeBriefingView,
    setBriefingView,
    __resetBriefingViewForTests
} from "./ViewToggle";

const KEY = "gtmos_briefing_view_v1";

describe("ViewToggle", () => {
    beforeEach(() => {
        window.localStorage.removeItem(KEY);
        __resetBriefingViewForTests();
    });

    it("defaults to workspace", () => {
        const { container } = render(<ViewToggle />);
        const buttons = container.querySelectorAll(".bf-view-toggle__btn");
        expect(buttons.length).toBe(2);
        expect(buttons[0]!.getAttribute("aria-selected")).toBe("true"); // workspace
        expect(buttons[1]!.getAttribute("aria-selected")).toBe("false");
        expect(activeBriefingView()).toBe("workspace");
    });

    it("switches to world on click", () => {
        const { container } = render(<ViewToggle />);
        const worldBtn = container.querySelectorAll(
            ".bf-view-toggle__btn"
        )[1] as HTMLButtonElement;
        fireEvent.click(worldBtn);
        expect(activeBriefingView()).toBe("world");
        expect(window.localStorage.getItem(KEY)).toBe("world");
    });

    it("respects stored choice on init", () => {
        window.localStorage.setItem(KEY, "world");
        __resetBriefingViewForTests();
        const { container } = render(<ViewToggle />);
        const buttons = container.querySelectorAll(".bf-view-toggle__btn");
        expect(buttons[0]!.getAttribute("aria-selected")).toBe("false");
        expect(buttons[1]!.getAttribute("aria-selected")).toBe("true");
        expect(activeBriefingView()).toBe("world");
    });

    it("setBriefingView persists", () => {
        setBriefingView("world");
        expect(window.localStorage.getItem(KEY)).toBe("world");
        setBriefingView("workspace");
        expect(window.localStorage.getItem(KEY)).toBe("workspace");
    });
});
