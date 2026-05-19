/**
 * Phase 4 / Room 11 — ICP Studio types.
 *
 * Per canon §4.4 the room sharpens one ICP so the rest of the system
 * has a real target to inherit. The ICP object is the thing being
 * sharpened — central authored surface, not a form output.
 *
 * Per Part II §4.8 ICP Studio is a Decision Bench hybrid: dark hero
 * (carrying the strategic thesis) above a bright work area (where the
 * actual decision gets shaped). Wave 3 wires that visual split.
 *
 * Wave 1 captures the typed shapes. Wave 2 ports the build/quality/
 * recommendation engine verbatim from `app/icp-studio/index.html`
 * lines 1170-1500.
 */

// ─── Role + templates ─────────────────────────────────────────────────

export type RoleKey = "founder" | "firstae";

export const ROLE_KEYS: ReadonlyArray<RoleKey> = ["founder", "firstae"];

export interface IcpTemplate {
    readonly id: string;
    readonly name: string;
    readonly industry: string;
    readonly size: string;
    readonly geo: string;
    readonly buyer: string;
    readonly pain: string;
    readonly trigger: string;
    readonly proofWindow: string;
    readonly activeAccounts?: number;
}

// ─── ICP draft + saved record ──────────────────────────────────────────

/** Draft fields the operator types into (form-shaped). */
export interface IcpDraft {
    readonly role: RoleKey;
    readonly industry: string;
    /** When industry === "custom", carries the typed-in industry name. */
    readonly industryCustom: string;
    readonly size: string;
    readonly geo: string;
    readonly buyer: string;
    /** When buyer === "custom", carries the typed-in buyer role. */
    readonly buyerCustom: string;
    readonly pain: string;
    readonly trigger: string;
    readonly proofWindow: string;
    readonly engineActive: string;
}

export const EMPTY_ICP_DRAFT: IcpDraft = {
    role: "founder",
    industry: "",
    industryCustom: "",
    size: "",
    geo: "",
    buyer: "",
    buyerCustom: "",
    pain: "",
    trigger: "",
    proofWindow: "",
    engineActive: ""
};

/** A saved ICP record (one row in `gtmos_icp_analytics.icps[]`). */
export interface SavedIcp {
    readonly id: string;
    readonly statement: string;
    readonly role: RoleKey;
    readonly industry: string;
    readonly size: string;
    readonly geo: string;
    readonly buyer: string;
    readonly pain: string;
    readonly trigger: string;
    readonly proofWindow: string;
    readonly engineActive: number;
    readonly qualityScore: number;
    readonly qualityChecks: ReadonlyArray<QualityCheck>;
    readonly createdAt: string;
    readonly updatedAt: string;
}

// ─── Quality engine ────────────────────────────────────────────────────

export type QualityTone = "good" | "warn" | "risk";

export interface QualityCheck {
    readonly tone: QualityTone;
    readonly text: string;
}

/**
 * Quality tier — 4-band classifier from legacy `buildIcpQuality` (lines
 * 1310-1326). Score thresholds: ≥85 sharp / ≥70 workable / ≥50 forming /
 * else broad.
 */
export type QualityTier = "sharp" | "workable" | "forming" | "broad";

export interface IcpQuality {
    readonly score: number;
    readonly tier: QualityTier;
    /** Display label e.g. "Sharp enough to run." */
    readonly label: string;
    /** One-sentence summary explaining what's blocking trust. */
    readonly summary: string;
    readonly checks: ReadonlyArray<QualityCheck>;
}

// ─── Build outputs ─────────────────────────────────────────────────────

export interface IcpStatement {
    readonly text: string;
    readonly hint: string;
}

export interface IcpOutputs {
    readonly statement: IcpStatement;
    readonly focus: string;
    readonly buyingGroup: ReadonlyArray<string>;
    readonly evidence: ReadonlyArray<string>;
}

// ─── Persistence envelope ──────────────────────────────────────────────

/** Top-level shape of `gtmos_icp_analytics` (legacy line 1096). */
export interface IcpAnalytics {
    readonly icps: ReadonlyArray<SavedIcp>;
    readonly totalWorked: number;
}

export const EMPTY_ANALYTICS: IcpAnalytics = {
    icps: [],
    totalWorked: 0
};
