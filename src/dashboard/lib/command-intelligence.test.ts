import { describe, expect, it } from "vitest";
import {
    buildCommandObjects,
    explainCommandObject,
    rankCommandObjects,
    summarizeCommandContext
} from "./command-intelligence";
import type { CommandEngineInput, RawCommandCard } from "./types";

function input(partial: Partial<CommandEngineInput> = {}): CommandEngineInput {
    return {
        riskCards: [],
        moveCards: [],
        healthSummaries: {},
        ...partial
    };
}

const acmeRiskCard: RawCommandCard = {
    title: "Acme — proposal stalled",
    badge: "70",
    meta: ["$250k", "stale 22"],
    actions: [
        { label: "Open deal", href: "/app/deal-workspace/", roomLabel: "Deal Workspace" }
    ]
};

const coverageMoveCard: RawCommandCard = {
    title: "Outbound to fintech wedge",
    badge: "Now",
    meta: ["heat 70"],
    actions: [{ label: "Open Signal Console", href: "/app/signal-console/", roomLabel: "Signal Console" }],
    rankingSignals: { causeId: "coverage_gap", highConfidenceCount: 3 }
};

describe("buildCommandObjects", () => {
    it("returns empty array when no inputs and no fallback", () => {
        const out = buildCommandObjects(input());
        expect(out).toHaveLength(0);
    });

    it("emits a risk-family object for a risk card", () => {
        const out = buildCommandObjects(input({ riskCards: [acmeRiskCard] }));
        expect(out).toHaveLength(1);
        expect(out[0]?.commandFamily).toBe("risk");
        expect(out[0]?.title).toBe("Acme — proposal stalled");
        expect(out[0]?.objectType).toBe("deal");
        expect(out[0]?.score).toBeGreaterThan(0);
        expect(out[0]?.scoreReasons.length).toBeGreaterThan(0);
    });

    it("infers move family from card title (advisor / opportunity / move)", () => {
        const out = buildCommandObjects(
            input({
                moveCards: [
                    { title: "Outbound to fintech wedge" },
                    { title: "Advisor warm intro for Beta Co" },
                    { title: "Tighten next-step lock" }
                ]
            })
        );
        const families = out.map((o) => o.commandFamily).sort();
        expect(families).toEqual(["advisor", "move", "opportunity"]);
    });

    it("dedupes by title (case-insensitive)", () => {
        const out = buildCommandObjects(
            input({
                riskCards: [acmeRiskCard, { ...acmeRiskCard, badge: "60" }]
            })
        );
        expect(out).toHaveLength(1);
    });

    it("appends a system object when dependencyWarnings is non-empty", () => {
        const out = buildCommandObjects(
            input({
                riskCards: [acmeRiskCard],
                dependencyWarnings: ["sync-fallback"]
            })
        );
        expect(out.find((o) => o.commandFamily === "system")).toBeTruthy();
    });

    it("appends an ICP object when context has accounts/signals/deals but no icps", () => {
        const out = buildCommandObjects(
            input({
                riskCards: [acmeRiskCard],
                shellContext: { accounts: 12, signals: 5, deals: 2, icps: 0 }
            })
        );
        expect(out.find((o) => o.commandFamily === "icp")).toBeTruthy();
    });

    it("falls back to primary when no risk/move cards exist", () => {
        const out = buildCommandObjects(
            input({
                primary: { title: "Set the first ICP", label: "Now" }
            })
        );
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("primary-fallback");
    });
});

