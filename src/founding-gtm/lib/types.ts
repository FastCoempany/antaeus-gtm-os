/**
 * Founding GTM types — Phase 5.B per canon §4.19.
 *
 * The room is NOT an aggregator. It is the **living onboarding
 * surface** the first hire opens on day one. Authored opinion +
 * cross-room synthesis. Specificity comes from per-section "surprise"
 * callouts that no single room could surface alone.
 *
 * Seven authored sections (locked):
 *   1. Who hits, who misses, why
 *   2. The rails that worked
 *   3. The questions that earned the next meeting
 *   4. Where deals are won + where they leak
 *   5. The losses we paid for
 *   6. Why we win
 *   7. Day-one operating rhythm
 *
 * Each renders as its own AuthoredSection with status, body
 * paragraphs, and a single SURPRISE callout (the cross-room read).
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
    who_hits: "§1 / Who",
    rails_that_worked: "§2 / Rails",
    questions_that_earned: "§3 / Questions",
    won_and_leaked: "§4 / Funnel truth",
    losses_paid_for: "§5 / Losses",
    why_we_win: "§6 / Wins",
    day_one_rhythm: "§7 / Day one"
};

export const SECTION_TITLE: Record<SectionId, string> = {
    who_hits: "Who hits, who misses, why",
    rails_that_worked: "The rails that worked",
    questions_that_earned: "The questions that earned the next meeting",
    won_and_leaked: "Where deals are won + where they leak",
    losses_paid_for: "The losses we paid for",
    why_we_win: "Why we win",
    day_one_rhythm: "Day-one operating rhythm"
};

/** Per-section status. Drives the §1-§7 status badges + total count. */
export type SectionStatus = "ready" | "partial" | "empty";

/**
 * Authored output for one section. Generated fresh on every render
 * from the cross-room readers — no separate persistence per section.
 *
 * - `body` is 1-3 short paragraphs of authored prose, never a bullet
 *   aggregation. The section is allowed to feel opinionated.
 * - `evidence` is concrete — actual deal names, actual ICP labels,
 *   actual question text. Not categories.
 * - `surprise` is the cross-room callout per spec (§4.19) — the
 *   read no single room can surface alone.
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

/**
 * Cross-room "surprise" callout — the spec-mandated read that earns
 * each section its place in the kit.
 *
 * The callout is intentionally one short headline + one short body.
 * Specific. Not generic.
 */
export interface SurpriseCallout {
    /** Headline — the surprise itself (8-15 words). */
    readonly headline: string;
    /** Body — 1-2 sentences of evidence. */
    readonly body: string;
    /** Tone affects color: corrective, affirming, neutral. */
    readonly tone: "corrective" | "affirming" | "neutral";
}

/** Per-section input. The lib readers produce these from cloud-mirrored data. */
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
    readonly proofs: ReadonlyArray<ProofRecord>;
    readonly advisorDeployments: ReadonlyArray<AdvisorDeploymentRecord>;
    readonly quota: QuotaInputs | null;
}

/** Lightweight typed shapes — only the fields the sections actually consume. */

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
    /** Which Discovery Studio segments were touched in the resulting call (if any). */
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

/** Aggregate Founding GTM health snapshot — published to localStorage. */
export interface FoundingGtmHealth {
    readonly sections_ready: number; // 0..7
    readonly sections_partial: number;
    readonly captured_at: string;
}
