import { describe, expect, it, beforeEach } from "vitest";
import type { Focus, TerritoryAccount } from "../../lib/types";
import { resetSession, setAccounts, setFocuses } from "../../state";
import { allocTone, bandTone, fieldRead, tierTone, toPulling } from "./adapters";

function focus(over: Partial<Focus> = {}): Focus {
    return {
        id: "th1",
        title: "Procurement consolidation",
        pressure: "Budgets just got cut",
        segment: "Software (B2B SaaS)",
        whyUs: "We've done this exact migration",
        tier: "t1",
        accountIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...over
    };
}

function account(over: Partial<TerritoryAccount> = {}): TerritoryAccount {
    return {
        id: `acct_${Math.random().toString(36).slice(2)}`,
        name: "Acme Industries",
        tier: "t1",
        focusId: "th1",
        approachId: "",
        disposition: "active",
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...over
    };
}

beforeEach(() => {
    resetSession();
});

describe("tone maps", () => {
    it("bands the field read (green runnable → amber loose → neutral empty)", () => {
        expect(bandTone("runnable")).toBe("green");
        expect(bandTone("tight")).toBe("blue");
        expect(bandTone("loose")).toBe("amber");
        expect(bandTone("empty")).toBeUndefined();
    });
    it("tones the tiers (t1 must-win red → t4 watch neutral)", () => {
        expect(tierTone("t1")).toBe("red");
        expect(tierTone("t2")).toBe("amber");
        expect(tierTone("t3")).toBe("blue");
        expect(tierTone("t4")).toBeUndefined();
    });
    it("tones the 300-cap status", () => {
        expect(allocTone("headroom")).toBe("green");
        expect(allocTone("at-cap")).toBe("amber");
        expect(allocTone("over")).toBe("red");
    });
});

describe("fieldRead", () => {
    it("reads empty when there are no focuses", () => {
        const r = fieldRead();
        expect(r.band).toBe("empty");
        expect(r.operatorMove.toLowerCase()).toContain("focus");
    });
    it("scores up as focuses + active accounts land", () => {
        setFocuses([focus(), focus({ id: "th2", title: "Second bet" }), focus({ id: "th3", title: "Third bet" })]);
        setAccounts(Array.from({ length: 6 }, (_, i) => account({ id: `a${i}` })));
        const r = fieldRead();
        expect(r.band).not.toBe("empty");
        expect(r.score).toBeGreaterThan(30);
    });
});

describe("toPulling", () => {
    it("is absent while the map is theoretical (no accounts)", () => {
        setFocuses([focus()]);
        expect(toPulling("")).toBeUndefined();
    });
    it("routes the territory into sourcing once it has focuses + accounts", () => {
        setFocuses([focus()]);
        setAccounts([account()]);
        const p = toPulling("Software (B2B SaaS)");
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Source prospects");
        expect(p!.object).toBe("Software (B2B SaaS)");
        expect(p!.href).toContain("/sourcing-workbench/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
