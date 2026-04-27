import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAccountOptionsForTests,
    __setDealOptionsForTests,
    accountOptions,
    currentCompany,
    dealOptions,
    draft,
    linkedDeal,
    matchedAccount,
    patchDraft,
    resetDraft,
    resetSession,
    setAccountOptions,
    setContactName,
    setCustomNotes,
    setDealOptions,
    setLinkedDealId,
    setLinkedinUrl,
    setPersona,
    topSignalHeadline
} from "./state";
import {
    EMPTY_DRAFT,
    type LinkedDeal,
    type MatchedAccount
} from "./lib/types";

function makeAccount(p: Partial<MatchedAccount>): MatchedAccount {
    // Distinguish "omitted" from "explicit null" — `??` would treat null as
    // missing and substitute the default, which is wrong for tests that
    // explicitly want a null top signal.
    const topSignal =
        "topSignal" in p
            ? (p.topSignal ?? null)
            : {
                  headline: "Series B announced",
                  publishedDate: "2026-04-25"
              };
    return {
        id: p.id ?? "acct-1",
        name: p.name ?? "Acme Robotics",
        heat: p.heat ?? 60,
        topSignal
    };
}

function makeDeal(p: Partial<LinkedDeal>): LinkedDeal {
    return {
        id: p.id ?? "deal-1",
        accountName: p.accountName ?? "Acme Robotics",
        value: p.value ?? 50000,
        stage: p.stage ?? "prospect"
    };
}

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("starts with empty draft + no accounts/deals", () => {
        expect(draft.value).toEqual(EMPTY_DRAFT);
        expect(accountOptions.value).toHaveLength(0);
        expect(dealOptions.value).toHaveLength(0);
    });
});

describe("draft mutations", () => {
    beforeEach(() => resetSession());

    it("patchDraft merges partial updates", () => {
        patchDraft({ contactName: "Sarah", customNotes: "Hot pressure" });
        expect(draft.value.contactName).toBe("Sarah");
        expect(draft.value.customNotes).toBe("Hot pressure");
        expect(draft.value.persona).toBe("cxo"); // unchanged
    });

    it("setContactName / setPersona / setCustomNotes / setLinkedinUrl / setLinkedDealId", () => {
        setContactName("Jamie");
        setPersona("vp");
        setCustomNotes("notes");
        setLinkedinUrl("https://linkedin.com/in/jamie");
        setLinkedDealId("deal-x");
        expect(draft.value).toEqual({
            contactName: "Jamie",
            persona: "vp",
            customNotes: "notes",
            linkedinUrl: "https://linkedin.com/in/jamie",
            linkedDealId: "deal-x"
        });
    });

    it("resetDraft restores EMPTY_DRAFT", () => {
        setContactName("Sarah");
        resetDraft();
        expect(draft.value).toEqual(EMPTY_DRAFT);
    });
});

describe("matchedAccount computed", () => {
    beforeEach(() => resetSession());

    it("is null when contact name is < 2 chars", () => {
        setAccountOptions([makeAccount({ name: "Acme Robotics" })]);
        setContactName("A");
        expect(matchedAccount.value).toBeNull();
    });

    it("matches when contact name is a substring of an account name", () => {
        setAccountOptions([
            makeAccount({ id: "1", name: "Acme Robotics" }),
            makeAccount({ id: "2", name: "Beta Logistics" })
        ]);
        setContactName("Acme");
        expect(matchedAccount.value?.id).toBe("1");
    });

    it("matches when account name is a substring of contact name", () => {
        setAccountOptions([
            makeAccount({ id: "1", name: "Acme" })
        ]);
        setContactName("Sarah at Acme");
        expect(matchedAccount.value?.id).toBe("1");
    });

    it("is case-insensitive", () => {
        setAccountOptions([makeAccount({ id: "1", name: "Acme" })]);
        setContactName("acme");
        expect(matchedAccount.value?.id).toBe("1");
    });

    it("returns null when no account matches", () => {
        setAccountOptions([makeAccount({ name: "Acme Robotics" })]);
        setContactName("Zelda");
        expect(matchedAccount.value).toBeNull();
    });

    it("returns the first match when multiple accounts qualify", () => {
        setAccountOptions([
            makeAccount({ id: "first", name: "Acme" }),
            makeAccount({ id: "second", name: "Acme Robotics" })
        ]);
        setContactName("Acme");
        expect(matchedAccount.value?.id).toBe("first");
    });
});

describe("linkedDeal computed", () => {
    beforeEach(() => resetSession());

    it("is null when no deal id is set", () => {
        expect(linkedDeal.value).toBeNull();
    });

    it("resolves the deal by id from dealOptions", () => {
        setDealOptions([
            makeDeal({ id: "a", accountName: "Acme" }),
            makeDeal({ id: "b", accountName: "Beta" })
        ]);
        setLinkedDealId("b");
        expect(linkedDeal.value?.accountName).toBe("Beta");
    });

    it("is null when the id is set but no matching deal exists", () => {
        setDealOptions([makeDeal({ id: "a" })]);
        setLinkedDealId("ghost");
        expect(linkedDeal.value).toBeNull();
    });
});

describe("currentCompany computed", () => {
    beforeEach(() => resetSession());

    it("returns matched account name when present", () => {
        setAccountOptions([
            makeAccount({ name: "Acme Robotics" })
        ]);
        setContactName("Acme");
        expect(currentCompany.value).toBe("Acme Robotics");
    });

    it("falls back to linked deal accountName when no match", () => {
        setDealOptions([makeDeal({ id: "a", accountName: "Beta" })]);
        setLinkedDealId("a");
        expect(currentCompany.value).toBe("Beta");
    });

    it("returns empty string when neither is set", () => {
        expect(currentCompany.value).toBe("");
    });

    it("prefers matched account over linked deal when both exist", () => {
        setAccountOptions([makeAccount({ name: "AcmeMatch" })]);
        setDealOptions([makeDeal({ id: "a", accountName: "BetaDeal" })]);
        setContactName("AcmeMatch");
        setLinkedDealId("a");
        expect(currentCompany.value).toBe("AcmeMatch");
    });
});

describe("topSignalHeadline computed", () => {
    beforeEach(() => resetSession());

    it("returns the matched account's top signal headline", () => {
        setAccountOptions([
            makeAccount({
                name: "Acme",
                topSignal: {
                    headline: "Hiring Director of RevOps",
                    publishedDate: "2026-04-25"
                }
            })
        ]);
        setContactName("Acme");
        expect(topSignalHeadline.value).toContain("Hiring");
    });

    it("returns empty string when no account is matched", () => {
        expect(topSignalHeadline.value).toBe("");
    });

    it("returns empty string when matched account has no top signal", () => {
        setAccountOptions([makeAccount({ name: "Acme", topSignal: null })]);
        setContactName("Acme");
        expect(topSignalHeadline.value).toBe("");
    });
});

describe("seed helpers + reset", () => {
    beforeEach(() => resetSession());

    it("__setAccountOptionsForTests + __setDealOptionsForTests + resetSession round-trip", () => {
        __setAccountOptionsForTests([makeAccount({ id: "1" })]);
        __setDealOptionsForTests([makeDeal({ id: "d1" })]);
        expect(accountOptions.value).toHaveLength(1);
        expect(dealOptions.value).toHaveLength(1);
        resetSession();
        expect(accountOptions.value).toHaveLength(0);
        expect(dealOptions.value).toHaveLength(0);
    });
});
