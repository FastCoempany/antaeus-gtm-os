/**
 * Phase 4 / Room 6 — Outbound Studio domain types.
 *
 * Per CLAUDE.md §4.8 the Outbound Studio is a Live Instrument family
 * room. Mind: "route one live outbound line — account × buyer ×
 * temperature × trigger × next-question — before it leaves." No send
 * path without a named strain.
 *
 * Field names mirror the legacy `app/outbound-studio/index.html`
 * runtime so existing data flows in without translation.
 */

// ─── Persona ──────────────────────────────────────────────────────────

export const PERSONAS = ["csuite", "vp", "ic", "procurement"] as const;
export type Persona = (typeof PERSONAS)[number];

export const PERSONA_LABELS: Record<Persona, string> = {
    csuite: "C-suite",
    vp: "VP / Director",
    ic: "IC / End user",
    procurement: "Procurement / Legal"
};

// ─── Temperature ──────────────────────────────────────────────────────

export const TEMPERATURES = [
    "ice_cold",
    "cool",
    "warm",
    "hot",
    "closing"
] as const;
export type Temperature = (typeof TEMPERATURES)[number];

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
    ice_cold: "Ice cold",
    cool: "Cool",
    warm: "Warm",
    hot: "Hot",
    closing: "Closing"
};

// ─── Trigger ──────────────────────────────────────────────────────────

export const TRIGGER_KEYS = [
    "funding",
    "expansion",
    "hiring",
    "vendor",
    "cost",
    "product",
    "churn",
    "leadership",
    "tech",
    "compliance"
] as const;
export type TriggerKey = (typeof TRIGGER_KEYS)[number];

// ─── Channel + asset + CTA ────────────────────────────────────────────

export const CHANNELS = ["email", "linkedin", "call"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
    email: "Email",
    linkedin: "LinkedIn",
    call: "Call"
};

export const ASSETS = [
    "none",
    "article",
    "one_pager",
    "case_study",
    "framework",
    "roi_model",
    "security_docs",
    "mutual_action_plan",
    "implementation_plan",
    "onboarding_doc"
] as const;
export type Asset = (typeof ASSETS)[number];

export const CTA_KEYS = [
    "no_ask",
    "micro_ask",
    "give_to_get",
    "meeting_request",
    "champion_arm",
    "process_facilitation"
] as const;
export type CtaKey = (typeof CTA_KEYS)[number];

// ─── Operator rack (form state) ───────────────────────────────────────

export interface OperatorRack {
    readonly accountName: string;
    readonly contactName: string;
    readonly persona: Persona;
    readonly temperature: Temperature;
    readonly trigger: TriggerKey;
    /** Optional buyer-question — drives the "next-question" jack copy. */
    readonly nextQuestion?: string;
    /** When true, the generator strips CTA sentences (value-only touch). */
    readonly noAsk: boolean;
}

export const EMPTY_RACK: OperatorRack = {
    accountName: "",
    contactName: "",
    persona: "vp",
    temperature: "cool",
    trigger: "funding",
    noAsk: false
};

/**
 * Account summary borrowed from Signal Console (Phase 4 / Room 3).
 * The dropdown reads `gtmos_sc_v4` and projects each account into this
 * smaller shape.
 */
export interface AccountOption {
    readonly id: string;
    readonly name: string;
    readonly heat?: number;
    readonly band?: string;
}

// ─── Touch log + angle save ───────────────────────────────────────────

/** Outcome of a logged touch — drives Signal Console's reply detection. */
export const TOUCH_OUTCOMES = [
    "sent",
    "no_response",
    "replied",
    "meeting_booked",
    "referred",
    "unsubscribed"
] as const;
export type TouchOutcome = (typeof TOUCH_OUTCOMES)[number];

export const TOUCH_OUTCOME_LABELS: Record<TouchOutcome, string> = {
    sent: "Sent",
    no_response: "No response",
    replied: "Replied",
    meeting_booked: "Meeting booked",
    referred: "Referred",
    unsubscribed: "Unsubscribed"
};

/**
 * Persisted touch — what gets logged to `gtmos_outbound_touches.touches[]`.
 * Phase 4 / Rooms 3 + 4 already read this key (`account` + `outcome`)
 * to compute account temperature. Field shape matches legacy.
 */
export interface Touch {
    readonly id: string;
    readonly account: string;
    readonly accountName: string;
    readonly contactName: string;
    readonly contactTitle: string;
    readonly persona: Persona;
    readonly temperature: Temperature;
    readonly channel: Channel;
    readonly trigger: TriggerKey;
    readonly ctaType: CtaKey;
    readonly assetUsed: Asset;
    readonly content: string;
    readonly outcome: TouchOutcome | null;
    readonly outcomeDate: string | null;
    readonly dealId: string | null;
    readonly qualityScore: number;
    readonly motionBand: string;
    readonly createdAt: string;
}

/** Persisted angle (saved value proposition) — `gtmos_angles[]`. */
export interface Angle {
    readonly id: string;
    readonly company: string;
    readonly trigger: TriggerKey;
    readonly persona: Persona;
    readonly email: string;
    readonly temperature: Temperature;
    readonly channel: Channel;
    readonly ctaType: CtaKey;
    readonly assetUsed: Asset;
    readonly qualityScore: number;
    readonly motionBand: string;
    readonly nextMove: string;
    readonly savedAt: string;
}

/** Cap for stored history (matches legacy + Phase 4 / Room 5 pattern). */
export const MAX_TOUCH_HISTORY = 200;
export const MAX_ANGLE_HISTORY = 100;
