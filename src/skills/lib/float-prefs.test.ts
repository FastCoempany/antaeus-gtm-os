import { describe, it, expect, beforeEach } from "vitest";
import {
    DEFAULT_PREFS,
    isSnoozed,
    loadPrefs,
    savePrefs,
    snoozeForHours,
    type FloatPrefs
} from "./float-prefs";

const KEY = "gtmos_schedule_float_prefs_v1";

describe("float-prefs", () => {
    beforeEach(() => {
        window.localStorage.removeItem(KEY);
    });

    it("returns defaults when storage is empty", () => {
        expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    });

    it("returns defaults on malformed JSON", () => {
        window.localStorage.setItem(KEY, "{not-json");
        expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    });

    it("falls back per-field on unknown values", () => {
        window.localStorage.setItem(
            KEY,
            JSON.stringify({
                mode: "wat",
                showInSessionNotifications: "yes",
                showTooltipHints: 0,
                surfaceVisible: null,
                snoozeUntilIso: 12345
            })
        );
        expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    });

    it("round-trips a saved prefs object", () => {
        const next: FloatPrefs = {
            mode: "minimized",
            showInSessionNotifications: false,
            showTooltipHints: false,
            surfaceVisible: true,
            snoozeUntilIso: "2026-06-01T18:00:00.000Z"
        };
        savePrefs(next);
        expect(loadPrefs()).toEqual(next);
    });

    it("isSnoozed: null returns false", () => {
        expect(isSnoozed(DEFAULT_PREFS, new Date())).toBe(false);
    });

    it("isSnoozed: future returns true", () => {
        const future = new Date(Date.now() + 60_000).toISOString();
        expect(
            isSnoozed({ ...DEFAULT_PREFS, snoozeUntilIso: future })
        ).toBe(true);
    });

    it("isSnoozed: past returns false", () => {
        const past = new Date(Date.now() - 60_000).toISOString();
        expect(
            isSnoozed({ ...DEFAULT_PREFS, snoozeUntilIso: past })
        ).toBe(false);
    });

    it("isSnoozed: garbage string returns false", () => {
        expect(
            isSnoozed({ ...DEFAULT_PREFS, snoozeUntilIso: "not-a-date" })
        ).toBe(false);
    });

    it("snoozeForHours: produces an ISO string N hours ahead", () => {
        const now = new Date("2026-06-01T12:00:00.000Z");
        expect(snoozeForHours(1, now)).toBe("2026-06-01T13:00:00.000Z");
        expect(snoozeForHours(4, now)).toBe("2026-06-01T16:00:00.000Z");
    });
});
