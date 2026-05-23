/**
 * Briefing — Read Interface Contracts (B.0c).
 *
 * The shape of state every GTM OS room exposes to the Briefing
 * pipeline. Each room owns its data; the Briefing reads. Writes
 * happen through `recommended_moves[].destination` routing (B.2+),
 * which is a separate user-confirmed flow.
 *
 * Source of truth:
 *   deliverables/specs/briefing/signal_console_gtm_os_read_interface_contracts_v0.1.md
 *
 * Discipline this file enforces:
 *   - The interface is the contract, not the implementation. Rooms
 *     can evolve their internal data freely; the read interface
 *     stays stable.
 *   - The contract surface is minimal — only what the Briefing
 *     actually needs.
 *   - Reads are synchronous, cheap, side-effect-free.
 *   - Schema is versioned. `schema_version` increments on contract
 *     changes; `last_modified_at` updates on data changes.
 *
 * B.0c ships these as types + adapter shells (uninitialized state by
 * default). Real data translation per adapter lands as each room
 * either retrofits per ADR-005 Step 5 (cloud) or grows a richer
 * localStorage adapter (legacy path) in follow-up PRs. The contract
 * surface stays stable across either path.
 */

// ─── Health states ─────────────────────────────────────────────

/**
 * Every contract reports one of four health states:
 *
 *   ok            — room is configured and has state to return
 *   degraded      — room has partial state (e.g. ICP defined but no
 *                   scoring criteria); the Briefing proceeds with
 *                   what's available
 *   uninitialized — room exists but the user hasn't set it up; the
 *                   Briefing falls back to defaults and prompts the
 *                   user
 *   error         — the adapter threw or returned malformed data;
 *                   the Briefing runs in degraded mode for this room.
 *                   Never returned by the room itself — assigned by
 *                   hydrate() when an adapter throws.
 */
export type ModuleHealth = "ok" | "degraded" | "uninitialized" | "error";

/**
 * The base shape every room's contract conforms to. Per-room
 * contracts narrow `state` to a room-specific type.
 */
export interface ModuleStateContract<TState> {
    readonly schema_version: string;
    readonly last_modified_at: string | null;
    readonly health: ModuleHealth;
    readonly health_reason?: string;
    readonly state: TState | null;
}

// ─── 3.1 ICP Studio ────────────────────────────────────────────

export interface ICPCriterion {
    readonly criterion: string;
    readonly weight: number;
    readonly evidence_signals: ReadonlyArray<string>;
}

export interface ICPStudioStateBody {
    readonly icp_summary: string;
    readonly icp_criteria: ReadonlyArray<ICPCriterion>;
    readonly disqualifiers: ReadonlyArray<string>;
    readonly target_company_size: { min: number; max: number } | null;
    readonly target_revenue_band: { min_usd: number; max_usd: number } | null;
    readonly target_industries: ReadonlyArray<string>;
    readonly target_geographies: ReadonlyArray<string>;
    readonly decision_maker_titles: ReadonlyArray<string>;
    readonly influencer_titles: ReadonlyArray<string>;
}

export type ICPStudioState = ModuleStateContract<ICPStudioStateBody>;

// ─── 3.2 Discovery Studio ──────────────────────────────────────

export interface DiscoveryQuestion {
    readonly question_id: string;
    readonly question_text: string;
    readonly intent: string;
    readonly follow_ups: ReadonlyArray<string>;
    readonly red_flags: ReadonlyArray<string>;
}

export interface DiscoveryPhase {
    readonly phase_number: number;
    readonly phase_name: string;
    readonly phase_purpose: string;
    readonly questions: ReadonlyArray<DiscoveryQuestion>;
    readonly objections_addressed: ReadonlyArray<string>;
    readonly exit_criteria: string;
}

export interface DiscoveryStudioStateBody {
    readonly active_framework_id: string | null;
    readonly active_framework_name: string | null;
    readonly active_framework_version: string | null;
    readonly phases: ReadonlyArray<DiscoveryPhase>;
}

