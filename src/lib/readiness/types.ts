/**
 * Readiness engine types.
 *
 * The readiness surface answers one question: could another seller walk
 * into this workspace and run the sales process? The user sees a plain
 * operating state rather than an internal score. The underlying enum
 * keys and gate math remain stable for compatibility.
 */

import { t } from "@/lib/voice/t";

/** Stable internal verdict keys — strictly ordered, gate-based. */
export type Verdict =
    | "you_are_the_system"
    | "building"
    | "inheritable_with_guardrails"
    | "hire_ready"
    | "hire_ready_repeatable";

/** Numeric rank of each verdict for transition comparisons (1..5). */
export const VERDICT_RANK: Record<Verdict, number> = {
    you_are_the_system: 1,
    building: 2,
    inheritable_with_guardrails: 3,
    hire_ready: 4,
    hire_ready_repeatable: 5
};

/** Plain user-facing label for each stable internal verdict. */
export const VERDICT_LABEL: Record<Verdict, string> = {
    you_are_the_system: t("Founder-dependent"),
    building: t("Partially documented"),
    inheritable_with_guardrails: t("Runnable with founder support"),
    hire_ready: t("Runnable independently"),
    hire_ready_repeatable: t("Documented and repeatable")
};

/**
 * The five assessed parts of the sales process. Internal ids remain
 * stable so cross-room consumers do not need a data migration.
 */
export type DimensionId = "icp" | "outreach" | "discovery" | "deals" | "proof";

export const DIMENSION_IDS: ReadonlyArray<DimensionId> = [
    "icp",
    "outreach",
    "discovery",
    "deals",
    "proof"
];

/** Human-readable label for each assessed part. */
export const DIMENSION_LABEL: Record<DimensionId, string> = {
    icp: t("ICP & targeting"),
    outreach: t("Outreach"),
    discovery: t("Discovery"),
    deals: t("Deal management"),
    proof: t("Pilot evidence")
};

/**
 * Scoring breakdown for one part.
 * - `score` is 0-20 and remains internal math.
 * - `evidence` is the human-readable basis for the assessment.
 * - `gaps` names what would improve readiness.
 */
export interface DimensionScore {
    readonly id: DimensionId;
    readonly label: string;
    readonly score: number;
    readonly evidence: ReadonlyArray<string>;
    readonly gaps: ReadonlyArray<string>;
}

/** Input bag for the readiness engine. */
export interface ReadinessInput {
    /** ICP Studio. */
    readonly icpCount: number;
    readonly bestIcpQualityScore: number;

    /** Territory + Sourcing. */
    readonly territoryAccountCount: number;
    readonly sourcingProspectsReady: number;

    /** Signal Console. Internal field names remain stable. */
    readonly accountsWithHeat: number;
    readonly hotAccounts: number;

    /** Outreach. */
    readonly outboundTouches: number;
    readonly coldCallsLogged: number;
    readonly linkedinCues: number;
    readonly distinctAccountsTouched: number;

    /** Discovery. */
    readonly callPlannerSessions: number;
    readonly discoveryAdvancedCalls: number;
    readonly discoveryStudioSessions: number;

    /** Deals. */
    readonly activeDeals: number;
    readonly dealsWithNextStep: number;
    readonly closedWonDeals: number;
    readonly closedLostDealsAnalyzed: number;

    /** Pilot evidence + institutional memory. */
    readonly castProofs: number;
    readonly futureAutopsiesRun: number;
    readonly advisorDeployments: number;
    readonly handoffSectionsReady: number;
}

/** Empty input — useful for tests + cold-boot rendering. */
export const EMPTY_READINESS_INPUT: ReadinessInput = {
    icpCount: 0,
    bestIcpQualityScore: 0,
    territoryAccountCount: 0,
    sourcingProspectsReady: 0,
    accountsWithHeat: 0,
    hotAccounts: 0,
    outboundTouches: 0,
    coldCallsLogged: 0,
    linkedinCues: 0,
    distinctAccountsTouched: 0,
    callPlannerSessions: 0,
    discoveryAdvancedCalls: 0,
    discoveryStudioSessions: 0,
    activeDeals: 0,
    dealsWithNextStep: 0,
    closedWonDeals: 0,
    closedLostDealsAnalyzed: 0,
    castProofs: 0,
    futureAutopsiesRun: 0,
    advisorDeployments: 0,
    handoffSectionsReady: 0
};

/** Full readiness summary rendered by the Dashboard drawer. */
export interface ReadinessSummary {
    readonly verdict: Verdict;
    readonly verdictLabel: string;
    readonly dimensions: ReadonlyArray<DimensionScore>;
    readonly totalScore: number;
    readonly gateBlockers: ReadonlyArray<string>;
    readonly nextVerdict: Verdict | null;
}

/** Persisted transition between stable internal verdict keys. */
export interface VerdictTransition {
    readonly id: string;
    readonly from: Verdict;
    readonly to: Verdict;
    readonly atIso: string;
    readonly direction: "up" | "down" | "same";
}
