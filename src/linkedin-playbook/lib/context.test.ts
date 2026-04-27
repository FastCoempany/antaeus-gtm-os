import { describe, expect, it } from "vitest";
import {
    loadBestIcp,
    loadHottestAccount,
    loadLatestTouch
} from "./context";

class MemStorage {
    private store = new Map<string, string>();
    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
}

describe("loadBestIcp", () => {
    it("returns null when storage is null", () => {
        expect(loadBestIcp(null)).toBeNull();
    });

    it("returns null when key is missing or malformed", () => {
        const s = new MemStorage();
        expect(loadBestIcp(s)).toBeNull();
        s.seed("gtmos_icp_analytics", "{not json");
        expect(loadBestIcp(s)).toBeNull();
    });

    it("picks the icp with the highest qualityScore", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_icp_analytics",
            JSON.stringify({
                icps: [
                    { name: "Series-A SaaS", qualityScore: 70 },
                    { name: "Mid-market FinTech", qualityScore: 90 },
                    { name: "Bootstrapped DevTools", qualityScore: 50 }
                ]
            })
        );
        const out = loadBestIcp(s);
        expect(out?.name).toBe("Mid-market FinTech");
        expect(out?.qualityScore).toBe(90);
    });

    it("ignores rows missing a name", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_icp_analytics",
            JSON.stringify({
                icps: [
                    { name: "", qualityScore: 99 },
                    { name: "Acme Co", qualityScore: 50 }
                ]
            })
        );
        expect(loadBestIcp(s)?.name).toBe("Acme Co");
    });

    it("returns null when no rows are usable", () => {
        const s = new MemStorage();
        s.seed("gtmos_icp_analytics", JSON.stringify({ icps: [] }));
        expect(loadBestIcp(s)).toBeNull();
    });
});

describe("loadHottestAccount", () => {
    it("returns null when storage is null or empty", () => {
        expect(loadHottestAccount(null)).toBeNull();
    });

    it("picks the account with the highest heat", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    { id: "1", name: "Acme", heat: 70 },
                    { id: "2", name: "Beta", heat: 90 },
                    { id: "3", name: "Gamma", heat: 50 }
                ]
            })
        );
        expect(loadHottestAccount(s)?.name).toBe("Beta");
    });

    it("falls back to legacy `_heat` when `heat` is absent", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [{ id: "1", name: "LegacyOnly", _heat: 80 }]
            })
        );
        expect(loadHottestAccount(s)?.heat).toBe(80);
    });

    it("respects an explicit `heat: 0` over a stale `_heat`", () => {
        // Same Codex P2 fix shape Phase 4 / Room 7's account-loader uses.
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    {
                        id: "1",
                        name: "ColdAccount",
                        heat: 0,
                        _heat: 80
                    },
                    { id: "2", name: "WarmAccount", heat: 50 }
                ]
            })
        );
        expect(loadHottestAccount(s)?.name).toBe("WarmAccount");
    });

    it("returns null when no rows are usable", () => {
        const s = new MemStorage();
        s.seed("gtmos_sc_v4", JSON.stringify({ accounts: [] }));
        expect(loadHottestAccount(s)).toBeNull();
    });
});

describe("loadLatestTouch", () => {
    it("returns null when storage is null or empty", () => {
        expect(loadLatestTouch(null)).toBeNull();
    });

    it("picks the touch with the latest createdAt", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_outbound_touches",
            JSON.stringify({
                touches: [
                    {
                        accountName: "OldAcct",
                        createdAt: "2026-04-01T00:00:00Z"
                    },
                    {
                        accountName: "Latest",
                        createdAt: "2026-04-27T12:00:00Z"
                    },
                    {
                        accountName: "Mid",
                        createdAt: "2026-04-10T00:00:00Z"
                    }
                ]
            })
        );
        expect(loadLatestTouch(s)?.accountName).toBe("Latest");
    });

    it("falls back to savedAt when createdAt is missing", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_outbound_touches",
            JSON.stringify({
                touches: [
                    {
                        accountName: "OnlySaved",
                        savedAt: "2026-04-27T12:00:00Z"
                    }
                ]
            })
        );
        expect(loadLatestTouch(s)?.accountName).toBe("OnlySaved");
    });

    it("ignores rows missing accountName", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_outbound_touches",
            JSON.stringify({
                touches: [
                    {
                        accountName: "",
                        createdAt: "2026-04-27T12:00:00Z"
                    },
                    {
                        accountName: "Real",
                        createdAt: "2026-04-26T00:00:00Z"
                    }
                ]
            })
        );
        expect(loadLatestTouch(s)?.accountName).toBe("Real");
    });
});
