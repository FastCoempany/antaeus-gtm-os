/**
 * Phase 4 / Room 3 — Signal Console domain types.
 *
 * Per CLAUDE.md §4.7 the Signal Console is a Live Instrument family
 * room and a named premium asset. Its sacred nouns:
 *   - Account: a named target organization with focus, tier, signals, heat
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
    readonly type?: SignalType | string;
    /** Legacy alias for type (the legacy room used `cat` for category). */
    readonly cat?: string;
    /** Headline / title — both names accepted to match legacy data. */
    readonly headline?: string;
    readonly title?: string;
    readonly source?: string;
    readonly url?: string;
    /**
     * When the signal happened in the world. Heat recency reads this
     * first, then fetched_at, then capturedAt. Field names mirror the
     * legacy `js`-side data so existing rows flow in without translation.
     */
    readonly published_date?: string;
    /** When we captured the signal (enrichment fetch time). */
    readonly fetched_at?: string;
    /** Modern field — set on signals authored from the new room. */
    readonly capturedAt?: string;
    /** Confidence 0..1 — ≥0.9 gets +5 heat bonus. */
    readonly confidence?: number;
    /** AI-detected signals weight 18 (vs 12 for non-AI). */
    readonly is_ai?: boolean;
    readonly ai?: boolean;
    /** Operator-flagged signal — excluded from heat. Legacy uses status==='flagged'. */
    readonly status?: string;
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
    readonly focus?: string;
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
