/**
 * Phase 4 / Room 8 — LinkedIn Playbook types.
 *
 * Per canon §4.10 the room runs LinkedIn as disciplined air cover — never
 * the opening scene. The 5-cue ladder (Watch → Comment → Connect →
 * Give-first → Ask) keeps the channel public-first and only crosses into
 * the inbox after recognition. Wave 1 captures the typed shapes; Wave 2
 * ports the data tables verbatim from `app/linkedin-playbook/index.html`
 * lines 110-111.
 */

export type CueIndex = 0 | 1 | 2 | 3 | 4;

/** What kind of LinkedIn touch a cue produces. */
export type ActionType =
    | "content_engage"
    | "connection_request"
    | "dm"
    | "content_share"
    | "inmail";

export const ACTION_TYPES: ReadonlyArray<ActionType> = [
    "content_engage",
    "connection_request",
    "dm",
    "content_share",
    "inmail"
];

export const ACTION_LABELS: Readonly<Record<ActionType, string>> = {
    content_engage: "Public",
    connection_request: "Connect",
    dm: "DM",
    content_share: "Share",
    inmail: "InMail"
};

/** Outcome the rep records once a cue lands (null = pending). */
export type Outcome = "accepted" | "replied" | "no_response" | "declined";

export const OUTCOMES: ReadonlyArray<Outcome> = [
    "accepted",
    "replied",
    "no_response",
    "declined"
];

export const OUTCOME_LABELS: Readonly<Record<Outcome, string>> = {
    accepted: "accepted",
    replied: "replied",
    no_response: "no response",
    declined: "declined"
};

/** A single cue rung in the 5-cue ladder. */
export interface Cue {
    readonly index: CueIndex;
    /** Display name e.g. "Comment with one operating read". */
    readonly name: string;
    /** Mono kicker label e.g. "Cue 02". */
    readonly label: string;
    /** Accent color token (CSS variable string). */
    readonly color: string;
    /** Default action type the cue produces. */
    readonly action: ActionType;
    /** Title shown on the live stage. */
    readonly title: string;
    /** Short copy under the cue name. */
    readonly copy: string;
    /** Say-first guidance (rendered in the live console below the stage). */
    readonly console: string;
}

/**
 * Recommended motion derived from current cross-room state. Mirrors the
 * legacy `getMotion(ctx)` shape so Wave 4 + 5 can hand it straight to the
 * booth read panel without translation.
 */
export type MotionKey =
    | "credibility"
    | "warm_signal_account"
    | "convert_connection"
    | "add_air_cover";

export interface Motion {
    readonly key: MotionKey;
    readonly label: string;
    readonly actionType: ActionType;
    readonly whyNow: string;
    readonly oneSession: string;
    readonly nextMove: string;
    readonly thresholds: string;
    readonly accountName: string;
    readonly context: string;
    readonly cueIndex: CueIndex;
    /**
     * Program 6 / PR 11 — what to do when the rep is corrected.
     *
     * Per canon §4.8 ("Every route keeps a recovery cable on the
     * same board") and the picked-winner Variant 02 / Cue Booth
     * wireframe — the rep needs a "what to do when corrected"
     * rule alongside the current-cue + one-session-win rules.
     * Surfaces in the booth-read aside as the recovery rule.
     */
    readonly recovery: string;
}

/** Read-only inbound context the motion engine consumes. */
export interface MotionContext {
    readonly icp: BestIcp | null;
    readonly hottestAccount: HottestAccount | null;
    readonly latestTouch: LatestTouch | null;
    readonly stats: ChannelStats;
}

export interface BestIcp {
    readonly name: string;
    readonly qualityScore: number;
}

export interface HottestAccount {
    readonly name: string;
    readonly heat: number;
}

export interface LatestTouch {
    readonly accountName: string;
    readonly createdAt: string;
}

/** Per-account counts used by the motion engine to pick the cue index. */
export interface AccountCounts {
    readonly content_engage: number;
    readonly connection_request: number;
    readonly dm: number;
}

export const EMPTY_ACCOUNT_COUNTS: AccountCounts = {
    content_engage: 0,
    connection_request: 0,
    dm: 0
};

/** Aggregate channel stats that drive the activity board + motion. */
export interface ChannelStats {
    readonly total: number;
    readonly connections: number;
    readonly accepted: number;
    readonly dms: number;
    readonly replies: number;
    readonly acceptRate: number;
    readonly replyRate: number;
    readonly byAccount: Readonly<Record<string, AccountCounts>>;
}

export const EMPTY_STATS: ChannelStats = {
    total: 0,
    connections: 0,
    accepted: 0,
    dms: 0,
    replies: 0,
    acceptRate: 0,
    replyRate: 0,
    byAccount: {}
};

/** A logged LinkedIn touch — one row in `gtmos_linkedin_log`. */
export interface ActionEntry {
    readonly id: string;
    readonly accountName: string;
    readonly contactName: string;
    readonly actionType: ActionType;
    readonly temperature: "ice_cold" | "cool" | "warm" | "hot";
    readonly content: string;
    readonly motionKey: MotionKey;
    readonly motionLabel: string;
    readonly cueLabel: string;
    readonly whyNow: string;
    readonly recommendedNext: string;
    readonly outcome: Outcome | null;
    readonly outcomeDate: string | null;
    readonly createdAt: string;
}

/** Form draft fields the operator types into in the cue ledger. */
export interface Draft {
    readonly accountName: string;
    readonly contactName: string;
    readonly actionType: ActionType;
}

export const EMPTY_DRAFT: Draft = {
    accountName: "",
    contactName: "",
    actionType: "content_engage"
};
