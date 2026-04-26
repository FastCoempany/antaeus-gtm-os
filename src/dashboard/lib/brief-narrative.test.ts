import { describe, expect, it } from "vitest";
import { buildBriefNarrative } from "./brief-narrative";
import {
    buildCommandObjects,
    summarizeCommandContext
} from "./command-intelligence";
import type { CommandEngineInput, RawCommandCard } from "./types";

function summarize(input: Partial<CommandEngineInput>) {
    return summarizeCommandContext(
        buildCommandObjects({
            riskCards: [],
            moveCards: [],
            healthSummaries: {},
            ...input
        })
    );
}

const riskCard: RawCommandCard = {
    title: "Acme proposal stalled",
    badge: "70",
    meta: ["$250k", "stale 22"],
    actions: [
        { label: "Open deal", href: "/app/deal-workspace/", roomLabel: "Deal Workspace" }
    ]
};

const moveCard: RawCommandCard = {
    title: "Outbound to fintech wedge",
    badge: "Now",
    meta: ["heat 70"],
    actions: [
        { label: "Open Signal Console", href: "/app/signal-console/", roomLabel: "Signal Console" }
    ]
};

describe("buildBriefNarrative", () => {
    it("returns the empty narrative when nothing is ranked", () => {
        const summary = summarize({});
        const n = buildBriefNarrative(summary);
        expect(n.headline).toMatch(/nothing under pressure/i);
        expect(n.sentences.length).toBeGreaterThanOrEqual(1);
        expect(n.insight).toBe("");
    });

    it("composes a 2-4 sentence narrative from a populated summary", () => {
        const summary = summarize({
            riskCards: [riskCard],
            moveCards: [moveCard]
        });
        const n = buildBriefNarrative(summary);
        expect(n.headline).toBe(summary.spotlight?.title);
        expect(n.sentences.length).toBeGreaterThanOrEqual(2);
        expect(n.sentences.length).toBeLessThanOrEqual(5);
        expect(n.insight.length).toBeGreaterThan(0);
    });

    it("the first sentence references the spotlight family + title", () => {
        const summary = summarize({ riskCards: [riskCard] });
        const n = buildBriefNarrative(summary);
        expect(n.sentences[0]).toContain(summary.spotlight!.roomFamilyLabel);
    });

    it("composition sentence pluralizes correctly", () => {
        const summary = summarize({
            riskCards: [
                { ...riskCard, title: "Acme A" },
                { ...riskCard, title: "Acme B" }
            ]
        });
        const n = buildBriefNarrative(summary);
        expect(n.sentences.some((s) => /2 deals/.test(s))).toBe(true);
    });

    it("insight is the spotlight's brief-mode explanation copy", () => {
        const summary = summarize({ riskCards: [riskCard] });
        const n = buildBriefNarrative(summary);
        expect(n.insight.endsWith(".")).toBe(true);
    });
});
