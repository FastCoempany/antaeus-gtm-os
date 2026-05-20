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
    "existing-proof-point": "Proof leverage",
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
