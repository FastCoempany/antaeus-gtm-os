import { beforeEach, describe, expect, it } from "vitest";
import {
    __setDraftForTests,
    __setSavedIcpsForTests,
    appendSavedIcp,
    bumpTotalWorked,
    draft,
    effectiveBuyer,
    effectiveIndustry,
    patchDraft,
    recentIcps,
    removeSavedIcp,
    replaceSavedIcp,
    resetDraft,
    resetSession,
    savedIcps,
    setRole,
    setSavedIcps,
    setTotalWorked,
    totalWorked
} from "./state";
import {
    EMPTY_ICP_DRAFT,
    type IcpDraft,
    type SavedIcp
} from "./lib/types";

function makeIcp(p: Partial<SavedIcp>): SavedIcp {
    return {
        id: p.id ?? "icp-1",
        statement: p.statement ?? "We win with X...",
        role: p.role ?? "founder",
        industry: p.industry ?? "Logistics",
        size: p.size ?? "200-500 employees",
        geo: p.geo ?? "North America",
        buyer: p.buyer ?? "VP Operations",
        pain: p.pain ?? "Manual reconciliation",
        trigger: p.trigger ?? "New leadership",
        proofWindow: p.proofWindow ?? "30 days",
        engineActive: p.engineActive ?? 0,
        qualityScore: p.qualityScore ?? 70,
        qualityChecks: p.qualityChecks ?? [],
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z",
        updatedAt: p.updatedAt ?? "2026-04-27T00:00:00Z"
    };
}

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("starts empty with founder default role", () => {
        expect(draft.value).toEqual(EMPTY_ICP_DRAFT);
        expect(draft.value.role).toBe("founder");
        expect(savedIcps.value).toHaveLength(0);
        expect(totalWorked.value).toBe(0);
    });
});

describe("draft mutations", () => {
    beforeEach(() => resetSession());

    it("patchDraft merges partial fields", () => {
        patchDraft({ industry: "Logistics", buyer: "VP Operations" });
        expect(draft.value.industry).toBe("Logistics");
        expect(draft.value.buyer).toBe("VP Operations");
        expect(draft.value.size).toBe("");
    });

    it("setRole updates the role only", () => {
        setRole("firstae");
        expect(draft.value.role).toBe("firstae");
        setRole("founder");
        expect(draft.value.role).toBe("founder");
    });

    it("resetDraft restores EMPTY_ICP_DRAFT", () => {
        patchDraft({ industry: "X", pain: "Y" });
        resetDraft();
        expect(draft.value).toEqual(EMPTY_ICP_DRAFT);
    });
});

describe("effectiveIndustry / effectiveBuyer computeds", () => {
    beforeEach(() => resetSession());

    it("returns the select value when not 'custom'", () => {
        patchDraft({
            industry: "Logistics",
            buyer: "VP Operations"
        });
        expect(effectiveIndustry.value).toBe("Logistics");
        expect(effectiveBuyer.value).toBe("VP Operations");
    });

    it("falls back to the custom field when value is 'custom' (trimmed)", () => {
        patchDraft({
            industry: "custom",
            industryCustom: "  AdTech  ",
            buyer: "custom",
            buyerCustom: "  Head of RevOps  "
        });
        expect(effectiveIndustry.value).toBe("AdTech");
        expect(effectiveBuyer.value).toBe("Head of RevOps");
    });

    it("returns empty string when 'custom' but custom field is blank", () => {
        patchDraft({ industry: "custom", industryCustom: "" });
        expect(effectiveIndustry.value).toBe("");
    });
});

describe("savedIcps mutations", () => {
    beforeEach(() => resetSession());

    it("setSavedIcps replaces; appendSavedIcp grows", () => {
        setSavedIcps([makeIcp({ id: "a" })]);
        appendSavedIcp(makeIcp({ id: "b" }));
        expect(savedIcps.value.map((i) => i.id)).toEqual(["a", "b"]);
    });

    it("replaceSavedIcp swaps by id", () => {
        setSavedIcps([
            makeIcp({ id: "a", statement: "old A" }),
            makeIcp({ id: "b" })
        ]);
        replaceSavedIcp(makeIcp({ id: "a", statement: "new A" }));
        expect(savedIcps.value[0]?.statement).toBe("new A");
        expect(savedIcps.value).toHaveLength(2);
    });

    it("replaceSavedIcp leaves list alone when id not found", () => {
        setSavedIcps([makeIcp({ id: "a" })]);
        replaceSavedIcp(makeIcp({ id: "ghost" }));
        expect(savedIcps.value.map((i) => i.id)).toEqual(["a"]);
    });

    it("removeSavedIcp drops by id", () => {
        setSavedIcps([
            makeIcp({ id: "a" }),
            makeIcp({ id: "b" })
        ]);
        removeSavedIcp("a");
        expect(savedIcps.value.map((i) => i.id)).toEqual(["b"]);
    });

    it("recentIcps sorts by updatedAt desc, falling back to createdAt", () => {
        __setSavedIcpsForTests([
            makeIcp({
                id: "old",
                updatedAt: "2026-04-01T00:00:00Z"
            }),
            makeIcp({
                id: "newest",
                updatedAt: "2026-04-27T00:00:00Z"
            }),
            makeIcp({
                id: "mid",
                updatedAt: "2026-04-15T00:00:00Z"
            })
        ]);
        expect(recentIcps.value.map((i) => i.id)).toEqual([
            "newest",
            "mid",
            "old"
        ]);
    });
});

describe("totalWorked counter", () => {
    beforeEach(() => resetSession());

    it("setTotalWorked clamps non-positive to 0", () => {
        setTotalWorked(5);
        expect(totalWorked.value).toBe(5);
        setTotalWorked(-3);
        expect(totalWorked.value).toBe(0);
    });

    it("setTotalWorked floors fractional values", () => {
        setTotalWorked(7.9);
        expect(totalWorked.value).toBe(7);
    });

    it("bumpTotalWorked adds and clamps", () => {
        setTotalWorked(2);
        bumpTotalWorked();
        expect(totalWorked.value).toBe(3);
        bumpTotalWorked(2);
        expect(totalWorked.value).toBe(5);
        bumpTotalWorked(-99);
        expect(totalWorked.value).toBe(0);
    });
});

describe("__setDraftForTests", () => {
    beforeEach(() => resetSession());

    it("seeds a fully-formed draft", () => {
        const next: IcpDraft = {
            ...EMPTY_ICP_DRAFT,
            industry: "Logistics",
            size: "200-500 employees",
            buyer: "VP Operations"
        };
        __setDraftForTests(next);
        expect(draft.value).toEqual(next);
    });
});
