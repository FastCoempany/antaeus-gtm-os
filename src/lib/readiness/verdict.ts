/**
 * Readiness gate evaluator + transition detector.
 *
 * The five stable internal verdict keys are gate-based rather than simple
 * thresholds on the total score. User-facing blockers must accurately name
 * the evidence or action required by the underlying gate.
 */

import { t } from "@/lib/voice/t";
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
    readonly blockers: ReadonlyArray<string>;
}

function dimensionBlocker(dimension: DimensionScore, fallback: string): string {
    const next = dimension.gaps[0];
    return next
        ? `${dimension.label}: ${next}.`
        : `${dimension.label}: ${fallback}`;
}

function gateHireReadyRepeatable(
    dimensions: ReadonlyArray<DimensionScore>,
    input: ReadinessInput
): GateResult {
    const blockers: string[] = [];

    const minScore = Math.min(...dimensions.map((d) => d.score));
    if (minScore < 14) {
        const weak = dimensions.find((d) => d.score < 14);
        if (weak) {
            blockers.push(
                dimensionBlocker(
                    weak,
                    t("additional evidence is required for the documented-and-repeatable state", {
                        class: "body"
                    })
                )
            );
        }
    }

    if (input.closedWonDeals < 1) {
        blockers.push(
            t("Record at least one closed-won deal so the handoff includes a completed customer outcome.", {
                class: "body"
            })
        );
    }
    if (input.futureAutopsiesRun < 1) {
        blockers.push(
            t("Complete at least one deal-risk review in Future Autopsy.", {
                class: "body"
            })
        );
    }
    if (input.castProofs < 1) {
        blockers.push(t("Complete a pilot with a result the buyer can evaluate.", { class: "body" }));
    }
    if (input.advisorDeployments < 1) {
        blockers.push(
            t("Use Call in a Favor on a real deal and record the outcome.", {
                class: "body"
            })
        );
    }

    const winLossRatio =
        input.closedLostDealsAnalyzed === 0
            ? input.closedWonDeals >= 1
                ? Infinity
                : 0
            : input.closedWonDeals / input.closedLostDealsAnalyzed;
    if (winLossRatio < 1) {
        blockers.push(
            t(
                "For this readiness state, recorded closed-won deals must be at least as numerous as analyzed closed-lost deals. Current: {won} won / {lost} analyzed lost.",
                { class: "body" }
            )
                .replace("{won}", String(input.closedWonDeals))
                .replace("{lost}", String(input.closedLostDealsAnalyzed))
        );
    }

    if (input.handoffSectionsReady < 5) {
        blockers.push(
            t("Complete at least 5 of 7 Founding GTM handoff sections (currently {n}/7).", {
                class: "body"
            }).replace("{n}", String(input.handoffSectionsReady))
        );
    }

    return { passed: blockers.length === 0, blockers };
}

function gateHireReady(
    dimensions: ReadonlyArray<DimensionScore>,
    input: ReadinessInput
): GateResult {
    const blockers: string[] = [];

    const minScore = Math.min(...dimensions.map((d) => d.score));
    if (minScore < 14) {
        const weak = dimensions.find((d) => d.score < 14);
        if (weak) {
            blockers.push(
                dimensionBlocker(
                    weak,
                    t("additional evidence is required before another seller can run this independently", {
                        class: "body"
                    })
                )
            );
        }
    }

    if (input.closedWonDeals < 1) {
        blockers.push(t("Record at least one closed-won deal.", { class: "body" }));
    }
    if (input.futureAutopsiesRun < 1) {
        blockers.push(t("Complete at least one deal-risk review in Future Autopsy.", { class: "body" }));
    }
    if (input.castProofs < 1) {
        blockers.push(t("Complete a pilot with an evaluable buyer result.", { class: "body" }));
    }

    return { passed: blockers.length === 0, blockers };
}

function gateInheritable(
    dimensions: ReadonlyArray<DimensionScore>,
    input: ReadinessInput
): GateResult {
    const blockers: string[] = [];

    const minScore = Math.min(...dimensions.map((d) => d.score));
    if (minScore < 10) {
        const weak = dimensions.find((d) => d.score < 10);
        if (weak) {
            blockers.push(
                dimensionBlocker(
                    weak,
                    t("more evidence is required for another seller to run this with founder support", {
                        class: "body"
                    })
                )
            );
        }
    }

    const maxScore = Math.max(...dimensions.map((d) => d.score));
    if (maxScore < 16) {
        const strongest = dimensions.reduce((best, d) =>
            d.score > best.score ? d : best
        );
        blockers.push(
            dimensionBlocker(
                strongest,
                t("at least one part of the sales process needs stronger evidence of repeatability", {
                    class: "body"
                })
            )
        );
    }

    if (input.castProofs < 1) {
        blockers.push(t("Complete a pilot with an evaluable buyer result.", { class: "body" }));
    }

    return { passed: blockers.length === 0, blockers };
}

function gateBuilding(dimensions: ReadonlyArray<DimensionScore>): GateResult {
    const blockers: string[] = [];

    const aboveEight = dimensions.filter((d) => d.score >= 8).length;
    if (aboveEight < 2) {
        const nextTwo = [...dimensions]
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .flatMap((d) => d.gaps.slice(0, 1));
        blockers.push(
            nextTwo.length > 0
                ? t("Complete two readiness actions: {actions}", { class: "body" }).replace(
                      "{actions}",
                      nextTwo.join("; ")
                  )
                : t("At least two parts of the sales process need additional recorded evidence.", {
                      class: "body"
                  })
        );
    }

    return { passed: blockers.length === 0, blockers };
}

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

/** Detect a transition between stable internal readiness states. */
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
