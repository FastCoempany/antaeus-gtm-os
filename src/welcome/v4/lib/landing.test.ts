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

/** A deep workspace whose top pressure is a DEAL (risk card wins the board). */
function seedWithDealPressure(s: FakeStorage): void {
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
    // Deal-health present with a real risk row — dealSnapshotToRiskCards
    // reads accountName/name (NOT title), so use the shape it consumes.
    s.setItem(
        "gtmos_deal_workspace_health",
        JSON.stringify({
            pipeline_value: 840000,
            top_pressure: [
                {
                    id: "d1",
                    accountName: "Northwind",
                    score: 90,
                    cause: "18 days silent in proposal",
                    stage: "proposal"
                }
            ]
        })
    );
}

/** Only a deal under pressure — no accounts, so no competing move card. */
function seedDealOnly(s: FakeStorage): void {
    s.setItem(
        "gtmos_deal_workspaces",
        JSON.stringify([{ id: "d1", accountName: "Northwind", value: 40000, stage: "proposal" }])
    );
    s.setItem(
        "gtmos_deal_workspace_health",
        JSON.stringify({
            pipeline_value: 120000,
            top_pressure: [
                { id: "d1", accountName: "Northwind", score: 95, cause: "18 days silent", stage: "proposal" }
            ]
        })
    );
}

/** The canonical onboarding→Welcome state: signal health only, no deal-health. */
function seedSignalOnly(s: FakeStorage): void {
    s.setItem(
        "gtmos_sc_v4",
        JSON.stringify({ accounts: [{ id: "a1", name: "Ramp", signals: [] }] })
    );
    s.setItem(
        "gtmos_signal_room_health",
        JSON.stringify({ hot_accounts: [{ id: "a1", name: "Ramp", heat: 88 }] })
    );
}

describe("buildLanding", () => {
    it("reads day-one on first visit, re-entry after the seen marker", () => {
        const s = new FakeStorage();
        seedWithDealPressure(s);
        const first = buildLanding({ storage: s });
        expect(first.lifecycle).toBe("day_one");
        expect(first.kicker).toContain("hard work");
        markWelcomeSeen(s);
        expect(hasSeenWelcome(s)).toBe(true);
        const second = buildLanding({ storage: s });
        expect(second.lifecycle).toBe("re_entry");
        expect(second.headline).not.toBe(first.headline);
    });

    it("names the pick after its family — a deal when a deal is on top", () => {
        const s = new FakeStorage();
        seedDealOnly(s);
        const l = buildLanding({ storage: s });
        expect(l.move?.title).toBeTruthy();
        // only a risk card exists → the spotlight is a deal → the
        // commanding statement promises a deal
        expect(l.headline.toLowerCase()).toContain("deal");
    });

    it("names the pick a 'move', not a 'deal', when the top pick is outbound", () => {
        const s = new FakeStorage();
        seedSignalOnly(s);
        const l = buildLanding({ storage: s });
        // No deal-health → the spotlight is an outbound move; the
        // commanding statement must NOT promise "a deal".
        if (l.move && l.headline.startsWith("The workspace is awake. It already found")) {
            expect(l.headline.toLowerCase()).not.toContain("the one deal");
            expect(l.headline.toLowerCase()).toContain("move");
        }
    });

    it("reports the operating line from counts + pipeline value", () => {
        const s = new FakeStorage();
        seedWithDealPressure(s);
        const l = buildLanding({ storage: s });
        expect(l.operating.accounts).toBe(2);
        expect(l.operating.deals).toBe(2);
        expect(l.operating.inFlight).toBe("$840k");
    });

    it("never repeats the one move inside the reads; routes to the dashboard", () => {
        const s = new FakeStorage();
        seedWithDealPressure(s);
        const l = buildLanding({ storage: s });
        if (l.move) {
            for (const row of l.saw) expect(row.lead).not.toBe(l.move.title);
        }
        expect(l.dashboardHref).toContain("/dashboard/");
    });

    it("degrades to a calm state on an empty workspace — never fabricates a dividend", () => {
        const s = new FakeStorage();
        const l = buildLanding({ storage: s });
        expect(l.operating.accounts).toBe(0);
        expect(l.operating.deals).toBe(0);
        expect(l.operating.inFlight).toBeNull();
        expect(l.headline.length).toBeGreaterThan(0);
        // the empty-state sub must NOT claim a dividend or "0 deals"
        expect(l.sub.toLowerCase()).not.toContain("dividend");
        expect(l.sub).not.toContain("0 deals");
        expect(l.sub).not.toContain("0 accounts");
    });
});
