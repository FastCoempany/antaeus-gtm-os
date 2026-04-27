import { beforeEach, describe, expect, it } from "vitest";
import {
    __setActionsForTests,
    __setBestIcpForTests,
    __setHottestAccountForTests,
    __setLatestTouchForTests,
    actions,
    activeCueIndex,
    appendAction,
    bestIcp,
    draft,
    hottestAccount,
    latestTouch,
    logCue,
    patchDraft,
    resetDraft,
    resetSession,
    setActions,
    setActiveCue,
    setBestIcp,
    setDraftActionType,
    setHottestAccount,
    setLatestTouch,
    stats,
    updateOutcome
} from "./state";
import { EMPTY_DRAFT, type ActionEntry } from "./lib/types";

function makeAction(p: Partial<ActionEntry>): ActionEntry {
    return {
        id: p.id ?? "li-1",
        accountName: p.accountName ?? "Acme",
        contactName: p.contactName ?? "Sarah",
        actionType: p.actionType ?? "content_engage",
        temperature: p.temperature ?? "ice_cold",
        content: p.content ?? "",
        motionKey: p.motionKey ?? "credibility",
        motionLabel: p.motionLabel ?? "",
        cueLabel: p.cueLabel ?? "",
        whyNow: p.whyNow ?? "",
        recommendedNext: p.recommendedNext ?? "",
        outcome: p.outcome ?? null,
        outcomeDate: p.outcomeDate ?? null,
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z"
    };
}

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("starts empty", () => {
        expect(actions.value).toHaveLength(0);
        expect(activeCueIndex.value).toBeNull();
        expect(draft.value).toEqual(EMPTY_DRAFT);
        expect(bestIcp.value).toBeNull();
        expect(hottestAccount.value).toBeNull();
        expect(latestTouch.value).toBeNull();
    });
});

describe("actions + draft mutations", () => {
    beforeEach(() => resetSession());

    it("setActions replaces the list; appendAction grows it", () => {
        setActions([makeAction({ id: "a" })]);
        expect(actions.value).toHaveLength(1);
        appendAction(makeAction({ id: "b" }));
        expect(actions.value.map((a) => a.id)).toEqual(["a", "b"]);
    });

    it("setActiveCue stores the index, then null clears", () => {
        setActiveCue(2);
        expect(activeCueIndex.value).toBe(2);
        setActiveCue(null);
        expect(activeCueIndex.value).toBeNull();
    });

    it("patchDraft merges partial updates; setDraftActionType is a shortcut", () => {
        patchDraft({ accountName: "Acme" });
        setDraftActionType("dm");
        expect(draft.value).toEqual({
            accountName: "Acme",
            contactName: "",
            actionType: "dm"
        });
    });

    it("resetDraft restores EMPTY_DRAFT without affecting actions", () => {
        setActions([makeAction({ id: "a" })]);
        patchDraft({ accountName: "Acme" });
        resetDraft();
        expect(draft.value).toEqual(EMPTY_DRAFT);
        expect(actions.value).toHaveLength(1);
    });
});

describe("inbound context", () => {
    beforeEach(() => resetSession());

    it("setBestIcp / setHottestAccount / setLatestTouch flow through", () => {
        setBestIcp({ name: "Series-A SaaS", qualityScore: 90 });
        setHottestAccount({ name: "Acme", heat: 80 });
        setLatestTouch({
            accountName: "Beta",
            createdAt: "2026-04-27T00:00:00Z"
        });
        expect(bestIcp.value?.name).toBe("Series-A SaaS");
        expect(hottestAccount.value?.heat).toBe(80);
        expect(latestTouch.value?.accountName).toBe("Beta");
    });

    it("test-only seed helpers + resetSession round-trip cleanly", () => {
        __setBestIcpForTests({ name: "X", qualityScore: 50 });
        __setHottestAccountForTests({ name: "Y", heat: 60 });
        __setLatestTouchForTests({
            accountName: "Z",
            createdAt: "2026-04-27"
        });
        expect(bestIcp.value).not.toBeNull();
        resetSession();
        expect(bestIcp.value).toBeNull();
        expect(hottestAccount.value).toBeNull();
        expect(latestTouch.value).toBeNull();
    });
});

