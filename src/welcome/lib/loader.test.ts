import { beforeEach, describe, expect, it } from "vitest";
import { loadActivationContext, loadCounts } from "./loader";

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
}

describe("loadCounts", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("empty storage returns zero counts", () => {
        const c = loadCounts(s);
        expect(c.icps).toBe(0);
        expect(c.deals).toBe(0);
        expect(c.signals).toBe(0);
    });

    it("counts ICPs from gtmos_icp_analytics", () => {
        s.setItem(
            "gtmos_icp_analytics",
            JSON.stringify({ icps: [{}, {}, {}] })
        );
        expect(loadCounts(s).icps).toBe(3);
    });

    it("counts deals from array shape", () => {
        s.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([{ id: "d1" }, { id: "d2" }])
        );
        expect(loadCounts(s).deals).toBe(2);
    });

    it("counts deals from object-of-deals shape", () => {
        s.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify({ deals: [{ id: "d1" }] })
        );
        expect(loadCounts(s).deals).toBe(1);
    });

    it("counts signals from gtmos_sc_v4 nested shape", () => {
        s.setItem(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    { id: "a", signals: [{}, {}] },
                    { id: "b", signals: [{}] },
                    { id: "c" }
                ]
            })
        );
        const c = loadCounts(s);
        expect(c.accounts).toBe(3);
        expect(c.signals).toBe(3);
    });

    it("sums outbound + linkedin into touches", () => {
        s.setItem("gtmos_outbound_touches", JSON.stringify({ touches: [{}, {}] }));
        s.setItem("gtmos_linkedin_log", JSON.stringify({ actions: [{}] }));
        expect(loadCounts(s).touches).toBe(3);
    });

    it("reads totalCalls from discovery stats", () => {
        s.setItem(
            "gtmos_discovery_stats",
            JSON.stringify({ totalCalls: 5, advancedCalls: 2 })
        );
        expect(loadCounts(s).calls).toBe(5);
    });

    it("malformed JSON does not throw + falls back", () => {
        s.setItem("gtmos_icp_analytics", "{not json");
        expect(() => loadCounts(s)).not.toThrow();
        expect(loadCounts(s).icps).toBe(0);
    });
});

describe("loadActivationContext", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("returns nulls when no context stored", () => {
        const c = loadActivationContext(s);
        expect(c.companyName).toBeNull();
        expect(c.role).toBeNull();
    });

    it("parses company + role + categoryLabel", () => {
        s.setItem(
            "gtmos_activation_context",
            JSON.stringify({
                company: "Antaeus",
                role: "founder",
                categoryLabel: "Revenue Intelligence AI"
            })
        );
        const c = loadActivationContext(s);
        expect(c.companyName).toBe("Antaeus");
        expect(c.role).toBe("founder");
        expect(c.categoryLabel).toBe("Revenue Intelligence AI");
    });

    it("ignores non-string values", () => {
        s.setItem(
            "gtmos_activation_context",
            JSON.stringify({ company: 42, role: { obj: true } })
        );
        const c = loadActivationContext(s);
        expect(c.companyName).toBeNull();
        expect(c.role).toBeNull();
    });
});
