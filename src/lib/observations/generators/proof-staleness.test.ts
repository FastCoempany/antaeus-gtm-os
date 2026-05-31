import { describe, expect, it } from "vitest";
import {
    PROOF_STALENESS_GENERATOR_ID,
    deriveProofStalenessObservations,
    selectStaleProofs,
    type ProofForStalenessCheck
} from "./proof-staleness";
import { validateObservation } from "@/lib/voice/voice-document";

const NOW = new Date("2026-05-31T12:00:00.000Z");

function daysAgo(n: number): string {
    return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

function makeProof(
    over: Partial<ProofForStalenessCheck> = {}
): ProofForStalenessCheck {
    return {
        id: "p_1",
        claim: "Resolves 40% of routine inquiries",
        claim_owner: "VP Support",
        outcome_state: "open",
        created_at: daysAgo(20),
        duration_days: 14,
        ...over
    };
}

describe("selectStaleProofs", () => {
    it("ignores proofs with non-open outcome", () => {
        for (const state of ["passed", "failed", "abandoned"]) {
            const out = selectStaleProofs(
                [makeProof({ outcome_state: state })],
                NOW
            );
            expect(out).toEqual([]);
        }
    });

    it("ignores proofs whose readout window is in the future", () => {
        const out = selectStaleProofs(
            [makeProof({ created_at: daysAgo(5), duration_days: 14 })],
            NOW
        );
        // 5d into a 14d window → readout is +9d.
        expect(out).toEqual([]);
    });

    it("includes a proof past its readout window", () => {
        const out = selectStaleProofs(
            [makeProof({ created_at: daysAgo(20), duration_days: 14 })],
            NOW
        );
        // 20d into a 14d window → 6d overdue.
        expect(out.length).toBe(1);
        expect(out[0]!.daysOverdue).toBe(6);
    });

    it("sorts most-overdue first", () => {
        const out = selectStaleProofs(
            [
                makeProof({ id: "p_a", created_at: daysAgo(20) }),
                makeProof({ id: "p_b", created_at: daysAgo(40) })
            ],
            NOW
        );
        expect(out.map((s) => s.proof.id)).toEqual(["p_b", "p_a"]);
    });

    it("skips proofs with unparseable created_at", () => {
        const out = selectStaleProofs(
            [makeProof({ created_at: "not a date" })],
            NOW
        );
        expect(out).toEqual([]);
    });
});

describe("deriveProofStalenessObservations — voice + shape", () => {
    it("names the claim, the overdue duration, and the owner", () => {
        const [c] = deriveProofStalenessObservations(
            [
                makeProof({
                    claim: "Resolves 40% of routine inquiries",
                    claim_owner: "VP Support",
                    created_at: daysAgo(20),
                    duration_days: 14
                })
            ],
            NOW
        );
        expect(c!.observationText).toContain("Resolves 40%");
        expect(c!.observationText).toContain("6 days ago");
        expect(c!.observationText).toContain("VP Support");
    });

    it("renders the 'at readout window today' variant when daysOverdue is 0", () => {
        const [c] = deriveProofStalenessObservations(
            [makeProof({ created_at: daysAgo(14), duration_days: 14 })],
            NOW
        );
        expect(c!.observationText).toContain("today");
    });

    it("falls back to 'pilot proof' when no claim", () => {
        const [c] = deriveProofStalenessObservations(
            [makeProof({ claim: null })],
            NOW
        );
        expect(c!.observationText).toContain("pilot proof");
    });

    it("omits owner clause when no claim_owner", () => {
        const [c] = deriveProofStalenessObservations(
            [makeProof({ claim_owner: null })],
            NOW
        );
        expect(c!.observationText).not.toContain("Readout owner");
    });

    it("carries proof-scoped supersession metadata", () => {
        const [c] = deriveProofStalenessObservations(
            [makeProof({ id: "p_specific" })],
            NOW
        );
        expect(c!.relatedObjectType).toBe("proof");
        expect(c!.relatedObjectId).toBe("p_specific");
        expect(c!.supersedesPrior).toBe(true);
    });

    it("every produced candidate passes the Voice Document validator", () => {
        const candidates = deriveProofStalenessObservations(
            [
                makeProof({ id: "p1" }),
                makeProof({ id: "p2", claim: null, claim_owner: null }),
                makeProof({
                    id: "p3",
                    claim: "Cut deflection time below 90 seconds",
                    claim_owner: null,
                    created_at: daysAgo(30)
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
});

describe("PROOF_STALENESS_GENERATOR_ID", () => {
    it("follows phase-b/<name>", () => {
        expect(PROOF_STALENESS_GENERATOR_ID).toBe("phase-b/proof-staleness");
    });
});
