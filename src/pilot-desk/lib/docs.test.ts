import { describe, expect, it } from "vitest";
import { generateDocs } from "./docs";
import type { LinkedDealSummary, ProofDraft } from "./types";
import { EMPTY_DRAFT } from "./types";

const NOW = new Date("2026-04-27T00:00:00Z").getTime();

function draft(partial: Partial<ProofDraft> = {}): ProofDraft {
    return { ...EMPTY_DRAFT, ...partial } as ProofDraft;
}

describe("generateDocs", () => {
    it("emits all four documents", () => {
        const docs = generateDocs(draft({}), null, { now: NOW });
        expect(docs.scope).toContain("POC SCOPE");
        expect(docs.kickoff).toContain("POC KICKOFF AGENDA");
        expect(docs.readout).toContain("POC READOUT AGENDA");
        expect(docs.email).toContain("Subject:");
    });

    it("substitutes vendor + account into all four docs", () => {
        const docs = generateDocs(
            draft({ vendor: "VendorCo", account: "Acme" }),
            null,
            { now: NOW }
        );
        for (const text of [docs.scope, docs.kickoff, docs.readout, docs.email]) {
            expect(text).toContain("Acme");
        }
        expect(docs.scope).toContain("VendorCo");
        expect(docs.email).toContain("VendorCo");
    });

    it("uses [Vendor] / [Account] placeholders when fields are blank", () => {
        const docs = generateDocs(draft({}), null, { now: NOW });
        expect(docs.scope).toContain("[Vendor]");
        expect(docs.scope).toContain("[Account]");
    });

    it("includes linked-deal line when a deal is provided", () => {
        const linked: LinkedDealSummary = {
            id: "d-1",
            accountName: "Acme",
            stage: "negotiation",
            value: 100000
        };
        const docs = generateDocs(
            draft({ vendor: "VendorCo", account: "Acme" }),
            linked,
            { now: NOW }
        );
        expect(docs.scope).toMatch(/Linked deal: Acme/);
        expect(docs.scope).toContain("Negotiation");
    });

    it("emits 'Linked deal: None' when unlinked", () => {
        const docs = generateDocs(draft({ account: "Acme" }), null, { now: NOW });
        expect(docs.scope).toContain("Linked deal: None");
    });

    it("respects durationDays in the email + scope dates", () => {
        const d7 = generateDocs(draft({ account: "Acme" }), null, { now: NOW });
        const d14 = generateDocs(
            draft({ account: "Acme", durationDays: 14 }),
            null,
            { now: NOW }
        );
        expect(d7.email).toContain("7-day");
        expect(d14.email).toContain("14-day");
        expect(d7.scope).toContain("(7 days)");
        expect(d14.scope).toContain("(14 days)");
    });
});
