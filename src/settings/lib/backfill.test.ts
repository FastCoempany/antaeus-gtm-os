import { describe, it, expect, vi } from "vitest";
import { parseBackfillCsv, splitCsvLine, commitBackfill } from "./backfill";

let mockClient: unknown = null;
vi.mock("@/lib/data-client", () => ({
    createDataClient: () => {
        if (mockClient) return mockClient;
        throw new Error("no env in tests — mirror-only path");
    }
}));

function mem(): { getItem(k: string): string | null; setItem(k: string, v: string): void; data: Record<string, string> } {
    const data: Record<string, string> = {};
    return {
        data,
        getItem: (k) => (k in data ? data[k]! : null),
        setItem: (k, v) => {
            data[k] = v;
        }
    };
}

describe("splitCsvLine", () => {
    it("honors quoted cells with commas", () => {
        expect(splitCsvLine('"Acme, Inc",80000,won')).toEqual(["Acme, Inc", "80000", "won"]);
    });
});

describe("parseBackfillCsv", () => {
    it("reads a tab-delimited paste straight from a spreadsheet", () => {
        const { deals, skipped } = parseBackfillCsv(
            "Account\tDeal Size\tOutcome\tClose Date\n" +
                "Northwind\t$80,000\tWon\t2026-03-04\n" +
                "Apex\t64000\tLost\t2026-04-18"
        );
        expect(skipped).toEqual([]);
        expect(deals).toHaveLength(2);
        expect(deals[0]).toMatchObject({ accountName: "Northwind", value: 80_000, won: true });
    });

    it("reads a headered sheet with money formatting", () => {
        const { deals, skipped } = parseBackfillCsv(
            "Account,Deal Size,Outcome,Close Date,Loss Reason\n" +
                'Northwind,"$80,000",Won,2026-03-04,\n' +
                "Apex Mfg,64000,Lost,2026-04-18,went with a competitor\n"
        );
        expect(skipped).toEqual([]);
        expect(deals).toHaveLength(2);
        expect(deals[0]).toMatchObject({ accountName: "Northwind", value: 80_000, won: true, closeDate: "2026-03-04" });
        expect(deals[1]).toMatchObject({ won: false, lossReason: "competitor", lossNotes: "went with a competitor" });
    });

    it("reads a bare sheet with no header in the fixed order", () => {
        const { deals } = parseBackfillCsv("Globex,120000,won,2026-01-10\nInitech,40000,lost,,no decision");
        expect(deals).toHaveLength(2);
        expect(deals[1]!.lossReason).toBe("no_decision");
    });

    it("reports unreadable rows by line, never silently", () => {
        const { deals, skipped } = parseBackfillCsv("account,outcome\nAcme,maybe\n,won");
        expect(deals).toHaveLength(0);
        expect(skipped).toHaveLength(2);
        expect(skipped[0]!.reason).toContain("won/lost");
        expect(skipped[1]!.reason).toContain("account");
    });

    it("a blank value cell is unreadable — never a $0 deal", () => {
        const { deals, skipped } = parseBackfillCsv("account,value,outcome\nAcme,,won\nGlobex,   ,lost");
        expect(deals).toHaveLength(0);
        expect(skipped).toHaveLength(2);
        expect(skipped[0]!.reason).toContain("value");
    });

    it("bare Yes/No outcome columns read as won/lost", () => {
        const { deals } = parseBackfillCsv("account,value,won?\nAcme,10000,Yes\nGlobex,20000,No");
        expect(deals.map((d) => d.won)).toEqual([true, false]);
    });

    it("maps loss reasons by keyword and keeps the raw words", () => {
        const { deals } = parseBackfillCsv(
            "account,value,outcome,date,reason\nA,10000,lost,,budget freeze\nB,10000,lost,,champion left the company\nC,10000,lost,,pushed to next year"
        );
        expect(deals.map((d) => d.lossReason)).toEqual(["budget", "champion_left", "timing"]);
    });
});

describe("commitBackfill", () => {
    it("appends to the deal mirror and dedupes on re-paste", async () => {
        const s = mem();
        const { deals } = parseBackfillCsv("Northwind,80000,won,2026-03-04");
        const first = await commitBackfill(deals, s);
        expect(first.written).toBe(1);
        const again = await commitBackfill(deals, s);
        expect(again.written).toBe(0);
        expect(again.duplicates).toBe(1);
        const mirror = JSON.parse(s.data["gtmos_deal_workspaces"]!) as Array<{
            stage: string;
            accountName: string;
            created_at?: string;
            updated_at?: string;
        }>;
        expect(mirror).toHaveLength(1);
        expect(mirror[0]).toMatchObject({ accountName: "Northwind", stage: "closed-won" });
        // Stamped with the close date so the pace/believability reads
        // land the win in the right month.
        expect(mirror[0]!.created_at).toContain("2026-03-04");
        expect(mirror[0]!.updated_at).toContain("2026-03-04");
    });

    it("cloud inserts carry the close-date stamps", async () => {
        const s = mem();
        const inserted: Array<Record<string, unknown>> = [];
        mockClient = {
            deals: {
                list: async () => [],
                insert: async (row: Record<string, unknown>) => {
                    inserted.push(row);
                    return { id: "cloud-1" };
                }
            }
        };
        try {
            const { deals } = parseBackfillCsv("Northwind,80000,won,2026-03-04");
            await commitBackfill(deals, s);
            expect(inserted).toHaveLength(1);
            expect(String(inserted[0]!["created_at"])).toContain("2026-03-04");
            expect(String(inserted[0]!["updated_at"])).toContain("2026-03-04");
        } finally {
            mockClient = null;
        }
    });

    it("dedupes against cloud rows even when the device mirror is empty", async () => {
        const s = mem();
        mockClient = {
            deals: {
                list: async () => [{ account_name: "Northwind", close_date: "2026-03-04" }],
                insert: async () => ({ id: "cloud-1" })
            }
        };
        try {
            const { deals } = parseBackfillCsv("Northwind,80000,won,2026-03-04");
            const r = await commitBackfill(deals, s);
            expect(r.written).toBe(0);
            expect(r.duplicates).toBe(1);
        } finally {
            mockClient = null;
        }
    });

    it("dedupes against deals inside a migrated passthrough blob", async () => {
        const s = mem();
        mockClient = {
            deals: {
                list: async () => [
                    {
                        account_name: null,
                        close_date: null,
                        data: {
                            migrated_from_localstorage: {
                                gtmos_deal_workspaces: [{ accountName: "Northwind", closeDate: "2026-03-04" }]
                            }
                        }
                    }
                ],
                insert: async () => ({ id: "cloud-1" })
            }
        };
        try {
            const { deals } = parseBackfillCsv("Northwind,80000,won,2026-03-04");
            const r = await commitBackfill(deals, s);
            expect(r.written).toBe(0);
            expect(r.duplicates).toBe(1);
        } finally {
            mockClient = null;
        }
    });

    it("preserves deals already in the mirror", async () => {
        const s = mem();
        s.data["gtmos_deal_workspaces"] = JSON.stringify([{ id: "d1", accountName: "Existing", stage: "discovery", value: 5 }]);
        const { deals } = parseBackfillCsv("Apex,64000,lost,2026-04-18,competitor");
        await commitBackfill(deals, s);
        const mirror = JSON.parse(s.data["gtmos_deal_workspaces"]!) as unknown[];
        expect(mirror).toHaveLength(2);
    });
});
