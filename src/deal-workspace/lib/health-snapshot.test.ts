import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    HEALTH_SNAPSHOT_KEY,
    dealsToHealthSummary,
    publishHealthSnapshot
} from "./health-snapshot";
import type { Deal } from "./deal-shape";

function makeDeal(partial: Partial<Deal>): Deal {
    return {
        id: partial.id ?? "x",
        accountName: partial.accountName ?? "Acme",
        value: partial.value ?? 1000,
        stage: partial.stage ?? "discovery",
        ...partial
    };
}

describe("dealsToHealthSummary", () => {
    it("counts active / won / lost separately", () => {
        const summary = dealsToHealthSummary([
            makeDeal({ id: "a", stage: "discovery", value: 10000 }),
            makeDeal({ id: "b", stage: "negotiation", value: 50000 }),
            makeDeal({ id: "c", stage: "closed-won", value: 30000 }),
            makeDeal({ id: "d", stage: "closed-lost", value: 5000 })
        ]);
        expect(summary.active_count).toBe(2);
        expect(summary.won_count).toBe(1);
        expect(summary.lost_count).toBe(1);
        expect(summary.pipeline_value).toBe(60000);
    });

    it("emits lane counts that sum to active count", () => {
        const summary = dealsToHealthSummary([
            makeDeal({ id: "a", stage: "discovery" }),
            makeDeal({ id: "b", stage: "evaluation" }),
            makeDeal({ id: "c", stage: "negotiation" })
        ]);
        const total =
            summary.critical_count + summary.at_risk_count + summary.healthy_count;
        expect(total).toBe(summary.active_count);
    });

    it("limits top_pressure to 5 entries", () => {
        const deals = Array.from({ length: 10 }, (_, i) =>
            makeDeal({
                id: `d-${i}`,
                stage: "discovery",
                nextStep: "" // forces nextStep score → 60
            })
        );
        const summary = dealsToHealthSummary(deals);
        expect(summary.top_pressure.length).toBeLessThanOrEqual(5);
    });

    it("emits an iso generated_at timestamp", () => {
        const summary = dealsToHealthSummary([]);
        expect(summary.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
});

describe("publishHealthSnapshot", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("writes the snapshot under the canonical key", () => {
        publishHealthSnapshot([
            makeDeal({ id: "a", stage: "discovery", value: 10000 })
        ]);
        const raw = localStorage.getItem(HEALTH_SNAPSHOT_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw ?? "{}");
        expect(parsed.active_count).toBe(1);
        expect(parsed.pipeline_value).toBe(10000);
    });

    it("does not throw when storage is hostile", () => {
        const original = localStorage.setItem.bind(localStorage);
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("QuotaExceededError");
            }
        });
        expect(() => publishHealthSnapshot([])).not.toThrow();
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: original
        });
    });
});
