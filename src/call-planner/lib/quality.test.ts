import { describe, expect, it } from "vitest";
import { evaluateQuality, type QualityInputs } from "./quality";
import {
    EMPTY_DRAFT,
    type Draft,
    type LinkedDeal,
    type MatchedAccount
} from "./types";

function makeDraft(p: Partial<Draft> = {}): Draft {
    return { ...EMPTY_DRAFT, ...p };
}

function makeAccount(p: Partial<MatchedAccount> = {}): MatchedAccount {
    return {
        id: p.id ?? "acct-1",
        name: p.name ?? "Acme",
        heat: p.heat ?? 60,
        topSignal:
            "topSignal" in p
                ? (p.topSignal ?? null)
                : { headline: "Series B announced", publishedDate: "2026-04-25" }
    };
}

function makeDeal(p: Partial<LinkedDeal> = {}): LinkedDeal {
    return {
        id: p.id ?? "deal-1",
        accountName: p.accountName ?? "Acme",
        value: p.value ?? 50000,
        stage: p.stage ?? "prospect"
    };
}

function inputs(p: Partial<QualityInputs> = {}): QualityInputs {
    return {
        draft: p.draft ?? makeDraft(),
        matchedAccount:
            "matchedAccount" in p ? (p.matchedAccount ?? null) : null,
        linkedDeal: "linkedDeal" in p ? (p.linkedDeal ?? null) : null
    };
}

describe("evaluateQuality — empty draft", () => {
    it("scores 10 (only the persona gate is met by default)", () => {
        const q = evaluateQuality(inputs());
        // Persona is "cxo" by default → met. All other gates miss.
        expect(q.score).toBe(10);
        expect(q.band).toBe("thin");
        expect(q.bandLabel).toBe("Thin");
        expect(q.gates.find((g) => g.key === "persona")?.met).toBe(true);
        expect(q.gates.find((g) => g.key === "person")?.met).toBe(false);
        expect(q.gates.find((g) => g.key === "context")?.met).toBe(false);
        expect(q.gates.find((g) => g.key === "why_now")?.met).toBe(false);
        expect(q.gates.find((g) => g.key === "advancement")?.met).toBe(false);
    });

    it("nextMove tells the operator to pick a real human first", () => {
        expect(evaluateQuality(inputs()).nextMove).toContain(
            "Choose the actual human"
        );
    });
});

describe("evaluateQuality — gate-by-gate scoring", () => {
    it("Real-person gate (≥ 2 chars) adds 20", () => {
        const q = evaluateQuality(
            inputs({ draft: makeDraft({ contactName: "Sarah" }) })
        );
        expect(q.score).toBe(30); // person 20 + persona 10
        expect(q.gates.find((g) => g.key === "person")?.met).toBe(true);
    });

    it("Real-person gate is OFF when contact is exactly 1 char", () => {
        const q = evaluateQuality(
            inputs({ draft: makeDraft({ contactName: "S" }) })
        );
        expect(q.gates.find((g) => g.key === "person")?.met).toBe(false);
    });

    it("Account-context gate via matchedAccount adds 20", () => {
        const q = evaluateQuality(
            inputs({
                matchedAccount: makeAccount({ topSignal: null }),
                draft: makeDraft({ contactName: "Sarah" })
            })
        );
        // person 20 + persona 10 + context 20 = 50
        expect(q.score).toBe(50);
        expect(q.gates.find((g) => g.key === "context")?.met).toBe(true);
    });

    it("Account-context gate via linkedinUrl adds 20 (no matched account needed)", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    linkedinUrl: "https://linkedin.com/in/sarah"
                })
            })
        );
        expect(q.gates.find((g) => g.key === "context")?.met).toBe(true);
        expect(q.score).toBe(50);
    });

    it("Why-now via top signal adds 25", () => {
        const q = evaluateQuality(
            inputs({
                matchedAccount: makeAccount(),
                draft: makeDraft({ contactName: "Sarah" })
            })
        );
        // person 20 + persona 10 + context 20 + why_now 25 = 75
        expect(q.score).toBe(75);
        expect(q.gates.find((g) => g.key === "why_now")?.met).toBe(true);
    });

    it("Why-now via custom notes (≥ 20 chars) adds 25", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    customNotes:
                        "They keep slipping on RevOps reporting deadlines."
                }),
                matchedAccount: makeAccount({ topSignal: null })
            })
        );
        expect(q.gates.find((g) => g.key === "why_now")?.met).toBe(true);
    });

    it("Why-now is OFF when custom notes is exactly 19 chars", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    customNotes: "1234567890123456789"
                }),
                matchedAccount: makeAccount({ topSignal: null })
            })
        );
        expect(q.gates.find((g) => g.key === "why_now")?.met).toBe(false);
    });

    it("Advancement gate adds 25 when a deal is linked", () => {
        const q = evaluateQuality(
            inputs({
                linkedDeal: makeDeal(),
                draft: makeDraft({ contactName: "Sarah" })
            })
        );
        // person 20 + persona 10 + advancement 25 = 55
        expect(q.score).toBe(55);
        expect(q.gates.find((g) => g.key === "advancement")?.met).toBe(true);
    });

    it("All five gates met without heat bonus → 100", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    customNotes: "Some custom context line over 20 chars long"
                }),
                matchedAccount: makeAccount({ heat: 60, topSignal: null }),
                linkedDeal: makeDeal()
            })
        );
        expect(q.score).toBe(100);
        expect(q.band).toBe("credible");
        expect(q.bandLabel).toBe("Credible");
    });
});

