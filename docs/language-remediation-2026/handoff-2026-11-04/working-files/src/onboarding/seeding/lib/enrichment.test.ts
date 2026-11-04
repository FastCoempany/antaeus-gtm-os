import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/observability", () => ({ reportError: vi.fn(), trackEvent: vi.fn() }));

// A network/backend failure must never be reported as researched company data.
vi.mock("@/lib/supabase-client", () => ({
    getSupabaseClient: () => {
        throw new Error("no supabase in test");
    }
}));

import { enrichAccounts, enrichAccountsStub } from "./enrichment";

describe("enrichAccounts unavailable state", () => {
    it("preserves account names without inventing evidence when the backend is unreachable", async () => {
        const r = await enrichAccounts(["Northwind", "Apex", "Cobalt", "Evermark"], "Heads of RevOps");
        expect(r.accounts.length).toBe(4);
        expect(r.unavailable).toBe(true);
        expect(r.accounts.map(a => a.name)).toEqual(["Northwind", "Apex", "Cobalt", "Evermark"]);
        expect(r.accounts.every(a => a.cold && a.heat === 0 && !a.sourceUrl)).toBe(true);
        expect(r.accounts.every(a => a.signal === "Account research unavailable")).toBe(true);
        expect(r.reads[0]?.body).toContain("No company changes were verified");
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
        expect(a.accounts.every(x => x.signal.startsWith("Demo example:"))).toBe(true);
    });
});
