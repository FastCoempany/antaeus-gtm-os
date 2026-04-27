import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAccountOptionsForTests,
    __setDealOptionsForTests,
    accountOptions,
    buildAgendaSnapshot,
    buildHandoffPayload,
    currentCompany,
    dealOptions,
    draft,
    hydrateDraftFromSnapshot,
    linkedDeal,
    logOutcome,
    matchedAccount,
    patchDraft,
    persistAgendaState,
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

describe("buildAgendaSnapshot", () => {
    beforeEach(() => resetSession());

    it("packs current state into the AgendaSnapshot shape", () => {
        // Account name matches the contact via legacy bidirectional
        // substring match (contactName "Sarah at Acme" includes "Acme").
        setAccountOptions([makeAccount({ name: "Acme", heat: 60 })]);
        setDealOptions([
            makeDeal({
                id: "d-acme",
                accountName: "Acme Robotics",
                value: 50000,
                stage: "demo"
            })
        ]);
        setContactName("Sarah at Acme");
        setPersona("vp");
        setLinkedinUrl("https://linkedin.com/in/sarah");
        setCustomNotes("They keep slipping on RevOps deadlines.");
        setLinkedDealId("d-acme");
        const snap = buildAgendaSnapshot(1746000000000);
        expect(snap.contact).toBe("Sarah at Acme");
        // matchedAccount.name beats linked-deal accountName per
        // currentCompany precedence
        expect(snap.company).toBe("Acme");
        expect(snap.persona).toBe("vp");
        expect(snap.linkedDeal).toBe("d-acme");
        expect(snap.signalHeadline).toBe("Series B announced");
        expect(snap.linkedinUrl).toBe("https://linkedin.com/in/sarah");
        expect(snap.customNotes).toContain("RevOps");
        expect(snap.gates).toHaveLength(5);
        expect(snap.gates.every((g) => typeof g === "boolean")).toBe(true);
        expect(snap.score).toBeGreaterThan(0);
        expect(snap.preparedAt).toBe("2025-04-30T08:00:00.000Z");
    });

    it("uses linked deal accountName as company when no matched account", () => {
        setDealOptions([makeDeal({ id: "d-1", accountName: "Beta" })]);
        setLinkedDealId("d-1");
        const snap = buildAgendaSnapshot();
        expect(snap.company).toBe("Beta");
    });

    it("signalHeadline is empty when no top signal", () => {
        setAccountOptions([
            makeAccount({ name: "Acme", topSignal: null })
        ]);
        setContactName("Acme");
        const snap = buildAgendaSnapshot();
        expect(snap.signalHeadline).toBe("");
    });
});

describe("buildHandoffPayload", () => {
    beforeEach(() => resetSession());

    it("builds a 'call_plan' payload when no outcome is supplied", () => {
        setContactName("Sarah");
        const snap = buildAgendaSnapshot(1746000000000);
        const payload = buildHandoffPayload(null, snap, 1746000000000);
        expect(payload.outcome).toBe("planned");
        expect(payload.logType).toBe("call_plan");
        expect(payload.summary).toBe("Discovery plan ready");
        expect(payload.contact).toBe("Sarah");
    });

    it("builds a 'call_outcome' payload when an Outcome is supplied", () => {
        setContactName("Sarah");
        const snap = buildAgendaSnapshot(1746000000000);
        const payload = buildHandoffPayload("advanced", snap, 1746000000000);
        expect(payload.outcome).toBe("advanced");
        expect(payload.logType).toBe("call_outcome");
        expect(payload.summary).toBe("Discovery call - Advanced");
    });

    it("normalizes empty linkedDeal to null", () => {
        const snap = buildAgendaSnapshot();
        const payload = buildHandoffPayload(null, snap);
        expect(payload.linkedDeal).toBeNull();
    });

    it("preserves linkedDeal id when present", () => {
        setDealOptions([makeDeal({ id: "d-x" })]);
        setLinkedDealId("d-x");
        const snap = buildAgendaSnapshot();
        const payload = buildHandoffPayload("stalled", snap);
        expect(payload.linkedDeal).toBe("d-x");
    });
});

describe("persistAgendaState + logOutcome", () => {
    beforeEach(() => {
        resetSession();
        if (typeof localStorage !== "undefined") localStorage.clear();
    });

    it("persistAgendaState(null) writes snapshot + handoff but does NOT bump stats", () => {
        setContactName("Sarah");
        const result = persistAgendaState(null);
        expect(result.handoff.outcome).toBe("planned");
        expect(localStorage.getItem("gtmos_discovery_agenda")).not.toBeNull();
        expect(localStorage.getItem("gtmos_call_handoff")).not.toBeNull();
        expect(localStorage.getItem("gtmos_discovery_stats")).toBeNull();
    });

    it("persistAgendaState(outcome) bumps stats with totalCalls only on non-advanced", () => {
        setContactName("Sarah");
        persistAgendaState("stalled");
        const stats = JSON.parse(
            localStorage.getItem("gtmos_discovery_stats") as string
        );
        expect(stats).toEqual({ totalCalls: 1, advancedCalls: 0 });
    });

    it("logOutcome('advanced') bumps both totalCalls and advancedCalls", () => {
        setContactName("Sarah");
        logOutcome("advanced");
        const stats = JSON.parse(
            localStorage.getItem("gtmos_discovery_stats") as string
        );
        expect(stats).toEqual({ totalCalls: 1, advancedCalls: 1 });
    });
});

describe("hydrateDraftFromSnapshot", () => {
    beforeEach(() => resetSession());

    it("restores draft fields from a stored snapshot", () => {
        hydrateDraftFromSnapshot({
            contact: "Sarah Chen",
            company: "Acme Robotics",
            persona: "ops",
            linkedDeal: "deal-x",
            gates: [],
            gateDetails: [],
            score: 70,
            band: "Workable",
            nextMove: "",
            signalHeadline: "",
            customNotes: "Manual context",
            linkedinUrl: "https://linkedin.com/in/sarah",
            preparedAt: "2026-04-27T18:00:00Z"
        });
        expect(draft.value.contactName).toBe("Sarah Chen");
        expect(draft.value.persona).toBe("ops");
        expect(draft.value.customNotes).toBe("Manual context");
        expect(draft.value.linkedinUrl).toBe(
            "https://linkedin.com/in/sarah"
        );
        expect(draft.value.linkedDealId).toBe("deal-x");
    });
});
