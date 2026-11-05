import { describe, expect, it } from "vitest";
import { buildAttentionField, classifyBand, freshestDays } from "./attention";
import type { Account, Signal } from "../../lib/types";

const NOW = Date.parse("2026-07-08T12:00:00Z");
const DAY = 86_400_000;

function sig(daysAgo: number, ai = true): Signal {
    return {
        id: `s_${daysAgo}`,
        headline: "Something moved",
        source: "Press",
        published_date: new Date(NOW - daysAgo * DAY).toISOString(),
        ai,
        confidence: 0.95
    };
}

function acct(id: string, signals: Signal[], createdDaysAgo = 100): Account {
    return {
        id,
        name: id,
        signals,
        heat: 0,
        aiCount: 0,
        created_at: new Date(NOW - createdDaysAgo * DAY).toISOString(),
        updated_at: new Date(NOW).toISOString()
    } as Account;
}

describe("classifyBand", () => {
    it("puts a hot, fresh account in 'act now'", () => {
        // 3 recent AI signals → high heat; freshest ≤ 2 days
        const a = acct("hot", [sig(0), sig(0), sig(1), sig(1), sig(2)]);
        expect(classifyBand(a, NOW)).toBe("now");
    });

    it("puts a hot but aging account in 'reach while warm'", () => {
        // enough signals for heat ≥ 60 but freshest > 2 days
        const a = acct("warm", [sig(5), sig(6), sig(7), sig(8)]);
        const band = classifyBand(a, NOW);
        expect(["warm", "emerging"]).toContain(band);
    });

    it("puts a brand-new watch (no signals) in 'emerging', never 'going cold'", () => {
        const a = acct("new", [], 0); // created just now, no signals
        expect(classifyBand(a, NOW)).toBe("emerging");
    });

    it("puts an old, quiet account in 'going cold'", () => {
        const a = acct("old", [sig(40)], 400);
        expect(classifyBand(a, NOW)).toBe("cold");
    });
});

describe("freshestDays", () => {
    it("uses the freshest of signals + created_at", () => {
        const a = acct("x", [sig(10)], 3);
        // created 3d ago beats the 10d signal
        expect(Math.round(freshestDays(a, NOW) ?? -1)).toBe(3);
    });
});

describe("buildAttentionField", () => {
    it("groups the field, computes the shape + posture + health", () => {
        const field = buildAttentionField(
            [
                acct("Snowflake", [sig(0), sig(0), sig(1), sig(1), sig(2)]), // now
                acct("New Co", [], 0), // emerging (fresh watch)
                acct("Stale Co", [sig(60)], 400) // cold
            ],
            NOW
        );
        expect(field.accountsWatched).toBe(3);
        expect(field.shape.now).toBe(1);
        expect(field.shape.emerging).toBe(1);
        expect(field.shape.cold).toBe(1);
        expect(field.posture).toContain("high priority");
        expect(field.needNow).toBe(1);
        // bands only surface non-empty in the render, but the field
        // exposes all four counts
        expect(field.bands).toHaveLength(4);
    });

    it("reads research-heavy posture when nothing needs action now", () => {
        const field = buildAttentionField([acct("Quiet", [sig(40)], 400)], NOW);
        expect(field.needNow).toBe(0);
        expect(field.posture).not.toContain("high priority");
    });
});

describe("buildAttentionField — counts agree with each other", () => {
    it("the 'priority 60 or more' count equals the high-priority + priority-declining groups", () => {
        const field = buildAttentionField(
            [
                acct("Hot", [sig(0), sig(0), sig(1), sig(1), sig(2)]),
                acct("Aging", [sig(5), sig(6), sig(7), sig(8)]),
                acct("Just added", [], 0),
                acct("Quiet", [sig(40)], 400)
            ],
            NOW
        );
        expect(field.compounding).toBe(field.shape.now + field.shape.warm);
        expect(field.shape.now + field.shape.warm + field.shape.emerging + field.shape.cold).toBe(field.accountsWatched);
    });

    it("labels the recent group as new signals OR newly watched, since a just-added account with no signals lands there", () => {
        const field = buildAttentionField([acct("Just added", [], 0)], NOW);
        expect(field.shape.emerging).toBe(1);
        expect(field.signalsThisWeek).toBe(0);
        const band = field.bands.find((b) => b.key === "emerging")!;
        expect(band.label).toBe("New signal or newly watched");
        expect(band.why).toContain("added to the watchlist in the last 7 days");
    });
});
