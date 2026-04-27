/**
 * Phase 4 / Room 7 — Cold Call Studio types.
 *
 * Per canon §4.9 the room narrows pressure thread-by-thread during a
 * live cold call. Six named threads (Prep → Opener → Pressure →
 * Proof → Ask → Exit) each with buyer-might-say branches and
 * recommended next lines. Wave 1 captures the typed shapes; Wave 2
 * ports the data tables verbatim from
 * `app/cold-call-studio/index.html` lines 97-127.
 */

export type ThreadId =
    | "prep"
    | "opener"
    | "pressure"
    | "proof"
    | "ask"
    | "exit";

export type ThreadVerb =
    | "hold"
    | "pull"
    | "tighten"
    | "trade"
    | "lock"
    | "release";

export interface Reply {
    /** Stable id within the thread; used for active selection. */
    readonly id: string;
    /** What the buyer might say (label on the response button). */
    readonly buyer: string;
    /** Recommended response — substituted via personalize() at render time. */
    readonly reply: string;
    /** Thread id to advance to after this reply, or null to end the call. */
    readonly next: ThreadId | "post" | null;
}

export interface Thread {
    readonly id: ThreadId;
    /** Numeric label rendered as kicker (01..06). */
    readonly num: string;
    /** Section name e.g. "Opening thread". */
    readonly label: string;
    /** Verb shown on the right of the thread row (hold / pull / tighten...). */
    readonly verb: ThreadVerb;
    /** Color token for the thread accent rule. */
    readonly color: string;
    /** Title shown on the thread row + on the say-line panel. */
    readonly title: string;
    /** Short copy under the title. */
    readonly copy: string;
    /** What to say now — supports [account] / [pressure] / [company] tokens. */
    readonly say: string;
    /** Coach line under the say-line. */
    readonly coach: string;
    readonly replies: ReadonlyArray<Reply>;
}

/** Outcome lane logged at the end of a thread. */
export type Outcome =
    | "meeting_booked"
    | "callback_scheduled"
    | "referral"
    | "voicemail"
    | "rejected"
    | "hung_up"
    | "no_answer"
    | "logged";

export const OUTCOMES: ReadonlyArray<Outcome> = [
    "meeting_booked",
    "callback_scheduled",
    "referral",
    "voicemail",
    "rejected",
    "hung_up",
    "no_answer"
];

export const OUTCOME_LABELS: Readonly<Record<Outcome, string>> = {
    meeting_booked: "meeting booked",
    callback_scheduled: "callback scheduled",
    referral: "referral",
    voicemail: "voicemail",
    rejected: "rejected",
    hung_up: "hung up",
    no_answer: "no answer",
    logged: "logged"
};

/** A single logged call (persisted to `gtmos_cold_call_log`). */
export interface CallLogEntry {
    readonly id: string;
    readonly accountName: string;
    readonly contactName: string;
    readonly contactTitle: string;
    readonly threadId: ThreadId;
    readonly threadTitle: string;
    readonly buyerResponse: string;
    readonly recommendedResponse: string;
    readonly outcome: Outcome;
    readonly notes: string;
    readonly source: "cold-call-studio-talk-loom";
    readonly createdAt: string;
}

/** Mutable draft fields the operator types into during a live call. */
export interface Draft {
    readonly contactName: string;
    readonly contactTitle: string;
    readonly notes: string;
}

export const EMPTY_DRAFT: Draft = {
    contactName: "",
    contactTitle: "",
    notes: ""
};

/** Subset of Signal Console account fields the room consumes. */
export interface AccountSummary {
    readonly id: string;
    readonly name: string;
    /** Top signal headline (drives [pressure] substitution). */
    readonly topSignal: string;
    /** Heat score 0-99; >65 boosts loomScore. */
    readonly heat: number;
}

/**
 * Stats derived from the call log — drives the loom-read panel + the
 * call memory header counts.
 */
export interface CallStats {
    readonly total: number;
    readonly meetings: number;
    readonly callbacks: number;
    readonly referrals: number;
}

export const EMPTY_STATS: CallStats = {
    total: 0,
    meetings: 0,
    callbacks: 0,
    referrals: 0
};
