import { describe, expect, it } from "vitest";
import { writeSeedingDraft } from "./seed-writer";
import type { SeedingDraft } from "../draft";

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
    json(k: string): unknown {
        const raw = this.map.get(k);
        return raw ? JSON.parse(raw) : null;
    }
}

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

describe("writeSeedingDraft", () => {
    it("writes the ICP into gtmos_icp_analytics", () => {
        const s = new FakeStorage();
        writeSeedingDraft(draftOf({ icpStatement: "Heads of RevOps at mid-market." }), [], { storage: s, now: 1 });
        const icp = s.json("gtmos_icp_analytics") as { icps: Array<{ statement: string }> };
        expect(icp.icps).toHaveLength(1);
        expect(icp.icps[0]!.statement).toBe("Heads of RevOps at mid-market.");
    });

    it("writes the account list + a health snapshot the Dashboard reads", () => {
        const s = new FakeStorage();
        writeSeedingDraft(
            draftOf({ accountNames: ["Northwind", "Apex", "Cobalt"] }),
            [
                { name: "Northwind", signal: "opened a GC search", heat: 91, cold: false },
                { name: "Apex", signal: "named a CFO", heat: 64, cold: false },
                { name: "Cobalt", signal: "quiet — nothing fresh yet", heat: 12, cold: true }
            ],
            { storage: s, now: 1 }
        );
        const sc = s.json("gtmos_sc_v4") as { accounts: Array<{ name: string; heat: number }> };
        expect(sc.accounts).toHaveLength(3);
        const health = s.json("gtmos_signal_room_health") as {
            hot_accounts: Array<{ name: string; heat: number }>;
            topName: string;
        };
        // Ranked hottest-first for the Dashboard's move cards.
        expect(health.topName).toBe("Northwind");
        expect(health.hot_accounts[0]!.name).toBe("Northwind");
    });

    it("writes live deals into gtmos_deal_workspaces with the judgment fields", () => {
        const s = new FakeStorage();
        writeSeedingDraft(
            draftOf({
                deals: [
                    {
                        id: "d0",
                        account: "Northwind",
                        value: 120000,
                        stage: "proposal",
                        champion: "VP Legal Ops",
                        whoSigns: "",
                        stuck: "silent 18 days"
                    }
                ]
            }),
            [],
            { storage: s, now: 1 }
        );
        const deals = s.json("gtmos_deal_workspaces") as Array<{
            accountName: string;
            economicBuyer: string;
            notes: string;
        }>;
        expect(deals).toHaveLength(1);
        expect(deals[0]!.accountName).toBe("Northwind");
        expect(deals[0]!.notes).toBe("silent 18 days");
    });

    it("writes quota inputs + marks onboarding complete", () => {
        const s = new FakeStorage();
        writeSeedingDraft(draftOf({ annualQuota: 1_200_000, avgDeal: 50_000 }), [], { storage: s, now: 1 });
        const qw = s.json("gtmos_qw_inputs") as { quota: number; acv: number };
        expect(qw.quota).toBe(1_200_000);
        expect(qw.acv).toBe(50_000);
        const ob = s.json("gtmos_onboarding") as { completed: boolean };
        expect(ob.completed).toBe(true);
        expect(s.getItem("gtmos_onboarding_completed_at")).not.toBeNull();
    });

    it("merges, does not clobber, existing accounts", () => {
        const s = new FakeStorage();
        s.setItem("gtmos_sc_v4", JSON.stringify({ accounts: [{ id: "old", name: "Legacy Co" }] }));
        writeSeedingDraft(draftOf({ accountNames: ["Northwind"] }), [{ name: "Northwind", signal: "", heat: 50, cold: false }], { storage: s, now: 1 });
        const sc = s.json("gtmos_sc_v4") as { accounts: Array<{ name: string }> };
        const names = sc.accounts.map((a) => a.name);
        expect(names).toContain("Legacy Co");
        expect(names).toContain("Northwind");
    });
});
