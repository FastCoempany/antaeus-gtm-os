import { beforeEach, describe, expect, it } from "vitest";
import { loadProspects, loadQueryCards, saveAll } from "./persistence";

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
}

describe("loadQueryCards", () => {
    let store: FakeStorage;
    beforeEach(() => {
        store = new FakeStorage();
    });

    it("returns [] when key is missing", () => {
        expect(loadQueryCards(store)).toEqual([]);
    });

    it("returns [] when value is non-array", () => {
        store.setItem("gtmos_sw_query_cards", '{"foo":1}');
        expect(loadQueryCards(store)).toEqual([]);
    });

    it("returns [] on parse error", () => {
        store.setItem("gtmos_sw_query_cards", "{not json");
        expect(loadQueryCards(store)).toEqual([]);
    });

    it("drops malformed rows + keeps valid ones", () => {
        const rows = [
            { id: "a", query: "x", platform: "linkedin" },
            { id: "", query: "y" },
            null,
            { foo: "bar" },
            { id: "b", query: "z", platform: "garbage" }
        ];
        store.setItem("gtmos_sw_query_cards", JSON.stringify(rows));
        const out = loadQueryCards(store);
        expect(out.map((c) => c.id)).toEqual(["a", "b"]);
        expect(out[0]!.platform).toBe("linkedin");
        expect(out[1]!.platform).toBe("linkedin");
    });
});

describe("loadProspects", () => {
    let store: FakeStorage;
    beforeEach(() => {
        store = new FakeStorage();
    });

    it("returns [] on missing key", () => {
        expect(loadProspects(store)).toEqual([]);
    });

    it("normalizes invalid leverage + stage to safe defaults", () => {
        store.setItem(
            "gtmos_sw_prospects",
            JSON.stringify([
                {
                    id: "p1",
                    accountName: "Acme",
                    leverage: "moonshot",
                    stage: "skyrocketing"
                }
            ])
        );
        const out = loadProspects(store);
        expect(out).toHaveLength(1);
        expect(out[0]!.leverage).toBe("cold");
        expect(out[0]!.stage).toBe("captured");
    });

    it("drops rows missing accountName or id", () => {
        store.setItem(
            "gtmos_sw_prospects",
            JSON.stringify([
                { id: "ok", accountName: "Acme" },
                { id: "", accountName: "Bad" },
                { id: "no_account", accountName: "" }
            ])
        );
        const out = loadProspects(store);
        expect(out.map((p) => p.id)).toEqual(["ok"]);
    });
});

describe("saveAll", () => {
    let store: FakeStorage;
    beforeEach(() => {
        store = new FakeStorage();
    });

    it("writes both keys as JSON arrays", () => {
        saveAll(
            {
                queryCards: [
                    {
                        id: "qc",
                        platform: "linkedin",
                        query: "x",
                        intent: "",
                        notes: "",
                        targetIcp: "",
                        createdAt: "2026-04-28T00:00:00Z",
                        updatedAt: "2026-04-28T00:00:00Z"
                    }
                ],
                prospects: [
                    {
                        id: "pr",
                        accountName: "Acme",
                        contactName: "",
                        contactTitle: "",
                        sourceQueryId: "",
                        leverage: "cold",
                        stage: "captured",
                        entryPoint: "",
                        approach: "",
                        notes: "",
                        createdAt: "2026-04-28T00:00:00Z",
                        updatedAt: "2026-04-28T00:00:00Z"
                    }
                ]
            },
            store
        );
        const cards = JSON.parse(store.getItem("gtmos_sw_query_cards") ?? "[]");
        const prospects = JSON.parse(
            store.getItem("gtmos_sw_prospects") ?? "[]"
        );
        expect(cards).toHaveLength(1);
        expect(prospects).toHaveLength(1);
    });

    it("noops when storage is null", () => {
        // No throw
        expect(() =>
            saveAll({ queryCards: [], prospects: [] }, null)
        ).not.toThrow();
    });
});

