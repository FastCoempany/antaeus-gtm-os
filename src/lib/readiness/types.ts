/**
 * Readiness engine types — Phase 5 / Room: Readiness Score.
 *
 * The readiness room answers ONE question: *could a real first-hire walk
 * into this workspace tomorrow and run the motion?* The answer is a
 * **verdict**, not a number. Dimension scoring is internal math; it
 * never leaves this library as the first-fold story.
 *
 * Five gate-based verdicts (canon §4.17), five dimensions (each 0-20).
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6 Phase 5
 */

import { t } from "@/lib/voice/t";

/** The five verdict levels — strictly ordered, gate-based. */
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

/** Human-readable label for each verdict (UI surface). */
export const VERDICT_LABEL: Record<Verdict, string> = {
    you_are_the_system: t("You are the system"),
    building: t("Building"),
    inheritable_with_guardrails: t("Inheritable with guardrails"),
    hire_ready: t("Hire-ready"),
    hire_ready_repeatable: t("Hire-ready, repeatable")
};

/**
 * The five dimensions. Names map roughly onto the legacy
 * Dashboard signals (readinessIcpWeak, readinessOutreachWeak, etc.) so
 * we can keep cross-room consumers wired without renaming.
 */
export type DimensionId = "icp" | "outreach" | "discovery" | "deals" | "proof";

export const DIMENSION_IDS: ReadonlyArray<DimensionId> = [
    "icp",
    "outreach",
    "discovery",
    "deals",
    "proof"
];

/** Human-readable label for each dimension. */
export const DIMENSION_LABEL: Record<DimensionId, string> = {
    icp: t("ICP & targeting"),
    outreach: t("Outreach"),
    discovery: t("Discovery"),
    deals: t("Deal motion"),
    proof: t("Evidence & memory")
};

/**
 * Scoring breakdown for one dimension.
 * - `score` is 0-20.
 * - `evidence` is a short list of human-readable bullet points the
 *   drawer can render under each dimension.
 * - `gaps` is what would move the dimension forward — the
 *   "what would change the verdict next" content the spec calls out.
 */
export interface DimensionScore {
    readonly id: DimensionId;
    readonly label: string;
    readonly score: number;
    readonly evidence: ReadonlyArray<string>;
    readonly gaps: ReadonlyArray<string>;
}

/**
 * Input bag for the engine. Pure data — every field is derived from
 * cloud-synced rooms via `data-client.ts`. Wave 3 wires the actual
 * fetch; Wave 1 keeps the engine pure + testable.
 */
export interface ReadinessInput {
    /** ICP Studio. */
    readonly icpCount: number;
    readonly bestIcpQualityScore: number; // 0-100, the best ICP's `qualityScore`

    /** Territory + Sourcing. */
    readonly territoryAccountCount: number;
    readonly sourcingProspectsReady: number; // prospects in 'ready' or 'pushed' stage

    /** Signal Console. */
    readonly accountsWithHeat: number; // accounts with heat >= 50
    readonly hotAccounts: number; // accounts with heat >= 75

    /** Outreach. */
    readonly outboundTouches: number;
    readonly coldCallsLogged: number;
    readonly linkedinCues: number;
    readonly distinctAccountsTouched: number;

    /** Discovery. */
    readonly callPlannerSessions: number;
    readonly discoveryAdvancedCalls: number; // outcome === 'advanced'
    readonly discoveryStudioSessions: number;

    /** Deals. */
    readonly activeDeals: number;
    readonly dealsWithNextStep: number;
    readonly closedWonDeals: number;
    readonly closedLostDealsAnalyzed: number; // closed-lost with lossReason captured

    /** Proof + memory. */
    readonly castProofs: number; // proofs in non-draft state
    readonly futureAutopsiesRun: number; // unique deals with autopsy task log
    readonly advisorDeployments: number;
    readonly handoffSectionsReady: number; // 0..7 from Founding GTM
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

/**
 * Full readiness summary — what the room renders.
 *
 * `verdict` is the singular thing the topbar anchor displays.
 * `dimensions` is the math underneath, only revealed in the drawer.
 * `gateBlockers` is the prescriptive *what would move it* content
 * for the verdict drawer's "next" section.
 */
export interface ReadinessSummary {
    readonly verdict: Verdict;
    readonly verdictLabel: string;
    readonly dimensions: ReadonlyArray<DimensionScore>;
    readonly totalScore: number; // sum of all dimension scores (0-100), kept for the math
    readonly gateBlockers: ReadonlyArray<string>; // why we're not at the next verdict yet
    readonly nextVerdict: Verdict | null; // the verdict above current, or null if at top
}

/**
 * History row — every verdict change persists one of these. Drives the
 * ceremony moment for Founding GTM (which fires on first upward
 * transition into `inheritable_with_guardrails`).
 */
export interface VerdictTransition {
    readonly id: string;
    readonly from: Verdict;
    readonly to: Verdict;
    readonly atIso: string;
    readonly direction: "up" | "down" | "same";
}
