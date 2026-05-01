import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    COMMAND_MODE_STORAGE_KEY,
    __resetForTests,
    commandMode,
    commandSummary,
    focusedCommandId,
    resolveInitialMode,
    setCommandMode,
    setEngineInput,
    setFocusedCommand,
    spotlightObject
} from "./state";
import type { RawCommandCard } from "./lib/types";

describe("resolveInitialMode", () => {
    it("prefers ?mode= over storage and default", () => {
        const fakeStorage = {
            getItem: () => "queue"
        };
        expect(resolveInitialMode("?mode=brief", fakeStorage)).toBe("brief");
    });

    it("falls back to storage when URL has no mode", () => {
        const fakeStorage = {
            getItem: () => "queue"
        };
        expect(resolveInitialMode("", fakeStorage)).toBe("queue");
    });

    it("returns default when neither URL nor storage has a value", () => {
        const fakeStorage = {
            getItem: () => null
        };
        expect(resolveInitialMode("", fakeStorage)).toBe("spotlight");
    });

    it("ignores garbage values from URL or storage", () => {
        const fakeStorage = {
            getItem: () => "garbage"
        };
        expect(resolveInitialMode("?mode=evil", fakeStorage)).toBe("spotlight");
    });

    it("survives a malformed search string", () => {
        const fakeStorage = {
            getItem: () => null
        };
        expect(resolveInitialMode("?%", fakeStorage)).toBe("spotlight");
    });

    it("survives a null storage", () => {
        expect(resolveInitialMode("", null)).toBe("spotlight");
    });
});

describe("setCommandMode", () => {
    beforeEach(() => {
        __resetForTests();
        localStorage.clear();
    });

    afterEach(() => {
        __resetForTests();
        localStorage.clear();
    });

    it("updates the signal", () => {
        setCommandMode("brief");
        expect(commandMode.value).toBe("brief");
    });

    it("persists to the canonical localStorage key", () => {
        setCommandMode("queue");
        expect(localStorage.getItem(COMMAND_MODE_STORAGE_KEY)).toBe("queue");
    });

    it("does not throw when storage is hostile", () => {
        const original = localStorage.setItem.bind(localStorage);
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("QuotaExceededError");
            }
        });
        expect(() => setCommandMode("brief")).not.toThrow();
        expect(commandMode.value).toBe("brief");
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: original
        });
    });
});

describe("setFocusedCommand", () => {
    beforeEach(() => {
        __resetForTests();
    });

    it("sets and clears the focus signal", () => {
        setFocusedCommand("acme-deal-1");
        expect(focusedCommandId.value).toBe("acme-deal-1");
        setFocusedCommand(null);
        expect(focusedCommandId.value).toBeNull();
    });
});

describe("commandSummary + spotlightObject", () => {
    const riskCard: RawCommandCard = {
        title: "Acme proposal stalled",
        badge: "70",
        meta: ["$250k", "stale 22"],
        actions: [
            { label: "Open deal", href: "/deal-workspace/", roomLabel: "Deal Workspace" }
        ]
    };
    const moveCard: RawCommandCard = {
        title: "Outbound to fintech wedge",
        badge: "Now",
        meta: ["heat 70"],
        actions: [
            { label: "Open Signal Console", href: "/signal-console/", roomLabel: "Signal Console" }
        ]
    };

    beforeEach(() => __resetForTests());

    it("returns null spotlight when input is empty", () => {
        expect(commandSummary.value.ranked.length).toBe(0);
        expect(spotlightObject.value).toBeNull();
    });

    it("derives the ranked summary from the engine input", () => {
        setEngineInput({
            riskCards: [riskCard],
            moveCards: [moveCard],
            healthSummaries: {}
        });
        expect(commandSummary.value.ranked.length).toBe(2);
        expect(spotlightObject.value).toBe(commandSummary.value.spotlight);
    });

    it("honors a manual focus over the engine top", () => {
        setEngineInput({
            riskCards: [riskCard],
            moveCards: [moveCard],
            healthSummaries: {}
        });
        const ranked = commandSummary.value.ranked;
        const second = ranked[1]!;
        setFocusedCommand(second.id);
        expect(spotlightObject.value?.id).toBe(second.id);
    });

    it("falls back to engine top if focused id is not in the ranked set", () => {
        setEngineInput({
            riskCards: [riskCard],
            moveCards: [moveCard],
            healthSummaries: {}
        });
        setFocusedCommand("does-not-exist");
        expect(spotlightObject.value?.id).toBe(
            commandSummary.value.spotlight?.id
        );
    });
});
