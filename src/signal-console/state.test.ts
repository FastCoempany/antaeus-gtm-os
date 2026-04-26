import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAllAccountsForTests,
    allAccounts,
    removeAccount,
    resetSession,
    searchQuery,
    selectAccount,
    selectedAccount,
    selectedAccountId,
    setAllAccounts,
    setSearchQuery,
    upsertAccount,
    visibleAccounts
} from "./state";
import type { Account } from "./lib/types";

function makeAccount(partial: Partial<Account>): Account {
    return {
        id: partial.id ?? "x",
        name: partial.name ?? "Acme",
        signals: partial.signals ?? [],
        ...partial
    };
}

describe("setAllAccounts / upsertAccount / removeAccount", () => {
    beforeEach(() => resetSession());

    it("seeds the list", () => {
        setAllAccounts([makeAccount({ id: "a" }), makeAccount({ id: "b" })]);
        expect(allAccounts.value).toHaveLength(2);
    });

    it("upserts inserts when id is new and replaces when id matches", () => {
        upsertAccount(makeAccount({ id: "a", name: "Acme" }));
        expect(allAccounts.value).toHaveLength(1);
        upsertAccount(makeAccount({ id: "a", name: "Acme Renamed" }));
        expect(allAccounts.value).toHaveLength(1);
        expect(allAccounts.value[0]?.name).toBe("Acme Renamed");
    });

    it("removeAccount drops the matching id", () => {
        setAllAccounts([makeAccount({ id: "a" }), makeAccount({ id: "b" })]);
        removeAccount("a");
        expect(allAccounts.value.map((x) => x.id)).toEqual(["b"]);
    });
});

describe("searchQuery + visibleAccounts", () => {
    beforeEach(() => {
        resetSession();
        __setAllAccountsForTests([
            makeAccount({ id: "a", name: "Acme Industries", ticker: "ACM" }),
            makeAccount({ id: "b", name: "Beta Corp", industry: "fintech" }),
            makeAccount({ id: "c", name: "Gamma Logistics" })
        ]);
    });

    it("returns all when query is empty", () => {
        expect(visibleAccounts.value).toHaveLength(3);
    });

    it("filters by name (case-insensitive)", () => {
        setSearchQuery("acme");
        expect(visibleAccounts.value.map((a) => a.id)).toEqual(["a"]);
    });

    it("filters by ticker + industry", () => {
        setSearchQuery("ACM");
        expect(visibleAccounts.value.map((a) => a.id)).toEqual(["a"]);
        setSearchQuery("fintech");
        expect(visibleAccounts.value.map((a) => a.id)).toEqual(["b"]);
    });

    it("returns empty array when no match", () => {
        setSearchQuery("zzz");
        expect(visibleAccounts.value).toHaveLength(0);
    });
});

describe("selectAccount + selectedAccount", () => {
    beforeEach(() => {
        resetSession();
        __setAllAccountsForTests([makeAccount({ id: "a" })]);
    });

    it("returns null when nothing is selected", () => {
        expect(selectedAccount.value).toBeNull();
    });

    it("returns the selected account when its id is set", () => {
        selectAccount("a");
        expect(selectedAccount.value?.id).toBe("a");
    });

    it("returns null when the selected id no longer matches a row", () => {
        selectAccount("does-not-exist");
        expect(selectedAccount.value).toBeNull();
    });
});

describe("resetSession", () => {
    it("clears all signals", () => {
        __setAllAccountsForTests([makeAccount({ id: "a" })]);
        selectAccount("a");
        setSearchQuery("x");
        resetSession();
        expect(allAccounts.value).toHaveLength(0);
        expect(selectedAccountId.value).toBeNull();
        expect(searchQuery.value).toBe("");
    });
});
