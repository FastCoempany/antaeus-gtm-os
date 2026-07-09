/**
 * Phase 4 / Room 5 — PoC Framework domain types.
 *
 * Per CLAUDE.md §4.15 the PoC Framework is a Decision Bench family
 * room with a hybrid dark/light split (canon Part II §4.8). Mind:
 * "shape one piece of pilot evidence the buyer's boss can act on,
 * so pilots stop becoming optimism theater."
 *
 * Field names mirror the legacy `app/poc-framework/index.html`
 * runtime so existing data flows in without translation.
 */

/** Proof-quality band. */
export type QualityBand = "thin" | "workable" | "ready";

/** Outcome state — drives the proof history + deal sync. */
export type Outcome = "not_started" | "in_progress" | "converted" | "failed";

export const OUTCOMES: ReadonlyArray<Outcome> = [
    "not_started",
    "in_progress",
    "converted",
    "failed"
];

/** Duration toggle — 7-day or 14-day pilot window. */
export type DurationDays = 7 | 14;

export const DEFAULT_DURATION: DurationDays = 7;

/** Maximum proofs kept in the room ledger (legacy cap). */
export const MAX_PROOF_HISTORY = 20;

/** Heat dimension key. */
export type HeatKey = "claim" | "owner" | "kill";

/** Heat label band. */
export type HeatLabel = "cast" | "hot" | "warming" | "cold";

export interface HeatReading {
    readonly value: number;
    readonly label: HeatLabel;
    readonly color: string;
}

export interface HeatLedger {
    readonly claim: HeatReading;
    readonly owner: HeatReading;
    readonly kill: HeatReading;
}

/** Weakest-mold diagnosis — drives the ingot copy + next-move card. */
export type MoldId = "account" | "owner" | "metric" | "kill_rule" | "readout";

export interface MoldDiagnosis {
    readonly id: MoldId;
    readonly title: string;
    readonly copy: string;
}

/**
 * The four documents the room generates from the active proof. Markdown
 * strings the operator can copy into any tool.
 */
export interface ProofDocs {
    readonly scope: string;
    readonly kickoff: string;
    readonly readout: string;
    readonly email: string;
}

/**
 * Working draft — the in-flight proof being shaped on the forge panel.
 * Persisted into `Proof` on save.
 */
export interface ProofDraft {
    readonly account: string;
    readonly vendor: string;
    readonly readoutOwner: string;
    readonly linkedDealId: string;
    readonly durationDays: DurationDays;
    readonly outcome: Outcome;
    readonly successCriteria: string;
    readonly boundaries: string;
}

/** Persisted proof entry. */
export interface Proof extends ProofDraft {
    readonly id: string;
    readonly linkedDealName: string;
    readonly qualityScore: number;
    readonly qualityBand: QualityBand;
    readonly docs: ProofDocs;
    readonly updatedAt: string;
}

/** Empty draft used when a fresh form is opened. */
export const EMPTY_DRAFT: ProofDraft = {
    account: "",
    vendor: "",
    readoutOwner: "",
    linkedDealId: "",
    durationDays: DEFAULT_DURATION,
    outcome: "not_started",
    successCriteria: "",
    boundaries: ""
};

/**
 * Subset of the Deal record this room consumes (linked-deal dropdown
 * + sync-back). Borrowed from Phase 4 / Room 1's mirror so Future
 * Autopsy / PoC / etc. can all consume the same shape.
 */
export interface LinkedDealSummary {
    readonly id: string;
    readonly accountName: string;
    readonly stage: string;
    readonly value: number;
}