export type DiscoveryStudioState =
    ModuleStateContract<DiscoveryStudioStateBody>;

// ─── 3.3 Call Planner ──────────────────────────────────────────

export interface ObjectionEntry {
    readonly objection_id: string;
    readonly objection_text: string;
    readonly category: string;
    readonly handler_summary: string;
    readonly handler_full: string;
    readonly evidence_links: ReadonlyArray<string>;
    readonly last_refreshed_at: string;
    readonly competitor_mentioned: string | null;
}

export interface CallBriefTemplate {
    readonly template_id: string;
    readonly template_name: string;
    readonly purpose: string;
}

export interface CallPlannerStateBody {
    readonly objection_bank: ReadonlyArray<ObjectionEntry>;
    readonly call_brief_templates: ReadonlyArray<CallBriefTemplate>;
}

export type CallPlannerState = ModuleStateContract<CallPlannerStateBody>;

// ─── 3.4 Outbound Studio ───────────────────────────────────────

export interface OutboundHookPerformance {
    readonly open_rate?: number;
    readonly reply_rate?: number;
    readonly notes?: string;
}

export interface OutboundHook {
    readonly hook_id: string;
    readonly hook_text: string;
    readonly use_case: string;
    readonly target_persona: string;
    readonly performance_summary: OutboundHookPerformance | null;
    readonly pain_tags: ReadonlyArray<string>;
    readonly last_refreshed_at: string;
}

export interface SignalTrigger {
    readonly trigger_id: string;
    readonly trigger_description: string;
    readonly matching_signal_types: ReadonlyArray<string>;
    readonly outbound_action: string;
}

export interface ActiveSequence {
    readonly sequence_id: string;
    readonly sequence_name: string;
    readonly target_persona: string;
    readonly steps_count: number;
    readonly hooks_used: ReadonlyArray<string>;
}

export interface OutboundStudioStateBody {
    readonly hooks: ReadonlyArray<OutboundHook>;
    readonly signal_triggers: ReadonlyArray<SignalTrigger>;
    readonly active_sequences: ReadonlyArray<ActiveSequence>;
}

export type OutboundStudioState = ModuleStateContract<OutboundStudioStateBody>;

// ─── 3.5 Asset Builder ─────────────────────────────────────────

export interface BattlecardTile {
    readonly tile_id: string;
    readonly competitor: string;
    readonly tile_title: string;
    readonly tile_summary: string;
    readonly tile_full: string;
    readonly evidence_links: ReadonlyArray<string>;
    readonly last_refreshed_at: string;
    readonly competitor_categories: ReadonlyArray<string>;
}

export type ExecutiveAssetType = "one_pager" | "board_slide" | "strategic_memo";

export interface ExecutiveAsset {
    readonly asset_id: string;
    readonly asset_title: string;
    readonly asset_type: ExecutiveAssetType;
    readonly audience: string;
    readonly topics: ReadonlyArray<string>;
    readonly last_refreshed_at: string;
}

export type CustomerAssetType = "case_study" | "testimonial" | "logo_grid";

export interface CustomerAsset {
    readonly asset_id: string;
    readonly asset_title: string;
    readonly asset_type: CustomerAssetType;
    readonly customer_name: string;
    readonly industry: string;
    readonly use_case: string;
    readonly last_refreshed_at: string;
}

export interface AssetBuilderStateBody {
    readonly battlecard_tiles: ReadonlyArray<BattlecardTile>;
    readonly executive_pages: ReadonlyArray<ExecutiveAsset>;
    readonly customer_assets: ReadonlyArray<CustomerAsset>;
}

export type AssetBuilderState = ModuleStateContract<AssetBuilderStateBody>;

// ─── 3.6 Active Deals (Deal Workspace) ─────────────────────────

export type ActiveDealStage =
    | "evaluation"
    | "negotiation"
    | "decision"
    | "closed_won"
    | "closed_lost";

