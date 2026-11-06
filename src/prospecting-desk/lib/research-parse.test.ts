import { describe, expect, it } from "vitest";
import type { Prospect, ProspectResearch } from "./types";
import { loadProspects, saveAll } from "./persistence";
import { prospectToInsert, rowToProspect, queryCardToUpdate, rowToQueryCard } from "./sourcing-bridge";
import type { Row } from "@/lib/database-helpers";

const research: ProspectResearch = {
    kind: "research",
    researchedAt: "2026-11-01T10:00:00.000Z",
    summary: "Payroll software for mid-size companies.",
    domain: "acme.io",
    signals: [{ what: "Raised a Series B.", date: "2026-10-02", sourceUrl: "https://news.example/acme", sourceName: null }],
    sources: ["https://acme.io"],
    whoToTarget: { role: "VP of Sales", why: "Owns hiring." },
    openingAngle: "Open with the raise.",
    confidence: null,
    fitMatches: ["Mid-size."],
    fitUnknowns: ["Tools unknown."],
    suggested: { targetFit: "Yes.", wayIn: "The raise.", outreach: "Email." },
    sample: false
};

const base: Prospect = {
    id: "pr_1", accountName: "Acme", contactName: "", contactTitle: "VP of Sales", sourceQueryId: "",
    leverage: "market-signal", stage: "captured", entryPoint: "", approach: "", notes: "",
    createdAt: "2026-11-01T10:00:00.000Z", updatedAt: "2026-11-01T10:00:00.000Z"
};

function memory(): { getItem(k: string): string | null; setItem(k: string, v: string): void } {
    const m = new Map<string, string>();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}

describe("web research persists on prospects", () => {
    it("round-trips through localStorage", () => {
        const s = memory();
        saveAll({ queryCards: [], prospects: [{ ...base, webResearch: research }] }, s);
        expect(loadProspects(s)[0]!.webResearch).toEqual(research);
    });

    it("round-trips through the studio_artifacts row bridge", () => {
        const row = { id: "00000000-0000-4000-8000-000000000001", ...prospectToInsert({ ...base, webResearch: research }), created_at: base.createdAt, updated_at: base.updatedAt } as unknown as Row<"studio_artifacts">;
        expect(rowToProspect(row)!.webResearch).toEqual(research);
    });

    it("loads older rows without research, and ignores the seed's unrelated research shape and bad links", () => {
        const s = memory();
        s.setItem("gtmos_sw_prospects", JSON.stringify([
            { id: "a", name: "Alaska Airlines", stage: "ready", research: { focusMatch: "strong", note: "x" } },
            { id: "b", accountName: "Beta", webResearch: { researchedAt: "2026-11-01", sources: ["javascript:alert(1)", "https://ok.example"], signals: [{ what: "x", sourceUrl: "http://plain.example" }] } },
            { id: "c", accountName: "Gamma", webResearch: "garbage" }
        ]));
        const [a, b, c] = loadProspects(s);
        expect(a!.webResearch).toBeUndefined();
        expect(b!.webResearch!.sources).toEqual(["https://ok.example"]);
        expect(b!.webResearch!.signals[0]!.sourceUrl).toBeNull();
        expect(c!.webResearch).toBeUndefined();
    });

    it("saved-search check fields round-trip through the bridge", () => {
        const card = { id: "q1", platform: "search" as const, query: "HR tech", intent: "", notes: "", targetIcp: "", createdAt: "x", updatedAt: "x", lastCheckedAt: "2026-11-02T00:00:00.000Z", lastNewCount: 3 };
        const row = { id: "q1", data: queryCardToUpdate(card).data, created_at: "x", updated_at: "x" } as unknown as Row<"studio_artifacts">;
        expect(rowToQueryCard(row)).toMatchObject({ lastCheckedAt: "2026-11-02T00:00:00.000Z", lastNewCount: 3 });
    });
});
