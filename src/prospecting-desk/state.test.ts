import { beforeEach, describe, expect, it } from "vitest";
import {
    patchProspectDraft,
    patchQueryCardDraft,
    prospectDraft,
    prospects,
    prospectsByStage,
    queryCardDraft,
    queryCards,
    removeProspect,
    removeQueryCard,
    resetSession,
    saveProspectFromDraft,
    saveQueryCardFromDraft,
    setProspectStage,
    stats,
    __setProspectsForTests,
    __setQueryCardsForTests
} from "./state";
import {
    EMPTY_PROSPECT_DRAFT,
    EMPTY_QUERY_CARD_DRAFT,
    type Prospect
} from "./lib/types";

const NOW = 1_730_000_000_000;

function makeProspect(p: Partial<Prospect>): Prospect {
    return {
        id: p.id ?? "pr_1",
        accountName: p.accountName ?? "Acme",
        contactName: p.contactName ?? "",
        contactTitle: p.contactTitle ?? "",
        sourceQueryId: p.sourceQueryId ?? "",
        leverage: p.leverage ?? "cold",
        stage: p.stage ?? "captured",
        entryPoint: p.entryPoint ?? "",
        approach: p.approach ?? "",
        notes: p.notes ?? "",
        createdAt: p.createdAt ?? "2026-04-28T00:00:00Z",
        updatedAt: p.updatedAt ?? "2026-04-28T00:00:00Z"
    };
}

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("starts with empty cards, prospects, and drafts", () => {
        expect(queryCards.value).toEqual([]);
        expect(prospects.value).toEqual([]);
        expect(queryCardDraft.value).toEqual(EMPTY_QUERY_CARD_DRAFT);
        expect(prospectDraft.value).toEqual(EMPTY_PROSPECT_DRAFT);
    });

    it("zero stats", () => {
        const s = stats.value;
        expect(s.captured).toBe(0);
        expect(s.researched).toBe(0);
        expect(s.ready).toBe(0);
        expect(s.pushed).toBe(0);
        expect(s.total).toBe(0);
    });

    it("empty buckets", () => {
        const g = prospectsByStage.value;
        expect(g.captured).toEqual([]);
        expect(g.researched).toEqual([]);
        expect(g.ready).toEqual([]);
        expect(g.pushed).toEqual([]);
        expect(g.dropped).toEqual([]);
    });
});

describe("patch drafts", () => {
    beforeEach(() => resetSession());

    it("patchQueryCardDraft merges fields", () => {
        patchQueryCardDraft({ query: "sales-nav search" });
        expect(queryCardDraft.value.query).toBe("sales-nav search");
        expect(queryCardDraft.value.intent).toBe("");
        patchQueryCardDraft({ intent: "find ops leaders", platform: "search" });
        expect(queryCardDraft.value.intent).toBe("find ops leaders");
        expect(queryCardDraft.value.platform).toBe("search");
        expect(queryCardDraft.value.query).toBe("sales-nav search");
    });

    it("patchProspectDraft merges fields", () => {
        patchProspectDraft({ accountName: "Meridian" });
        expect(prospectDraft.value.accountName).toBe("Meridian");
        patchProspectDraft({
            contactName: "Sarah Chen",
            leverage: "network-connection"
        });
        expect(prospectDraft.value.contactName).toBe("Sarah Chen");
        expect(prospectDraft.value.leverage).toBe("network-connection");
        expect(prospectDraft.value.accountName).toBe("Meridian");
    });
});

describe("save query card", () => {
    beforeEach(() => resetSession());

    it("refuses to save when query is blank", () => {
        patchQueryCardDraft({ intent: "valid intent" });
        const out = saveQueryCardFromDraft(NOW);
        expect(out).toBeNull();
        expect(queryCards.value).toEqual([]);
    });

    it("saves when query has content + trims whitespace", () => {
        patchQueryCardDraft({
            query: "  vp ops AND logistics  ",
            intent: "  find leaders  ",
            platform: "linkedin"
        });
        const out = saveQueryCardFromDraft(NOW);
        expect(out).not.toBeNull();
        expect(queryCards.value).toHaveLength(1);
        const c = queryCards.value[0]!;
        expect(c.query).toBe("vp ops AND logistics");
        expect(c.intent).toBe("find leaders");
        expect(c.platform).toBe("linkedin");
    });

    it("clears the draft but preserves chosen platform after save", () => {
        patchQueryCardDraft({ query: "x", platform: "intent" });
        saveQueryCardFromDraft(NOW);
        expect(queryCardDraft.value.query).toBe("");
        expect(queryCardDraft.value.platform).toBe("intent");
    });
});

