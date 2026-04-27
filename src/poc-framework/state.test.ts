import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAllProofsForTests,
    __setLinkedDealsForTests,
    activeProof,
    allProofs,
    draft,
    linkedDeal,
    linkedDeals,
    patchDraft,
    resetDraft,
    resetSession,
    setAllProofs,
    setDurationDays,
    setLinkedDeals,
    setOutcome,
    upsertProof
} from "./state";
import { EMPTY_DRAFT, type Proof } from "./lib/types";

function makeProof(partial: Partial<Proof>): Proof {
    return {
        id: partial.id ?? "p",
        account: partial.account ?? "Acme",
        vendor: partial.vendor ?? "VendorCo",
        readoutOwner: partial.readoutOwner ?? "",
        linkedDealId: partial.linkedDealId ?? "",
        linkedDealName: partial.linkedDealName ?? "",
        durationDays: partial.durationDays ?? 7,
        outcome: partial.outcome ?? "not_started",
        successCriteria: partial.successCriteria ?? "",
        boundaries: partial.boundaries ?? "",
        qualityScore: partial.qualityScore ?? 50,
        qualityBand: partial.qualityBand ?? "workable",
        docs: partial.docs ?? { scope: "", kickoff: "", readout: "", email: "" },
        updatedAt: partial.updatedAt ?? "2026-04-27T00:00:00Z",
        ...partial
    };
}

describe("draft", () => {
    beforeEach(() => resetSession());

    it("starts empty", () => {
        expect(draft.value).toEqual(EMPTY_DRAFT);
    });

    it("patchDraft merges partial updates", () => {
        patchDraft({ account: "Acme", vendor: "VendorCo" });
        expect(draft.value.account).toBe("Acme");
        expect(draft.value.vendor).toBe("VendorCo");
        expect(draft.value.outcome).toBe("not_started");
    });

    it("setOutcome updates only the outcome field", () => {
        patchDraft({ account: "Acme" });
        setOutcome("converted");
        expect(draft.value.outcome).toBe("converted");
        expect(draft.value.account).toBe("Acme");
    });

    it("setDurationDays accepts 7 or 14", () => {
        setDurationDays(14);
        expect(draft.value.durationDays).toBe(14);
        setDurationDays(7);
        expect(draft.value.durationDays).toBe(7);
    });

    it("resetDraft restores EMPTY_DRAFT", () => {
        patchDraft({ account: "Acme", vendor: "VendorCo" });
        resetDraft();
        expect(draft.value).toEqual(EMPTY_DRAFT);
    });
});

describe("allProofs / upsertProof", () => {
    beforeEach(() => resetSession());

    it("seeds an empty list", () => {
        expect(allProofs.value).toEqual([]);
    });

    it("setAllProofs replaces the list and marks loaded", () => {
        setAllProofs([makeProof({ id: "a" }), makeProof({ id: "b" })]);
        expect(allProofs.value).toHaveLength(2);
    });

    it("upsertProof inserts new + replaces matching id", () => {
        upsertProof(makeProof({ id: "a", qualityScore: 40 }));
        upsertProof(makeProof({ id: "a", qualityScore: 80 }));
        expect(allProofs.value).toHaveLength(1);
        expect(allProofs.value[0]?.qualityScore).toBe(80);
    });

    it("upsertProof prepends new entries (most recent first)", () => {
        upsertProof(makeProof({ id: "first" }));
        upsertProof(makeProof({ id: "second" }));
        expect(allProofs.value.map((p) => p.id)).toEqual(["second", "first"]);
    });
});

describe("linkedDeal computed", () => {
    beforeEach(() => resetSession());

    it("returns null when no deal is linked", () => {
        expect(linkedDeal.value).toBeNull();
    });

    it("resolves linked deal when id matches a known deal", () => {
        setLinkedDeals([
            { id: "d-1", accountName: "Acme", stage: "negotiation", value: 50000 }
        ]);
        patchDraft({ linkedDealId: "d-1" });
        expect(linkedDeal.value?.id).toBe("d-1");
        expect(linkedDeal.value?.accountName).toBe("Acme");
    });

    it("returns null when linked id has no match", () => {
        patchDraft({ linkedDealId: "ghost" });
        expect(linkedDeal.value).toBeNull();
    });
});

describe("activeProof computed", () => {
    beforeEach(() => resetSession());

    it("returns null when account is empty", () => {
        expect(activeProof.value).toBeNull();
    });

    it("returns null when no proof matches the active account+vendor pair", () => {
        __setAllProofsForTests([makeProof({ account: "Other", vendor: "X" })]);
        patchDraft({ account: "Acme", vendor: "VendorCo" });
        expect(activeProof.value).toBeNull();
    });

    it("returns the most-recent matching proof (case-insensitive)", () => {
        __setAllProofsForTests([
            makeProof({
                id: "old",
                account: "ACME",
                vendor: "vendorco",
                updatedAt: "2026-04-20T00:00:00Z"
            }),
            makeProof({
                id: "new",
                account: "Acme",
                vendor: "VendorCo",
                updatedAt: "2026-04-26T00:00:00Z"
            })
        ]);
        patchDraft({ account: "Acme", vendor: "VendorCo" });
        expect(activeProof.value?.id).toBe("new");
    });
});

describe("resetSession", () => {
    it("clears every signal", () => {
        __setAllProofsForTests([makeProof({ id: "a" })]);
        __setLinkedDealsForTests([
            { id: "d-1", accountName: "Acme", stage: "discovery", value: 10000 }
        ]);
        patchDraft({ account: "Acme" });
        resetSession();
        expect(allProofs.value).toEqual([]);
        expect(linkedDeals.value).toEqual([]);
        expect(draft.value).toEqual(EMPTY_DRAFT);
    });
});
