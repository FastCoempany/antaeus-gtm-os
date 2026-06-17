import { describe, expect, it, beforeEach } from "vitest";
import { __resetForTests, setSectionsInput } from "../../state";
import { sectionCounts, statusTone, surpriseTone, toPulling } from "./adapters";
import type { SectionsInput } from "../../lib/types";

function richInput(): SectionsInput {
    const won = Array.from({ length: 3 }, (_, i) => ({
        id: `w${i}`,
        accountName: `Won ${i}`,
        stage: "closed-won",
        value: 80000,
        nextStep: "",
        icpLabel: "Mid-market ops",
        persona: "ops",
        trigger: "New CFO",
        lossReason: "",
        closeDate: "2026-05-01",
        createdAt: "2026-02-01"
    }));
    return {
        icps: [
            { id: "i1", name: "Mid-market ops", persona: "ops", trigger: "New CFO", worked: true, qualityScore: 88 }
        ],
        closedWon: won,
        closedLost: [],
        openDeals: [],
        touches: [],
        cues: [],
        coldCalls: [],
        callPlanner: [],
        autopsies: [],
        autopsySnapshots: [],
        proofs: [],
        advisorDeployments: [],
        quota: { quota: 1200000, acv: 60000, winRate: 20, cycle: 90 },
        discoveryCalls: [],
        discoveryStats: null,
        discoveryWorked: []
    };
}

beforeEach(() => {
    __resetForTests();
});

describe("tone maps", () => {
    it("tones the section status", () => {
        expect(statusTone("ready")).toBe("green");
        expect(statusTone("partial")).toBe("amber");
        expect(statusTone("empty")).toBeUndefined();
    });
    it("tones the surprise callouts", () => {
        expect(surpriseTone("corrective")).toBe("amber");
        expect(surpriseTone("affirming")).toBe("green");
        expect(surpriseTone("neutral")).toBe("blue");
    });
});

describe("sectionCounts", () => {
    it("counts seven sections with an empty workspace", () => {
        const c = sectionCounts();
        expect(c.ready + c.partial + c.empty).toBe(7);
    });
    it("lights up sections as evidence arrives", () => {
        setSectionsInput(richInput());
        const c = sectionCounts();
        expect(c.ready).toBeGreaterThan(0);
    });
});

describe("toPulling", () => {
    it("is absent until at least one section is ready", () => {
        expect(toPulling()).toBeUndefined();
    });
    it("routes to the Dashboard once a section is ready", () => {
        setSectionsInput(richInput());
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.verb).toBe("Open the dashboard");
        // The pulling href threads the continuity params back to the kit
        // room, same as the HandoffStrip routes.
        const u = new URL(p!.href, "http://x");
        expect(u.pathname).toBe("/dashboard/");
        expect(u.searchParams.get("returnTo")).toBe("/founding-gtm/");
        expect(u.searchParams.get("fromSurface")).toBe("founding-gtm");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});
