/**
 * Negotiation room types — Phase 4 of the 2026-05 navigation-
 * intelligence roadmap (canon §4.16b).
 *
 * Brings back the legacy "CFO Negotiation" room as **Negotiation** —
 * Live Instrument family, post-evaluation pre-close. Treats each
 * negotiation as a routed ask (deal × counterparty × ask-moment ×
 * concession ladder) the same way Advisor Deploy treats backchannel
 * asks.
 *
 * The legacy `antaeus_studio_cfo_v2` localStorage shape held
 * procurement + finance scripts — those are the seed templates this
 * room carries forward. Phase 4 expands the surface to six
 * counterparties (founder directive 2026-05-18) and ten ask-moments
 * inferred from the Discovery Studio framework families.
 */

/**
 * The six counterparty roles a founder/operator typically faces in
 * the post-evaluation negotiation window. CFO + Procurement + Legal
 * + GC are the legacy four; VP Finance + Infosec are the founder-
 * directed additions for AI-native B2B (security review is now a
 * routine post-eval gate).
 */
export type CounterpartyRole =
    | "cfo"
    | "vp_finance"
    | "procurement"
    | "legal"
    | "gc"
    | "infosec";

export const COUNTERPARTY_LABEL: Record<CounterpartyRole, string> = {
    cfo: "CFO / Finance",
    vp_finance: "VP Finance",
    procurement: "Procurement",
    legal: "Legal",
    gc: "General Counsel",
    infosec: "InfoSec / Security"
};

/**
 * The ten ask-moments that shape what the operator is actually
 * walking in to ask for. Inferred from Discovery Studio's nine
 * framework families' decision-architecture segments — these are
 * the recurring shapes the negotiation conversation lands on in
 * the post-eval window. Picking one routes which seed pushbacks
 * + which opening line the room recommends.
 */
export type AskMoment =
    | "pricing_position"
    | "discount_request"
    | "terms_and_payment"
    | "contract_length"
    | "auto_renewal"
    | "indemnification"
    | "security_review"
    | "rampup_schedule"
    | "expansion_commitment"
    | "decision_deadline";

export const ASK_MOMENT_LABEL: Record<AskMoment, string> = {
    pricing_position: "Pricing position",
    discount_request: "Discount request",
    terms_and_payment: "Payment terms",
    contract_length: "Contract length",
    auto_renewal: "Auto-renewal",
    indemnification: "Indemnification carve-outs",
    security_review: "Security review",
    rampup_schedule: "Ramp-up schedule",
    expansion_commitment: "Expansion commitment",
    decision_deadline: "Decision deadline"
};

/** A single concession step on the ladder. */
export interface ConcessionStep {
    readonly id: string;
    readonly give: string; // what we give
    readonly ask: string; // what we ask in return
    readonly cost: "free" | "low" | "mid" | "high";
}

/** A pushback/response template — what to say when X comes up. */
export interface PushbackTemplate {
    readonly id: string;
    readonly trigger: string; // "We need a 20% discount"
    readonly response: string; // "Here's what that triangulates against…"
}

/**
 * One drafted negotiation — the operator preps before walking in,
 * runs the script during, logs outcome after.
 */
export interface Negotiation {
    readonly id: string;
    readonly dealId: string | null; // links to gtmos_deal_workspaces
    readonly counterparty: CounterpartyRole;
    readonly counterpartyName: string; // person on the other side
    readonly askMoment: AskMoment; // what we're walking in to ask for
    readonly startingPosition: string; // our opening
    readonly walkawayPosition: string; // the line we won't cross
    readonly openingLine: string; // the actual first words
    readonly concessionLadder: ReadonlyArray<ConcessionStep>;
    readonly pushbacks: ReadonlyArray<PushbackTemplate>;
    readonly notes: string; // free-form
    readonly status: "drafting" | "ready" | "in_motion" | "closed";
    readonly outcome: NegotiationOutcome | null;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export type NegotiationOutcome =
    | "held_position" // we got the deal at our starting position
    | "moved_one_step" // gave one ladder step
    | "moved_two_plus" // gave 2+ steps
    | "walked_away" // they crossed our walkaway
    | "lost_to_pricing"; // they walked

export const OUTCOME_LABEL: Record<NegotiationOutcome, string> = {
    held_position: "Held position",
    moved_one_step: "Moved one step",
    moved_two_plus: "Moved 2+ steps",
    walked_away: "Walked away",
    lost_to_pricing: "Lost to pricing"
};

/** Lessons-learned log entry — "we won't repeat this." */
export interface LearningEntry {
    readonly id: string;
    readonly negotiationId: string;
    readonly text: string;
    readonly createdAt: string;
}

/** Empty draft — used when starting a fresh negotiation. */
export const EMPTY_NEGOTIATION: Omit<
    Negotiation,
    "id" | "createdAt" | "updatedAt"
> = {
    dealId: null,
    counterparty: "cfo",
    counterpartyName: "",
    askMoment: "pricing_position",
    startingPosition: "",
    walkawayPosition: "",
    openingLine: "",
    concessionLadder: [],
    pushbacks: [],
    notes: "",
    status: "drafting",
    outcome: null
};

/** Linked-deal summary for the dropdown. */
export interface LinkedDealSummary {
    readonly id: string;
    readonly accountName: string;
    readonly stage: string;
    readonly value: number;
}