describe("legacy shape compatibility", () => {
    let store: FakeStorage;
    beforeEach(() => {
        store = new FakeStorage();
    });

    it("accepts legacy query card with filters object + no top-level query", () => {
        // Shape from app/sourcing-workbench/index.html lines 1846-1869.
        const legacy = [
            {
                id: "qc_legacy_1",
                thesisId: "thesis_a",
                platform: "sales-nav",
                filters: {
                    industry: "Logistics",
                    companySize: "50-2,000",
                    geography: "EU",
                    personaTitles: "VP Operations",
                    booleanString: '"VP Operations" AND "logistics"',
                    customNotes: "Watch for Series C raises.",
                    exclusions: "Companies <2 yrs old"
                },
                status: "active",
                createdAt: "2025-12-01T00:00:00Z",
                updatedAt: "2025-12-01T00:00:00Z"
            }
        ];
        store.setItem("gtmos_sw_query_cards", JSON.stringify(legacy));
        const out = loadQueryCards(store);
        expect(out).toHaveLength(1);
        expect(out[0]!.id).toBe("qc_legacy_1");
        expect(out[0]!.platform).toBe("linkedin"); // sales-nav → linkedin
        // booleanString wins as the highest-fidelity query source
        expect(out[0]!.query).toBe('"VP Operations" AND "logistics"');
        expect(out[0]!.intent).toContain("VP Operations");
        expect(out[0]!.intent).toContain("Logistics");
        expect(out[0]!.targetIcp).toBe("Logistics");
        expect(out[0]!.notes).toContain("Series C");
        expect(out[0]!.notes).toContain("Exclude:");
    });

    it("derives query from personas+industry when booleanString is empty", () => {
        const legacy = [
            {
                id: "qc_legacy_2",
                platform: "google-boolean",
                filters: { industry: "Freight", personaTitles: "Director Compliance" },
                status: "active"
            }
        ];
        store.setItem("gtmos_sw_query_cards", JSON.stringify(legacy));
        const out = loadQueryCards(store);
        expect(out).toHaveLength(1);
        expect(out[0]!.platform).toBe("search"); // google-boolean → search
        expect(out[0]!.query).toBe("Director Compliance / Freight");
    });

    it("falls back to behavioralSignal when industry+personas missing", () => {
        const legacy = [
            {
                id: "qc_legacy_3",
                platform: "zoominfo",
                filters: { behavioralSignal: "International expansion last 24 months" },
                status: "active"
            }
        ];
        store.setItem("gtmos_sw_query_cards", JSON.stringify(legacy));
        const out = loadQueryCards(store);
        expect(out).toHaveLength(1);
        expect(out[0]!.platform).toBe("intent");
        expect(out[0]!.query).toContain("International expansion");
    });

    it("drops legacy query card with no usable filter content", () => {
        const legacy = [{ id: "qc_legacy_empty", platform: "sales-nav", filters: {} }];
        store.setItem("gtmos_sw_query_cards", JSON.stringify(legacy));
        expect(loadQueryCards(store)).toEqual([]);
    });

    it("maps every legacy platform onto the new enum", () => {
        const legacy = [
            { id: "a", platform: "sales-nav", filters: { industry: "x" } },
            { id: "b", platform: "google-boolean", filters: { industry: "x" } },
            { id: "c", platform: "zoominfo", filters: { industry: "x" } },
            { id: "d", platform: "apollo", filters: { industry: "x" } },
            { id: "e", platform: "conference", filters: { industry: "x" } },
            { id: "f", platform: "crm", filters: { industry: "x" } },
            { id: "g", platform: "custom", filters: { industry: "x" } }
        ];
        store.setItem("gtmos_sw_query_cards", JSON.stringify(legacy));
        const out = loadQueryCards(store);
        expect(out.map((c) => c.platform)).toEqual([
            "linkedin",
            "search",
            "intent",
            "intent",
            "signals",
            "list",
            "list"
        ]);
    });

    it("accepts legacy prospect with `name` instead of accountName", () => {
        // Shape from app/sourcing-workbench/index.html lines 2049-2058.
        const legacy = [
            {
                id: "pr_legacy_1",
                name: "Meridian Logistics",
                thesisId: "thesis_a",
                sourceType: "query-card",
                sourceQueryCardId: "qc_legacy_1",
                initialImpression: "New CTO from competitor, just raised Series C",
                stage: "captured",
                research: null,
                tier: null,
                pushedToTA: false,
                pushedAt: null,
                createdAt: "2026-04-01T00:00:00Z",
                updatedAt: "2026-04-01T00:00:00Z"
            }
        ];
        store.setItem("gtmos_sw_prospects", JSON.stringify(legacy));
        const out = loadProspects(store);
        expect(out).toHaveLength(1);
        expect(out[0]!.accountName).toBe("Meridian Logistics");
        expect(out[0]!.sourceQueryId).toBe("qc_legacy_1");
        expect(out[0]!.notes).toContain("Series C");
    });

    it("folds legacy stages parked + rejected into dropped", () => {
        const legacy = [
            { id: "a", name: "Acme", stage: "parked" },
            { id: "b", name: "Beta", stage: "rejected" }
        ];
        store.setItem("gtmos_sw_prospects", JSON.stringify(legacy));
        const out = loadProspects(store);
        expect(out).toHaveLength(2);
        expect(out[0]!.stage).toBe("dropped");
        expect(out[1]!.stage).toBe("dropped");
    });

    it("new-stack field wins when both new + legacy fields are present", () => {
        const mixed = [
            {
                id: "x",
                accountName: "NewName",
                name: "OldName",
                sourceQueryId: "new_qc",
                sourceQueryCardId: "old_qc",
                notes: "new notes",
                initialImpression: "old notes"
            }
        ];
        store.setItem("gtmos_sw_prospects", JSON.stringify(mixed));
        const out = loadProspects(store);
        expect(out[0]!.accountName).toBe("NewName");
        expect(out[0]!.sourceQueryId).toBe("new_qc");
        expect(out[0]!.notes).toBe("new notes");
    });
});

describe("roundtrip", () => {
    let store: FakeStorage;
    beforeEach(() => {
        store = new FakeStorage();
    });

    it("survives save → load", () => {
        const original = {
            queryCards: [
                {
                    id: "qc1",
                    platform: "intent" as const,
                    query: "vp ops",
                    intent: "find leaders",
                    notes: "",
                    targetIcp: "EU mid-market",
                    createdAt: "2026-04-28T00:00:00Z",
                    updatedAt: "2026-04-28T00:00:00Z"
                }
            ],
            prospects: [
                {
                    id: "pr1",
                    accountName: "Meridian",
                    contactName: "Sarah",
                    contactTitle: "VP Ops",
                    sourceQueryId: "qc1",
                    leverage: "network-connection" as const,
                    stage: "ready" as const,
                    entryPoint: "Warm intro",
                    approach: "Lead with EU compliance",
                    notes: "Strong fit",
                    createdAt: "2026-04-28T00:00:00Z",
                    updatedAt: "2026-04-28T00:00:00Z"
                }
            ]
        };
        saveAll(original, store);
        const cards = loadQueryCards(store);
        const prospects = loadProspects(store);
        expect(cards).toHaveLength(1);
        expect(prospects).toHaveLength(1);
        expect(cards[0]!.platform).toBe("intent");
        expect(prospects[0]!.leverage).toBe("network-connection");
        expect(prospects[0]!.stage).toBe("ready");
    });
});
