import { describe, expect, it, vi } from "vitest";
import { mirrorSeedToCloud } from "./cloud-mirror";
import type { SeedingDraft } from "../draft";
import type { DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";

vi.mock("@/lib/observability", () => ({ reportError: vi.fn(), trackEvent: vi.fn() }));

function draftOf(p: Partial<SeedingDraft>): SeedingDraft {
    return {
        icpPicks: [],
        icpStatement: "",
        accountNames: [],
        deals: [],
        annualQuota: 0,
        avgDeal: 0,
        winRate: 22,
        cycleDays: 90,
        ...p
    };
}

function mockClient() {
    const icpInsert = vi.fn(async (row: unknown) => ({ id: "icp-1", ...(row as object) }));
    const acctInsert = vi.fn(async (row: unknown) => ({ id: "acc-1", ...(row as object) }));
    const signalInsert = vi.fn(async (row: unknown) => ({ id: "sig-1", ...(row as object) }));
    const dealInsert = vi.fn(async (row: unknown) => ({ id: "deal-1", ...(row as object) }));
    const data = {
        icps: { insert: icpInsert },
        signalConsoleAccounts: { insert: acctInsert },
        signals: { insert: signalInsert },
        deals: { insert: dealInsert }
    } as unknown as DataClient;
    return { data, icpInsert, acctInsert, signalInsert, dealInsert };
}

describe("mirrorSeedToCloud", () => {
    it("inserts the ICP with the statement as summary", async () => {
        const { data, icpInsert } = mockClient();
        await mirrorSeedToCloud(draftOf({ icpStatement: "Heads of RevOps at mid-market." }), [], { data });
        expect(icpInsert).toHaveBeenCalledTimes(1);
        expect(icpInsert.mock.calls[0]![0]).toMatchObject({ summary: "Heads of RevOps at mid-market." });
    });

    it("inserts each account and a signal for the hot ones (not the quiet)", async () => {
        const { data, acctInsert, signalInsert } = mockClient();
        const r = await mirrorSeedToCloud(
            draftOf({ accountNames: ["Northwind", "Evermark"] }),
            [
                { name: "Northwind", signal: "opened a GC search", heat: 91, cold: false, sourceUrl: "https://x.com" },
                { name: "Evermark", signal: "quiet — nothing fresh yet", heat: 12, cold: true, sourceUrl: "" }
            ],
            { data }
        );
        expect(acctInsert).toHaveBeenCalledTimes(2);
        // Only the non-cold account gets a signal row.
        expect(signalInsert).toHaveBeenCalledTimes(1);
        expect(signalInsert.mock.calls[0]![0]).toMatchObject({ account_id: "acc-1", headline: "opened a GC search", url: "https://x.com" });
        expect(r.accounts).toBe(2);
    });

    it("inserts deals with the judgment in the data blob", async () => {
        const { data, dealInsert } = mockClient();
        await mirrorSeedToCloud(
            draftOf({
                deals: [{ id: "d", account: "Northwind", value: 120000, stage: "proposal", champion: "VP Ops", whoSigns: "", stuck: "silent 18 days" }]
            }),
            [],
            { data }
        );
        expect(dealInsert).toHaveBeenCalledTimes(1);
        expect(dealInsert.mock.calls[0]![0]).toMatchObject({
            account_name: "Northwind",
            stage: "proposal",
            deal_value: 120000
        });
    });

    it("a re-seed duplicate (23505) is silent — no reportError", async () => {
        vi.mocked(reportError).mockClear();
        const { data, acctInsert } = mockClient();
        // The account already exists in the workspace on a re-run.
        (acctInsert as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
            Object.assign(new Error('duplicate key value violates unique constraint "signal_console_accounts_user_key_idx"'), {
                code: "23505"
            })
        );
        const r = await mirrorSeedToCloud(
            draftOf({ accountNames: ["Northwind"] }),
            [{ name: "Northwind", signal: "", heat: 40, cold: false, sourceUrl: "" }],
            { data }
        );
        expect(r.accounts).toBe(0); // the dup didn't count
        expect(reportError).not.toHaveBeenCalled(); // and stayed quiet
    });

    it("a genuine (non-duplicate) insert failure IS reported", async () => {
        vi.mocked(reportError).mockClear();
        const { data } = mockClient();
        (data.deals.insert as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("rls denied"));
        await mirrorSeedToCloud(
            draftOf({ deals: [{ id: "d", account: "A", value: 1, stage: "discovery", champion: "c", whoSigns: "s", stuck: "" }] }),
            [],
            { data }
        );
        expect(reportError).toHaveBeenCalled();
    });

    it("a single insert failure doesn't abort the rest", async () => {
        const { data, dealInsert } = mockClient();
        // Make the ICP insert throw; accounts + deals should still run.
        (data.icps.insert as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("rls"));
        const r = await mirrorSeedToCloud(
            draftOf({
                icpStatement: "X",
                accountNames: ["A"],
                deals: [{ id: "d", account: "A", value: 1, stage: "discovery", champion: "c", whoSigns: "s", stuck: "" }]
            }),
            [{ name: "A", signal: "", heat: 40, cold: false, sourceUrl: "" }],
            { data }
        );
        expect(r.icps).toBe(0); // failed
        expect(r.accounts).toBe(1); // still ran
        expect(dealInsert).toHaveBeenCalledTimes(1);
    });
});
