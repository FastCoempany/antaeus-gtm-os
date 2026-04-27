import { describe, expect, it } from "vitest";
import { loadDealOptions } from "./deal-loader";

class MemStorage {
    private store = new Map<string, string>();
    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
}

describe("loadDealOptions", () => {
    it("returns [] when storage is null or empty", () => {
        expect(loadDealOptions(null)).toHaveLength(0);
        expect(loadDealOptions(new MemStorage())).toHaveLength(0);
    });

    it("returns [] on malformed JSON", () => {
        const s = new MemStorage();
        s.seed("gtmos_deal_workspaces", "{not json");
        expect(loadDealOptions(s)).toHaveLength(0);
    });

    it("projects valid deals from the array shape", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([
                {
                    id: "d1",
                    accountName: "Acme",
                    value: 50000,
                    stage: "demo"
                },
                {
                    id: "d2",
                    accountName: "Beta",
                    value: 30000,
                    stage: "prospect"
                }
            ])
        );
        const out = loadDealOptions(s);
        expect(out).toHaveLength(2);
        expect(out[0]?.accountName).toBe("Acme");
        expect(out[1]?.stage).toBe("prospect");
    });

    it("supports the legacy object-of-deals shape (Object.values fallback)", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify({
                "deal-x": { id: "x", accountName: "Beta", stage: "demo" },
                "deal-y": { id: "y", accountName: "Gamma", stage: "lost" }
            })
        );
        const out = loadDealOptions(s);
        expect(out.map((d) => d.id).sort()).toEqual(["x", "y"]);
    });

    it("falls back to snake_case `account_name`", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([{ id: "d", account_name: "Acme" }])
        );
        expect(loadDealOptions(s)[0]?.accountName).toBe("Acme");
    });

    it("drops rows missing id or accountName", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { id: "", accountName: "NoId" },
                { id: "no-name", accountName: "" },
                { id: "good", accountName: "Acme" },
                null
            ])
        );
        expect(loadDealOptions(s).map((d) => d.id)).toEqual(["good"]);
    });

    it("defaults stage to 'prospect' when missing", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([{ id: "d", accountName: "Acme" }])
        );
        expect(loadDealOptions(s)[0]?.stage).toBe("prospect");
    });
});
