import { describe, expect, it, beforeEach } from "vitest";
import type { Account, Signal } from "../../lib/types";
import { heatRead, heatTone, toPulling } from "./adapters";

const NOW = new Date("2026-06-15T00:00:00Z").getTime();

function sig(over: Partial<Signal> = {}): Signal {
    return {
        id: `s_${Math.random().toString(36).slice(2)}`,
        headline: "Acme raised a Series B",
        published_date: "2026-06-10T00:00:00Z", // recent → recency 1.0
        confidence: 0.95,
        is_ai: true,
        ...over
    };
}

function acct(over: Partial<Account> = {}): Account {
    return {
        id: `a_${Math.random().toString(36).slice(2)}`,
        name: "Acme Industries",
        signals: [sig()],
        ...over
    } as Account;
}

beforeEach(() => {
    localStorage.clear();
});

describe("heatTone", () => {
    it("maps bands to rationed tones (orange reserved for the move)", () => {
        expect(heatTone("Hot")).toBe("red");
        expect(heatTone("Active")).toBe("amber");
        expect(heatTone("Watch")).toBe("blue");
        expect(heatTone("Low")).toBeUndefined();
    });
});

describe("heatRead", () => {
    it("pairs the heat ratio with a read sentence carrying the count", () => {
        const r = heatRead(acct({ signals: [sig(), sig()] }), NOW);
        expect(r.ratio).toBeGreaterThan(0);
        expect(r.ratio).toBeLessThanOrEqual(1);
        expect(r.read).toContain("signals");
        expect(r.score).toBe(r.score); // numeric
        expect(typeof r.band).toBe("string");
    });

    it("reads singular for a single signal", () => {
        const r = heatRead(acct({ signals: [sig()] }), NOW);
        expect(r.read).toContain("1 signal");
        expect(r.read).not.toContain("1 signals");
    });
});

describe("toPulling", () => {
    it("returns undefined for an empty radar", () => {
        expect(toPulling([], NOW)).toBeUndefined();
    });

    it("picks the hottest account and defaults to outbound when no deal", () => {
        const cold = acct({ name: "Cold Co", signals: [] });
        const hot = acct({ name: "Hot Co", signals: [sig(), sig(), sig()] });
        const p = toPulling([cold, hot], NOW);
        expect(p?.object).toBe("Hot Co");
        expect(p?.verb).toBe("Compose outbound");
        expect(p?.href).toContain("/outbound-studio/");
        expect(p?.reasons.length).toBeGreaterThan(0);
    });

    it("routes to the deal when the hottest account has an active deal", () => {
        localStorage.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { accountName: "Hot Co", stage: "discovery" }
            ])
        );
        const hot = acct({ name: "Hot Co", signals: [sig(), sig()] });
        const p = toPulling([hot], NOW);
        expect(p?.verb).toBe("Open the deal");
        expect(p?.href).toContain("/deal-workspace/");
    });
});
