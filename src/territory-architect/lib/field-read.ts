import type {
    AllocationReadout,
    Approach,
    TerritoryAccount,
    Thesis
} from "./types";

/**
 * Program 6 / PR 12 — Field Read engine.
 *
 * Per the picked-winner Variant 02 / Signal Field refinement
 * (deliverables/prototypes/wireframes/antaeus-territory-architect-
 * signal-field-refinement-2026-04-17.html line 453+), the room's
 * top-of-page should not just count rows — it should INTERPRET the
 * territory. Three lines + a score:
 *
 *   - Field read score (Runnable / Tight / Loose / Empty)
 *   - Main risk      — what's loose about the territory right now
 *   - Replacement    — what should come in to backfill drift
 *   - Operator move  — the one prescribed next-step
 *
 * Pure: takes accounts + theses + approaches + allocation explicitly
 * so tests can probe every branch.
 */

export type FieldReadBand = "empty" | "loose" | "tight" | "runnable";

export interface FieldRead {
    readonly score: number;
    readonly band: FieldReadBand;
    readonly bandLabel: string;
    readonly mainRisk: string;
    readonly replacement: string;
    readonly operatorMove: string;
}

export interface FieldReadInputs {
    readonly accounts: ReadonlyArray<TerritoryAccount>;
    readonly theses: ReadonlyArray<Thesis>;
    readonly approaches: ReadonlyArray<Approach>;
    readonly allocation: AllocationReadout;
}

/**
 * Score band labels mirror the wireframe's diagnostic language —
 * "Runnable" at the top, "Empty" at the bottom.
 */
const BAND_LABELS: Readonly<Record<FieldReadBand, string>> = {
    runnable: "Runnable",
    tight: "Tight",
    loose: "Loose",
    empty: "Empty"
};

export function computeFieldRead(input: FieldReadInputs): FieldRead {
    const { accounts, theses, approaches, allocation } = input;

    // Active = accounts still in the field (not closed). Drift =
    // closed-lost rows still occupying the strategic memory but no
    // longer worth their slot. Paused = still in the field but not
    // actively worked. The wireframe's "watch ring" maps to paused.
    const active = accounts.filter((a) => a.disposition === "active");
    const paused = accounts.filter((a) => a.disposition === "paused");
    const lost = accounts.filter((a) => a.disposition === "closed-lost");
    const won = accounts.filter((a) => a.disposition === "closed-won");

    const score = computeScore({
        thesisCount: theses.length,
        approachCount: approaches.length,
        activeCount: active.length,
        wonCount: won.length,
        allocation
    });
    const band = scoreToBand(score, theses.length, active.length);

    return {
        score,
        band,
        bandLabel: BAND_LABELS[band],
        mainRisk: pickMainRisk({
            theses,
            allocation,
            paused,
            lost,
            active
        }),
        replacement: pickReplacement({ paused, lost }),
        operatorMove: pickOperatorMove({
            theses,
            approaches,
            allocation,
            lost,
            paused
        })
    };
}

interface ScoreInputs {
    readonly thesisCount: number;
    readonly approachCount: number;
    readonly activeCount: number;
    readonly wonCount: number;
    readonly allocation: AllocationReadout;
}

function computeScore(s: ScoreInputs): number {
    let score = 30;
    if (s.thesisCount >= 1) score += 8;
    if (s.thesisCount >= 3) score += 12;
    if (s.approachCount >= 1) score += 6;
    if (s.approachCount >= 3) score += 10;
    if (s.activeCount >= 5) score += 8;
    if (s.activeCount >= 30) score += 8;
    if (s.wonCount >= 1) score += 4;
    if (s.allocation.status === "headroom" && s.activeCount > 0) score += 4;
    if (s.allocation.status === "over") score -= 8;
    return Math.max(0, Math.min(92, score));
}

function scoreToBand(
    score: number,
    thesisCount: number,
    activeCount: number
): FieldReadBand {
    if (thesisCount === 0 || activeCount === 0) return "empty";
    if (score >= 75) return "runnable";
    if (score >= 55) return "tight";
    return "loose";
}

interface RiskInputs {
    readonly theses: ReadonlyArray<Thesis>;
    readonly allocation: AllocationReadout;
    readonly paused: ReadonlyArray<TerritoryAccount>;
    readonly lost: ReadonlyArray<TerritoryAccount>;
    readonly active: ReadonlyArray<TerritoryAccount>;
}

function pickMainRisk(s: RiskInputs): string {
    if (s.theses.length === 0) {
        return "No theses defined. The territory has no strategic bets to organize around.";
    }
    if (s.theses.length === 1) {
        return "A single thesis covers the whole territory. One miss sinks the field.";
    }
    if (s.allocation.status === "over") {
        return `Field is over the ${s.allocation.ceiling} ceiling. Retier or close to come back inside.`;
    }
    if (s.lost.length >= s.active.length && s.lost.length >= 3) {
        return "Drift accounts outnumber active wins. The field is full of ghosts.";
    }
    if (s.paused.length >= 5) {
        return "Watch-ring accounts still look too comfortable. Promote one or eject.";
    }
    if (s.active.length === 0) {
        return "No active accounts in the field yet. The map is theoretical.";
    }
    return "Field is operating. Keep tightening — drift is the leak to watch.";
}

interface ReplacementInputs {
    readonly paused: ReadonlyArray<TerritoryAccount>;
    readonly lost: ReadonlyArray<TerritoryAccount>;
}

function pickReplacement(s: ReplacementInputs): string {
    const backfillNeeded = s.lost.length + Math.floor(s.paused.length / 2);
    if (backfillNeeded === 0) {
        return "No backfill needed this week. The field is holding.";
    }
    if (backfillNeeded === 1) {
        return "One cleaner replacement should land this week.";
    }
    return `${backfillNeeded} cleaner replacements should land this week.`;
}

interface OperatorMoveInputs {
    readonly theses: ReadonlyArray<Thesis>;
    readonly approaches: ReadonlyArray<Approach>;
    readonly allocation: AllocationReadout;
    readonly lost: ReadonlyArray<TerritoryAccount>;
    readonly paused: ReadonlyArray<TerritoryAccount>;
}

function pickOperatorMove(s: OperatorMoveInputs): string {
    if (s.theses.length === 0) {
        return "Start with one thesis. Name the strategic bet.";
    }
    if (s.approaches.length === 0) {
        return "Add an approach for each thesis. Approaches are the talk-tracks the field needs.";
    }
    if (s.allocation.status === "over") {
        return "Retier or close enough accounts to bring the total back under the ceiling.";
    }
    if (s.lost.length >= 3) {
        return "Remove the closed-lost rows. Drift accounts shouldn't carry slots.";
    }
    if (s.paused.length >= 3) {
        return "Promote one watch-ring account or eject — the middle should feel unstable.";
    }
    return "Add the next high-conviction Tier 1, or sharpen an existing thesis.";
}