describe("save prospect", () => {
    beforeEach(() => resetSession());

    it("refuses to save when accountName is blank", () => {
        patchProspectDraft({ contactName: "valid" });
        const out = saveProspectFromDraft(NOW);
        expect(out).toBeNull();
        expect(prospects.value).toEqual([]);
    });

    it("saves when accountName is present", () => {
        patchProspectDraft({ accountName: "Meridian" });
        const out = saveProspectFromDraft(NOW);
        expect(out).not.toBeNull();
        expect(prospects.value).toHaveLength(1);
    });

    it("auto-promotes a strong prospect past captured", () => {
        // High-quality entry: proof leverage + contact + title + entry +
        // approach + 40-char notes pushes the score past the captured
        // band per quality engine thresholds.
        patchProspectDraft({
            accountName: "Meridian Logistics",
            contactName: "Sarah Chen",
            contactTitle: "VP Operations",
            entryPoint: "Warm intro from advisor at TechCrunch",
            approach: "Reference Acme proof; lead with EU compliance angle",
            notes:
                "She led a similar EU compliance build at her last shop and is now scaling Meridian's ops team.",
            leverage: "existing-proof-point"
        });
        const out = saveProspectFromDraft(NOW);
        expect(out).not.toBeNull();
        expect(out!.stage).not.toBe("captured");
    });

    it("leaves a thin prospect at captured", () => {
        patchProspectDraft({ accountName: "Bare Account" });
        const out = saveProspectFromDraft(NOW);
        expect(out).not.toBeNull();
        expect(out!.stage).toBe("captured");
    });
});

describe("stage transitions", () => {
    beforeEach(() => resetSession());

    it("setProspectStage moves between columns", () => {
        __setProspectsForTests([makeProspect({ id: "pr_1", stage: "captured" })]);
        setProspectStage("pr_1", "researched");
        expect(prospects.value[0]!.stage).toBe("researched");
        setProspectStage("pr_1", "ready");
        expect(prospects.value[0]!.stage).toBe("ready");
        setProspectStage("pr_1", "pushed");
        expect(prospects.value[0]!.stage).toBe("pushed");
    });

    it("setProspectStage updates updatedAt", () => {
        __setProspectsForTests([
            makeProspect({
                id: "pr_1",
                stage: "captured",
                updatedAt: "2020-01-01T00:00:00Z"
            })
        ]);
        setProspectStage("pr_1", "researched");
        expect(prospects.value[0]!.updatedAt).not.toBe("2020-01-01T00:00:00Z");
    });

    it("setProspectStage on unknown id is a no-op", () => {
        const before = [makeProspect({ id: "pr_1", stage: "captured" })];
        __setProspectsForTests(before);
        setProspectStage("pr_999", "ready");
        expect(prospects.value[0]!.stage).toBe("captured");
    });
});

describe("computed stats + grouping", () => {
    beforeEach(() => resetSession());

    it("counts by stage", () => {
        __setProspectsForTests([
            makeProspect({ id: "a", stage: "captured" }),
            makeProspect({ id: "b", stage: "captured" }),
            makeProspect({ id: "c", stage: "researched" }),
            makeProspect({ id: "d", stage: "ready" }),
            makeProspect({ id: "e", stage: "ready" }),
            makeProspect({ id: "f", stage: "ready" }),
            makeProspect({ id: "g", stage: "pushed" })
        ]);
        const s = stats.value;
        expect(s.captured).toBe(2);
        expect(s.researched).toBe(1);
        expect(s.ready).toBe(3);
        expect(s.pushed).toBe(1);
        expect(s.total).toBe(7);
    });

    it("groups buckets correctly", () => {
        __setProspectsForTests([
            makeProspect({ id: "a", stage: "captured" }),
            makeProspect({ id: "b", stage: "ready" }),
            makeProspect({ id: "c", stage: "dropped" })
        ]);
        const g = prospectsByStage.value;
        expect(g.captured.map((p) => p.id)).toEqual(["a"]);
        expect(g.ready.map((p) => p.id)).toEqual(["b"]);
        expect(g.dropped.map((p) => p.id)).toEqual(["c"]);
        expect(g.researched).toEqual([]);
        expect(g.pushed).toEqual([]);
    });
});

describe("removal", () => {
    beforeEach(() => resetSession());

    it("removeQueryCard drops only the matched card", () => {
        __setQueryCardsForTests([
            {
                id: "a",
                platform: "linkedin",
                query: "x",
                intent: "",
                notes: "",
                targetIcp: "",
                createdAt: "",
                updatedAt: ""
            },
            {
                id: "b",
                platform: "search",
                query: "y",
                intent: "",
                notes: "",
                targetIcp: "",
                createdAt: "",
                updatedAt: ""
            }
        ]);
        removeQueryCard("a");
        expect(queryCards.value.map((c) => c.id)).toEqual(["b"]);
    });

    it("removeProspect drops only the matched prospect", () => {
        __setProspectsForTests([
            makeProspect({ id: "a" }),
            makeProspect({ id: "b" })
        ]);
        removeProspect("a");
        expect(prospects.value.map((p) => p.id)).toEqual(["b"]);
    });
});
