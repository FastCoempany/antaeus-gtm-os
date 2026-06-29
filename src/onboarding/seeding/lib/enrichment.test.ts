import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/observability", () => ({ reportError: vi.fn(), trackEvent: vi.fn() }));

// Force the Edge Function path to fail so enrichAccounts falls back to the
// stub — the behaviour internal preview relies on when nothing's deployed.
vi.mock("@/lib/supabase-client", () => ({
    getSupabaseClient: () => {
        throw new Error("no supabase in test");
    }
}));

import { enrichAccounts, enrichAccountsStub } from "./enrichment";

describe("enrichAccounts (fallback to stub)", () => {
    it("returns the stub result when the Edge Function isn't reachable", async () => {
        const r = await enrichAccounts(["Northwind", "Apex", "Cobalt", "Evermark"], "Heads of RevOps");
        expect(r.accounts.length).toBe(4);
        // Ranked hottest-first; the last is the honest quiet one.
        expect(r.accounts[r.accounts.length - 1]!.cold).toBe(true);
        expect(r.accounts[r.accounts.length - 1]!.signal).toMatch(/quiet/);
        expect(r.reads.length).toBeGreaterThan(0);
    });

    it("empty input short-circuits", async () => {
        const r = await enrichAccounts([], "x");
        expect(r.accounts).toEqual([]);
    });
});

describe("enrichAccountsStub", () => {
    it("is deterministic for the same names", async () => {
        const a = await enrichAccountsStub(["Acme", "Beta", "Gamma"], "icp");
        const b = await enrichAccountsStub(["Acme", "Beta", "Gamma"], "icp");
        expect(a.accounts.map((x) => x.name)).toEqual(b.accounts.map((x) => x.name));
    });
});
