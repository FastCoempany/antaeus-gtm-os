import { describe, expect, it } from "vitest";
import { loadDeals } from "./deal-loader";

class MemStorage {
    private store = new Map<string, string>();
    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
}

describe("loadDeals", () => {
    it("returns [] when storage is null or key missing", () => {
        expect(loadDeals(null)).toHaveLength(0);
        expect(loadDeals(new MemStorage())).toHaveLength(0);
    });

    it("returns [] when JSON is malformed or wrong shape", () => {
        const s = new MemStorage();
        s.seed("gtmos_deal_workspaces", "{not json");
        expect(loadDeals(s)).toHaveLength(0);
        s.seed("gtmos_deal_workspaces", JSON.stringify({ wrong: "shape" }));
        expect(loadDeals(s)).toHaveLength(0);
    });

    it("drops rows missing id or accountName", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { id: "1", accountName: "Good" },
                { id: "", accountName: "BadId" },
                { id: "2", accountName: "" },
                null
            ])
        );
        expect(loadDeals(s).map((d) => d.id)).toEqual(["1"]);
    });

    it("supports camelCase + snake_case + name fallback for accountName", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { id: "1", accountName: "Camel" },
                { id: "2", account_name: "Snake" },
                { id: "3", name: "FallbackName" }
            ])
        );
        const out = loadDeals(s);
        expect(out.map((d) => d.accountName)).toEqual([
            "Camel",
            "Snake",
            "FallbackName"
        ]);
    });

    it("preserves stage / value / nextStepDate / EB / champion / decisionProcess", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([
                {
                    id: "1",
                    accountName: "Acme",
                    stage: "negotiation",
                    value: 250000,
                    nextStep: "Procurement",
                    nextStepDate: "2026-05-01",
                    economicBuyer: "Pat",
                    champion: "Lee",
                    decisionProcess: "CIO+CFO"
                }
            ])
        );
        const out = loadDeals(s);
        expect(out[0]).toMatchObject({
            stage: "negotiation",
            value: 250000,
            nextStep: "Procurement",
            nextStepDate: "2026-05-01",
            economicBuyer: "Pat",
            champion: "Lee",
            decisionProcess: "CIO+CFO"
        });
    });

    it("parses advisorHistory, dropping malformed rows", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([
                {
                    id: "1",
                    accountName: "Acme",
                    advisorHistory: [
                        {
                            id: "h1",
                            advisorId: "a1",
                            advisorName: "Sarah",
                            momentId: "intro",
                            momentName: "Warm intro",
                            outcome: "successful",
                            createdAt: "2026-04-27T00:00:00Z",
                            outcomeDate: "2026-04-28T00:00:00Z"
                        },
                        { missing: "id" }
                    ]
                }
            ])
        );
        const out = loadDeals(s);
        expect(out[0]?.advisorHistory).toHaveLength(1);
        expect(out[0]?.advisorHistory[0]?.outcome).toBe("successful");
    });
});