export interface ActiveDeal {
    readonly deal_id: string;
    readonly account_name: string;
    readonly account_url: string | null;
    readonly competitive_set: ReadonlyArray<string>;
    readonly stage_estimate: ActiveDealStage;
    readonly watch_for: ReadonlyArray<string>;
    readonly created_at: string;
    readonly closes_estimate_at: string | null;
    /** Anti-CRM: never carry deal notes into the Briefing pipeline. */
    readonly notes: null;
}

export interface ActiveDealsStateBody {
    readonly deals: ReadonlyArray<ActiveDeal>;
}

export type ActiveDealsState = ModuleStateContract<ActiveDealsStateBody>;

// ─── 3.7 Watchlist Triggers ────────────────────────────────────

export type WatchlistTriggerType =
    | "single_event"
    | "aggregation"
    | "threshold"
    | "adjacency"
    | "silence";

export type WatchlistTriggerStatus =
    | "armed"
    | "fired_today"
    | "fired_this_week"
    | "dormant";

/**
 * The full grammar of TriggerParsedQuery lives in B.3 (Watchlist
 * Trigger Grammar spec). v0.1 of the contract carries `type` only;
 * subsequent fields are absorbed into a `Record<string, unknown>` so
 * the parser can evolve without breaking this contract.
 */
export interface TriggerParsedQuery {
    readonly type: WatchlistTriggerType;
    readonly [key: string]: unknown;
}

export interface WatchlistTrigger {
    readonly trigger_id: string;
    readonly natural_language: string;
    readonly parsed_query: TriggerParsedQuery;
    readonly status: WatchlistTriggerStatus;
    readonly created_at: string;
    readonly last_fired_at: string | null;
    readonly fire_count: number;
    readonly false_fire_count: number;
    readonly user_approved_fires: number;
}

export interface WatchlistTriggersStateBody {
    readonly triggers: ReadonlyArray<WatchlistTrigger>;
}

export type WatchlistTriggersState =
    ModuleStateContract<WatchlistTriggersStateBody>;

// ─── 3.8 Voice Document ────────────────────────────────────────

export type VoiceExemplarClusterType =
    | "pain_tag"
    | "company"
    | "exec_move"
    | "narrative_shift"
    | "trigger_fire";

export interface VoiceExemplar {
    readonly exemplar_id: string;
    readonly title: string;
    readonly cluster_type: VoiceExemplarClusterType;
    readonly pattern_full_text: string;
    readonly annotation: string;
    readonly promoted_from_user_feedback: boolean;
    readonly promoted_at: string | null;
}

export interface VoiceAntiExemplar {
    readonly anti_exemplar_id: string;
    readonly title: string;
    readonly bad_pattern_text: string;
    readonly annotation: string;
    readonly failure_modes: ReadonlyArray<string>;
}

export interface BannedVocabulary {
    readonly hard_ban: ReadonlyArray<string>;
    readonly soft_ban: ReadonlyArray<string>;
}

export interface PreferredReplacement {
    readonly instead_of: string;
    readonly use: string;
}

export interface StructuralRules {
    readonly pattern_name: {
        readonly max_words: number;
        readonly style_notes: ReadonlyArray<string>;
    };
    readonly analysis: {
        readonly min_words: number;
        readonly max_words: number;
        readonly max_sentences: number;
        readonly forbidden_openings: ReadonlyArray<string>;
        readonly forbidden_closings: ReadonlyArray<string>;
    };
    readonly six_questions: Readonly<
        Record<string, { readonly max_sentences: number; readonly style_notes: string }>
    >;
    readonly recommended_moves: {
        readonly max_count: number;
        readonly ordering: string;
    };
    readonly voice_cadence: ReadonlyArray<string>;
}

export interface HedgingRules {
    readonly assert_when: ReadonlyArray<string>;
    readonly hedge_when: ReadonlyArray<string>;
    readonly max_hedging_adverbs_per_analysis: number;
    readonly banned_hedge_constructions: ReadonlyArray<string>;
    readonly uncertainty_naming_pattern: string;
}

