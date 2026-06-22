/**
 * Consumer-facing helpers for the auto-generated Supabase types.
 *
 * Why a separate file from database.types.ts:
 *   - database.types.ts is machine-generated (supabase gen types
 *     typescript --linked) and overwrites cleanly on every regen.
 *     Touching it by hand is a discipline violation per ADR-005
 *     resolution 2 ("schema-types regeneration machine-generated only").
 *   - These helpers (Row<T> / InsertRow<T> / UpdateRow<T> generics,
 *     named enum-like aliases, convenience row aliases) are hand-written
 *     because the generator doesn't emit them. They live here so the
 *     next regen never overwrites them.
 *
 * Consumer code imports everything from THIS file, not database.types
 * directly. That gives us one stable import surface even as the
 * generator's output shape evolves between Supabase CLI versions.
 *
 * Ref: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md
 */

import type { Database } from "./database.types";

// Re-export the generator's outputs so consumer code only needs to
// import from this one module.
export type { Database, Json } from "./database.types";

// ─── Generic table-shape extractors ────────────────────────────────────

export type TableName = keyof Database["public"]["Tables"];
export type ViewName = keyof Database["public"]["Views"];

export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type InsertRow<T extends TableName> =
    Database["public"]["Tables"][T]["Insert"];
export type UpdateRow<T extends TableName> =
    Database["public"]["Tables"][T]["Update"];

export type ViewRow<T extends ViewName> = Database["public"]["Views"][T]["Row"];

/**
 * Per-table primary key. Most tables key on `id`; a few don't —
 * `workspace_profile` is keyed by `workspace_id` (one row per workspace,
 * no surrogate `id`). The data clients' `get` / `update` / `remove`
 * filter on the row's primary key, so they must use the right column.
 *
 * Before this map existed, `update(workspace_id, …)` on workspace_profile
 * compiled to `where id = …` and threw "column workspace_profile.id does
 * not exist", silently breaking every workspace_profile write (onboarding
 * cloud mirror, density, ICP profile, Phase F toggle). Only Phase F
 * surfaced it; the others fell back to localStorage.
 */
const PRIMARY_KEY: Partial<Record<TableName, string>> = {
    workspace_profile: "workspace_id"
};

export function pkColumn(table: TableName): string {
    return PRIMARY_KEY[table] ?? "id";
}

// ─── Named enum-like string unions ─────────────────────────────────────
// The DB stores these as text columns (not Postgres enums), so the
// generator emits them as `string | null`. Defining them as named
// string unions here gives consumer code typechecker leverage —
// e.g. a typo like `role = "owners"` fails to compile.

export type WorkspaceMemberRole = "owner" | "admin" | "member";
export type ProofOutcomeState = "open" | "passed" | "failed" | "abandoned";
export type AdvisorTier = "investor" | "advisor" | "customer" | "other";
export type AdvisorOutcomeStamp = "send" | "hold" | "reroute";
export type ReadinessVerdict = "hire_ready" | "partial" | "thin";

// ─── Convenience row aliases ───────────────────────────────────────────
// `Workspace` instead of `Row<"workspaces">`. Purely convenience.
// Order tracks supabase/migrations/ table-creation order.

export type Workspace = Row<"workspaces">;
export type WorkspaceMember = Row<"workspace_members">;
export type Icp = Row<"icps">;
export type Deal = Row<"deals">;
export type Sequence = Row<"sequences">;
export type SignalConsoleAccount = Row<"signal_console_accounts">;
export type SignalRow = Row<"signals">;
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
export type WorkspaceSession = Row<"workspace_sessions">;
export type WorkspaceProfile = Row<"workspace_profile">;
export type Observation = Row<"observations">;

// ─── Briefing room (ADR-006) ───────────────────────────────────────────
// The seven tables added by migration 20260523180000. Per the build
// phase plan §B.0, these are the foundation tables Briefing B.0 → B.2
// requires. Triggers (B.3) + Periphery (B.4) tables land later.

export type BriefingRun = Row<"briefing_runs">;
export type BriefingRawItem = Row<"briefing_raw_items">;
export type BriefingEnrichedItem = Row<"briefing_enriched_items">;
export type BriefingCluster = Row<"briefing_clusters">;
export type BriefingPattern = Row<"briefing_patterns">;
export type BriefingAuditEnvelope = Row<"briefing_audit_envelopes">;
export type BriefingPatternFeedback = Row<"briefing_pattern_feedback">;

// ─── Views ─────────────────────────────────────────────────────────────
// Views show up in Database["public"]["Views"] rather than Tables. The
// generator emits every view column as `T | null` because views don't
// enforce NOT NULL even when the underlying table does. Consumer code
// has to handle that nullability explicitly.

export type SignalsWithAccountRow = ViewRow<"signals_with_account">;
export type DiscoveryAnalytics = ViewRow<"discovery_analytics">;
export type TopWorkedItems = ViewRow<"top_worked_items">;
