import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    HEALTH_SNAPSHOT_KEY,
    buildSignalRoomHealthSnapshot,
    publishHealthSnapshot
} from "./health-snapshot";
import type { Account } from "./types";

const NOW = new Date("2026-04-26T00:00:00Z").getTime();

function daysAgo(days: number): string {
    return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();
}

const hot: Account = {
    id: "hot-1",
    name: "Hot Corp",
    signals: Array.from({ length: 6 }, (_, i) => ({
        id: `s-${i}`,
        headline: `Signal ${i}`,
        published_date: daysAgo(2),
        is_ai: true,
        confidence: 0.95
    }))
};

const cold: Account = {
    id: "cold-1",
    name: "Cold LLC",
    signals: [
        {
            id: "c-1",
            published_date: daysAgo(200),
            confidence: 0.5
        }
    ]
};

describe("buildSignalRoomHealthSnapshot", () => {
    it("emits empty / zero state when accounts array is empty", () => {
        const s = buildSignalRoomHealthSnapshot([], NOW);
        expect(s.accountCount).toBe(0);
        expect(s.signalCount).toBe(0);
        expect(s.readyCount).toBe(0);
        expect(s.topAccountId).toBeNull();
        expect(s.topAccountName).toBe("");
        expect(s.topHeat).toBe(0);
        expect(s.topBand).toBe("Low");
        expect(s.hot_accounts).toHaveLength(0);
    });

    it("counts active signals across all accounts", () => {
        const s = buildSignalRoomHealthSnapshot([hot, cold], NOW);
        expect(s.signalCount).toBe(7);
        expect(s.accountCount).toBe(2);
    });

    it("counts ready accounts (heat ≥ 75)", () => {
        const s = buildSignalRoomHealthSnapshot([hot, cold], NOW);
        expect(s.readyCount).toBeGreaterThanOrEqual(1);
    });

    it("picks the top-ranked account as top*", () => {
        const s = buildSignalRoomHealthSnapshot([cold, hot], NOW);
        expect(s.topAccountId).toBe("hot-1");
        expect(s.topAccountName).toBe("Hot Corp");
        expect(s.topHeat).toBeGreaterThan(0);
    });

    it("emits hot_accounts limited to 5 entries", () => {
        const accounts = Array.from({ length: 8 }, (_, i) => ({
            ...hot,
            id: `acc-${i}`,
            name: `Account ${i}`
        }));
        const s = buildSignalRoomHealthSnapshot(accounts, NOW);
        expect(s.hot_accounts.length).toBeLessThanOrEqual(5);
    });

    it("each hot_accounts entry carries the fields Dashboard's aggregator expects", () => {
        const s = buildSignalRoomHealthSnapshot([hot], NOW);
        const entry = s.hot_accounts[0];
        expect(entry?.id).toBe("hot-1");
        expect(entry?.name).toBe("Hot Corp");
        expect(typeof entry?.heat).toBe("number");
        expect(typeof entry?.signalCount).toBe("number");
        expect(typeof entry?.recentSignals).toBe("number");
        expect(typeof entry?.highConfidenceSignals).toBe("number");
    });

    it("emits ISO capturedAt timestamp", () => {
        const s = buildSignalRoomHealthSnapshot([], NOW);
        expect(s.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
});

describe("publishHealthSnapshot", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("writes the snapshot under the canonical key", () => {
        publishHealthSnapshot([hot]);
        const raw = localStorage.getItem(HEALTH_SNAPSHOT_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw!);
        expect(parsed.accountCount).toBe(1);
        expect(parsed.topAccountName).toBe("Hot Corp");
    });

    it("does not throw when storage is hostile", () => {
        const original = localStorage.setItem.bind(localStorage);
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("QuotaExceededError");
            }
        });
        expect(() => publishHealthSnapshot([hot])).not.toThrow();
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: original
        });
    });
});
