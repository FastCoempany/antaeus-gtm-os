/**
 * Founding GTM types — sales handoff documentation generated from the
 * evidence already present across the workspace.
 *
 * The room is not a raw aggregator. It synthesizes recorded customer,
 * outreach, discovery, deal, pilot, win/loss, and quota evidence into the
 * material another seller would need to understand and run the process.
 * Internal section ids remain stable for compatibility.
 *
 * Seven sections:
 *   1. Target customers and disqualification criteria
 *   2. Outreach patterns associated with responses
 *   3. Discovery questions used on calls that progressed
 *   4. Where deals tend to advance or stall
 *   5. Loss patterns
 *   6. Win patterns
 *   7. First-week operating cadence
 */

export type SectionId =
    | "who_hits"
    | "rails_that_worked"
    | "questions_that_earned"
    | "won_and_leaked"
    | "losses_paid_for"
    | "why_we_win"
    | "day_one_rhythm";

export const SECTION_IDS: ReadonlyArray<SectionId> = [
    "who_hits",
    "rails_that_worked",
    "questions_that_earned",
    "won_and_leaked",
    "losses_paid_for",
    "why_we_win",
    "day_one_rhythm"
];

export const SECTION_KICKER: Record<SectionId, string> = {
    who_hits: "§1 / Target customers",
    rails_that_worked: "§2 / Outreach",
    questions_that_earned: "§3 / Discovery",
    won_and_leaked: "§4 / Deal progression",
    losses_paid_for: "§5 / Loss patterns",
    why_we_win: "§6 / Win patterns",
    day_one_rhythm: "§7 / First week"
};

export const SECTION_TITLE: Record<SectionId, string> = {
    who_hits: "Target customers and disqualification criteria",
    rails_that_worked: "Outreach patterns associated with responses",
    questions_that_earned: "Discovery questions used on calls that progressed",
    won_and_leaked: "Where deals tend to advance or stall",
    losses_paid_for: "Loss patterns",
    why_we_win: "Win patterns",
    day_one_rhythm: "First-week operating cadence"
};

/** Per-section status. Drives the section status badges + total count. */
export type SectionStatus = "ready" | "partial" | "empty";

/**
 * Generated output for one section. Built fresh from cross-room readers;
 * there is no separate persisted authoring record per section.
 *
 * - `body` is 1-3 short explanatory paragraphs.
 * - `evidence` names actual deals, ICP labels, questions, or outcomes.
 * - `surprise` is retained as a stable internal field name but represents
 *   one cross-room observation that is not visible from a single room.
 */
export interface AuthoredSection {
    readonly id: SectionId;
    readonly kicker: string;
    readonly title: string;
    readonly status: SectionStatus;
    readonly body: ReadonlyArray<string>;
    readonly evidence: ReadonlyArray<string>;
    readonly surprise: SurpriseCallout | null;
}

/** Cross-room observation supported by evidence from more than one source. */
export interface SurpriseCallout {
    readonly headline: string;
    readonly body: string;
    readonly tone: "corrective" | "affirming" | "neutral";
}

/** Per-section input. Readers produce these shapes from workspace data. */
export interface SectionsInput {
    readonly icps: ReadonlyArray<IcpRecord>;
    readonly closedWon: ReadonlyArray<DealRecord>;
    readonly closedLost: ReadonlyArray<DealRecord>;
    readonly openDeals: ReadonlyArray<DealRecord>;
    readonly touches: ReadonlyArray<TouchRecord>;
    readonly cues: ReadonlyArray<CueRecord>;
    readonly coldCalls: ReadonlyArray<ColdCallRecord>;
    readonly callPlanner: ReadonlyArray<CallPlanRecord>;
    readonly autopsies: ReadonlyArray<AutopsyRecord>;
    readonly autopsySnapshots: ReadonlyArray<AutopsySnapshotRecord>;
    readonly proofs: ReadonlyArray<ProofRecord>;
    readonly advisorDeployments: ReadonlyArray<AdvisorDeploymentRecord>;
    readonly quota: QuotaInputs | null;
    readonly discoveryCalls: ReadonlyArray<DiscoveryCallRecord>;
    readonly discoveryStats: DiscoveryStats | null;
    readonly discoveryWorked: ReadonlyArray<string>;
}

export interface DiscoveryStats {
    readonly totalCalls: number;
    readonly advancedCalls: number;
}

export type DiscoveryDisposition =
    | "advanced"
    | "stalled"
    | "lost"
    | "won"
    | "no-show";

export interface DiscoveryCallRecord {
    readonly id: string;
    readonly createdAtIso: string;
    readonly accountName: string;
    readonly activeFramework: string | null;
    readonly segmentKeysWorked: ReadonlyArray<string>;
    readonly disposition: DiscoveryDisposition;
}

export interface IcpRecord {
    readonly id: string;
    readonly name: string;
    readonly persona: string;
    readonly trigger: string;
    readonly worked: boolean;
    readonly qualityScore: number;
}

export interface DealRecord {
    readonly id: string;
    readonly accountName: string;
    readonly stage: string;
    readonly value: number;
    readonly nextStep: string;
    readonly icpLabel: string;
    readonly persona: string;
    readonly trigger: string;
    readonly lossReason: string;
    readonly closeDate: string;
    readonly createdAt: string;
}

export interface TouchRecord {
    readonly accountName: string;
    readonly persona: string;
    readonly temperature: string;
    readonly trigger: string;
    readonly channel: string;
    readonly outcome: string;
    readonly sendLine: string;
    readonly createdAtIso: string;
}

export interface CueRecord {
    readonly accountName: string;
    readonly cueIndex: number;
    readonly actionType: string;
    readonly outcome: string;
    readonly createdAtIso: string;
}

export interface ColdCallRecord {
    readonly accountName: string;
    readonly outcome: string;
    readonly createdAtIso: string;
}

export interface CallPlanRecord {
    readonly accountName: string;
    readonly persona: string;
    readonly outcome: string;
    readonly nextStep: string;
    readonly createdAtIso: string;
    readonly segmentsWorked: ReadonlyArray<string>;
}

export interface AutopsyRecord {
    readonly dealId: string;
    readonly accountName: string;
    readonly verdict: "left_alone" | "corrected" | "unknown";
    readonly killSwitchFired: boolean;
    readonly tasks: ReadonlyArray<{
        readonly id: string;
        readonly text: string;
        readonly checked: boolean;
    }>;
}

export interface ProofRecord {
    readonly id: string;
    readonly accountName: string;
    readonly outcome: string;
    readonly score: number;
    readonly band: string;
}

export interface AutopsySnapshotRecord {
    readonly dealId: string;
    readonly accountName: string;
    readonly verdictMode: "left" | "corrected";
    readonly killSwitch: string;
    readonly topCauseLabel: string | null;
}

export interface AdvisorDeploymentRecord {
    readonly id: string;
    readonly accountName: string;
    readonly tier: string;
    readonly moment: string;
    readonly outcome: string;
}

export interface QuotaInputs {
    readonly quota: number;
    readonly acv: number;
    readonly winRate: number;
    readonly cycle: number;
    readonly touchesPerDay?: number;
    readonly meetingsPerWeek?: number;
}

export interface FoundingGtmHealth {
    readonly sections_ready: number;
    readonly sections_partial: number;
    readonly captured_at: string;
}