describe("rankCommandObjects", () => {
    it("orders by score desc, then baseScore, then family priority, then title", () => {
        const out = rankCommandObjects(
            buildCommandObjects(
                input({
                    riskCards: [acmeRiskCard],
                    moveCards: [coverageMoveCard]
                })
            )
        );
        // Both objects survive ranking; ordering monotonically by score.
        expect(out).toHaveLength(2);
        expect(out[0]!.score).toBeGreaterThanOrEqual(out[1]!.score);
    });

    it("breaks family ties by familyPriority", () => {
        // Two objects with identical score but different family.
        // risk priority (5) > opportunity priority (4).
        const a = {
            id: "a",
            commandFamily: "opportunity" as const,
            score: 80,
            baseScore: 80,
            title: "Opportunity"
        } as Parameters<typeof rankCommandObjects>[0][number];
        const b = {
            id: "b",
            commandFamily: "risk" as const,
            score: 80,
            baseScore: 80,
            title: "Risk"
        } as Parameters<typeof rankCommandObjects>[0][number];
        const out = rankCommandObjects([a, b]);
        expect(out[0]?.commandFamily).toBe("risk");
    });

    it("is stable for empty input", () => {
        expect(rankCommandObjects([])).toEqual([]);
    });
});

describe("summarizeCommandContext", () => {
    it("emits spotlight (top-1) + queue (top-N) + per-family slices", () => {
        const objects = buildCommandObjects(
            input({
                riskCards: [acmeRiskCard],
                moveCards: [coverageMoveCard]
            })
        );
        const summary = summarizeCommandContext(objects);
        // Spotlight is the top-ranked object, not the first input.
        const ranked = rankCommandObjects(objects);
        expect(summary.spotlight?.id).toBe(ranked[0]?.id);
        expect(summary.queue.length).toBeLessThanOrEqual(6);
        expect(summary.riskCards.every((o) => o.commandFamily === "risk")).toBe(true);
        expect(
            summary.moveCards.every(
                (o) => o.commandFamily !== "risk" && o.commandFamily !== "system"
            )
        ).toBe(true);
    });

    it("respects custom limit", () => {
        const objects = buildCommandObjects(
            input({
                moveCards: Array.from({ length: 10 }, (_, i) => ({
                    title: `Move ${i}`,
                    badge: "Now"
                }))
            })
        );
        const summary = summarizeCommandContext(objects, { limit: 3 });
        expect(summary.queue.length).toBe(3);
    });
});

describe("explainCommandObject", () => {
    it("emits a 'Why this is here' label in spotlight mode", () => {
        const objects = buildCommandObjects(input({ riskCards: [acmeRiskCard] }));
        const expl = explainCommandObject(objects[0]!, "spotlight");
        expect(expl.label).toBe("Why this is here");
        expect(expl.title.length).toBeGreaterThan(0);
        expect(expl.copy.endsWith(".")).toBe(true);
    });

    it("emits a 'Why this order' label in queue mode", () => {
        const objects = buildCommandObjects(input({ riskCards: [acmeRiskCard] }));
        const expl = explainCommandObject(objects[0]!, "queue");
        expect(expl.label).toBe("Why this order");
    });
});

describe("stability bonus (re-rank smoothing)", () => {
    it("nudges the previous spotlight up", () => {
        const cardA: RawCommandCard = {
            title: "Acme proposal stalled",
            badge: "60",
            meta: ["$120k", "stale 14"],
            actions: [{ label: "Open deal", href: "/app/deal-workspace/", roomLabel: "Deal Workspace" }]
        };
        const cardB: RawCommandCard = {
            title: "Beta proposal stalled",
            badge: "60",
            meta: ["$120k", "stale 14"],
            actions: [{ label: "Open deal", href: "/app/deal-workspace/", roomLabel: "Deal Workspace" }]
        };

        const noPrev = rankCommandObjects(
            buildCommandObjects(input({ riskCards: [cardA, cardB] }))
        );
        const withPrev = rankCommandObjects(
            buildCommandObjects(input({ riskCards: [cardA, cardB] }), {
                previousSnapshot: { spotlightTitle: cardB.title }
            })
        );

        // Without snapshot: alphabetical tiebreak ⇒ Acme first.
        expect(noPrev[0]?.title).toContain("Acme");
        // With snapshot pinning Beta: stability bonus pushes Beta past Acme.
        expect(withPrev[0]?.title).toContain("Beta");
    });
});
