import { describe, expect, it } from "vitest";
import { getProspectQuality } from "./quality";
import type { Prospect } from "./types";

function makeProspect(p: Partial<Prospect>): Prospect {
    return {
        id: p.id ?? "pr_1",
        accountName: p.accountName ?? "Acme",
        contactName: p.contactName ?? "",
        contactTitle: p.contactTitle ?? "",
        sourceQueryId: p.sourceQueryId ?? "",
        leverage: p.leverage ?? "cold",
        stage: p.stage ?? "captured",
        entryPoint: p.entryPoint ?? "",
        approach: p.approach ?? "",
        notes: p.notes ?? "",
        createdAt: p.createdAt ?? "2026-04-28T00:00:00Z",
        updatedAt: p.updatedAt ?? "2026-04-28T00:00:00Z"
    };
}

describe("getProspectQuality", () => {
    it("bare prospect (cold + only account) lands captured", () => {
        const q = getProspectQuality(makeProspect({}));
        expect(q.score).toBeGreaterThan(0);
        expect(q.score).toBeLessThan(55);
        expect(q.band).toBe("captured");
        expect(q.recommendedStage).toBe("captured");
    });

    it("network leverage adds 12 points + reason", () => {
        const cold = getProspectQuality(makeProspect({ leverage: "cold" }));
        const network = getProspectQuality(
            makeProspect({ leverage: "network-connection" })
        );
        expect(network.score).toBeGreaterThan(cold.score);
        expect(network.reasons.some((r) => /network/.test(r))).toBe(true);
    });

    it("full data unlocks ready band", () => {
        const q = getProspectQuality(
            makeProspect({
                accountName: "Meridian",
                contactName: "Sarah Chen",
                contactTitle: "VP Operations",
                leverage: "existing-proof-point",
                entryPoint: "Warm intro from advisor",
                approach: "Lead with EU compliance",
                notes:
                    "She led a similar EU compliance build at her last shop and is now scaling Meridian."
            })
        );
        expect(q.score).toBeGreaterThanOrEqual(80);
        expect(q.band).toBe("ready");
    });

    it("middle quality lands researched", () => {
        const q = getProspectQuality(
            makeProspect({
                accountName: "Acme",
                contactName: "Sarah",
                leverage: "market-signal",
                entryPoint: "Cold email"
            })
        );
        expect(q.score).toBeGreaterThanOrEqual(55);
        expect(q.score).toBeLessThan(80);
        expect(q.band).toBe("researched");
    });

    it("notes between 1 and 39 chars give partial credit + a gap", () => {
        const q = getProspectQuality(makeProspect({ notes: "short notes" }));
        expect(q.gaps.some((g) => /thin/i.test(g))).toBe(true);
    });

    it("score is clamped to 100", () => {
        const q = getProspectQuality(
            makeProspect({
                accountName: "Acme",
                contactName: "Sarah",
                contactTitle: "VP Ops",
                leverage: "network-connection",
                entryPoint: "x",
                approach: "y",
                notes: "z".repeat(100)
            })
        );
        expect(q.score).toBeLessThanOrEqual(100);
    });

    it("missing fields appear in gaps", () => {
        const q = getProspectQuality(makeProspect({ accountName: "" }));
        expect(q.gaps.some((g) => /Account/i.test(g))).toBe(true);
        expect(q.gaps.some((g) => /Contact name/i.test(g))).toBe(true);
        expect(q.gaps.some((g) => /Entry point/i.test(g))).toBe(true);
    });
});
