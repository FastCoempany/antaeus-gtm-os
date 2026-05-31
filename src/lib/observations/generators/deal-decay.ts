import type { ObservationCandidate, RelatedObjectType } from "./types";

/**
 * `deal_decay` generator — pure function form.
 *
 * Reads the workspace's deals and emits one observation per stalled
 * deal. A deal is "stalled" when:
 *
 *   - its stage is not closed-won / closed-lost (open opportunity), AND
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
 * Stage age comes from parsing the deal's `stage_history` JSONB
 * column: an append-only array of `{from, to, at}` transitions. The
 * most-recent transition's `at` is when the current stage started.
 * Falls back to `updated_at` when no history is recorded yet (a deal
 * that was created but never transitioned).
 *
 * Voice contract: each candidate text passes through
 * validateObservation() before the writer commits it.
 *
 * Ref: ADR-009 §"Four initial generators" — deal_decay.
 */

export const STALL_THRESHOLD_DAYS = 7;
export const DEAL_DECAY_GENERATOR_ID = "phase-b/deal-decay";
const RELATED_OBJECT_TYPE: RelatedObjectType = "deal";

/**
 * Stages that count as closed. Derived from the canonical isClosed()
 * in src/deal-workspace/lib/deal-shape.ts — kept as a Set here to
 * avoid cross-room imports for what's a stable two-element list.
 */
const CLOSED_STAGES: ReadonlySet<string> = new Set(["closed-won", "closed-lost"]);

/**
 * Shape of one stage_history entry. The legacy demo seed + Phase 4
 * Deal Workspace both write this exact shape.
 */
export interface StageTransition {
    readonly from: string;
    readonly to: string;
    readonly at: string;
}

/**
 * Minimal subset of the `deals` table that this generator reads.
 * The Deno wrapper selects exactly these columns; the pure function
 * doesn't touch anything else.
 *
 * NOTE: the real Postgres schema has `stage_history: jsonb`, not a
 * scalar `stage_changed_at` — that field doesn't exist. Same for
 * `is_closed`: the real schema only has `stage` (closed-ness is
 * derived). Earlier versions of this file modeled non-existent
 * columns; PR fixing this is in the session log.
 */
export interface DealForDecayCheck {
    readonly id: string;
    readonly account_name: string | null;
    readonly stage: string | null;
    readonly stage_history: ReadonlyArray<StageTransition> | null;
    readonly next_step_date: string | null;
    readonly updated_at: string | null;
}

interface StalledDeal {
    readonly deal: DealForDecayCheck;
    readonly daysAtStage: number;
}

/**
 * Extract the ISO timestamp when the deal's current stage started.
 * Returns null when no history is available; caller falls back to
 * `updated_at`. Tolerates a malformed history entry by walking
 * backward until a parseable `at` is found.
 */
export function currentStageStartedAt(
    history: ReadonlyArray<StageTransition> | null
): string | null {
    if (!history || history.length === 0) return null;
    for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        if (!entry) continue;
        if (typeof entry.at === "string" && entry.at.length > 0) {
            return entry.at;
        }
    }
    return null;
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
        if (!d.stage) continue;
        if (CLOSED_STAGES.has(d.stage)) continue;

        const sinceIso =
            currentStageStartedAt(d.stage_history) ?? d.updated_at;
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
