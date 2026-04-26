import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, loadAccounts, saveAccounts } from "./persistence";
import type { Account } from "./types";

const sample: Account[] = [
    {
        id: "a-1",
        name: "Acme Industries",
        ticker: "ACM",
        industry: "industrials",
        signals: [
            {
                id: "s-1",
                headline: "Funded series C",
                published_date: "2026-04-10",
                confidence: 0.92,
                is_ai: true
            }
        ]
    },
    {
        id: "a-2",
        name: "Beta Corp",
        signals: []
    }
];

describe("loadAccounts", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty array when key is missing", () => {
        expect(loadAccounts()).toEqual([]);
    });

    it("returns empty array when value is malformed JSON", () => {
        localStorage.setItem(STORAGE_KEY, "{not json");
        expect(loadAccounts()).toEqual([]);
    });

    it("parses the legacy persisted shape", () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ accounts: sample, lastSavedAt: new Date().toISOString() })
        );
        const out = loadAccounts();
        expect(out).toHaveLength(2);
        expect(out[0]?.name).toBe("Acme Industries");
        expect(out[0]?.signals).toHaveLength(1);
        expect(out[0]?.signals[0]?.is_ai).toBe(true);
    });

    it("filters out accounts missing id or name", () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                accounts: [
                    { id: "ok", name: "Real", signals: [] },
                    { id: "no-name", signals: [] },
                    { name: "no-id", signals: [] },
                    "not an object"
                ]
            })
        );
        const out = loadAccounts();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("ok");
    });

    it("filters out malformed signals inside an account", () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                accounts: [
                    {
                        id: "a",
                        name: "Acme",
                        signals: [
                            { id: "good", headline: "real" },
                            { headline: "no id" },
                            null,
                            "string"
                        ]
                    }
                ]
            })
        );
        const out = loadAccounts();
        expect(out[0]?.signals).toHaveLength(1);
        expect(out[0]?.signals[0]?.id).toBe("good");
    });
});

describe("saveAccounts", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("writes the legacy persisted shape under the canonical key", () => {
        saveAccounts(sample);
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw!);
        expect(Array.isArray(parsed.accounts)).toBe(true);
        expect(parsed.accounts).toHaveLength(2);
        expect(parsed.lastSavedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("does not throw when storage is hostile", () => {
        const original = localStorage.setItem.bind(localStorage);
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("QuotaExceededError");
            }
        });
        expect(() => saveAccounts(sample)).not.toThrow();
        Object.defineProperty(localStorage, "setItem", {
            configurable: true,
            value: original
        });
    });

    it("round-trips: load(save(x)) preserves the array", () => {
        saveAccounts(sample);
        const out = loadAccounts();
        expect(out).toHaveLength(sample.length);
        expect(out[0]?.id).toBe(sample[0]?.id);
        expect(out[0]?.signals[0]?.id).toBe(sample[0]?.signals[0]?.id);
    });
});
