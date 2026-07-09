import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadDealsForLinking, syncProofIntoDeal } from "./deal-sync";
import type { Proof } from "./types";

const DEAL_KEY = "gtmos_deal_workspaces";

function makeProof(partial: Partial<Proof> = {}): Proof {
    return {
        id: partial.id ?? "p-1",
        account: partial.account ?? "Acme",
        vendor: partial.vendor ?? "VendorCo",
        readoutOwner: partial.readoutOwner ?? "Sarah",
        linkedDealId: partial.linkedDealId ?? "d-1",
        linkedDealName: partial.linkedDealName ?? "Acme",
        durationDays: partial.durationDays ?? 7,
        outcome: partial.outcome ?? "in_progress",
        successCriteria: partial.successCriteria ?? "criterion one\ncriterion two\ncriterion three",
        boundaries: partial.boundaries ?? "boundary one\nboundary two",
        qualityScore: partial.qualityScore ?? 75,
        qualityBand: partial.qualityBand ?? "workable",
        docs: partial.docs ?? { scope: "", kickoff: "", readout: "", email: "" },
        updatedAt: partial.updatedAt ?? "2026-04-27T00:00:00Z",
        ...partial
    };
}

describe("loadDealsForLinking", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty array when key is missing", () => {
        expect(loadDealsForLinking()).toEqual([]);
    });

    it("returns empty array on malformed JSON", () => {
        localStorage.setItem(DEAL_KEY, "{not json");
        expect(loadDealsForLinking()).toEqual([]);
    });

    it("returns empty array when value is not an array", () => {
        localStorage.setItem(DEAL_KEY, JSON.stringify({ pocs: [] }));
        expect(loadDealsForLinking()).toEqual([]);
    });

    it("projects camelCase rows to LinkedDealSummary", () => {
        localStorage.setItem(
            DEAL_KEY,
            JSON.stringify([
                {
                    id: "d-1",
                    accountName: "Acme",
                    stage: "negotiation",
                    value: 100000
                }
            ])
        );
        const out = loadDealsForLinking();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("d-1");
        expect(out[0]?.accountName).toBe("Acme");
        expect(out[0]?.stage).toBe("negotiation");
        expect(out[0]?.value).toBe(100000);
    });

    it("accepts snake_case fallbacks", () => {
        localStorage.setItem(
            DEAL_KEY,
            JSON.stringify([
                { id: "d-1", account_name: "Beta", stage: "discovery", deal_value: 50000 }
            ])
        );
        const out = loadDealsForLinking();
        expect(out[0]?.accountName).toBe("Beta");
        expect(out[0]?.value).toBe(50000);
    });

    it("filters rows missing required id or accountName", () => {
        localStorage.setItem(
            DEAL_KEY,
            JSON.stringify([
                { id: "ok", accountName: "Real" },
                { accountName: "no-id" },
                { id: "no-name" },
                null
            ])
        );
        const out = loadDealsForLinking();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("ok");
    });
});

describe("syncProofIntoDeal", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("no-op when proof has no linkedDealId", () => {
        localStorage.setItem(
            DEAL_KEY,
            JSON.stringify([{ id: "d-1", accountName: "Acme" }])
        );
        const before = localStorage.getItem(DEAL_KEY);
        syncProofIntoDeal(makeProof({ linkedDealId: "" }));
        expect(localStorage.getItem(DEAL_KEY)).toBe(before);
    });

    it("no-op when no deal matches the linkedDealId", () => {
        localStorage.setItem(
            DEAL_KEY,
            JSON.stringify([{ id: "d-1", accountName: "Acme" }])
        );
        const before = localStorage.getItem(DEAL_KEY);
        syncProofIntoDeal(makeProof({ linkedDealId: "ghost" }));
        expect(localStorage.getItem(DEAL_KEY)).toBe(before);
    });

    it("writes .poc snapshot into the matching deal", () => {
        localStorage.setItem(
            DEAL_KEY,
            JSON.stringify([
                { id: "d-1", accountName: "Acme", stage: "negotiation" },
                { id: "d-2", accountName: "Beta", stage: "discovery" }
            ])
        );
        syncProofIntoDeal(makeProof({ linkedDealId: "d-1" }));
        const parsed = JSON.parse(localStorage.getItem(DEAL_KEY) ?? "[]");
        expect(parsed[0].poc).toBeDefined();
        expect(parsed[0].poc.score).toBe(75);
        expect(parsed[0].poc.status).toBe("in_progress");
        expect(parsed[0].poc.band).toBe("workable");
        // Other deals untouched.
        expect(parsed[1].poc).toBeUndefined();
    });

    it("preserves other deal fields when writing .poc", () => {
        localStorage.setItem(
            DEAL_KEY,
            JSON.stringify([
                {
                    id: "d-1",
                    accountName: "Acme",
                    stage: "negotiation",
                    nextStep: "Send proposal"
                }
            ])
        );
        syncProofIntoDeal(makeProof({ linkedDealId: "d-1" }));
        const parsed = JSON.parse(localStorage.getItem(DEAL_KEY) ?? "[]");
        expect(parsed[0].nextStep).toBe("Send proposal");
        expect(parsed[0].stage).toBe("negotiation");
    });
});
