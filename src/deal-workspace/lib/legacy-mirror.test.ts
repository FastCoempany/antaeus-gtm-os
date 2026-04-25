import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    LEGACY_DEALS_KEY,
    dealsToLegacyArray,
    mirrorToLegacyStorage
} from "./legacy-mirror";
import type { Deal } from "./deal-shape";

const sampleDeals: Deal[] = [
    {
        id: "d1",
        accountName: "Acme",
        value: 50000,
        stage: "evaluation",
        nextStep: "Send proposal",
        nextStepDate: "2026-05-01",
        champion: "Jane",
        momentum: "strong"
    },
    {
        id: "d2",
        accountName: "Beta",
        value: 0,
        stage: "prospect"
    }
];

describe("dealsToLegacyArray", () => {
    it("emits one item per deal with camelCase fields", () => {
        const arr = dealsToLegacyArray(sampleDeals);
        expect(arr).toHaveLength(2);
        expect(arr[0]?.accountName).toBe("Acme");
        expect(arr[0]?.nextStep).toBe("Send proposal");
        expect(arr[0]?.champion).toBe("Jane");
        expect(arr[0]?.momentum).toBe("strong");
    });

    it("omits undefined fields rather than emitting null", () => {
        const arr = dealsToLegacyArray(sampleDeals);
        const second = arr[1] as Record<string, unknown>;
        expect("nextStep" in second).toBe(false);
        expect("champion" in second).toBe(false);
        expect(second.accountName).toBe("Beta");
    });
});

describe("mirrorToLegacyStorage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("writes the array under the canonical key", () => {
        mirrorToLegacyStorage(sampleDeals);
        const raw = localStorage.getItem(LEGACY_DEALS_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw ?? "[]") as Array<Record<string, unknown>>;
        expect(parsed).toHaveLength(2);
        expect(parsed[0]?.id).toBe("d1");
    });

    it("overwrites a previous mirror cleanly", () => {
        mirrorToLegacyStorage(sampleDeals);
        mirrorToLegacyStorage([sampleDeals[0]!]);
        const parsed = JSON.parse(
            localStorage.getItem(LEGACY_DEALS_KEY) ?? "[]"
        ) as unknown[];
        expect(parsed).toHaveLength(1);
    });

    it("does not throw when storage is hostile", () => {
        const original = localStorage.setItem.bind(localStorage);
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("QuotaExceededError");
            }
        });
        expect(() => mirrorToLegacyStorage(sampleDeals)).not.toThrow();
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: original
        });
    });
});
