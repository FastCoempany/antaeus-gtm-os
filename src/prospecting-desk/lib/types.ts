/**
 * Phase 4 / Room 13 — Sourcing Workbench types.
 *
 * Per canon §4.6 the room turns focuses into named, pushable prospects;
 * prevents the territory from sitting as a blank ceiling. Bright per
 * founder directive.
 */

export type Platform =
    | "linkedin"
    | "search"
    | "intent"
    | "signals"
    | "list";

export const PLATFORMS: ReadonlyArray<Platform> = [
    "linkedin",
    "search",
    "intent",
    "signals",
    "list"
];

export const PLATFORM_LABELS: Readonly<Record<Platform, string>> = {
    linkedin: "LinkedIn search",
    search: "Web search",
    intent: "Intent / 3rd party",
    signals: "Signal radar",
    list: "Static list import"
};

export type LeverageKey =
    | "network-connection"
    | "existing-proof-point"
    | "market-signal"
    | "geographic-advantage"
    | "cold";

export const LEVERAGE_LABELS: Readonly<Record<LeverageKey, string>> = {
    "network-connection": "Network leverage",
    "existing-proof-point": "Existing evidence",
    "market-signal": "Live signal leverage",
    "geographic-advantage": "Geographic leverage",
    cold: "Cold entry only"
};

/** Lifecycle stage of a prospect — drives the workbench column rendering. */
export type ProspectStage =
    | "captured"
    | "researched"
    | "ready"
    | "pushed"
    | "dropped";

export const PROSPECT_STAGES: ReadonlyArray<ProspectStage> = [
    "captured",
    "researched",
    "ready",
    "pushed",
    "dropped"
];

export const STAGE_LABELS: Readonly<Record<ProspectStage, string>> = {
    captured: "Captured",
    researched: "Researched",
    ready: "Ready to push",
    pushed: "Pushed",
    dropped: "Dropped"
};

// ─── Query Card ────────────────────────────────────────────────────────

export interface QueryCard {
    readonly id: string;
    readonly platform: Platform;
    /** Search query string e.g. LinkedIn boolean, Google operator string. */
    readonly query: string;
    /** What the operator is hoping to surface. */
    readonly intent: string;
    /** Optional notes / refinements. */
    readonly notes: string;
    /** ICP industry the query is targeting (free-form). */
    readonly targetIcp: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    /** Last time the seller ran "Check for new matches" on this search. */
    readonly lastCheckedAt?: string;
    /** How many new companies that check returned. */
    readonly lastNewCount?: number;
    /** "auto" when the weekly automatic re-check ran it, not the seller. */
    readonly lastCheckedBy?: "auto" | "you";
}

export interface QueryCardDraft {
    readonly platform: Platform;
    readonly query: string;
    readonly intent: string;
    readonly notes: string;
    readonly targetIcp: string;
}

export const EMPTY_QUERY_CARD_DRAFT: QueryCardDraft = {
    platform: "linkedin",
    query: "",
    intent: "",
    notes: "",
    targetIcp: ""
};

// ─── Prospect ──────────────────────────────────────────────────────────

export interface Prospect {
    readonly id: string;
    readonly accountName: string;
    readonly contactName: string;
    readonly contactTitle: string;
    /** Source query card (free-form id reference, may be empty). */
    readonly sourceQueryId: string;
    readonly leverage: LeverageKey;
    readonly stage: ProspectStage;
    readonly entryPoint: string;
    readonly approach: string;
    readonly notes: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    /** Present when the company came from Antaeus web research. */
    readonly webResearch?: ProspectResearch;
}

// ─── Web research (cited) ──────────────────────────────────────────────

export type ResearchConfidence = "high" | "medium" | "low";

/** A dated public event, with the page it came from when one exists. */
export interface ResearchSignal {
    readonly what: string;
    /** YYYY-MM-DD, or null when the source gives no date. */
    readonly date: string | null;
    /** https link to the source page; null only for demo sample data. */
    readonly sourceUrl: string | null;
    /** Publisher name, shown when there is no link (demo sample data). */
    readonly sourceName: string | null;
}

export interface WhoToTarget {
    readonly role: string;
    readonly why: string;
}

/**
 * Suggested answers to the three qualification questions. They are
 * suggestions only: the seller has to accept or edit each one before it
 * counts toward sending the account to Signal Console.
 */
export interface SuggestedAnswers {
    readonly targetFit: string;
    readonly wayIn: string;
    readonly outreach: string;
}

export interface ProspectResearch {
    readonly kind: "find" | "research";
    readonly researchedAt: string;
    /** Why it fits (find) or what the company does (research). */
    readonly summary: string;
    readonly domain: string | null;
    readonly signals: ReadonlyArray<ResearchSignal>;
    readonly sources: ReadonlyArray<string>;
    readonly whoToTarget: WhoToTarget | null;
    readonly openingAngle: string;
    readonly confidence: ResearchConfidence | null;
    readonly fitMatches: ReadonlyArray<string>;
    readonly fitUnknowns: ReadonlyArray<string>;
    readonly suggested: SuggestedAnswers | null;
    /** True when this came from the demo's sample data, not a live search. */
    readonly sample: boolean;
    /** True when the weekly automatic re-check of a saved search found it. */
    readonly auto?: boolean;
}

export interface ProspectDraft {
    readonly accountName: string;
    readonly contactName: string;
    readonly contactTitle: string;
    readonly sourceQueryId: string;
    readonly leverage: LeverageKey;
    readonly entryPoint: string;
    readonly approach: string;
    readonly notes: string;
}

export const EMPTY_PROSPECT_DRAFT: ProspectDraft = {
    accountName: "",
    contactName: "",
    contactTitle: "",
    sourceQueryId: "",
    leverage: "cold",
    entryPoint: "",
    approach: "",
    notes: ""
};

// ─── Quality / readiness ───────────────────────────────────────────────

export type QualityBand = "ready" | "researched" | "captured";

export interface ProspectQuality {
    readonly score: number;
    readonly recommendedStage: QualityBand;
    readonly band: QualityBand;
    readonly reasons: ReadonlyArray<string>;
    readonly gaps: ReadonlyArray<string>;
}

// ─── Workbench summary ─────────────────────────────────────────────────

export interface WorkbenchStats {
    readonly captured: number;
    readonly researched: number;
    readonly ready: number;
    readonly pushed: number;
    readonly total: number;
}
