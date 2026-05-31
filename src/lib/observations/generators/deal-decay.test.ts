import { describe, expect, it } from "vitest";
import {
    DEAL_DECAY_GENERATOR_ID,
    STALL_THRESHOLD_DAYS,
    currentStageStartedAt,
    deriveDealDecayObservations,
    selectStalledDeals,
    type DealForDecayCheck,
    type StageTransition
} from "./deal-decay";
import { validateObservation } from "@/lib/voice/voice-document";

const NOW = new Date("2026-05-31T12:00:00.000Z");

function daysAgo(n: number): string {
    return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

function history(stages: ReadonlyArray<[string, number]>): StageTransition[] {
    // Each entry: [stageName, daysAgo]. The function fabricates the
    // transitions as a continuous chain.
    return stages.map(([stage, ago], i) => ({
        from: i === 0 ? "" : stages[i - 1]![0],
        to: stage,
        at: daysAgo(ago)
    }));
}

function makeDeal(over: Partial<DealForDecayCheck> = {}): DealForDecayCheck {
    // Spread `over` LAST so explicit null/undefined values win over
    // the defaults.
    return {
        id: "d_1",
        account_name: "Acme",
        stage: "negotiation",
        stage_history: history([
            ["prospect", 30],
            ["discovery", 25],
            ["evaluation", 20],
            ["negotiation", 10]
        ]),
        next_step_date: null,
        updated_at: daysAgo(10),
        ...over
    };
}

describe("currentStageStartedAt", () => {
    it("returns null for null/empty history", () => {
        expect(currentStageStartedAt(null)).toBeNull();
        expect(currentStageStartedAt([])).toBeNull();
    });

    it("returns the last transition's at", () => {
        const h = history([
            ["prospect", 30],
            ["discovery", 20],
            ["negotiation", 10]
        ]);
        expect(currentStageStartedAt(h)).toBe(daysAgo(10));
    });

    it("walks backward past entries with missing at", () => {
        const h: StageTransition[] = [
            { from: "", to: "prospect", at: daysAgo(20) },
            { from: "prospect", to: "discovery", at: "" }
        ];
        expect(currentStageStartedAt(h)).toBe(daysAgo(20));
    });
});

describe("selectStalledDeals — threshold semantics", () => {
    it("returns empty for an empty list", () => {
        expect(selectStalledDeals([], NOW)).toEqual([]);
    });

    it("ignores closed-won deals even if they meet threshold", () => {
        const out = selectStalledDeals(
            [makeDeal({ stage: "closed-won" })],
            NOW
        );
        expect(out).toEqual([]);
    });

    it("ignores closed-lost deals even if they meet threshold", () => {
        const out = selectStalledDeals(
            [makeDeal({ stage: "closed-lost" })],
            NOW
        );
        expect(out).toEqual([]);
    });

    it("ignores deals younger than the threshold", () => {
        const out = selectStalledDeals(
            [
                makeDeal({
                    stage_history: history([
                        ["prospect", 30],
                        ["negotiation", STALL_THRESHOLD_DAYS - 1]
                    ])
                })
            ],
            NOW
        );
        expect(out).toEqual([]);
    });

    it("includes a deal exactly at the threshold", () => {
        const out = selectStalledDeals(
            [
                makeDeal({
                    stage_history: history([
                        ["prospect", 30],
                        ["negotiation", STALL_THRESHOLD_DAYS]
                    ])
                })
            ],
            NOW
        );
        expect(out.length).toBe(1);
        expect(out[0]!.daysAtStage).toBeGreaterThanOrEqual(STALL_THRESHOLD_DAYS);
    });

    it("ignores deals with a future-dated next_step_date even if old", () => {
        const out = selectStalledDeals(
            [
                makeDeal({
                    stage_history: history([["negotiation", 30]]),
                    next_step_date: new Date(
                        NOW.getTime() + 5 * 24 * 60 * 60 * 1000
                    ).toISOString()
                })
            ],
            NOW
        );
        expect(out).toEqual([]);
    });

    it("includes a deal with an overdue next_step_date", () => {
        const out = selectStalledDeals(
            [
                makeDeal({
                    stage_history: history([["negotiation", 30]]),
                    next_step_date: daysAgo(2)
                })
            ],
            NOW
        );
        expect(out.length).toBe(1);
    });

    it("falls back to updated_at when stage_history is null", () => {
        const out = selectStalledDeals(
            [
                makeDeal({
                    stage_history: null,
                    updated_at: daysAgo(20)
                })
            ],
            NOW
        );
        expect(out.length).toBe(1);
        expect(out[0]!.daysAtStage).toBeGreaterThanOrEqual(20);
    });

    it("skips a deal with no stage", () => {
        const out = selectStalledDeals(
            [makeDeal({ stage: null })],
            NOW
        );
        expect(out).toEqual([]);
    });

    it("skips a deal with neither stage_history nor updated_at", () => {
        const out = selectStalledDeals(
            [
                makeDeal({
                    stage_history: null,
                    updated_at: null
                })
            ],
            NOW
        );
        expect(out).toEqual([]);
    });

    it("sorts most-decayed first", () => {
        const out = selectStalledDeals(
            [
                makeDeal({
                    id: "younger",
                    stage_history: history([["negotiation", 10]])
                }),
                makeDeal({
                    id: "older",
                    stage_history: history([["negotiation", 30]])
                })
            ],
            NOW
        );
        expect(out.map((s) => s.deal.id)).toEqual(["older", "younger"]);
    });
});

describe("deriveDealDecayObservations — voice + shape", () => {
    it("produces a candidate per stalled deal", () => {
        const candidates = deriveDealDecayObservations(
            [
                makeDeal({ id: "d_a", account_name: "Acme" }),
                makeDeal({ id: "d_b", account_name: "Globex" })
            ],
            NOW
        );
        expect(candidates.length).toBe(2);
    });

    it("each candidate names the account, stage, and day count", () => {
        const [c] = deriveDealDecayObservations(
            [
                makeDeal({
                    id: "d_a",
                    account_name: "Acme",
                    stage: "negotiation",
                    stage_history: history([["negotiation", 21]])
                })
            ],
            NOW
        );
        expect(c!.observationText).toContain("Acme");
        expect(c!.observationText).toContain("negotiation");
        expect(c!.observationText).toContain("21");
    });

    it("flags 'no dated next step' when next_step_date is null", () => {
        const [c] = deriveDealDecayObservations(
            [makeDeal({ next_step_date: null })],
            NOW
        );
        expect(c!.observationText).toContain("no dated next step");
    });

    it("flags 'overdue next step' when next_step_date is in the past", () => {
        const [c] = deriveDealDecayObservations(
            [makeDeal({ next_step_date: daysAgo(2) })],
            NOW
        );
        expect(c!.observationText).toContain("overdue next step");
    });

    it("supersedesPrior=true so re-fires evolve instead of stack", () => {
        const [c] = deriveDealDecayObservations([makeDeal()], NOW);
        expect(c!.supersedesPrior).toBe(true);
    });

    it("relatedObjectType is 'deal' and relatedObjectId is the deal id", () => {
        const [c] = deriveDealDecayObservations(
            [makeDeal({ id: "d_specific" })],
            NOW
        );
        expect(c!.relatedObjectType).toBe("deal");
        expect(c!.relatedObjectId).toBe("d_specific");
    });

    it("every produced candidate passes the Voice Document validator", () => {
        const candidates = deriveDealDecayObservations(
            [
                makeDeal({ id: "d1", account_name: "Acme", stage: "negotiation" }),
                makeDeal({ id: "d2", account_name: "Globex", stage: "discovery" }),
                makeDeal({
                    id: "d3",
                    account_name: "Initech",
                    stage: "prospect",
                    next_step_date: daysAgo(5)
                })
            ],
            NOW
        );
        for (const c of candidates) {
            const v = validateObservation(c.observationText);
            expect(
                v.valid,
                `voice failed for: "${c.observationText}" — ${v.violations.map((x) => x.message).join("; ")}`
            ).toBe(true);
        }
    });

    it("falls back to 'unnamed deal' when account_name is null", () => {
        const [c] = deriveDealDecayObservations(
            [makeDeal({ account_name: null })],
            NOW
        );
        expect(c!.observationText).toContain("unnamed deal");
    });
});

describe("selectStalledDeals — placeholder filtering", () => {
    it("skips the migration-blob passthrough row", () => {
        const out = selectStalledDeals(
            [
                makeDeal({
                    id: "blob",
                    account_name: "__gtmos_migration_blob__",
                    stage_history: history([["discovery", 37]])
                }),
                makeDeal({
                    id: "real",
                    account_name: "Acme",
                    stage_history: history([["negotiation", 21]])
                })
            ],
            NOW
        );
        expect(out.map((s) => s.deal.id)).toEqual(["real"]);
    });
});

describe("DEAL_DECAY_GENERATOR_ID", () => {
    it("follows the phase-b/<name> convention", () => {
        expect(DEAL_DECAY_GENERATOR_ID).toBe("phase-b/deal-decay");
    });
});
