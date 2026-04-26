import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    aggregateEngineInput,
    bootSnapshotAggregator
} from "./snapshot-aggregator";

const KEY_DEAL = "gtmos_deal_workspace_health";
const KEY_SIGNAL = "gtmos_signal_room_health";
const KEY_READINESS = "gtmos_readiness_snapshot";

describe("aggregateEngineInput", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty input when no snapshots exist", () => {
        const out = aggregateEngineInput();
        expect(out.riskCards).toHaveLength(0);
        expect(out.moveCards).toHaveLength(0);
        expect(out.healthSummaries).toEqual({});
    });

    it("ignores malformed JSON without throwing", () => {
        localStorage.setItem(KEY_DEAL, "{not json");
        expect(() => aggregateEngineInput()).not.toThrow();
        const out = aggregateEngineInput();
        expect(out.riskCards).toHaveLength(0);
    });

    it("translates deal-workspace top_pressure into risk cards", () => {
        const snapshot = {
            active_count: 5,
            top_pressure: [
                {
                    id: "deal-1",
                    accountName: "Acme",
                    stage: "negotiation",
                    score: 240,
                    cause: "Stalled 22 days"
                },
                {
                    id: "deal-2",
                    accountName: "Beta",
                    stage: "evaluation",
                    score: 120,
                    cause: "No next step"
                }
            ]
        };
        localStorage.setItem(KEY_DEAL, JSON.stringify(snapshot));
        const out = aggregateEngineInput();
        expect(out.riskCards).toHaveLength(2);
        expect(out.riskCards[0]?.title).toBe("Acme");
        expect(out.riskCards[0]?.actions?.[0]?.href).toContain(
            "/deal-workspace/"
        );
        expect(out.healthSummaries.deal).toBeTruthy();
    });

    it("skips entries without an account name", () => {
        const snapshot = {
            top_pressure: [{ score: 100 }, { accountName: "", score: 50 }, { accountName: "Real", score: 80 }]
        };
        localStorage.setItem(KEY_DEAL, JSON.stringify(snapshot));
        const out = aggregateEngineInput();
        expect(out.riskCards).toHaveLength(1);
        expect(out.riskCards[0]?.title).toBe("Real");
    });

    it("translates signal-room hot_accounts into move cards", () => {
        const snapshot = {
            hot_accounts: [
                {
                    id: "acc-1",
                    name: "Northstar",
                    heat: 80,
                    recentSignals: 4,
                    highConfidenceSignals: 3,
                    cause: "coverage_gap"
                }
            ]
        };
        localStorage.setItem(KEY_SIGNAL, JSON.stringify(snapshot));
        const out = aggregateEngineInput();
        expect(out.moveCards).toHaveLength(1);
        expect(out.moveCards[0]?.title).toContain("Northstar");
        const ranking = out.moveCards[0]?.rankingSignals as
            | Record<string, unknown>
            | undefined;
        expect(ranking?.causeId).toBe("coverage_gap");
    });

    it("attaches health summaries for the engine to consume", () => {
        localStorage.setItem(KEY_READINESS, JSON.stringify({ score: 72 }));
        const out = aggregateEngineInput();
        expect(out.healthSummaries.readiness).toBeTruthy();
    });
});

describe("bootSnapshotAggregator", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("invokes onUpdate immediately with the current state", () => {
        let lastInput: { riskCards: ReadonlyArray<unknown> } | null = null;
        const handle = bootSnapshotAggregator({
            onUpdate: (input) => {
                lastInput = input;
            }
        });
        expect(lastInput).not.toBeNull();
        expect(lastInput!.riskCards).toHaveLength(0);
        handle.stop();
    });

    it("re-reads on storage events for relevant keys", () => {
        let count = 0;
        const handle = bootSnapshotAggregator({
            onUpdate: () => {
                count++;
            }
        });
        const before = count;
        window.dispatchEvent(
            new StorageEvent("storage", { key: KEY_DEAL, newValue: "{}" })
        );
        expect(count).toBeGreaterThan(before);
        handle.stop();
    });

    it("ignores storage events for unrelated keys", () => {
        let count = 0;
        const handle = bootSnapshotAggregator({
            onUpdate: () => {
                count++;
            }
        });
        const before = count;
        window.dispatchEvent(
            new StorageEvent("storage", { key: "totally_unrelated", newValue: "x" })
        );
        expect(count).toBe(before);
        handle.stop();
    });

    it("stop() removes the storage listener", () => {
        let count = 0;
        const handle = bootSnapshotAggregator({
            onUpdate: () => {
                count++;
            }
        });
        const after_boot = count;
        handle.stop();
        window.dispatchEvent(
            new StorageEvent("storage", { key: KEY_DEAL, newValue: "{}" })
        );
        expect(count).toBe(after_boot);
    });
});
