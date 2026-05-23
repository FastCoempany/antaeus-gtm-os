export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      advisor_deployments: {
        Row: {
          advisor_name: string | null
          advisor_tier: string | null
          ask_moment: string | null
          ask_text: string | null
          created_at: string
          created_by: string | null
          data: Json
          deal_id: string | null
          id: string
          outcome_stamp: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          advisor_name?: string | null
          advisor_tier?: string | null
          ask_moment?: string | null
          ask_text?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          deal_id?: string | null
          id?: string
          outcome_stamp?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          advisor_name?: string | null
          advisor_tier?: string | null
          ask_moment?: string | null
          ask_text?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          deal_id?: string | null
          id?: string
          outcome_stamp?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_deployments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_deployments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      // ─── Briefing room B.0a — HAND-AUTHORED PENDING REGEN ──────────
      // The seven tables below were added by migration 20260523180000.
      // These hand-authored stubs let the Briefing room scaffolding
      // (B.0b/B.0c sub-PRs) reference Row<"briefing_runs"> etc. in a
      // type-safe way before the founder regen runs.
      //
      // Replace this block with the output of `supabase gen types
      // typescript --linked` after the migration applies to production.
      // The regen should produce the same shape; if it differs in
      // nullability or column ordering, the regen wins.
      //
      // Ref: deliverables/specs/briefing/01-build-phase-plan.md §B.0
      briefing_audit_envelopes: {
        Row: {
          cluster_snapshot: Json
          created_at: string
          critique_record: Json | null
          draft_record: Json | null
          gate_decisions: Json
          hydrated_context_snapshot: Json
          id: string
          pattern_id: string
          revise_record: Json | null
          total_cost: number
          user_actions: Json
          workspace_id: string
        }
        Insert: {
          cluster_snapshot: Json
          created_at?: string
          critique_record?: Json | null
          draft_record?: Json | null
          gate_decisions?: Json
          hydrated_context_snapshot: Json
          id?: string
          pattern_id: string
          revise_record?: Json | null
          total_cost?: number
          user_actions?: Json
          workspace_id?: string
        }
        Update: {
          cluster_snapshot?: Json
          created_at?: string
          critique_record?: Json | null
          draft_record?: Json | null
          gate_decisions?: Json
          hydrated_context_snapshot?: Json
          id?: string
          pattern_id?: string
          revise_record?: Json | null
          total_cost?: number
          user_actions?: Json
          workspace_id?: string
        }
        Relationships: []
      }
      briefing_clusters: {
        Row: {
          anchor: string
          cluster_type: string
          created_at: string
          data: Json
          id: string
          item_ids: string[]
          parent_cluster_id: string | null
          run_id: string
          trajectory: string | null
          weighted_evidence: number
          workspace_id: string
        }
        Insert: {
          anchor: string
          cluster_type: string
          created_at?: string
          data?: Json
          id?: string
          item_ids?: string[]
          parent_cluster_id?: string | null
          run_id: string
          trajectory?: string | null
          weighted_evidence?: number
          workspace_id?: string
        }
        Update: {
          anchor?: string
          cluster_type?: string
          created_at?: string
          data?: Json
          id?: string
          item_ids?: string[]
          parent_cluster_id?: string | null
          run_id?: string
          trajectory?: string | null
          weighted_evidence?: number
          workspace_id?: string
        }
        Relationships: []
      }
      briefing_enriched_items: {
        Row: {
          affects_deals: string[]
          claim_type: string | null
          created_at: string
          data: Json
          enrichment_cost: number
          entities: Json
          event_category: string | null
          exec_move: Json | null
          id: string
          is_noise: boolean
          matches_triggers: string[]
          model_v_hash: string | null
          pain_tags: string[]
          raw_item_id: string
          run_id: string
          summary: string
          topic_tags: string[]
          user_relevance_score: number | null
          what_changed: string | null
          workspace_id: string
        }
        Insert: {
          affects_deals?: string[]
          claim_type?: string | null
          created_at?: string
          data?: Json
          enrichment_cost?: number
          entities?: Json
          event_category?: string | null
          exec_move?: Json | null
          id?: string
          is_noise?: boolean
          matches_triggers?: string[]
          model_v_hash?: string | null
          pain_tags?: string[]
          raw_item_id: string
          run_id: string
          summary: string
          topic_tags?: string[]
          user_relevance_score?: number | null
          what_changed?: string | null
          workspace_id?: string
        }
        Update: {
          affects_deals?: string[]
          claim_type?: string | null
          created_at?: string
          data?: Json
          enrichment_cost?: number
          entities?: Json
          event_category?: string | null
          exec_move?: Json | null
          id?: string
          is_noise?: boolean
          matches_triggers?: string[]
          model_v_hash?: string | null
          pain_tags?: string[]
          raw_item_id?: string
          run_id?: string
          summary?: string
          topic_tags?: string[]
          user_relevance_score?: number | null
          what_changed?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      briefing_pattern_feedback: {
        Row: {
          id: string
          mark: string
          marked_at: string
          note: string | null
          pattern_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          mark: string
          marked_at?: string
          note?: string | null
          pattern_id: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          id?: string
          mark?: string
          marked_at?: string
          note?: string | null
          pattern_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      briefing_patterns: {
        Row: {
          affects_deals: string[]
          attribute_grid: Json
          audit_envelope_id: string | null
          body: string
          cluster_id: string | null
          confidence: number
          created_at: string
          data: Json
          evidence_count: number
          id: string
          matches_triggers: string[]
          pattern_type: string
          recommended_moves: Json
          run_id: string
          six_questions: Json
          source_count: number
          surfaced_at: string
          title: string
          trajectory: string | null
          workspace_id: string
        }
        Insert: {
          affects_deals?: string[]
          attribute_grid?: Json
          audit_envelope_id?: string | null
          body: string
          cluster_id?: string | null
          confidence: number
          created_at?: string
          data?: Json
          evidence_count?: number
          id?: string
          matches_triggers?: string[]
          pattern_type: string
          recommended_moves?: Json
          run_id: string
          six_questions?: Json
          source_count?: number
          surfaced_at?: string
          title: string
          trajectory?: string | null
          workspace_id?: string
        }
        Update: {
          affects_deals?: string[]
          attribute_grid?: Json
          audit_envelope_id?: string | null
          body?: string
          cluster_id?: string | null
          confidence?: number
          created_at?: string
          data?: Json
          evidence_count?: number
          id?: string
          matches_triggers?: string[]
          pattern_type?: string
          recommended_moves?: Json
          run_id?: string
          six_questions?: Json
          source_count?: number
          surfaced_at?: string
          title?: string
          trajectory?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      briefing_raw_items: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          external_id: string
          fetched_at: string
          id: string
          published_date: string | null
          run_id: string
          source_id: string
          title: string
          url: string | null
          workspace_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          external_id: string
          fetched_at?: string
          id?: string
          published_date?: string | null
          run_id: string
          source_id: string
          title: string
          url?: string | null
          workspace_id?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          external_id?: string
          fetched_at?: string
          id?: string
          published_date?: string | null
          run_id?: string
          source_id?: string
          title?: string
          url?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      briefing_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          data: Json
          error: string | null
          id: string
          stage_log: Json
          started_at: string
          status: string
          total_cost: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data?: Json
          error?: string | null
          id?: string
          stage_log?: Json
          started_at?: string
          status?: string
          total_cost?: number
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data?: Json
          error?: string | null
          id?: string
          stage_log?: Json
          started_at?: string
          status?: string
          total_cost?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      // ─── End Briefing room B.0a hand-authored stubs ────────────────
      deals: {
        Row: {
          account_name: string
          blockers: string | null
          champion: string | null
          close_date: string | null
          competition: string | null
          created_at: string
          data: Json
          deal_value: number | null
          decision_process: string | null
          economic_buyer: string | null
          forecast_category: string | null
          id: string
          is_active: boolean | null
          loss_reason: string | null
          next_step_date: string | null
          next_steps: string | null
          notes: string | null
          pain_points: string | null
          poc_end_date: string | null
          poc_notes: string | null
          poc_start_date: string | null
          poc_status: string | null
          primary_persona: string | null
          stage: string | null
          stage_history: Json
          stakeholders: Json | null
          success_criteria: string | null
          timeline: string | null
          updated_at: string
          use_cases: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          account_name: string
          blockers?: string | null
          champion?: string | null
          close_date?: string | null
          competition?: string | null
          created_at?: string
          data?: Json
          deal_value?: number | null
          decision_process?: string | null
          economic_buyer?: string | null
          forecast_category?: string | null
          id?: string
          is_active?: boolean | null
          loss_reason?: string | null
          next_step_date?: string | null
          next_steps?: string | null
          notes?: string | null
          pain_points?: string | null
          poc_end_date?: string | null
          poc_notes?: string | null
          poc_start_date?: string | null
          poc_status?: string | null
          primary_persona?: string | null
          stage?: string | null
          stage_history?: Json
          stakeholders?: Json | null
          success_criteria?: string | null
          timeline?: string | null
          updated_at?: string
          use_cases?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          account_name?: string
          blockers?: string | null
          champion?: string | null
          close_date?: string | null
          competition?: string | null
          created_at?: string
          data?: Json
          deal_value?: number | null
          decision_process?: string | null
          economic_buyer?: string | null
          forecast_category?: string | null
          id?: string
          is_active?: boolean | null
          loss_reason?: string | null
          next_step_date?: string | null
          next_steps?: string | null
          notes?: string | null
          pain_points?: string | null
          poc_end_date?: string | null
          poc_notes?: string | null
          poc_start_date?: string | null
          poc_status?: string | null
          primary_persona?: string | null
          stage?: string | null
          stage_history?: Json
          stakeholders?: Json | null
          success_criteria?: string | null
          timeline?: string | null
          updated_at?: string
          use_cases?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_call_logs: {
        Row: {
          account_name: string | null
          call_date: string | null
          created_at: string
          data: Json
          elements_used: Json | null
          framework_id: string | null
          framework_name: string | null
          id: string
          log_type: string | null
          notes: string | null
          summary: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          account_name?: string | null
          call_date?: string | null
          created_at?: string
          data?: Json
          elements_used?: Json | null
          framework_id?: string | null
          framework_name?: string | null
          id?: string
          log_type?: string | null
          notes?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          account_name?: string | null
          call_date?: string | null
          created_at?: string
          data?: Json
          elements_used?: Json | null
          framework_id?: string | null
          framework_name?: string | null
          id?: string
          log_type?: string | null
          notes?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_call_logs_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "discovery_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_call_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_frameworks: {
        Row: {
          category: string | null
          created_at: string
          data: Json
          description: string | null
          framework_data: Json | null
          framework_key: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          framework_data?: Json | null
          framework_key?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          framework_data?: Json | null
          framework_key?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_frameworks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      handoff_artifacts: {
        Row: {
          completeness_score: number | null
          created_at: string
          created_by: string | null
          data: Json
          exported_at: string | null
          id: string
          sections: Json
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completeness_score?: number | null
          created_at?: string
          created_by?: string | null
          data?: Json
          exported_at?: string | null
          id?: string
          sections?: Json
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          completeness_score?: number | null
          created_at?: string
          created_by?: string | null
          data?: Json
          exported_at?: string | null
          id?: string
          sections?: Json
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_artifacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      icps: {
        Row: {
          company_size: string | null
          created_at: string
          data: Json
          geography: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          pain_point: string | null
          primary_buyer: string | null
          proof_window: string | null
          statement: string | null
          summary: string | null
          trigger_event: string | null
          updated_at: string
          user_id: string
          worked: boolean
          workspace_id: string | null
        }
        Insert: {
          company_size?: string | null
          created_at?: string
          data?: Json
          geography?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          pain_point?: string | null
          primary_buyer?: string | null
          proof_window?: string | null
          statement?: string | null
          summary?: string | null
          trigger_event?: string | null
          updated_at?: string
          user_id?: string
          worked?: boolean
          workspace_id?: string | null
        }
        Update: {
          company_size?: string | null
          created_at?: string
          data?: Json
          geography?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          pain_point?: string | null
          primary_buyer?: string | null
          proof_window?: string | null
          statement?: string | null
          summary?: string | null
          trigger_event?: string | null
          updated_at?: string
          user_id?: string
          worked?: boolean
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "icps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          confidence: string | null
          dismissed_at: string | null
          dismissed_reason: string | null
          id: string
          observation_text: string
          related_object_id: string | null
          related_object_type: string | null
          source_generator: string
          status: string
          superseded_by: string | null
          workspace_id: string
          written_at: string
        }
        Insert: {
          confidence?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          id?: string
          observation_text: string
          related_object_id?: string | null
          related_object_type?: string | null
          source_generator: string
          status?: string
          superseded_by?: string | null
          workspace_id: string
          written_at?: string
        }
        Update: {
          confidence?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          id?: string
          observation_text?: string
          related_object_id?: string | null
          related_object_type?: string | null
          source_generator?: string
          status?: string
          superseded_by?: string | null
          workspace_id?: string
          written_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_settings: {
        Row: {
          acv: number | null
          created_at: string
          data: Json
          id: string
          meeting_to_opp: number | null
          monthly_target: number | null
          show_rate: number | null
          touch_to_meeting: number | null
          touches_per_account: number | null
          updated_at: string
          user_id: string
          win_rate: number | null
          working_days: number | null
          workspace_id: string | null
        }
        Insert: {
          acv?: number | null
          created_at?: string
          data?: Json
          id?: string
          meeting_to_opp?: number | null
          monthly_target?: number | null
          show_rate?: number | null
          touch_to_meeting?: number | null
          touches_per_account?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
          working_days?: number | null
          workspace_id?: string | null
        }
        Update: {
          acv?: number | null
          created_at?: string
          data?: Json
          id?: string
          meeting_to_opp?: number | null
          monthly_target?: number | null
          show_rate?: number | null
          touch_to_meeting?: number | null
          touches_per_account?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
          working_days?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_level: string
          acv_band: string | null
          average_deal_size: number | null
          buyer_persona: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          onboarding_answers: Json
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          product_category: string | null
          quota: number | null
          role: string | null
          startup_stage: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          access_level?: string
          acv_band?: string | null
          average_deal_size?: number | null
          buyer_persona?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          onboarding_answers?: Json
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          product_category?: string | null
          quota?: number | null
          role?: string | null
          startup_stage?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          access_level?: string
          acv_band?: string | null
          average_deal_size?: number | null
          buyer_persona?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          onboarding_answers?: Json
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          product_category?: string | null
          quota?: number | null
          role?: string | null
          startup_stage?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      proofs: {
        Row: {
          claim: string | null
          claim_owner: string | null
          created_at: string
          created_by: string | null
          data: Json
          deal_id: string | null
          duration_days: number
          id: string
          kill_rule: string | null
          outcome_state: string
          success_metric: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          claim?: string | null
          claim_owner?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          deal_id?: string | null
          duration_days?: number
          id?: string
          kill_rule?: string | null
          outcome_state?: string
          success_metric?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          claim?: string | null
          claim_owner?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          deal_id?: string | null
          duration_days?: number
          id?: string
          kill_rule?: string | null
          outcome_state?: string
          success_metric?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proofs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_snapshots: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          dimension_scores: Json
          id: string
          overall_score: number | null
          verdict: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          dimension_scores?: Json
          id?: string
          overall_score?: number | null
          verdict?: string | null
          workspace_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          dimension_scores?: Json
          id?: string
          overall_score?: number | null
          verdict?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          angle: string | null
          asset_type: string | null
          channels: string | null
          copy_blocks: Json | null
          created_at: string
          data: Json
          id: string
          is_active: boolean | null
          length: number | null
          name: string
          notes: string | null
          pace: string | null
          persona: string | null
          quality_score: number | null
          sequence_key: string | null
          title: string | null
          touches: Json | null
          trigger_event: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          angle?: string | null
          asset_type?: string | null
          channels?: string | null
          copy_blocks?: Json | null
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean | null
          length?: number | null
          name: string
          notes?: string | null
          pace?: string | null
          persona?: string | null
          quality_score?: number | null
          sequence_key?: string | null
          title?: string | null
          touches?: Json | null
          trigger_event?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          angle?: string | null
          asset_type?: string | null
          channels?: string | null
          copy_blocks?: Json | null
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean | null
          length?: number | null
          name?: string
          notes?: string | null
          pace?: string | null
          persona?: string | null
          quality_score?: number | null
          sequence_key?: string | null
          title?: string | null
          touches?: Json | null
          trigger_event?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_console_accounts: {
        Row: {
          account_key: string
          account_name: string | null
          created_at: string
          data: Json
          domain: string | null
          heat: number
          heat_computed_at: string | null
          id: string
          industry: string | null
          last_enriched_at: string | null
          sector: string | null
          ticker: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          account_key: string
          account_name?: string | null
          created_at?: string
          data?: Json
          domain?: string | null
          heat?: number
          heat_computed_at?: string | null
          id?: string
          industry?: string | null
          last_enriched_at?: string | null
          sector?: string | null
          ticker?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          account_key?: string
          account_name?: string | null
          created_at?: string
          data?: Json
          domain?: string | null
          heat?: number
          heat_computed_at?: string | null
          id?: string
          industry?: string | null
          last_enriched_at?: string | null
          sector?: string | null
          ticker?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_console_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          account_id: string
          captured_at: string | null
          confidence: number | null
          created_at: string | null
          data: Json | null
          fetched_at: string | null
          flagged: boolean | null
          headline: string | null
          id: string
          is_ai: boolean | null
          note: string | null
          published_date: string | null
          signal_type: string | null
          source: string | null
          updated_at: string | null
          url: string | null
          workspace_id: string
        }
        Insert: {
          account_id: string
          captured_at?: string | null
          confidence?: number | null
          created_at?: string | null
          data?: Json | null
          fetched_at?: string | null
          flagged?: boolean | null
          headline?: string | null
          id?: string
          is_ai?: boolean | null
          note?: string | null
          published_date?: string | null
          signal_type?: string | null
          source?: string | null
          updated_at?: string | null
          url?: string | null
          workspace_id?: string
        }
        Update: {
          account_id?: string
          captured_at?: string | null
          confidence?: number | null
          created_at?: string | null
          data?: Json | null
          fetched_at?: string | null
          flagged?: boolean | null
          headline?: string | null
          id?: string
          is_ai?: boolean | null
          note?: string | null
          published_date?: string | null
          signal_type?: string | null
          source?: string | null
          updated_at?: string | null
          url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "signal_console_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_artifacts: {
        Row: {
          artifact_type: string
          created_at: string | null
          data: Json
          id: string
          meta: Json | null
          outcome: string | null
          outcome_updated_at: string | null
          payload: Json
          studio: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          artifact_type: string
          created_at?: string | null
          data?: Json
          id?: string
          meta?: Json | null
          outcome?: string | null
          outcome_updated_at?: string | null
          payload?: Json
          studio: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          artifact_type?: string
          created_at?: string | null
          data?: Json
          id?: string
          meta?: Json | null
          outcome?: string | null
          outcome_updated_at?: string | null
          payload?: Json
          studio?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_artifacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json
          page_path: string | null
          referrer: string | null
          source: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json
          page_path?: string | null
          referrer?: string | null
          source?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json
          page_path?: string | null
          referrer?: string | null
          source?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          data: Json
          invited_at: string
          joined_at: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          data?: Json
          invited_at?: string
          joined_at?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          data?: Json
          invited_at?: string
          joined_at?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_sessions: {
        Row: {
          created_at: string
          focused_object_id: string | null
          focused_object_name: string | null
          focused_object_room: string | null
          focused_object_type: string | null
          id: string
          recent_actions: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          focused_object_id?: string | null
          focused_object_name?: string | null
          focused_object_room?: string | null
          focused_object_type?: string | null
          id?: string
          recent_actions?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          focused_object_id?: string | null
          focused_object_name?: string | null
          focused_object_room?: string | null
          focused_object_type?: string | null
          id?: string
          recent_actions?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          owner_id: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name: string
          owner_id: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          owner_id?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      discovery_analytics: {
        Row: {
          advancement_rate_pct: number | null
          disqualified: number | null
          follow_ups: number | null
          meetings_booked: number | null
          no_interest: number | null
          product_category: string | null
          total_calls: number | null
          user_id: string | null
          week: string | null
        }
        Relationships: []
      }
      signals_with_account: {
        Row: {
          account_heat: number | null
          account_heat_computed_at: string | null
          account_id: string | null
          account_name: string | null
          captured_at: string | null
          confidence: number | null
          created_at: string | null
          data: Json | null
          domain: string | null
          fetched_at: string | null
          flagged: boolean | null
          headline: string | null
          id: string | null
          industry: string | null
          is_ai: boolean | null
          note: string | null
          published_date: string | null
          signal_type: string | null
          source: string | null
          ticker: string | null
          updated_at: string | null
          url: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "signal_console_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      top_worked_items: {
        Row: {
          led_to_meeting: number | null
          product_category: string | null
          times_used: number | null
          user_id: string | null
          worked_item: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_default_workspace_id: { Args: never; Returns: string }
      dismiss_observation: {
        Args: { obs_id: string; reason?: string }
        Returns: undefined
      }
      is_workspace_member: { Args: { w: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
