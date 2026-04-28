import { describe, expect, it } from "vitest";
import { loadAnalytics, saveAnalytics, uid } from "./persistence";
import type { SavedIcp } from "./types";

class MemStorage {
    private store = new Map<string, string>();
    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.store.set(k, v);
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
}

function makeIcp(p: Partial<SavedIcp>): SavedIcp {
    return {
        id: p.id ?? "icp-1",
        statement: p.statement ?? "We win with X...",
        role: p.role ?? "founder",
        industry: p.industry ?? "Logistics",
        size: p.size ?? "200-1,000 employees",
        geo: p.geo ?? "US",
        buyer: p.buyer ?? "VP Operations",
        pain: p.pain ?? "Cost control / spend leakage",
        trigger: p.trigger ?? "Hiring spike / org change",
        proofWindow: p.proofWindow ?? "14 days",
        engineActive: p.engineActive ?? 80,
        qualityScore: p.qualityScore ?? 85,
        qualityChecks: p.qualityChecks ?? [
            { tone: "good", text: "Industry wedge is defined." }
        ],
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z",
        updatedAt: p.updatedAt ?? "2026-04-27T00:00:00Z"
    };
}

describe("loadAnalytics", () => {
    it("returns EMPTY_ANALYTICS when storage is null", () => {
        expect(loadAnalytics(null)).toEqual({ icps: [], totalWorked: 0 });
    });

    it("returns EMPTY_ANALYTICS when key is missing or malformed", () => {
        const s = new MemStorage();
        expect(loadAnalytics(s)).toEqual({ icps: [], totalWorked: 0 });
        s.seed("gtmos_icp_analytics", "{not json");
        expect(loadAnalytics(s)).toEqual({ icps: [], totalWorked: 0 });
    });

    it("drops rows missing id", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_icp_analytics",
            JSON.stringify({
                icps: [
                    makeIcp({ id: "good" }),
                    { ...makeIcp({}), id: "" },
                    null
                ],
                totalWorked: 2
            })
        );
        const out = loadAnalytics(s);
        expect(out.icps.map((i) => i.id)).toEqual(["good"]);
        expect(out.totalWorked).toBe(2);
    });

    it("normalizes role + qualityCheck tones", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_icp_analytics",
            JSON.stringify({
                icps: [
                    {
                        ...makeIcp({}),
                        role: "ghost",
                        qualityChecks: [
                            { tone: "weird", text: "hi" },
                            { tone: "good", text: "ok" }
                        ]
                    }
                ],
                totalWorked: 0
            })
        );
        const out = loadAnalytics(s);
        expect(out.icps[0]?.role).toBe("founder");
        expect(out.icps[0]?.qualityChecks[0]?.tone).toBe("warn");
        expect(out.icps[0]?.qualityChecks[1]?.tone).toBe("good");
    });

    it("falls back from updatedAt to createdAt", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_icp_analytics",
            JSON.stringify({
                icps: [
                    {
                        ...makeIcp({}),
                        updatedAt: "",
                        createdAt: "2026-04-01T00:00:00Z"
                    }
                ],
                totalWorked: 0
            })
        );
        expect(loadAnalytics(s).icps[0]?.updatedAt).toBe(
            "2026-04-01T00:00:00Z"
        );
    });

    it("clamps totalWorked to 0 floor", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_icp_analytics",
            JSON.stringify({ icps: [], totalWorked: -5 })
        );
        expect(loadAnalytics(s).totalWorked).toBe(0);
    });

    it("accepts legacy `activeAccounts` field as a fallback when `engineActive` is missing", () => {
        // Legacy ICP rows persisted under the `activeAccounts` key
        // (legacy line 1657 in app/icp-studio/index.html). Newer rows
        // use `engineActive`. When only the legacy key is present, the
        // parser should pick it up.
        const s = new MemStorage();
        const { engineActive: _drop, ...rest } = makeIcp({});
        void _drop;
        s.seed(
            "gtmos_icp_analytics",
            JSON.stringify({
                icps: [{ ...rest, activeAccounts: 75 }],
                totalWorked: 0
            })
        );
        expect(loadAnalytics(s).icps[0]?.engineActive).toBe(75);
    });
});

describe("saveAnalytics", () => {
    it("round-trips through loadAnalytics", () => {
        const s = new MemStorage();
        const icps = [makeIcp({ id: "a" }), makeIcp({ id: "b" })];
        saveAnalytics({ icps, totalWorked: 3 }, s);
        const out = loadAnalytics(s);
        expect(out.icps.map((i) => i.id)).toEqual(["a", "b"]);
        expect(out.totalWorked).toBe(3);
    });

    it("preserves the {icps, totalWorked} envelope shape", () => {
        const s = new MemStorage();
        saveAnalytics({ icps: [makeIcp({})], totalWorked: 1 }, s);
        const raw = s.getItem("gtmos_icp_analytics");
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw as string) as Record<string, unknown>;
        expect(Array.isArray(parsed.icps)).toBe(true);
        expect(parsed.totalWorked).toBe(1);
    });
});

describe("uid", () => {
    it("starts with prefix + timestamp", () => {
        const id = uid("icp", 1746000000000);
        expect(id.startsWith("icp_1746000000000_")).toBe(true);
    });

    it("two consecutive ids are different", () => {
        expect(uid("icp", 100)).not.toBe(uid("icp", 100));
    });
});
