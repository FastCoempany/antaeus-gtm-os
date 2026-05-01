/**
 * Verdict gate evaluator + transition detector.
 *
 * The five verdicts are gate-based (canon §4.17) — NOT thresholds on
 * the total score. Each verdict requires a specific combination of
 * dimension scores AND independent evidence (proofs / wins / autopsies
 * / advisors / handoff sections). A workspace can score 80/100 and
 * still be "Building" if it lacks the gating evidence; it can score
 * 65/100 and reach "Inheritable with guardrails" if every dimension
 * crosses 10 + a proof exists.
 *
 * Every gate is checked top-down (highest verdict first). The first
 * gate to pass wins. The drawer's "next" section reads the gate that
 * just below the winner — those are the unmet conditions.
 */

import type {
    DimensionScore,
    ReadinessInput,
    ReadinessSummary,
    Verdict,
    VerdictTransition
} from "./types";
import { VERDICT_LABEL, VERDICT_RANK } from "./types";
import { scoreAllDimensions } from "./dimensions";

interface GateResult {
    readonly passed: boolean;
    /** Reasons it did NOT pass, in priority order. Empty if `passed`. */
    readonly blockers: ReadonlyArray<string>;
}

/** Verdict 5 — "Hire-ready, repeatable" gate. */
function gateHireReadyRepeatable(
    dimensions: ReadonlyArray<DimensionScore>,
    input: ReadinessInput
): GateResult {
    const blockers: string[] = [];

    const minScore = Math.min(...dimensions.map((d) => d.score));
    if (minScore < 14) {
        const weak = dimensions.find((d) => d.score < 14);
        if (weak) {
            blockers.push(`${weak.label} below 14/20`);
        }
    }

    if (input.closedWonDeals < 1) blockers.push("No closed-won deals yet");
    if (input.futureAutopsiesRun < 1) {
        blockers.push("No Future Autopsies run");
    }
    if (input.castProofs < 1) blockers.push("No cast proofs");
    if (input.advisorDeployments < 1) {
        blockers.push("No advisor deployments");
    }

    const winLossRatio =
        input.closedLostDealsAnalyzed === 0
            ? input.closedWonDeals >= 1
                ? Infinity
                : 0
            : input.closedWonDeals / input.closedLostDealsAnalyzed;
    if (winLossRatio < 1) {
        blockers.push("Win/loss ratio below 1:1");
    }

    if (input.handoffSectionsReady < 5) {
        blockers.push(
            `Founding GTM at ${input.handoffSectionsReady}/7 sections — need 5+`
        );
    }

    return { passed: blockers.length === 0, blockers };
}

/** Verdict 4 — "Hire-ready" gate. */
function gateHireReady(
    dimensions: ReadonlyArray<DimensionScore>,
    input: ReadinessInput
): GateResult {
    const blockers: string[] = [];

    const minScore = Math.min(...dimensions.map((d) => d.score));
    if (minScore < 14) {
        const weak = dimensions.find((d) => d.score < 14);
        if (weak) {
            blockers.push(`${weak.label} below 14/20`);
        }
    }

    if (input.closedWonDeals < 1) blockers.push("No closed-won deals yet");
    if (input.futureAutopsiesRun < 1) {
        blockers.push("No Future Autopsies run");
    }
    if (input.castProofs < 1) blockers.push("No cast proofs");

    return { passed: blockers.length === 0, blockers };
}

/** Verdict 3 — "Inheritable with guardrails" gate. */
function gateInheritable(
    dimensions: ReadonlyArray<DimensionScore>,
    input: ReadinessInput
): GateResult {
    const blockers: string[] = [];

    const minScore = Math.min(...dimensions.map((d) => d.score));
    if (minScore < 10) {
        const weak = dimensions.find((d) => d.score < 10);
        if (weak) {
            blockers.push(`${weak.label} below 10/20`);
        }
    }

    const maxScore = Math.max(...dimensions.map((d) => d.score));
    if (maxScore < 16) {
        blockers.push("No dimension at 16+/20 yet (need a strong suit)");
    }

    if (input.castProofs < 1) blockers.push("No cast proofs");

    return { passed: blockers.length === 0, blockers };
}

/** Verdict 2 — "Building" gate. */
function gateBuilding(dimensions: ReadonlyArray<DimensionScore>): GateResult {
    const blockers: string[] = [];

    const aboveEight = dimensions.filter((d) => d.score >= 8).length;
    if (aboveEight < 2) {
        blockers.push("Need 2+ dimensions above 8/20");
    }

    return { passed: blockers.length === 0, blockers };
}

/**
 * Evaluate every gate top-down and return the winning verdict +
 * the blockers from the *next* unreached verdict.
 */
function pickVerdict(
    dimensions: ReadonlyArray<DimensionScore>,
    input: ReadinessInput
): { verdict: Verdict; blockers: ReadonlyArray<string> } {
    const repeatable = gateHireReadyRepeatable(dimensions, input);
    if (repeatable.passed) {
        return { verdict: "hire_ready_repeatable", blockers: [] };
    }

    const ready = gateHireReady(dimensions, input);
    if (ready.passed) {
        return {
            verdict: "hire_ready",
            blockers: repeatable.blockers
        };
    }

    const inheritable = gateInheritable(dimensions, input);
    if (inheritable.passed) {
        return {
            verdict: "inheritable_with_guardrails",
            blockers: ready.blockers
        };
    }

    const building = gateBuilding(dimensions);
    if (building.passed) {
        return {
            verdict: "building",
            blockers: inheritable.blockers
        };
    }

    return {
        verdict: "you_are_the_system",
        blockers: building.blockers
    };
}

function nextVerdict(verdict: Verdict): Verdict | null {
    switch (verdict) {
        case "you_are_the_system":
            return "building";
        case "building":
            return "inheritable_with_guardrails";
        case "inheritable_with_guardrails":
            return "hire_ready";
        case "hire_ready":
            return "hire_ready_repeatable";
        case "hire_ready_repeatable":
            return null;
    }
}

/**
 * Top-level entry point — score every dimension, run gates, return the
 * full summary the room renders.
 */
export function evaluateReadiness(input: ReadinessInput): ReadinessSummary {
    const dimensions = scoreAllDimensions(input);
    const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
    const { verdict, blockers } = pickVerdict(dimensions, input);

    return {
        verdict,
        verdictLabel: VERDICT_LABEL[verdict],
        dimensions,
        totalScore,
        gateBlockers: blockers,
        nextVerdict: nextVerdict(verdict)
    };
}

/**
 * Detect a verdict transition between two summaries.
 *
 * Returns null if `from` and `to` resolve to the same verdict.
 * Otherwise returns a `VerdictTransition` with direction = "up" /
 * "down" computed from the rank ordering.
 *
 * The Founding GTM ceremony moment listens specifically for
 * `direction === "up"` AND `to === "inheritable_with_guardrails"`,
 * and only fires once per workspace per upward transition (caller
 * tracks idempotency via persisted history rows).
 */
export function detectTransition(
    from: Verdict,
    to: Verdict,
    atIso: string,
    id: string
): VerdictTransition | null {
    if (from === to) return null;
    const fromRank = VERDICT_RANK[from];
    const toRank = VERDICT_RANK[to];
    return {
        id,
        from,
        to,
        atIso,
        direction: toRank > fromRank ? "up" : "down"
    };
}
