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
