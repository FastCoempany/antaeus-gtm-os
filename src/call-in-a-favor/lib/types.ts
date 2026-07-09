/**
 * Phase 4 / Room 10 — Advisor Deploy types.
 *
 * Per canon §4.16 the room runs as a "private influence desk." Deal ×
 * advisor × ask-moment produces the exact ask. Stamps record Send /
 * Hold / Reroute. Trust is spent, not spent — every ask must return as
 * deal update, advisor hold, or reroute.
 *
 * Wave 1 captures the typed shapes. Wave 2 ports the data tables
 * (TIERS + MOMENTS) verbatim from `js/advisor-deploy-backchannel.js`
 * lines 4-22.
 */

// ─── Tiers ──────────────────────────────────────────────────────────────

export type TierId = "t1" | "t2" | "t3" | "t4";

export interface Tier {
    readonly id: TierId;
    /** Display label e.g. "Board / Investor". */
    readonly label: string;
    /** Days the tier cools down for after the most recent deployment. */
    readonly cooldownDays: number;
}

export const TIER_IDS: ReadonlyArray<TierId> = ["t1", "t2", "t3", "t4"];

// ─── Ask-moments ────────────────────────────────────────────────────────

export type MomentId =
    | "intro"
    | "eb_bridge"
    | "poc_stall"
    | "procurement"
    | "competitor"
    | "champion_left"
    | "budget_kill"
    | "board_decision"
    | "reference"
    | "renewal";

export interface Moment {
    readonly id: MomentId;
    /** Display name e.g. "Warm introduction". */
    readonly name: string;
    /** One-line "why this moment" copy. */
    readonly short: string;
    /** Ask template — supports [company] and [buyer] tokens. */
    readonly ask: string;
    /** Proof line shown on the proof blotter. */
    readonly proof: string;
    /** Coaching line for the advisor (renders in the forward-note body). */
    readonly advisorLine: string;
    /** Expected outcome the rep should target. */
    readonly outcome: string;
}

export const MOMENT_IDS: ReadonlyArray<MomentId> = [
    "intro",
    "eb_bridge",
    "poc_stall",
    "procurement",
    "competitor",
    "champion_left",
    "budget_kill",
    "board_decision",
    "reference",
    "renewal"
];

// ─── Advisor + Deployment + Deal mirrors ───────────────────────────────

export type RelationshipState = "active" | "dormant" | "lapsed";

export interface Advisor {
    readonly id: string;
    readonly name: string;
    /** Free-form role e.g. "Board member, operator, customer". */
    readonly title: string;
    readonly tier: TierId;
    readonly expertise: string;
    /** Optional equity description (legacy field, currently unused). */
    readonly equity: string;
    /** Companies they can carry weight with — substring-matched against deal account. */
    readonly companies: ReadonlyArray<string>;
    readonly notes: string;
    readonly relationship: RelationshipState;
    readonly createdAt: string;
}

export type DeploymentOutcome =
    | "pending"
    | "engaged"
    | "successful"
    | "no_response"
    | "declined"
    | "hold"
    | "reroute";

export const DEPLOYMENT_OUTCOMES: ReadonlyArray<DeploymentOutcome> = [
    "pending",
    "engaged",
    "successful",
    "no_response",
    "declined",
    "hold",
    "reroute"
];

export const DEPLOYMENT_OUTCOME_LABELS: Readonly<
    Record<DeploymentOutcome, string>
> = {
    pending: "Pending",
    engaged: "Engaged",
    successful: "Successful",
    no_response: "No response",
    declined: "Declined",
    hold: "Hold",
    reroute: "Reroute"
};

/** A logged advisor deployment — one row in `gtmos_advisor_deployments`. */
export interface Deployment {
    readonly id: string;
    readonly dealId: string;
    readonly dealName: string;
    readonly dealStage: string;
    readonly advisorId: string;
    readonly advisorName: string;
    readonly momentId: MomentId;
    readonly momentName: string;
    readonly ask: string;
    readonly forwardableNote: string;
    readonly outcome: DeploymentOutcome;
    readonly notes: string;
    readonly createdAt: string;
    readonly outcomeDate: string | null;
}

/** Subset of Deal Workspace fields the room consumes. */
export interface AdvisorDeal {
    readonly id: string;
    readonly accountName: string;
    readonly stage: string;
    readonly value: number;
    readonly nextStep: string;
    readonly nextStepDate: string | null;
    readonly champion: string;
    readonly economicBuyer: string;
    readonly primaryContact: string;
    readonly buyer: string;
    readonly decisionProcess: string;
    /** Advisor history written back by syncDeploymentToDeal. */
    readonly advisorHistory: ReadonlyArray<DealAdvisorEntry>;
}

/** Single advisor entry mirrored back onto a Deal record. */
export interface DealAdvisorEntry {
    readonly id: string;
    readonly advisorId: string;
    readonly advisorName: string;
    readonly momentId: MomentId;
    readonly momentName: string;
    readonly outcome: DeploymentOutcome;
    readonly createdAt: string;
    readonly outcomeDate: string | null;
}

// ─── Desk state + form drafts ──────────────────────────────────────────

export interface DeskState {
    readonly dealId: string;
    readonly advisorId: string;
    readonly momentId: MomentId;
    /** Operator-edited override of the generated ask (empty = use generated). */
    readonly customAsk: string;
}

export const EMPTY_DESK_STATE: DeskState = {
    dealId: "",
    advisorId: "",
    momentId: "intro",
    customAsk: ""
};

/** Form draft for the registry "Save advisor" panel. */
export interface AdvisorDraft {
    readonly name: string;
    readonly title: string;
    readonly tier: TierId;
    readonly expertise: string;
    readonly companies: string;
    readonly notes: string;
}

export const EMPTY_ADVISOR_DRAFT: AdvisorDraft = {
    name: "",
    title: "",
    tier: "t2",
    expertise: "",
    companies: "",
    notes: ""
};

// ─── Generated ask shape ───────────────────────────────────────────────

export interface GeneratedAsk {
    /** The full hi/why-now/proof-line message ready to send to the advisor. */
    readonly ask: string;
    /** The forwardable note the advisor passes to the buyer. */
    readonly forward: string;
    /** Title (substituted ask template, sans hi/preamble). */
    readonly title: string;
    /** Proof line (from moment.proof). */
    readonly proof: string;
    /** Outcome target (from moment.outcome). */
    readonly outcome: string;
}

// ─── Spend read score ──────────────────────────────────────────────────

export type SpendBand = "ask_ready" | "narrow_first" | "not_ready";

export interface SpendRead {
    readonly score: number;
    readonly band: SpendBand;
    readonly bandLabel: string;
    readonly bandCopy: string;
}

// ─── Cooldown ──────────────────────────────────────────────────────────

export interface CooldownStatus {
    readonly ok: boolean;
    /** Display label e.g. "Available" or "Cooling 12d". */
    readonly label: string;
    /** Days remaining if cooling, 0 if ok. */
    readonly daysRemaining: number;
}
