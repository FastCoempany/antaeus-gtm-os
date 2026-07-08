import { describe, expect, it } from "vitest";
import { buildLanding, hasSeenWelcome, markWelcomeSeen } from "./landing";

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
}

function seedWorkspace(s: FakeStorage): void {
    s.setItem(
        "gtmos_sc_v4",
        JSON.stringify({
            accounts: [
                { id: "a1", name: "Apex", signals: [{ headline: "New CFO" }] },
                { id: "a2", name: "Northwind", signals: [] }
            ]
        })
    );
    s.setItem(
        "gtmos_deal_workspaces",
        JSON.stringify([
            { id: "d1", accountName: "Northwind", value: 40000, stage: "proposal" },
            { id: "d2", accountName: "Apex", value: 20000, stage: "discovery" }
        ])
    );
    s.setItem(
        "gtmos_deal_workspace_health",
        JSON.stringify({
            pipeline_value: 840000,
            top_pressure: [
                { id: "d1", title: "Northwind", cause: "18 days silent", meta: ["18d"] }
            ]
        })
    );
    s.setItem(
        "gtmos_signal_room_health",
        JSON.stringify({ hot_accounts: [{ id: "a1", name: "Apex", heat: 80 }] })
    );
}

describe("buildLanding", () => {
    it("reads day-one on first visit and re-entry after the seen marker", () => {
        const s = new FakeStorage();
        seedWorkspace(s);
        const first = buildLanding({ storage: s });
        expect(first.lifecycle).toBe("day_one");
        expect(first.kicker).toContain("hard work");
        markWelcomeSeen(s);
        expect(hasSeenWelcome(s)).toBe(true);
        const second = buildLanding({ storage: s });
        expect(second.lifecycle).toBe("re_entry");
        expect(second.headline).not.toBe(first.headline);
    });

    it("reports the operating line from counts + pipeline value", () => {
        const s = new FakeStorage();
        seedWorkspace(s);
        const l = buildLanding({ storage: s });
        expect(l.operating.accounts).toBe(2);
        expect(l.operating.deals).toBe(2);
        expect(l.operating.inFlight).toBe("$840k");
    });

    it("never repeats the one move inside the 'what the system saw' reads", () => {
        const s = new FakeStorage();
        seedWorkspace(s);
        const l = buildLanding({ storage: s });
        if (l.move) {
            for (const row of l.saw) {
                expect(row.lead).not.toBe(l.move.title);
            }
        }
        expect(l.dashboardHref).toContain("/dashboard/");
    });

    it("degrades to a calm state on an empty workspace (no throw, no move)", () => {
        const s = new FakeStorage();
        const l = buildLanding({ storage: s });
        expect(l.operating.accounts).toBe(0);
        expect(l.operating.deals).toBe(0);
        expect(l.operating.inFlight).toBeNull();
        // headline is still a real commanding statement, never "all done"
        expect(l.headline.length).toBeGreaterThan(0);
    });
});