describe("stats computed", () => {
    beforeEach(() => resetSession());

    it("returns zeros on empty log", () => {
        expect(stats.value.total).toBe(0);
        expect(stats.value.acceptRate).toBe(0);
        expect(stats.value.replyRate).toBe(0);
        expect(stats.value.byAccount).toEqual({});
    });

    it("counts connections + accepted + acceptRate", () => {
        __setActionsForTests([
            makeAction({
                id: "1",
                actionType: "connection_request",
                outcome: "accepted"
            }),
            makeAction({
                id: "2",
                actionType: "connection_request",
                outcome: "no_response"
            }),
            makeAction({
                id: "3",
                actionType: "connection_request",
                outcome: "declined"
            }),
            makeAction({
                id: "4",
                actionType: "connection_request",
                outcome: "accepted"
            })
        ]);
        expect(stats.value.connections).toBe(4);
        expect(stats.value.accepted).toBe(2);
        expect(stats.value.acceptRate).toBe(50);
    });

    it("counts dms + replies + replyRate", () => {
        __setActionsForTests([
            makeAction({ id: "1", actionType: "dm", outcome: "replied" }),
            makeAction({ id: "2", actionType: "dm", outcome: null }),
            makeAction({ id: "3", actionType: "dm", outcome: "no_response" })
        ]);
        expect(stats.value.dms).toBe(3);
        expect(stats.value.replies).toBe(1);
        expect(stats.value.replyRate).toBe(33);
    });

    it("rounds rates to nearest integer", () => {
        __setActionsForTests([
            makeAction({
                id: "1",
                actionType: "connection_request",
                outcome: "accepted"
            }),
            makeAction({
                id: "2",
                actionType: "connection_request",
                outcome: null
            }),
            makeAction({
                id: "3",
                actionType: "connection_request",
                outcome: null
            })
        ]);
        // 1/3 = 33.33 → 33
        expect(stats.value.acceptRate).toBe(33);
    });

    it("groups byAccount counts per actionType (case-insensitive)", () => {
        __setActionsForTests([
            makeAction({
                id: "1",
                accountName: "Acme",
                actionType: "content_engage"
            }),
            makeAction({
                id: "2",
                accountName: "ACME",
                actionType: "connection_request"
            }),
            makeAction({
                id: "3",
                accountName: "  acme  ",
                actionType: "dm"
            }),
            makeAction({
                id: "4",
                accountName: "Beta",
                actionType: "content_engage"
            })
        ]);
        expect(stats.value.byAccount["acme"]).toEqual({
            content_engage: 1,
            connection_request: 1,
            dm: 1
        });
        expect(stats.value.byAccount["beta"]).toEqual({
            content_engage: 1,
            connection_request: 0,
            dm: 0
        });
    });

    it("ignores blank accountName entries from byAccount but still counts in totals", () => {
        __setActionsForTests([
            makeAction({
                id: "1",
                accountName: "",
                actionType: "connection_request",
                outcome: "accepted"
            })
        ]);
        expect(stats.value.connections).toBe(1);
        expect(stats.value.byAccount).toEqual({});
    });
});

describe("logCue + updateOutcome", () => {
    beforeEach(() => {
        resetSession();
        if (typeof localStorage !== "undefined") localStorage.clear();
    });

    it("returns null when account + contact are both blank (legacy guard)", () => {
        expect(logCue()).toBeNull();
        expect(actions.value).toHaveLength(0);
    });

    it("logs an entry when only account is set", () => {
        patchDraft({ accountName: "Acme" });
        const entry = logCue();
        expect(entry).not.toBeNull();
        expect(entry?.accountName).toBe("Acme");
        expect(entry?.contactName).toBe("");
        expect(actions.value).toHaveLength(1);
    });

    it("logs an entry when only contact is set", () => {
        patchDraft({ contactName: "Sarah" });
        const entry = logCue();
        expect(entry).not.toBeNull();
        expect(entry?.contactName).toBe("Sarah");
    });

    it("freezes the active cue label + motion fields into the entry", () => {
        __setHottestAccountForTests({ name: "Acme", heat: 80 });
        patchDraft({ accountName: "Acme", contactName: "Sarah" });
        const entry = logCue();
        // Default motion derived from hottest=Acme, no prior actions
        // → warm_signal_account, cueIndex 1 → Cue 02 "Comment with one
        // operating read".
        expect(entry?.motionKey).toBe("warm_signal_account");
        expect(entry?.cueLabel).toContain("Comment");
    });

    it("respects a pinned active cue when freezing the entry", () => {
        patchDraft({ accountName: "Acme", contactName: "Sarah" });
        // Pin cue 4 (Ask)
        setActiveCue(4);
        const entry = logCue();
        expect(entry?.cueLabel).toContain("Ask");
    });

    it("clears account + contact draft fields after logCue (preserves actionType)", () => {
        patchDraft({
            accountName: "Acme",
            contactName: "Sarah",
            actionType: "dm"
        });
        logCue();
        expect(draft.value.accountName).toBe("");
        expect(draft.value.contactName).toBe("");
        expect(draft.value.actionType).toBe("dm");
    });

    it("trims whitespace from account + contact before storing", () => {
        patchDraft({
            accountName: "  Acme  ",
            contactName: "  Sarah  "
        });
        const entry = logCue();
        expect(entry?.accountName).toBe("Acme");
        expect(entry?.contactName).toBe("Sarah");
    });

    it("updateOutcome sets outcome + outcomeDate on the matching id", () => {
        __setActionsForTests([
            makeAction({ id: "a", outcome: null }),
            makeAction({ id: "b", outcome: null })
        ]);
        updateOutcome("a", "accepted");
        expect(actions.value[0]?.outcome).toBe("accepted");
        expect(actions.value[0]?.outcomeDate).toBeTruthy();
        expect(actions.value[1]?.outcome).toBeNull();
    });

    it("updateOutcome with null clears outcome + outcomeDate", () => {
        __setActionsForTests([
            makeAction({
                id: "a",
                outcome: "accepted",
                outcomeDate: "2026-04-27T00:00:00Z"
            })
        ]);
        updateOutcome("a", null);
        expect(actions.value[0]?.outcome).toBeNull();
        expect(actions.value[0]?.outcomeDate).toBeNull();
    });

    it("updateOutcome returns null when no row matches", () => {
        expect(updateOutcome("missing", "accepted")).toBeNull();
    });
});
