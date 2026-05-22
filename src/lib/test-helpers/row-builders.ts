/**
 * Test-only Row builders.
 *
 * The regen-typed Row<T> shapes from database.types.ts include every
 * column the production schema has, including audit + nullable
 * columns that bridge tests don't care about. Constructing partial
 * Row literals in tests would fail typecheck.
 *
 * These builders take the fields a test actually wants to assert
 * against, fill in defaults for everything else, and return a
 * complete Row<T> that satisfies the regen-strict type.
 *
 * Per-table because each table's null-safe defaults differ. Add a new
 * builder when a new bridge test starts constructing Row literals.
 *
 * NOT for production code. NOT imported outside *.test.ts files.
 *
 * Ref: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md
 */

import type { Json, Row } from "@/lib/database-helpers";

// ─── studio_artifacts ──────────────────────────────────────────────────

/**
 * Build a complete Row<"studio_artifacts"> from a minimal partial
 * input. Fills missing columns with the same defaults the production
 * DB would set: nullable columns → null, NOT-NULL columns with
 * defaults → empty/zero/now().
 *
 * Tests that exercise rowToX bridges typically only care about
 * `id`, `data`, and timestamps. Pass those in; defaults handle the
 * rest.
 */
export function buildStudioArtifactRow(
    partial: Partial<Row<"studio_artifacts">> & { id: string }
): Row<"studio_artifacts"> {
    const now = "2026-04-02T12:00:00Z";
    return {
        id: partial.id,
        user_id: partial.user_id ?? "u",
        workspace_id: partial.workspace_id ?? "w",
        artifact_type: partial.artifact_type ?? "test",
        studio: partial.studio ?? "test",
        title: partial.title ?? "Test artifact",
        data: partial.data ?? ({} as Json),
        payload: partial.payload ?? ({} as Json),
        meta: partial.meta ?? null,
        outcome: partial.outcome ?? null,
        outcome_updated_at: partial.outcome_updated_at ?? null,
        tags: partial.tags ?? null,
        created_at: partial.created_at ?? now,
        updated_at: partial.updated_at ?? now
    };
}

// ─── sequences ─────────────────────────────────────────────────────────

export function buildSequenceRow(
    partial: Partial<Row<"sequences">> & { id: string; name: string }
): Row<"sequences"> {
    const now = "2026-04-02T12:00:00Z";
    return {
        id: partial.id,
        user_id: partial.user_id ?? "u",
        workspace_id: partial.workspace_id ?? "w",
        name: partial.name,
        title: partial.title ?? null,
        sequence_key: partial.sequence_key ?? null,
        data: partial.data ?? ({} as Json),
        angle: partial.angle ?? null,
        asset_type: partial.asset_type ?? null,
        channels: partial.channels ?? null,
        copy_blocks: partial.copy_blocks ?? null,
        is_active: partial.is_active ?? null,
        length: partial.length ?? null,
        notes: partial.notes ?? null,
        pace: partial.pace ?? null,
        persona: partial.persona ?? null,
        quality_score: partial.quality_score ?? null,
        touches: partial.touches ?? null,
        trigger_event: partial.trigger_event ?? null,
        created_at: partial.created_at ?? now,
        updated_at: partial.updated_at ?? now
    };
}

// ─── discovery_call_logs ───────────────────────────────────────────────

export function buildDiscoveryCallLogRow(
    partial: Partial<Row<"discovery_call_logs">> & { id: string }
): Row<"discovery_call_logs"> {
    const now = "2026-04-02T12:00:00Z";
    return {
        id: partial.id,
        user_id: partial.user_id ?? "u",
        workspace_id: partial.workspace_id ?? "w",
        data: partial.data ?? ({} as Json),
        account_name: partial.account_name ?? null,
        call_date: partial.call_date ?? null,
        elements_used: partial.elements_used ?? null,
        framework_id: partial.framework_id ?? null,
        framework_name: partial.framework_name ?? null,
        log_type: partial.log_type ?? null,
        notes: partial.notes ?? null,
        summary: partial.summary ?? null,
        created_at: partial.created_at ?? now,
        updated_at: partial.updated_at ?? now
    };
}

// ─── icps ──────────────────────────────────────────────────────────────

export function buildIcpRow(
    partial: Partial<Row<"icps">> & { id: string; name: string }
): Row<"icps"> {
    const now = "2026-04-02T12:00:00Z";
    return {
        id: partial.id,
        user_id: partial.user_id ?? "u",
        workspace_id: partial.workspace_id ?? "w",
        name: partial.name,
        worked: partial.worked ?? false,
        data: partial.data ?? ({} as Json),
        summary: partial.summary ?? null,
        statement: partial.statement ?? null,
        industry: partial.industry ?? null,
        company_size: partial.company_size ?? null,
        geography: partial.geography ?? null,
        is_active: partial.is_active ?? null,
        notes: partial.notes ?? null,
        pain_point: partial.pain_point ?? null,
        primary_buyer: partial.primary_buyer ?? null,
        proof_window: partial.proof_window ?? null,
        trigger_event: partial.trigger_event ?? null,
        created_at: partial.created_at ?? now,
        updated_at: partial.updated_at ?? now
    };
}

// ─── pipeline_settings ─────────────────────────────────────────────────

export function buildPipelineSettingsRow(
    partial: Partial<Row<"pipeline_settings">> & { id: string }
): Row<"pipeline_settings"> {
    const now = "2026-04-02T12:00:00Z";
    return {
        id: partial.id,
        user_id: partial.user_id ?? "u",
        workspace_id: partial.workspace_id ?? "w",
        data: partial.data ?? ({} as Json),
        acv: partial.acv ?? null,
        meeting_to_opp: partial.meeting_to_opp ?? null,
        monthly_target: partial.monthly_target ?? null,
        show_rate: partial.show_rate ?? null,
        touch_to_meeting: partial.touch_to_meeting ?? null,
        touches_per_account: partial.touches_per_account ?? null,
        win_rate: partial.win_rate ?? null,
        working_days: partial.working_days ?? null,
        created_at: partial.created_at ?? now,
        updated_at: partial.updated_at ?? now
    };
}
