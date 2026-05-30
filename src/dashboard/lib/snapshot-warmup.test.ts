import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { warmUpMissingSnapshots } from "./snapshot-warmup";

const SIGNAL_KEY = "gtmos_signal_room_health";
const DEAL_KEY = "gtmos_deal_workspace_health";
const SC_KEY = "gtmos_sc_v4";
const DW_KEY = "gtmos_deal_workspaces";

/**
 * Tests run against the global localStorage (happy-dom). Deal
 * Workspace's publisher hardcodes localStorage internally; we clear
 * between tests so each starts from a known-clean state.
 */
function clearAll(): void {
    for (const k of [SIGNAL_KEY, DEAL_KEY, SC_KEY, DW_KEY]) {
        localStorage.removeItem(k);
    }
}

function seedAccounts(count: number): void {
    const accounts = Array.from({ length: count }, (_, i) => ({
        id: `acc-${i}`,
        name: `Account ${i}`,
        ticker: "",
        industry: "Logistics",
        hq: "",
        employees: null,
        tier: "tier-1",
        signals: [
            {
                id: `sig-${i}`,
                headline: `Signal ${i}`,
                confidence: 0.8,
                published_date: new Date(Date.now() - 86400000).toISOString(),
                fetched_at: new Date().toISOString(),
                ai: true,
                status: "active"
            }
        ],
        source: "test",
        capturedAt: new Date().toISOString()
    }));
    localStorage.setItem(SC_KEY, JSON.stringify({ accounts, mode: "complex" }));
}

function seedDeals(count: number): void {
    const deals = Array.from({ length: count }, (_, i) => ({
        id: `deal-${i}`,
        accountName: `Account ${i}`,
        value: 50000 + i * 10000,
        stage: "discovery",
        ownerName: "Sarah",
        nextStep: "follow up",
        nextStepDate: new Date(Date.now() + 86400000).toISOString(),
        closeDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date().toISOString()
    }));
    localStorage.setItem(DW_KEY, JSON.stringify(deals));
}

describe("warmUpMissingSnapshots", () => {
    beforeEach(clearAll);
    afterEach(clearAll);

    it("no-op when storage is null", () => {
        const r = warmUpMissingSnapshots(null);
        expect(r).toEqual({ signal: false, deal: false });
    });

    it("no-op when both snapshots already present", () => {
        localStorage.setItem(SIGNAL_KEY, '{"capturedAt":"x"}');
        localStorage.setItem(DEAL_KEY, '{"generated_at":"x"}');
        seedAccounts(5);
        seedDeals(5);
        const r = warmUpMissingSnapshots();
        expect(r).toEqual({ signal: false, deal: false });
        expect(localStorage.getItem(SIGNAL_KEY)).toBe('{"capturedAt":"x"}');
        expect(localStorage.getItem(DEAL_KEY)).toBe('{"generated_at":"x"}');
    });

    it("publishes signal snapshot when accounts exist but snapshot missing", () => {
        seedAccounts(3);
        const r = warmUpMissingSnapshots();
        expect(r.signal).toBe(true);
        const snap = JSON.parse(localStorage.getItem(SIGNAL_KEY) ?? "{}");
        expect(snap.accountCount).toBe(3);
        expect(snap.hot_accounts).toHaveLength(3);
    });

    it("publishes deal snapshot when deals exist but snapshot missing", () => {
        seedDeals(4);
        const r = warmUpMissingSnapshots();
        expect(r.deal).toBe(true);
        const snap = JSON.parse(localStorage.getItem(DEAL_KEY) ?? "{}");
        expect(snap.active_count).toBe(4);
        expect(snap.pipeline_value).toBeGreaterThan(0);
    });

    it("publishes both when both raw nouns exist and both snapshots missing — the demo-seed case", () => {
        seedAccounts(2);
        seedDeals(3);
        const r = warmUpMissingSnapshots();
        expect(r).toEqual({ signal: true, deal: true });
        expect(localStorage.getItem(SIGNAL_KEY)).toBeTruthy();
        expect(localStorage.getItem(DEAL_KEY)).toBeTruthy();
    });

    it("skips snapshot publish when raw noun key is missing", () => {
        const r = warmUpMissingSnapshots();
        expect(r).toEqual({ signal: false, deal: false });
        expect(localStorage.getItem(SIGNAL_KEY)).toBeNull();
        expect(localStorage.getItem(DEAL_KEY)).toBeNull();
    });

    it("skips signal publish when accounts array is empty", () => {
        localStorage.setItem(SC_KEY, JSON.stringify({ accounts: [] }));
        seedDeals(2);
        const r = warmUpMissingSnapshots();
        expect(r).toEqual({ signal: false, deal: true });
        expect(localStorage.getItem(SIGNAL_KEY)).toBeNull();
    });

    it("skips deal publish when deals payload is malformed (not an array)", () => {
        seedAccounts(2);
        localStorage.setItem(DW_KEY, '{"not":"an array"}');
        const r = warmUpMissingSnapshots();
        expect(r).toEqual({ signal: true, deal: false });
        expect(localStorage.getItem(DEAL_KEY)).toBeNull();
    });

    it("skips deal publish on JSON parse error", () => {
        seedAccounts(2);
        localStorage.setItem(DW_KEY, "{not valid json");
        const r = warmUpMissingSnapshots();
        expect(r).toEqual({ signal: true, deal: false });
    });
});
