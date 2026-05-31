import type { ObservationCandidate, RelatedObjectType } from "./types";

/**
 * `proof_staleness` generator — pure function form.
 *
 * Emits one observation per proof whose readout date has passed
 * without a recorded outcome. A proof is "stale" when:
 *
 *   - outcome_state is "open" (not passed, failed, or abandoned), AND
 *   - created_at + duration_days has passed (now ≥ readout)
 *
 * No threshold knob — the proof's own duration_days is the deadline.
 * Each proof times itself.
 *
 * Voice contract: observation_text passes through the Voice Document
 * validator. Tests below assert.
 *
 * Ref: ADR-009 §"Four initial generators" — proof_staleness.
 */

export const PROOF_STALENESS_GENERATOR_ID = "phase-b/proof-staleness";
const RELATED_OBJECT_TYPE: RelatedObjectType = "proof";

/** Subset of `proofs` the generator reads. */
export interface ProofForStalenessCheck {
    readonly id: string;
    readonly claim: string | null;
    readonly claim_owner: string | null;
    readonly outcome_state: string | null;
    readonly created_at: string;
    readonly duration_days: number;
}

interface StaleProof {
    readonly proof: ProofForStalenessCheck;
    readonly daysOverdue: number;
}

export function selectStaleProofs(
    proofs: ReadonlyArray<ProofForStalenessCheck>,
    now: Date
): ReadonlyArray<StaleProof> {
    const out: StaleProof[] = [];
    for (const p of proofs) {
        if (p.outcome_state !== "open") continue;
        const created = new Date(p.created_at);
        if (Number.isNaN(created.getTime())) continue;
        const readout = new Date(
            created.getTime() + p.duration_days * 24 * 60 * 60 * 1000
        );
        if (readout.getTime() > now.getTime()) continue;
        const daysOverdue = Math.floor(
            (now.getTime() - readout.getTime()) / (1000 * 60 * 60 * 24)
        );
        out.push({ proof: p, daysOverdue });
    }
    return out.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

function renderCandidate(s: StaleProof): ObservationCandidate {
    const claim = s.proof.claim?.trim();
    const owner = s.proof.claim_owner?.trim();
    const subject = claim ? `The "${claim}" proof` : "A pilot proof";
    const ownerClause = owner ? ` Readout owner is ${owner}.` : "";
    const overdueClause =
        s.daysOverdue === 0
            ? "is at its readout window today"
            : `passed its readout window ${s.daysOverdue} days ago`;
    const text = `${subject} ${overdueClause} with no recorded outcome.${ownerClause}`;
    return {
        observationText: text,
        relatedObjectType: RELATED_OBJECT_TYPE,
        relatedObjectId: s.proof.id,
        confidence: "high",
        supersedesPrior: true
    };
}

export function deriveProofStalenessObservations(
    proofs: ReadonlyArray<ProofForStalenessCheck>,
    now: Date
): ReadonlyArray<ObservationCandidate> {
    return selectStaleProofs(proofs, now).map(renderCandidate);
}
