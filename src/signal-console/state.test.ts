import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAllAccountsForTests,
    addSignalToAccount,
    allAccounts,
    buildManualAccount,
    removeAccount,
    removeSignalFromAccount,
    resetSession,
    searchQuery,
    setAccountRelationshipLocal,
    selectAccount,
    selectedAccount,
    selectedAccountId,
    setAccountSignals,
    setAllAccounts,
    setSearchQuery,
    updateSignalInAccount,
    upsertAccount,
    visibleAccounts
} from "./state";
import type { Account, Signal as ScSignal } from "./lib/types";

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

describe("setAccountRelationshipLocal (ADR-007)", () => {
    beforeEach(() => resetSession());

    it("flags an account's relationship + returns the updated account", () => {
        setAllAccounts([makeAccount({ id: "a", name: "Rival Inc" })]);
        const updated = setAccountRelationshipLocal("a", "competitor");
        expect(updated?.relationshipType).toBe("competitor");
        expect(allAccounts.value[0]?.relationshipType).toBe("competitor");
    });

    it("returns null + no-ops when the account isn't found", () => {
        setAllAccounts([makeAccount({ id: "a" })]);
        expect(setAccountRelationshipLocal("missing", "partner")).toBeNull();
        expect(allAccounts.value[0]?.relationshipType).toBeUndefined();
    });

    it("preserves other account fields when flipping relationship", () => {
        setAllAccounts([
            makeAccount({ id: "a", name: "Keep", industry: "FinTech", tier: 2 })
        ]);
        setAccountRelationshipLocal("a", "customer");
        const a = allAccounts.value[0];
        expect(a?.name).toBe("Keep");
        expect(a?.industry).toBe("FinTech");
        expect(a?.tier).toBe(2);
        expect(a?.relationshipType).toBe("customer");
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

describe("buildManualAccount", () => {
    it("trims name + applies a legacy-style id", () => {
        const a = buildManualAccount({
            name: "  Acme Industries  ",
            now: 1700000000000
        });
        expect(a.name).toBe("Acme Industries");
        expect(a.id).toMatch(/^acc_1700000000000_[a-z0-9]{6}$/);
        expect(a.signals).toEqual([]);
    });

    it("normalizes domain to lowercase + ticker to uppercase", () => {
        const a = buildManualAccount({
            name: "Acme",
            domain: "ACME.COM",
            ticker: "acme"
        });
        expect(a.domain).toBe("acme.com");
        expect(a.ticker).toBe("ACME");
    });

    it("omits blank optional fields", () => {
        const a = buildManualAccount({
            name: "Acme",
            domain: "  ",
            ticker: "",
            industry: "",
            hq: "",
            notes: ""
        });
        expect(a.domain).toBeUndefined();
        expect(a.ticker).toBeUndefined();
        expect(a.industry).toBeUndefined();
        expect(a.hq).toBeUndefined();
        expect(a.notes).toBeUndefined();
    });

    it("preserves filled optional fields trimmed", () => {
        const a = buildManualAccount({
            name: "Acme",
            industry: "  Logistics  ",
            hq: " SF ",
            notes: " Active prospect "
        });
        expect(a.industry).toBe("Logistics");
        expect(a.hq).toBe("SF");
        expect(a.notes).toBe("Active prospect");
    });
});

// ─── Local signal mutations (Wave 3) ──────────────────────────────────

function makeSignal(partial: Partial<ScSignal> = {}): ScSignal {
    return { id: "sig_1", ...partial };
}

describe("addSignalToAccount", () => {
    beforeEach(() => __setAllAccountsForTests([]));

    it("prepends a signal to the account's signals (newest first)", () => {
        __setAllAccountsForTests([
            makeAccount({
                id: "a1",
                signals: [makeSignal({ id: "older" })]
            })
        ]);
        addSignalToAccount("a1", makeSignal({ id: "newer", headline: "x" }));
        const account = allAccounts.value.find((a) => a.id === "a1")!;
        expect(account.signals).toHaveLength(2);
        expect(account.signals[0]!.id).toBe("newer");
        expect(account.signals[1]!.id).toBe("older");
    });

    it("no-ops when account not found", () => {
        __setAllAccountsForTests([makeAccount({ id: "a1" })]);
        addSignalToAccount("missing", makeSignal({ id: "new" }));
        expect(allAccounts.value[0]!.signals).toHaveLength(0);
    });
});

describe("updateSignalInAccount", () => {
    beforeEach(() => __setAllAccountsForTests([]));

    it("replaces a signal in-place by id", () => {
        __setAllAccountsForTests([
            makeAccount({
                id: "a1",
                signals: [
                    makeSignal({ id: "s1", flagged: false }),
                    makeSignal({ id: "s2" })
                ]
            })
        ]);
        updateSignalInAccount("a1", makeSignal({ id: "s1", flagged: true }));
        const account = allAccounts.value.find((a) => a.id === "a1")!;
        expect(account.signals[0]!.flagged).toBe(true);
        // Position preserved
        expect(account.signals[0]!.id).toBe("s1");
        expect(account.signals[1]!.id).toBe("s2");
    });

    it("no-ops when signal not found", () => {
        __setAllAccountsForTests([
            makeAccount({ id: "a1", signals: [makeSignal({ id: "s1" })] })
        ]);
        updateSignalInAccount("a1", makeSignal({ id: "missing", flagged: true }));
        const account = allAccounts.value.find((a) => a.id === "a1")!;
        expect(account.signals[0]!.flagged).toBeUndefined();
    });
});

describe("removeSignalFromAccount", () => {
    beforeEach(() => __setAllAccountsForTests([]));

    it("removes the matching signal", () => {
        __setAllAccountsForTests([
            makeAccount({
                id: "a1",
                signals: [
                    makeSignal({ id: "s1" }),
                    makeSignal({ id: "s2" })
                ]
            })
        ]);
        removeSignalFromAccount("a1", "s1");
        const account = allAccounts.value.find((a) => a.id === "a1")!;
        expect(account.signals).toHaveLength(1);
        expect(account.signals[0]!.id).toBe("s2");
    });

    it("no-ops on missing signal", () => {
        __setAllAccountsForTests([
            makeAccount({ id: "a1", signals: [makeSignal({ id: "s1" })] })
        ]);
        removeSignalFromAccount("a1", "missing");
        expect(allAccounts.value[0]!.signals).toHaveLength(1);
    });
});

describe("setAccountSignals", () => {
    beforeEach(() => __setAllAccountsForTests([]));

    it("replaces the whole signals array", () => {
        __setAllAccountsForTests([
            makeAccount({
                id: "a1",
                signals: [makeSignal({ id: "s1" })]
            })
        ]);
        setAccountSignals("a1", [
            makeSignal({ id: "n1", headline: "Fresh" }),
            makeSignal({ id: "n2" })
        ]);
        const account = allAccounts.value.find((a) => a.id === "a1")!;
        expect(account.signals).toHaveLength(2);
        expect(account.signals[0]!.id).toBe("n1");
        expect(account.signals[0]!.headline).toBe("Fresh");
    });

    it("can clear signals to empty array", () => {
        __setAllAccountsForTests([
            makeAccount({ id: "a1", signals: [makeSignal({ id: "s1" })] })
        ]);
        setAccountSignals("a1", []);
        expect(allAccounts.value[0]!.signals).toHaveLength(0);
    });

    it("no-ops when account not found", () => {
        __setAllAccountsForTests([makeAccount({ id: "a1" })]);
        setAccountSignals("missing", [makeSignal({ id: "x" })]);
        expect(allAccounts.value[0]!.signals).toHaveLength(0);
    });
});
