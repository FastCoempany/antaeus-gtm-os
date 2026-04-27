import { describe, expect, it } from "vitest";
import {
    autopsyUniverseScore,
    generateAutopsy,
    killSwitchFor,
    rankAutopsyUniverse
} from "./autopsy";
import { computeVitals, DEFAULT_PREFS } from "./vitals";
import type { Deal } from "@/deal-workspace/lib/deal-shape";

const NOW = new Date("2026-04-26T12:00:00Z").getTime();

function daysAgo(days: number): string {
    return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();
}

function deal(partial: Partial<Deal>): Deal {
    return {
        id: partial.id ?? "d",
        accountName: partial.accountName ?? "Acme",
        value: partial.value ?? 50000,
        stage: partial.stage ?? "discovery",
        ...partial
    };
}

const STORAGE = null;

describe("generateAutopsy", () => {
    it("emits AutopsyDoc with all required slots populated", () => {
        const v = computeVitals(deal({ updated_at: daysAgo(20) }), {
            now: NOW,
            storage: STORAGE
        });
        const doc = generateAutopsy(v);
        expect(doc.deal.id).toBe("d");
        expect(doc.horizonDays).toBe(DEFAULT_PREFS.autopsyHorizonDays);
        expect(doc.causes.length).toBeGreaterThan(0);
        expect(doc.chapters.length).toBeGreaterThan(0);
        expect(doc.winConditions.length).toBeGreaterThanOrEqual(5);
        expect(doc.countermeasures.length).toBeGreaterThan(0);
        expect(typeof doc.killSwitch).toBe("string");
        expect(doc.loseStory.length).toBeGreaterThan(0);
        expect(doc.winStory.length).toBeGreaterThan(0);
    });

    it("clips lose/win story to <= 700 chars", () => {
        const v = computeVitals(deal({ updated_at: daysAgo(20) }), {
            now: NOW,
            storage: STORAGE
        });
        const doc = generateAutopsy(v);
        expect(doc.loseStory.length).toBeLessThanOrEqual(700);
        expect(doc.winStory.length).toBeLessThanOrEqual(700);
    });

    it("varies the lose lead by stage + top cause", () => {
        const negVitals = computeVitals(
            deal({ stage: "negotiation", updated_at: daysAgo(20) }),
            { now: NOW, storage: STORAGE }
        );
        const discVitals = computeVitals(
            deal({ stage: "discovery", updated_at: daysAgo(20) }),
            { now: NOW, storage: STORAGE }
        );
        const negDoc = generateAutopsy(negVitals);
        const discDoc = generateAutopsy(discVitals);
        // The two should pull different stage leads.
        expect(negDoc.loseStory).not.toBe(discDoc.loseStory);
    });

    it("countermeasures includes 'Engage 3+ stakeholders' when single_threaded", () => {
        const v = computeVitals(deal({ value: 100000 }), {
            now: NOW,
            storage: STORAGE
        });
        const doc = generateAutopsy(v);
        expect(
            doc.countermeasures.some((t) => t.taskId === "multi_thread")
        ).toBe(true);
    });

    it("respects custom horizonDays override", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: STORAGE });
        const doc = generateAutopsy(v, { horizonDays: 90 });
        expect(doc.horizonDays).toBe(90);
    });
});

describe("killSwitchFor", () => {
    it("recommends close when low value + critically stale + weak qual + high risk", () => {
        const v = computeVitals(
            deal({ value: 10000, updated_at: daysAgo(45) }),
            { now: NOW, storage: STORAGE }
        );
        const result = killSwitchFor(v);
        expect(result).toMatch(/recommend closing/i);
    });

    it("does not recommend close when value is high", () => {
        const v = computeVitals(
            deal({ value: 200000, updated_at: daysAgo(45) }),
            { now: NOW, storage: STORAGE }
        );
        const result = killSwitchFor(v);
        expect(result).toMatch(/not fully met/i);
    });
});

describe("autopsyUniverseScore", () => {
    it("rises with risk + staleness + value", () => {
        const small = computeVitals(
            deal({ id: "small", value: 10000, updated_at: daysAgo(2) }),
            { now: NOW, storage: STORAGE }
        );
        const big = computeVitals(
            deal({ id: "big", value: 200000, updated_at: daysAgo(40) }),
            { now: NOW, storage: STORAGE }
        );
        expect(autopsyUniverseScore(big)).toBeGreaterThan(
            autopsyUniverseScore(small)
        );
    });

    it("amplifies on negotiation/verbal stage", () => {
        const disc = computeVitals(
            deal({ id: "disc", stage: "discovery", updated_at: daysAgo(10) }),
            { now: NOW, storage: STORAGE }
        );
        const neg = computeVitals(
            deal({
                id: "neg",
                stage: "negotiation",
                updated_at: daysAgo(10)
            }),
            { now: NOW, storage: STORAGE }
        );
        expect(autopsyUniverseScore(neg)).toBeGreaterThanOrEqual(
            autopsyUniverseScore(disc)
        );
    });
});

describe("rankAutopsyUniverse", () => {
    it("returns empty when no vitals", () => {
        expect(rankAutopsyUniverse([])).toEqual([]);
    });

    it("excludes closed deals", () => {
        const open = computeVitals(deal({ id: "open" }), {
            now: NOW,
            storage: STORAGE
        });
        const closed = computeVitals(
            deal({ id: "closed", stage: "closed-won" }),
            { now: NOW, storage: STORAGE }
        );
        const out = rankAutopsyUniverse([open, closed]);
        expect(out.map((v) => v.id)).toEqual(["open"]);
    });

    it("orders by score desc; stable on ties", () => {
        const a = computeVitals(
            deal({ id: "a", value: 100000, updated_at: daysAgo(20) }),
            { now: NOW, storage: STORAGE }
        );
        const b = computeVitals(
            deal({ id: "b", value: 30000, updated_at: daysAgo(2) }),
            { now: NOW, storage: STORAGE }
        );
        const out = rankAutopsyUniverse([b, a]);
        expect(out.map((v) => v.id)).toEqual(["a", "b"]);
    });

    it("respects the limit", () => {
        const many = Array.from({ length: 10 }, (_, i) =>
            computeVitals(deal({ id: `v-${i}`, value: 50000 + i * 1000 }), {
                now: NOW,
                storage: STORAGE
            })
        );
        const out = rankAutopsyUniverse(many, { limit: 4 });
        expect(out).toHaveLength(4);
    });
});
