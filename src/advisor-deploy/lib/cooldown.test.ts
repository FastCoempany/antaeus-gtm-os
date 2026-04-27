import { describe, expect, it } from "vitest";
import { daysSince, getCooldownStatus } from "./cooldown";
import type { Advisor, Deployment } from "./types";

function makeAdvisor(p: Partial<Advisor>): Advisor {
    return {
        id: p.id ?? "adv-1",
        name: p.name ?? "Sarah",
        title: p.title ?? "",
        tier: p.tier ?? "t2",
        expertise: "",
        equity: "",
        companies: [],
        notes: "",
        relationship: "active",
        createdAt: "2026-01-01T00:00:00Z"
    };
}

function makeDeployment(p: Partial<Deployment>): Deployment {
    return {
        id: p.id ?? "dep-1",
        dealId: "",
        dealName: "",
        dealStage: "",
        advisorId: p.advisorId ?? "adv-1",
        advisorName: "",
        momentId: "intro",
        momentName: "",
        ask: "",
        forwardableNote: "",
        outcome: "pending",
        notes: "",
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z",
        outcomeDate: null
    };
}

const DAY = 86400000;

describe("daysSince", () => {
    it("returns 999 when iso is empty / unparseable", () => {
        expect(daysSince("")).toBe(999);
        expect(daysSince("not-a-date")).toBe(999);
    });

    it("returns floor of (now - iso) / day", () => {
        const now = Date.parse("2026-04-27T00:00:00Z");
        expect(daysSince("2026-04-27T00:00:00Z", now)).toBe(0);
        expect(daysSince("2026-04-26T00:00:00Z", now)).toBe(1);
        expect(daysSince("2026-04-20T00:00:00Z", now)).toBe(7);
    });

    it("clamps to 0 for future iso", () => {
        const now = Date.parse("2026-04-27T00:00:00Z");
        expect(daysSince("2026-05-27T00:00:00Z", now)).toBe(0);
    });
});

describe("getCooldownStatus", () => {
    const now = Date.parse("2026-04-27T00:00:00Z");

    it("returns Available with no prior deployments", () => {
        const adv = makeAdvisor({ id: "a" });
        const result = getCooldownStatus(adv, [], now);
        expect(result).toEqual({
            ok: true,
            label: "Available",
            daysRemaining: 0
        });
    });

    it("returns Available when latest deployment is past the cooldown window", () => {
        const adv = makeAdvisor({ id: "a", tier: "t2" }); // 30d
        const deps = [
            makeDeployment({
                advisorId: "a",
                createdAt: new Date(now - 31 * DAY).toISOString()
            })
        ];
        expect(getCooldownStatus(adv, deps, now).ok).toBe(true);
    });

    it("returns Cooling Xd when within cooldown window", () => {
        const adv = makeAdvisor({ id: "a", tier: "t2" }); // 30d
        const deps = [
            makeDeployment({
                advisorId: "a",
                createdAt: new Date(now - 5 * DAY).toISOString()
            })
        ];
        const result = getCooldownStatus(adv, deps, now);
        expect(result.ok).toBe(false);
        expect(result.label).toMatch(/^Cooling \d+d$/);
        expect(result.daysRemaining).toBe(25);
    });

    it("respects per-tier cooldownDays (t1=90, t3=14)", () => {
        const t1 = makeAdvisor({ id: "a", tier: "t1" });
        const t3 = makeAdvisor({ id: "b", tier: "t3" });
        const at20 = [
            makeDeployment({
                advisorId: "a",
                createdAt: new Date(now - 20 * DAY).toISOString()
            })
        ];
        // t1 (90d): still cooling at 20d in
        expect(getCooldownStatus(t1, at20, now).ok).toBe(false);
        // t3 (14d): available at 20d in
        const at20b = [
            makeDeployment({
                advisorId: "b",
                createdAt: new Date(now - 20 * DAY).toISOString()
            })
        ];
        expect(getCooldownStatus(t3, at20b, now).ok).toBe(true);
    });

    it("only considers deployments matching the advisor's id", () => {
        const adv = makeAdvisor({ id: "a", tier: "t2" });
        const deps = [
            makeDeployment({
                advisorId: "other",
                createdAt: new Date(now - 1 * DAY).toISOString()
            })
        ];
        expect(getCooldownStatus(adv, deps, now).ok).toBe(true);
    });

    it("uses the most-recent deployment when multiple exist", () => {
        const adv = makeAdvisor({ id: "a", tier: "t2" });
        const deps = [
            makeDeployment({
                advisorId: "a",
                createdAt: new Date(now - 60 * DAY).toISOString()
            }),
            makeDeployment({
                advisorId: "a",
                createdAt: new Date(now - 5 * DAY).toISOString()
            })
        ];
        expect(getCooldownStatus(adv, deps, now).ok).toBe(false);
    });
});
