/**
 * Phase 4 / Room 9 — Call Planner types.
 *
 * Per canon §4.11 the room prepares the exact shape of the next call so
 * the rep arrives with conviction, not hope. The 4-stop spine —
 * Open / Reason now / Probe / Advance ask — is canonical. Wave 1
 * captures the typed shapes; Wave 2 ports the persona question banks +
 * the 5-gate quality model; Wave 4 wires `gtmos_call_handoff` for
 * Discovery Studio.
 *
 * Legacy app path is `/app/discovery-agenda/`; the new room is
 * `/call-planner/`. The same flag pattern Phase 4 uses for cutover
 * applies.
 */

export type PersonaKey = "cxo" | "vp" | "ops" | "it" | "finance" | "revops";

export const PERSONA_KEYS: ReadonlyArray<PersonaKey> = [
    "cxo",
    "vp",
    "ops",
    "it",
    "finance",
    "revops"
];

export const PERSONA_LABELS: Readonly<Record<PersonaKey, string>> = {
    cxo: "C-suite / Founder",
    vp: "VP / Director",
    ops: "Ops / IC",
    it: "IT / Security",
    finance: "Finance / Procurement",
    revops: "RevOps"
};

/** Outcome a call can land in; matches legacy `logOutcome(type)` keys. */
export type Outcome =
    | "advanced"
    | "stalled"
    | "no_show"
    | "rescheduled"
    | "lost";

export const OUTCOMES: ReadonlyArray<Outcome> = [
    "advanced",
    "stalled",
    "no_show",
    "rescheduled",
    "lost"
];

export const OUTCOME_LABELS: Readonly<Record<Outcome, string>> = {
    advanced: "Advanced",
    stalled: "Stalled",
    no_show: "No-show",
    rescheduled: "Rescheduled",
    lost: "Lost"
};

/** A signal headline projected from a Signal Console account's signals[]. */
export interface SignalSummary {
    readonly headline: string;
    readonly publishedDate: string;
}

/** Subset of a Signal Console account this room reads. */
export interface MatchedAccount {
    readonly id: string;
    readonly name: string;
    /** Heat score 0-99; ≥85 grants a +5 quality bonus per legacy. */
    readonly heat: number;
    /** Top signal (signals[0]) — drives the opener + reason-now copy. */
    readonly topSignal: SignalSummary | null;
}

/** Subset of a Deal Workspace deal this room reads (linked-deal dropdown). */
export interface LinkedDeal {
    readonly id: string;
    readonly accountName: string;
    readonly value: number;
    readonly stage: string;
}

/** A single quality gate evaluated against the current draft. */
export interface QualityGate {
    readonly key:
        | "person"
        | "persona"
        | "context"
        | "why_now"
        | "advancement";
    readonly label: string;
    readonly copy: string;
    readonly weight: number;
    readonly met: boolean;
}

export type QualityBand = "credible" | "workable" | "thin";

/** Aggregated agenda quality projection. */
export interface AgendaQuality {
    readonly score: number;
    readonly band: QualityBand;
    readonly bandLabel: string;
    readonly gates: ReadonlyArray<QualityGate>;
    readonly nextMove: string;
    readonly hasSignal: boolean;
}

/**
 * The form-driven draft. Every field is bound to an input in the
 * planner UI; quality is recomputed whenever any of these change.
 */
export interface Draft {
    readonly contactName: string;
    readonly persona: PersonaKey;
    readonly customNotes: string;
    readonly linkedinUrl: string;
    readonly linkedDealId: string;
}

export const EMPTY_DRAFT: Draft = {
    contactName: "",
    persona: "cxo",
    customNotes: "",
    linkedinUrl: "",
    linkedDealId: ""
};

/**
 * Snapshot persisted to `gtmos_discovery_agenda`. Mirrors the legacy
 * `getAgendaSnapshot()` shape so Discovery Studio + downstream rooms
 * see the same payload they always have.
 */
export interface AgendaSnapshot {
    readonly contact: string;
    readonly company: string;
    readonly persona: PersonaKey;
    readonly linkedDeal: string;
    readonly gates: ReadonlyArray<boolean>;
    readonly gateDetails: ReadonlyArray<{
        readonly label: string;
        readonly met: boolean;
        readonly copy: string;
    }>;
    readonly score: number;
    readonly band: string;
    readonly nextMove: string;
    readonly signalHeadline: string;
    readonly customNotes: string;
    readonly linkedinUrl: string;
    readonly preparedAt: string;
}

/**
 * Handoff payload written to `gtmos_call_handoff` — Discovery Studio
 * reads this on boot to prefill its first segment. Shape preserved
 * verbatim from legacy `persistAgendaState()`.
 */
export interface CallHandoffPayload {
    readonly contact: string;
    readonly outcome: Outcome | "planned";
    readonly timestamp: string;
    readonly linkedDeal: string | null;
    readonly company: string;
    readonly persona: PersonaKey;
    readonly logType: "call_outcome" | "call_plan";
    readonly summary: string;
    readonly agendaScore: number;
    readonly agendaBand: string;
    readonly nextMove: string;
}
