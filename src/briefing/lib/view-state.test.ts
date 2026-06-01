import { describe, it, expect, beforeEach } from "vitest";
import { DEFAULT_VIEW, loadView, saveView } from "./view-state";

const KEY = "gtmos_briefing_view_v1";

describe("briefing view state", () => {
    beforeEach(() => {
        window.localStorage.removeItem(KEY);
    });

    it("defaults to workspace on empty storage", () => {
        expect(loadView()).toBe("workspace");
        expect(DEFAULT_VIEW).toBe("workspace");
    });

    it("returns default on unknown value", () => {
        window.localStorage.setItem(KEY, "garbage");
        expect(loadView()).toBe("workspace");
    });

    it("round-trips a saved value", () => {
        saveView("world");
        expect(loadView()).toBe("world");
        saveView("workspace");
        expect(loadView()).toBe("workspace");
    });
});
