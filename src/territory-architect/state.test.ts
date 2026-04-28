import { beforeEach, describe, expect, it } from "vitest";
import {
    accounts,
    allocation,
    approaches,
    approachesByThesis,
    accountsByThesis,
    patchAccountDraft,
    patchApproachDraft,
    patchThesisDraft,
    removeThesis,
    resetSession,
    retierAccount,
    saveAccountFromDraft,
    saveApproachFromDraft,
    saveThesisFromDraft,
    setAccountDisposition,
    theses,
    thesisDraft,
    __setAccountsForTests
} from "./state";
import {
    ACCOUNT_CEILING,
    EMPTY_THESIS_DRAFT,
    type TerritoryAccount
} from "./lib/types";

function makeAccount(p: Partial<TerritoryAccount>): TerritoryAccount {
    return {
        id: p.id ?? "acct-1",
        name: p.name ?? "Acme",
        tier: p.tier ?? "t2",
        thesisId: p.thesisId ?? "th-1",
        approachId: p.approachId ?? "",
        disposition: p.disposition ?? "active",
        notes: p.notes ?? "",
        createdAt: p.createdAt ?? "2026-04-28T00:00:00Z",
        updatedAt: p.updatedAt ?? "2026-04-28T00:00:00Z"
    };
}

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("starts empty", () => {
        expect(theses.value).toHaveLength(0);
        expect(approaches.value).toHaveLength(0);
        expect(accounts.value).toHaveLength(0);
        expect(thesisDraft.value).toEqual(EMPTY_THESIS_DRAFT);
    });

    it("allocation is 0/300 with headroom on empty state", () => {
        expect(allocation.value.total).toBe(0);
        expect(allocation.value.ceiling).toBe(ACCOUNT_CEILING);
        expect(allocation.value.status).toBe("headroom");
    });
});

describe("thesis save", () => {
    beforeEach(() => resetSession());

    it("returns null when title blank", () => {
        patchThesisDraft({ title: "  " });
        expect(saveThesisFromDraft()).toBeNull();
        expect(theses.value).toHaveLength(0);
    });

    it("appends + resets draft", () => {
        patchThesisDraft({
            title: "Procurement consolidation",
            tier: "t1",
            pressure: "Q2 deadline"
        });
        const t = saveThesisFromDraft();
        expect(t?.title).toBe("Procurement consolidation");
        expect(t?.tier).toBe("t1");
        expect(theses.value).toHaveLength(1);
        expect(thesisDraft.value).toEqual(EMPTY_THESIS_DRAFT);
    });
});

describe("approach save", () => {
    beforeEach(() => resetSession());

    it("requires both name + thesisId", () => {
        patchApproachDraft({ name: "Intro", thesisId: "" });
        expect(saveApproachFromDraft()).toBeNull();
        patchApproachDraft({ name: "", thesisId: "th-1" });
        expect(saveApproachFromDraft()).toBeNull();
    });

    it("saves + indexes by thesis", () => {
        patchThesisDraft({ title: "T1" });
        const t = saveThesisFromDraft();
        patchApproachDraft({ name: "Approach 1", thesisId: t!.id });
        const a = saveApproachFromDraft();
        expect(a?.name).toBe("Approach 1");
        expect(approachesByThesis.value[t!.id]).toHaveLength(1);
    });
});

describe("account save + ceiling", () => {
    beforeEach(() => resetSession());

    it("requires name + thesisId", () => {
        patchAccountDraft({ name: "Acme", thesisId: "" });
        expect(saveAccountFromDraft()).toBeNull();
        patchAccountDraft({ name: "", thesisId: "th-1" });
        expect(saveAccountFromDraft()).toBeNull();
    });

    it("blocks at ceiling", () => {
        const seed: TerritoryAccount[] = [];
        for (let i = 0; i < ACCOUNT_CEILING; i++) {
            seed.push(makeAccount({ id: `a-${i}`, name: `A${i}` }));
        }
        __setAccountsForTests(seed);
        expect(allocation.value.status).toBe("at-cap");
        patchAccountDraft({ name: "Overflow", thesisId: "th-1" });
        expect(saveAccountFromDraft()).toBeNull();
    });

    it("allocation counts active only (excludes closed-won/lost)", () => {
        __setAccountsForTests([
            makeAccount({ id: "a", disposition: "active" }),
            makeAccount({ id: "b", disposition: "closed-won" }),
            makeAccount({ id: "c", disposition: "closed-lost" }),
            makeAccount({ id: "d", disposition: "paused" })
        ]);
        // active + paused count toward ceiling; won/lost excluded
        expect(allocation.value.total).toBe(2);
    });
});

describe("retier + disposition + accountsByThesis", () => {
    beforeEach(() => resetSession());

    it("retierAccount swaps tier", () => {
        __setAccountsForTests([makeAccount({ id: "a", tier: "t2" })]);
        retierAccount("a", "t1");
        expect(accounts.value[0]?.tier).toBe("t1");
    });

    it("setAccountDisposition flips disposition", () => {
        __setAccountsForTests([makeAccount({ id: "a" })]);
        setAccountDisposition("a", "paused");
        expect(accounts.value[0]?.disposition).toBe("paused");
    });

    it("accountsByThesis ignores closed accounts", () => {
        __setAccountsForTests([
            makeAccount({ id: "a", thesisId: "x", disposition: "active" }),
            makeAccount({ id: "b", thesisId: "x", disposition: "closed-won" })
        ]);
        expect(accountsByThesis.value["x"]).toBe(1);
    });
});

describe("removeThesis cascades", () => {
    beforeEach(() => resetSession());

    it("removes thesis + its approaches + its accounts", () => {
        patchThesisDraft({ title: "T1" });
        const t = saveThesisFromDraft()!;
        patchApproachDraft({ name: "A1", thesisId: t.id });
        saveApproachFromDraft();
        patchAccountDraft({ name: "Acct1", thesisId: t.id });
        saveAccountFromDraft();
        expect(approaches.value).toHaveLength(1);
        expect(accounts.value).toHaveLength(1);
        removeThesis(t.id);
        expect(theses.value).toHaveLength(0);
        expect(approaches.value).toHaveLength(0);
        expect(accounts.value).toHaveLength(0);
    });
});
