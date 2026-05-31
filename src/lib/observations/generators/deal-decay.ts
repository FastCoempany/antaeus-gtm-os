import type { ObservationCandidate, RelatedObjectType } from "./types";

/**
 * `deal_decay` generator — pure function form.
 *
 * Reads the workspace's deals and emits one observation per stalled
 * deal. A deal is "stalled" when:
 *
 *   - it's not closed (open opportunity), AND
 *   - it's been at the same stage for ≥ STALL_THRESHOLD_DAYS, AND
 *   - either there's no next_step_date, OR the next_step_date has
 *     already passed
 *
 * The 7-day threshold is the most-sensitive default; the Dashboard
 * card filters to ≥ 14d by default with a 7d toggle (display-side
 * filter, not generator threshold). This way the heartbeat fires
 * once per deal once it crosses 7d, the observation supersedes on
 * each refire (so the row evolves as the deal stalls further), and
 * the operator's toggle just changes which rows are shown.
 *
 * Voice contract: each candidate text passes through
 * validateObservation() before the writer commits it. The Deno
 * wrapper calls the validator. Tests below also assert valid voice.
 *
 * Ref: ADR-009 §"Four initial generators" — deal_decay.
 */

export const STALL_THRESHOLD_DAYS = 7;
export const DEAL_DECAY_GENERATOR_ID = "phase-b/deal-decay";
const RELATED_OBJECT_TYPE: RelatedObjectType = "deal";

/**
 * Minimal subset of the `deals` table that this generator reads.
 * The Deno wrapper selects exactly these columns; the pure function
 * doesn't touch anything else.
 */
export interface DealForDecayCheck {
    readonly id: string;
    readonly account_name: string | null;
    readonly stage: string | null;
    readonly is_closed: boolean | null;
    readonly stage_changed_at: string | null;
    readonly next_step_date: string | null;
    readonly updated_at: string | null;
}

interface StalledDeal {
    readonly deal: DealForDecayCheck;
    readonly daysAtStage: number;
}

/**
 * Identify which deals have crossed the stall threshold. Exported
 * separately from `deriveDealDecayObservations` so tests can assert
 * threshold semantics independently of voice rendering.
 */
export function selectStalledDeals(
    deals: ReadonlyArray<DealForDecayCheck>,
    now: Date
): ReadonlyArray<StalledDeal> {
    const out: StalledDeal[] = [];
    for (const d of deals) {
        if (d.is_closed) continue;
        if (!d.stage) continue;

        const sinceIso = d.stage_changed_at ?? d.updated_at;
        if (!sinceIso) continue;
        const since = new Date(sinceIso);
        if (Number.isNaN(since.getTime())) continue;

        const daysAtStage = Math.floor(
            (now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysAtStage < STALL_THRESHOLD_DAYS) continue;

        const nextStepInFuture =
            d.next_step_date !== null &&
            d.next_step_date !== "" &&
            !Number.isNaN(new Date(d.next_step_date).getTime()) &&
            new Date(d.next_step_date).getTime() > now.getTime();

        if (nextStepInFuture) continue;

        out.push({ deal: d, daysAtStage });
    }
    // Sort newest-stall first so the Dashboard card's "most decayed"
    // sort is the natural read order.
    return out.sort((a, b) => b.daysAtStage - a.daysAtStage);
}

/**
 * Format a stalled deal as an observation candidate. The text uses
 * canon-voice prose (full sentence, specific entity, specific number)
 * and supersedesPrior so re-fires don't stack on the operator.
 */
function renderCandidate(s: StalledDeal): ObservationCandidate {
    const account = s.deal.account_name?.trim() || "An unnamed deal";
    const stage = s.deal.stage?.trim() || "an early stage";
    const nextStepClause =
        s.deal.next_step_date === null || s.deal.next_step_date === ""
            ? "no dated next step"
            : "an overdue next step";
    const text = `${account} has been at ${stage} for ${s.daysAtStage} days with ${nextStepClause}.`;
    return {
        observationText: text,
        relatedObjectType: RELATED_OBJECT_TYPE,
        relatedObjectId: s.deal.id,
        confidence: "high",
        supersedesPrior: true
    };
}

export function deriveDealDecayObservations(
    deals: ReadonlyArray<DealForDecayCheck>,
    now: Date
): ReadonlyArray<ObservationCandidate> {
    return selectStalledDeals(deals, now).map(renderCandidate);
}