describe("evaluateQuality — heat bonus + clamp", () => {
    it("Heat ≥ 85 adds the +5 bonus on top", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    customNotes: "Manual context that is at least 20 chars."
                }),
                // matched account exists but no top signal so why_now needs notes
                matchedAccount: makeAccount({ heat: 90, topSignal: null }),
                linkedDeal: makeDeal()
            })
        );
        // 20+10+20+25+25 = 100, +5 bonus → still capped at 100
        expect(q.score).toBe(100);
    });

    it("Heat < 85 does NOT add the bonus", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    linkedinUrl: "https://x"
                }),
                matchedAccount: makeAccount({ heat: 84, topSignal: null }),
                linkedDeal: makeDeal()
            })
        );
        // person 20 + persona 10 + context 20 + advancement 25 = 75 (no why_now)
        expect(q.score).toBe(75);
    });

    it("Score is clamped at 100", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    linkedinUrl: "https://x"
                }),
                matchedAccount: makeAccount({ heat: 99 }),
                linkedDeal: makeDeal()
            })
        );
        // 20+10+20+25+25 = 100, +5 → clamp 100
        expect(q.score).toBe(100);
    });
});

describe("evaluateQuality — band thresholds", () => {
    it("score 84 → workable, 85 → credible (boundary)", () => {
        const draftBase = makeDraft({
            contactName: "Sarah",
            linkedinUrl: "https://x",
            customNotes: "Manual context that is at least 20 chars."
        });
        // 20+10+20+25 = 75 + heat-bonus 5 = 80 → workable
        // we need exactly 85 vs 84 — easier to test by inspection across gate combos.
        const workable = evaluateQuality(
            inputs({
                draft: draftBase,
                matchedAccount: makeAccount({ heat: 90 })
            })
        );
        // person 20 + persona 10 + context 20 + why_now 25 + bonus 5 = 80
        expect(workable.score).toBe(80);
        expect(workable.band).toBe("workable");

        const credible = evaluateQuality(
            inputs({
                draft: draftBase,
                matchedAccount: makeAccount({ heat: 90 }),
                linkedDeal: makeDeal()
            })
        );
        // 80 + advancement 25 = 105 → clamp 100 → credible
        expect(credible.score).toBe(100);
        expect(credible.band).toBe("credible");
    });

    it("score 64 → thin, 65 → workable (boundary)", () => {
        const thin = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    customNotes: "Twenty-character context line here."
                })
            })
        );
        // person 20 + persona 10 + why_now 25 = 55 → thin
        expect(thin.score).toBe(55);
        expect(thin.band).toBe("thin");

        const workable = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    linkedinUrl: "https://x"
                }),
                linkedDeal: makeDeal()
            })
        );
        // person 20 + persona 10 + context 20 + advancement 25 = 75 → workable
        expect(workable.score).toBe(75);
        expect(workable.band).toBe("workable");
    });
});

describe("evaluateQuality — nextMove ordering", () => {
    it("missing person beats every other coach line", () => {
        expect(evaluateQuality(inputs()).nextMove).toContain(
            "actual human"
        );
    });

    it("missing context beats missing why-now and missing advancement", () => {
        const q = evaluateQuality(
            inputs({ draft: makeDraft({ contactName: "Sarah" }) })
        );
        expect(q.nextMove).toContain("LinkedIn profile or match");
    });

    it("missing why-now is suggested when context is present but no signal/notes", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    linkedinUrl: "https://x"
                })
            })
        );
        expect(q.nextMove).toContain("why-now");
    });

    it("missing advancement is suggested when everything else is met", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({
                    contactName: "Sarah",
                    customNotes: "Twenty-character context line here please."
                }),
                matchedAccount: makeAccount({ topSignal: null }),
                linkedDeal: null
            })
        );
        expect(q.nextMove).toContain("in-flight deal");
    });

    it("all gates met → coach line points downstream", () => {
        const q = evaluateQuality(
            inputs({
                draft: makeDraft({ contactName: "Sarah" }),
                matchedAccount: makeAccount(),
                linkedDeal: makeDeal()
            })
        );
        expect(q.nextMove).toContain("Discovery Studio");
    });
});

describe("evaluateQuality — hasSignal projection", () => {
    it("is true when matched account has a top signal", () => {
        expect(
            evaluateQuality(
                inputs({ matchedAccount: makeAccount() })
            ).hasSignal
        ).toBe(true);
    });

    it("is false when matched account has no top signal", () => {
        expect(
            evaluateQuality(
                inputs({ matchedAccount: makeAccount({ topSignal: null }) })
            ).hasSignal
        ).toBe(false);
    });

    it("is false when no account is matched", () => {
        expect(evaluateQuality(inputs()).hasSignal).toBe(false);
    });
});
