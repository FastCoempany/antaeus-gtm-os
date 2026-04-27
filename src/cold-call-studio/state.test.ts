import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAccountOptionsForTests,
    __setCallLogForTests,
    accountOptions,
    activeReply,
    activeThread,
    appendCallEntry,
    callLog,
    callStats,
    draft,
    loaded,
    patchDraft,
    resetSession,
    selectedAccount,
    selectedAccountName,
    setAccountOptions,
    setActiveReply,
    setActiveThread,
    setCallLog,
    setSelectedAccount
} from "./state";
import { EMPTY_DRAFT, type CallLogEntry } from "./lib/types";

function makeEntry(p: Partial<CallLogEntry>): CallLogEntry {
    return {
        id: p.id ?? "call-1",
        accountName: p.accountName ?? "Acme",
        contactName: p.contactName ?? "Sarah",
        contactTitle: p.contactTitle ?? "",
        threadId: p.threadId ?? "opener",
        threadTitle: p.threadTitle ?? "Earn permission in the first breath.",
        buyerResponse: p.buyerResponse ?? "I am busy.",
        recommendedResponse: p.recommendedResponse ?? "Fair...",
        outcome: p.outcome ?? "logged",
        notes: p.notes ?? "",
        source: "cold-call-studio-talk-loom",
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z"
    };
}

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("starts with prep thread, no reply, no account, empty log", () => {
        expect(activeThread.value).toBe("prep");
        expect(activeReply.value).toBeNull();
        expect(selectedAccountName.value).toBeNull();
        expect(accountOptions.value).toHaveLength(0);
        expect(callLog.value).toHaveLength(0);
        expect(draft.value).toEqual(EMPTY_DRAFT);
        expect(loaded.value).toBe(false);
    });
});

describe("thread + reply mutations", () => {
    beforeEach(() => resetSession());

    it("setActiveThread switches the thread and clears the active reply", () => {
        setActiveReply("busy");
        expect(activeReply.value).toBe("busy");
        setActiveThread("pressure");
        expect(activeThread.value).toBe("pressure");
        expect(activeReply.value).toBeNull();
    });

    it("setActiveReply does not touch the active thread", () => {
        setActiveThread("opener");
        setActiveReply("who");
        expect(activeThread.value).toBe("opener");
        expect(activeReply.value).toBe("who");
    });

    it("setActiveReply(null) clears the selection", () => {
        setActiveReply("pain");
        setActiveReply(null);
        expect(activeReply.value).toBeNull();
    });
});

describe("account selection", () => {
    beforeEach(() => resetSession());

    it("setSelectedAccount(name) routes the room to the opener thread", () => {
        setSelectedAccount("Acme");
        expect(selectedAccountName.value).toBe("Acme");
        expect(activeThread.value).toBe("opener");
        expect(activeReply.value).toBeNull();
    });

    it("setSelectedAccount(null) routes back to prep", () => {
        setSelectedAccount("Acme");
        setActiveReply("busy");
        setSelectedAccount(null);
        expect(selectedAccountName.value).toBeNull();
        expect(activeThread.value).toBe("prep");
        expect(activeReply.value).toBeNull();
    });

    it("selectedAccount computed resolves the name to a record (case-insensitive)", () => {
        setAccountOptions([
            { id: "1", name: "Acme", topSignal: "Funding raise", heat: 80 },
            { id: "2", name: "Beta", topSignal: "Hiring spike", heat: 50 }
        ]);
        setSelectedAccount("acme");
        expect(selectedAccount.value?.name).toBe("Acme");
    });

    it("selectedAccount is null when name has no matching record", () => {
        setAccountOptions([
            { id: "1", name: "Acme", topSignal: "Funding", heat: 80 }
        ]);
        setSelectedAccount("Unknown");
        expect(selectedAccount.value).toBeNull();
    });
});

describe("draft + call log", () => {
    beforeEach(() => resetSession());

    it("patchDraft merges partial fields", () => {
        patchDraft({ contactName: "Sarah" });
        patchDraft({ notes: "Mentioned roadmap concerns." });
        expect(draft.value.contactName).toBe("Sarah");
        expect(draft.value.notes).toBe("Mentioned roadmap concerns.");
        expect(draft.value.contactTitle).toBe("");
    });

    it("appendCallEntry appends to the end (ordered by createdAt)", () => {
        appendCallEntry(makeEntry({ id: "first", outcome: "voicemail" }));
        appendCallEntry(
            makeEntry({ id: "second", outcome: "meeting_booked" })
        );
        expect(callLog.value.map((c) => c.id)).toEqual(["first", "second"]);
    });

    it("setCallLog replaces the list", () => {
        appendCallEntry(makeEntry({ id: "old" }));
        setCallLog([makeEntry({ id: "fresh" })]);
        expect(callLog.value.map((c) => c.id)).toEqual(["fresh"]);
    });
});

describe("callStats computed", () => {
    beforeEach(() => resetSession());

    it("returns zeros for empty log", () => {
        expect(callStats.value).toEqual({
            total: 0,
            meetings: 0,
            callbacks: 0,
            referrals: 0
        });
    });

    it("counts meetings / callbacks / referrals separately", () => {
        __setCallLogForTests([
            makeEntry({ id: "1", outcome: "meeting_booked" }),
            makeEntry({ id: "2", outcome: "meeting_booked" }),
            makeEntry({ id: "3", outcome: "callback_scheduled" }),
            makeEntry({ id: "4", outcome: "referral" }),
            makeEntry({ id: "5", outcome: "voicemail" }),
            makeEntry({ id: "6", outcome: "rejected" })
        ]);
        expect(callStats.value).toEqual({
            total: 6,
            meetings: 2,
            callbacks: 1,
            referrals: 1
        });
    });
});

describe("accountOptions seeding", () => {
    beforeEach(() => resetSession());

    it("seeds + clears via __setAccountOptionsForTests + resetSession", () => {
        __setAccountOptionsForTests([
            { id: "1", name: "Acme", topSignal: "Funding", heat: 80 }
        ]);
        expect(accountOptions.value).toHaveLength(1);
        resetSession();
        expect(accountOptions.value).toHaveLength(0);
    });
});
