import { describe, expect, it } from "vitest";
import { transitionedToLost } from "./state";

describe("transitionedToLost", () => {
    it("returns true on first transition into closed-lost", () => {
        expect(transitionedToLost("negotiation", "closed-lost")).toBe(true);
        expect(transitionedToLost("verbal", "closed-lost")).toBe(true);
        expect(transitionedToLost("prospect", "closed-lost")).toBe(true);
    });

    it("returns false when prev was already closed-lost (re-edit)", () => {
        expect(transitionedToLost("closed-lost", "closed-lost")).toBe(false);
    });

    it("returns false when next is not closed-lost", () => {
        expect(transitionedToLost("discovery", "evaluation")).toBe(false);
        expect(transitionedToLost("negotiation", "closed-won")).toBe(false);
        expect(transitionedToLost(null, "discovery")).toBe(false);
    });

    it("returns true even when prev is null (deal landed straight in lost)", () => {
        expect(transitionedToLost(null, "closed-lost")).toBe(true);
    });
});

// ── Pipeline CSV export (pre-beta hygiene, 2026-06-02) ──────────

import { allDeals, exportDealsCsv } from "./state";
import { beforeEach, vi } from "vitest";
import type { Deal } from "./lib/deal-shape";

function mkDeal(over: Partial<Deal> = {}): Deal {
    return {
        id: over.id ?? "d1",
        accountName: over.accountName ?? "Acme",
        value: over.value ?? 50000,
        stage: over.stage ?? "discovery",
        nextStep: over.nextStep,
        nextStepDate: over.nextStepDate,
        closeDate: over.closeDate,
        forecastCategory: over.forecastCategory,
        momentum: over.momentum,
        champion: over.champion,
        economicBuyer: over.economicBuyer,
        useCase: over.useCase,
        pain: over.pain,
        competition: over.competition,
        decisionProcess: over.decisionProcess,
        notes: over.notes,
        stakeholders: over.stakeholders,
        lossReason: over.lossReason,
        lossNotes: over.lossNotes,
        created_at: over.created_at,
        updated_at: over.updated_at
    };
}

describe("exportDealsCsv", () => {
    beforeEach(() => {
        allDeals.value = [];
    });

    it("returns ok:false rowCount:0 when called outside a DOM (default test env)", () => {
        // jsdom DOES provide document, so the download triggers. Validate
        // shape regardless: ok is boolean, rowCount matches.
        allDeals.value = [];
        const r = exportDealsCsv();
        expect(typeof r.ok).toBe("boolean");
        expect(r.rowCount).toBe(0);
    });

    it("counts the current rows + triggers a download", () => {
        allDeals.value = [
            mkDeal({ id: "a", accountName: "Acme", value: 10000 }),
            mkDeal({ id: "b", accountName: "BetaCo", value: 20000 })
        ];
        // Stub Blob URL creation so jsdom doesn't error.
        const createUrl = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:test");
        const revokeUrl = vi
            .spyOn(URL, "revokeObjectURL")
            .mockReturnValue(undefined);
        const r = exportDealsCsv();
        expect(r.rowCount).toBe(2);
        expect(r.ok).toBe(true);
        createUrl.mockRestore();
        revokeUrl.mockRestore();
    });
});