export interface VoiceDocumentStateBody {
    readonly version: string;
    readonly tone_profile: string;
    readonly voice_exemplars: ReadonlyArray<VoiceExemplar>;
    readonly anti_exemplars: ReadonlyArray<VoiceAntiExemplar>;
    readonly banned_vocabulary: BannedVocabulary;
    readonly preferred_replacements: ReadonlyArray<PreferredReplacement>;
    readonly structural_rules: StructuralRules;
    readonly hedging_rules: HedgingRules;
}

export type VoiceDocumentState = ModuleStateContract<VoiceDocumentStateBody>;

// ─── 3.9 Behavioral Feedback ───────────────────────────────────

export type FeedbackSurface =
    | "briefing_main"
    | "watchlist_trigger"
    | "deal_watch";

export type FeedbackVerdict =
    | "used"
    | "met"
    | "noise"
    | "useful_fire"
    | "false_fire"
    | "helped"
    | "didnt_apply";

export interface FeedbackEntry {
    readonly feedback_id: string;
    readonly surfaced_as: FeedbackSurface;
    readonly pattern_id: string | null;
    readonly trigger_id: string | null;
    readonly deal_id: string | null;
    readonly verdict: FeedbackVerdict;
    readonly given_at: string;
    readonly context: { readonly reason?: string } | null;
}

export interface FeedbackAggregates {
    readonly historical_snr_by_source: Readonly<Record<string, number>>;
    readonly pain_tag_relevance_weights: Readonly<Record<string, number>>;
    readonly pattern_themes_promoted: ReadonlyArray<string>;
    readonly pattern_themes_demoted: ReadonlyArray<string>;
}

export interface BehavioralFeedbackStateBody {
    readonly feedback_log: ReadonlyArray<FeedbackEntry>;
    readonly aggregates: FeedbackAggregates;
}

export type BehavioralFeedbackState =
    ModuleStateContract<BehavioralFeedbackStateBody>;

// ─── 4. HydratedContext ────────────────────────────────────────

export type ModuleName =
    | "icp_studio"
    | "discovery_studio"
    | "call_planner"
    | "outbound_studio"
    | "asset_builder"
    | "active_deals"
    | "watchlist_triggers"
    | "voice_document"
    | "behavioral_feedback";

export interface ModuleReadResult {
    readonly module: ModuleName;
    readonly read_at: string;
    readonly health: ModuleHealth;
    readonly schema_version: string;
    readonly last_modified_at: string | null;
    readonly read_duration_ms: number;
    readonly error_message: string | null;
}

/**
 * A globally-relevant pain tag the synthesis stage references. Lives
 * outside any individual room — sourced from a global registry. B.0c
 * ships the type only; the registry itself is authored in B.2 when
 * the first Patterns synthesize.
 */
export interface PainTag {
    readonly tag_id: string;
    readonly label: string;
    readonly description: string;
}

export interface HydratedContext {
    readonly context_id: string;
    readonly user_id: string;
    readonly hydrated_at: string;
    readonly modules_read: ReadonlyArray<ModuleReadResult>;
    readonly icp: ICPStudioStateBody | null;
    readonly discovery: DiscoveryStudioStateBody | null;
    readonly call_planner: CallPlannerStateBody | null;
    readonly outbound: OutboundStudioStateBody | null;
    readonly asset_builder: AssetBuilderStateBody | null;
    readonly active_deals: ActiveDealsStateBody | null;
    readonly watchlist_triggers: WatchlistTriggersStateBody | null;
    readonly voice_document: VoiceDocumentStateBody | null;
    readonly behavioral_feedback: BehavioralFeedbackStateBody | null;
    readonly watchlist_companies: ReadonlyArray<string>;
    readonly pain_lib: ReadonlyArray<PainTag>;
}

// ─── Constants ─────────────────────────────────────────────────

/** Current contract schema version. Bump on breaking changes. */
export const CONTRACT_SCHEMA_VERSION = "1.0";
