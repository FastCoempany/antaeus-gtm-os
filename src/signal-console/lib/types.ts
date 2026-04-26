/**
 * Phase 4 / Room 3 — Signal Console domain types.
 *
 * Per CLAUDE.md §4.7 the Signal Console is a Live Instrument family
 * room and a named premium asset. Its sacred nouns:
 *   - Account: a named target organization with thesis, tier, signals, heat
 *   - Signal: a time-limited event implying commercial opportunity
 *
 * Heat is computed (not stored) — these types lock the source-of-truth
 * shape. Field names mirror the legacy `app/signal-console/index.html`
 * runtime so existing data flows in without translation.
 *
 * The legacy storage key `gtmos_sc_v4` writes:
 *   { accounts: Account[], lastSavedAt?: string }
 */

export const SIGNAL_TYPES = [
    "exec_change",
    "funding",
    "hiring",
    "tech_change",
    "product_launch",
    "comp_loss",
    "ai_move",
    "press",
    "earnings",
    "regulatory",
    "trigger",
    "manual"
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export interface Signal {
    readonly id: string;
    readonly type: SignalType | string;
    readonly title: string;
    readonly source?: string;
    readonly url?: string;
    readonly capturedAt: string;
    /** Confidence 0..1 — high-confidence signals get heat bonus. */
    readonly confidence?: number;
    /** AI-detected signals weight higher in the heat formula. */
    readonly is_ai?: boolean;
    /** Operator-flagged signal — excluded from heat. */
    readonly flagged?: boolean;
    readonly note?: string;
}

export const ACCOUNT_TIERS = [1, 2, 3, 4] as const;
export type AccountTier = (typeof ACCOUNT_TIERS)[number];

export interface Account {
    readonly id: string;
    readonly name: string;
    readonly ticker?: string;
    readonly domain?: string;
    readonly industry?: string;
    readonly hq?: string;
    readonly employees?: string;
    readonly thesis?: string;
    readonly tier?: AccountTier;
    readonly approach?: string;
    readonly persona?: string;
    readonly enrichedAt?: string;
    readonly notes?: string;
    readonly signals: ReadonlyArray<Signal>;
    /** Audit. */
    readonly created_at?: string;
    readonly updated_at?: string;
}

/**
 * Heat band maps the numeric score onto the same 4-state vocabulary
 * the legacy room exposed (Hot / Active / Watch / Low). Dashboard
 * snapshots and other rooms use these labels directly.
 */
export type HeatBand = "Hot" | "Active" | "Watch" | "Low";

export interface HeatMetrics {
    readonly heat: number;
    readonly band: HeatBand;
    readonly signalCount: number;
    readonly recentCount: number;
    readonly highConfidenceCount: number;
    readonly aiCount: number;
    readonly triggerCount: number;
    readonly avgRecency: number;
}
