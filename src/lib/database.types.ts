/**
 * Antaeus database types — Phase 2.2 hand-authored baseline.
 *
 * This file is the TypeScript view of the public schema, matching exactly
 * what's in supabase/migrations/20260424170000 through 20260424170004.
 *
 * ─── Provenance ──────────────────────────────────────────────────────────
 * Hand-authored on 2026-04-24 during Phase 2.2 because `supabase gen types`
 * requires the CLI + live DB access which only the founder has. Structure
 * matches Supabase's generator output so a later run of:
 *
 *     supabase gen types typescript --linked > src/lib/database.types.ts
 *
 * will overwrite this cleanly without consumer code changes. The public
 * export is `Database` with `Tables` / `Views` / `Functions` keys — that's
 * the generator's contract.
 *
 * ─── Maintenance rule ────────────────────────────────────────────────────
 * Every migration that adds/renames a column MUST be followed by regenerating
 * this file. Drift between types and DB is the most common Phase 3+ failure
 * mode for rooms that rely on typed data-client queries.
 *
 * Legacy tables (pre-Phase-2) have their columns approximated here — some
 * `data jsonb` payloads carry shape that's not reflected in the type. First
 * `gen types` run after Phase 2 lands will tighten these.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.2
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// ─── Enum-like string unions ────────────────────────────────────────────

export type WorkspaceMemberRole = "owner" | "admin" | "member";
export type ProofOutcomeState = "open" | "passed" | "failed" | "abandoned";
export type AdvisorTier = "investor" | "advisor" | "customer" | "other";
export type AdvisorOutcomeStamp = "send" | "hold" | "reroute";
export type ReadinessVerdict = "hire_ready" | "partial" | "thin";

// ─── Row / Insert / Update triplets per table ───────────────────────────

export interface Database {
    public: {
        Tables: {
            workspaces: {
                Row: {
                    id: string;
                    name: string;
                    slug: string | null;
                    owner_id: string;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug?: string | null;
                    owner_id: string;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string | null;
                    owner_id?: string;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            workspace_members: {
                Row: {
                    workspace_id: string;
                    user_id: string;
                    role: WorkspaceMemberRole;
                    invited_at: string;
                    joined_at: string | null;
                    data: Json;
                };
                Insert: {
                    workspace_id: string;
                    user_id: string;
                    role?: WorkspaceMemberRole;
                    invited_at?: string;
                    joined_at?: string | null;
                    data?: Json;
                };
                Update: {
                    workspace_id?: string;
                    user_id?: string;
                    role?: WorkspaceMemberRole;
                    invited_at?: string;
                    joined_at?: string | null;
                    data?: Json;
                };
            };

            icps: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    name: string | null;
                    worked: boolean;
                    summary: string | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    name?: string | null;
                    worked?: boolean;
                    summary?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    name?: string | null;
                    worked?: boolean;
                    summary?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            deals: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    account_name: string | null;
                    stage: string;
                    deal_value: number;
                    close_date: string | null;
                    next_step_date: string | null;
                    forecast_category: string | null;
                    loss_reason: string | null;
                    stage_history: Json;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    account_name?: string | null;
                    stage?: string;
                    deal_value?: number;
                    close_date?: string | null;
                    next_step_date?: string | null;
                    forecast_category?: string | null;
                    loss_reason?: string | null;
                    stage_history?: Json;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    account_name?: string | null;
                    stage?: string;
                    deal_value?: number;
                    close_date?: string | null;
                    next_step_date?: string | null;
                    forecast_category?: string | null;
                    loss_reason?: string | null;
                    stage_history?: Json;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            sequences: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    sequence_key: string;
                    name: string | null;
                    title: string | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    sequence_key: string;
                    name?: string | null;
                    title?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    sequence_key?: string;
                    name?: string | null;
                    title?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            signal_console_accounts: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    account_key: string;
                    account_name: string | null;
                    domain: string | null;
                    ticker: string | null;
                    industry: string | null;
                    sector: string | null;
                    heat: number;
                    last_enriched_at: string | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    account_key: string;
                    account_name?: string | null;
                    domain?: string | null;
                    ticker?: string | null;
                    industry?: string | null;
                    sector?: string | null;
                    heat?: number;
                    last_enriched_at?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    account_key?: string;
                    account_name?: string | null;
                    domain?: string | null;
                    ticker?: string | null;
                    industry?: string | null;
                    sector?: string | null;
                    heat?: number;
                    last_enriched_at?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            discovery_frameworks: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    framework_key: string;
                    name: string | null;
                    category: string | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    framework_key: string;
                    name?: string | null;
                    category?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    framework_key?: string;
                    name?: string | null;
                    category?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            discovery_call_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    log_type: string | null;
                    summary: string | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    log_type?: string | null;
                    summary?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    log_type?: string | null;
                    summary?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            pipeline_settings: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    email: string | null;
                    full_name: string | null;
                    role: string | null;
                    access_level: string | null;
                    company_name: string | null;
                    startup_stage: string | null;
                    buyer_persona: string | null;
                    product_category: string | null;
                    quota: number | null;
                    average_deal_size: number | null;
                    acv_band: string | null;
                    onboarding_completed: boolean | null;
                    onboarding_completed_at: string | null;
                    onboarding_answers: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    email?: string | null;
                    full_name?: string | null;
                    role?: string | null;
                    access_level?: string | null;
                    company_name?: string | null;
                    startup_stage?: string | null;
                    buyer_persona?: string | null;
                    product_category?: string | null;
                    quota?: number | null;
                    average_deal_size?: number | null;
                    acv_band?: string | null;
                    onboarding_completed?: boolean | null;
                    onboarding_completed_at?: string | null;
                    onboarding_answers?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    email?: string | null;
                    full_name?: string | null;
                    role?: string | null;
                    access_level?: string | null;
                    company_name?: string | null;
                    startup_stage?: string | null;
                    buyer_persona?: string | null;
                    product_category?: string | null;
                    quota?: number | null;
                    average_deal_size?: number | null;
                    acv_band?: string | null;
                    onboarding_completed?: boolean | null;
                    onboarding_completed_at?: string | null;
                    onboarding_answers?: Json | null;
                    created_at?: string;
                };
            };

            studio_artifacts: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            proofs: {
                Row: {
                    id: string;
                    workspace_id: string;
                    created_by: string | null;
                    deal_id: string | null;
                    claim: string | null;
                    claim_owner: string | null;
                    success_metric: string | null;
                    kill_rule: string | null;
                    outcome_state: ProofOutcomeState;
                    duration_days: number;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id?: string;
                    created_by?: string | null;
                    deal_id?: string | null;
                    claim?: string | null;
                    claim_owner?: string | null;
                    success_metric?: string | null;
                    kill_rule?: string | null;
                    outcome_state?: ProofOutcomeState;
                    duration_days?: number;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    created_by?: string | null;
                    deal_id?: string | null;
                    claim?: string | null;
                    claim_owner?: string | null;
                    success_metric?: string | null;
                    kill_rule?: string | null;
                    outcome_state?: ProofOutcomeState;
                    duration_days?: number;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            advisor_deployments: {
                Row: {
                    id: string;
                    workspace_id: string;
                    created_by: string | null;
                    deal_id: string | null;
                    advisor_name: string | null;
                    advisor_tier: AdvisorTier | null;
                    ask_moment: string | null;
                    ask_text: string | null;
                    outcome_stamp: AdvisorOutcomeStamp | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id?: string;
                    created_by?: string | null;
                    deal_id?: string | null;
                    advisor_name?: string | null;
                    advisor_tier?: AdvisorTier | null;
                    ask_moment?: string | null;
                    ask_text?: string | null;
                    outcome_stamp?: AdvisorOutcomeStamp | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    created_by?: string | null;
                    deal_id?: string | null;
                    advisor_name?: string | null;
                    advisor_tier?: AdvisorTier | null;
                    ask_moment?: string | null;
                    ask_text?: string | null;
                    outcome_stamp?: AdvisorOutcomeStamp | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            readiness_snapshots: {
                Row: {
                    id: string;
                    workspace_id: string;
                    created_by: string | null;
                    overall_score: number | null;
                    verdict: ReadinessVerdict | null;
                    dimension_scores: Json;
                    data: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id?: string;
                    created_by?: string | null;
                    overall_score?: number | null;
                    verdict?: ReadinessVerdict | null;
                    dimension_scores?: Json;
                    data?: Json;
                    created_at?: string;
                };
                // readiness_snapshots is append-only by RLS. Update type is
                // included for structural completeness but mutations will
                // fail the policy check.
                Update: {
                    id?: string;
                    workspace_id?: string;
                    created_by?: string | null;
                    overall_score?: number | null;
                    verdict?: ReadinessVerdict | null;
                    dimension_scores?: Json;
                    data?: Json;
                    created_at?: string;
                };
            };

            handoff_artifacts: {
                Row: {
                    id: string;
                    workspace_id: string;
                    created_by: string | null;
                    title: string | null;
                    sections: Json;
                    completeness_score: number | null;
                    exported_at: string | null;
                    data: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id?: string;
                    created_by?: string | null;
                    title?: string | null;
                    sections?: Json;
                    completeness_score?: number | null;
                    exported_at?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    created_by?: string | null;
                    title?: string | null;
                    sections?: Json;
                    completeness_score?: number | null;
                    exported_at?: string | null;
                    data?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            waitlist_signups: {
                Row: {
                    id: string;
                    email: string;
                    source: string | null;
                    page_path: string | null;
                    referrer: string | null;
                    user_agent: string | null;
                    metadata: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    source?: string | null;
                    page_path?: string | null;
                    referrer?: string | null;
                    user_agent?: string | null;
                    metadata?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    source?: string | null;
                    page_path?: string | null;
                    referrer?: string | null;
                    user_agent?: string | null;
                    metadata?: Json;
                    created_at?: string;
                };
            };

            // ─── Phase A orchestration layer (ADR-004) ──────────────────
            workspace_sessions: {
                Row: {
                    id: string;
                    workspace_id: string;
                    focused_object_type: string | null;
                    focused_object_id: string | null;
                    focused_object_name: string | null;
                    focused_object_room: string | null;
                    recent_actions: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id: string;
                    focused_object_type?: string | null;
                    focused_object_id?: string | null;
                    focused_object_name?: string | null;
                    focused_object_room?: string | null;
                    recent_actions?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    focused_object_type?: string | null;
                    focused_object_id?: string | null;
                    focused_object_name?: string | null;
                    focused_object_room?: string | null;
                    recent_actions?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            observations: {
                Row: {
                    id: string;
                    workspace_id: string;
                    written_at: string;
                    observation_text: string;
                    related_object_type: string | null;
                    related_object_id: string | null;
                    source_generator: string;
                    confidence: string | null;
                    status: string;
                    superseded_by: string | null;
                    dismissed_at: string | null;
                    dismissed_reason: string | null;
                };
                Insert: {
                    id?: string;
                    workspace_id: string;
                    written_at?: string;
                    observation_text: string;
                    related_object_type?: string | null;
                    related_object_id?: string | null;
                    source_generator: string;
                    confidence?: string | null;
                    status?: string;
                    superseded_by?: string | null;
                    dismissed_at?: string | null;
                    dismissed_reason?: string | null;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    written_at?: string;
                    observation_text?: string;
                    related_object_type?: string | null;
                    related_object_id?: string | null;
                    source_generator?: string;
                    confidence?: string | null;
                    status?: string;
                    superseded_by?: string | null;
                    dismissed_at?: string | null;
                    dismissed_reason?: string | null;
                };
            };
        };

        Views: {
            // Two views exist in production per ADR-002 §3; their shape is
            // not used by the typed client today. Regenerate this file via
            // `supabase gen types typescript --linked` to capture them.
            [key: string]: never;
        };

        Functions: {
            is_workspace_member: {
                Args: { w: string };
                Returns: boolean;
            };
            current_user_default_workspace_id: {
                Args: Record<string, never>;
                Returns: string;
            };
            update_updated_at_column: {
                Args: Record<string, never>;
                Returns: unknown;
            };
            // ─── Phase A orchestration layer (ADR-004) ──────────────────
            dismiss_observation: {
                Args: { obs_id: string; reason: string | null };
                Returns: void;
            };
            touch_workspace_session_updated_at: {
                Args: Record<string, never>;
                Returns: unknown;
            };
        };

        Enums: {
            [key: string]: never;
        };
    };
}

// ─── Convenience type aliases for consumer code ─────────────────────────
// These let rooms import `Deal` instead of `Database["public"]["Tables"]["deals"]["Row"]`.

export type TableName = keyof Database["public"]["Tables"];

export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type InsertRow<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type UpdateRow<T extends TableName> = Database["public"]["Tables"][T]["Update"];

export type Workspace = Row<"workspaces">;
export type WorkspaceMember = Row<"workspace_members">;
export type Icp = Row<"icps">;
export type Deal = Row<"deals">;
export type Sequence = Row<"sequences">;
export type SignalConsoleAccount = Row<"signal_console_accounts">;
export type DiscoveryFramework = Row<"discovery_frameworks">;
export type DiscoveryCallLog = Row<"discovery_call_logs">;
export type PipelineSettings = Row<"pipeline_settings">;
export type Profile = Row<"profiles">;
export type StudioArtifact = Row<"studio_artifacts">;
export type Proof = Row<"proofs">;
export type AdvisorDeployment = Row<"advisor_deployments">;
export type ReadinessSnapshot = Row<"readiness_snapshots">;
export type HandoffArtifact = Row<"handoff_artifacts">;
export type WaitlistSignup = Row<"waitlist_signups">;
// ─── Phase A orchestration layer (ADR-004) ──────────────────────────────
export type WorkspaceSession = Row<"workspace_sessions">;
export type Observation = Row<"observations">;
