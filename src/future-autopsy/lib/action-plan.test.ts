import { describe, expect, it } from "vitest";
import { buildActionPlan } from "./action-plan";
import { generateAutopsy } from "./autopsy";
import { computeVitals } from "./vitals";
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

describe("buildActionPlan", () => {
    it("returns three populated routes", () => {
        const v = computeVitals(deal({ updated_at: daysAgo(20) }), {
            now: NOW,
            storage: null
        });
        const doc = generateAutopsy(v);
        const plan = buildActionPlan(doc);
        expect(plan.primary).not.toBeNull();
        expect(plan.secondary).not.toBeNull();
        expect(plan.tertiary).not.toBeNull();
    });

    it("routes to PoC Framework when stage is poc", () => {
        const v = computeVitals(
            deal({ stage: "poc", updated_at: daysAgo(20) }),
            { now: NOW, storage: null }
        );
        const plan = buildActionPlan(generateAutopsy(v));
        expect(plan.primary?.roomLabel).toBe("PoC Framework");
    });

    it("routes to Call Planner when EB is missing", () => {
        const filled = "x".repeat(40);
        const v = computeVitals(
            deal({
                champion: filled,
                useCase: filled,
                pain: filled,
                decisionProcess: filled,
                competition: filled,
                notes: filled,
                nextStep: "Demo with full agenda for Tuesday meeting",
                nextStepDate: "2026-05-15",
                closeDate: "2026-06-15",
                stakeholders: [
                    { name: "T1", role: "technical", engaged: true },
                    { name: "T2", role: "end_user", engaged: true }
                ]
            }),
            { now: NOW, storage: null }
        );
        const plan = buildActionPlan(generateAutopsy(v));
        // Top cause should be no_eb (since everything else is filled).
        expect(plan.primary?.roomLabel).toBe("Call Planner");
    });

    it("primary CTA carries continuity params", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: null });
        const plan = buildActionPlan(generateAutopsy(v));
        const url = new URL("https://x.com" + plan.primary!.href);
        expect(url.searchParams.get("returnTo")).toBe("/app/future-autopsy/");
        expect(url.searchParams.get("focusObject")).toBe("Acme");
    });

    it("secondary is Discovery when primary is Deal Workspace", () => {
        const v = computeVitals(deal({}), { now: NOW, storage: null });
        const plan = buildActionPlan(generateAutopsy(v));
        if (plan.primary?.roomLabel === "Deal Workspace") {
            expect(plan.secondary?.roomLabel).toBe("Discovery Studio");
        }
    });
});
