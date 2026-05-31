import type { DataClient } from "./data-client";
import { createDataClient } from "./data-client";
import type { TableName } from "./database-helpers";
import { isFeatureEnabled, reportError, trackEvent } from "./observability";

/**
 * Antaeus localStorage → Supabase migration tool (Phase 2.3).
 *
 * Reads every known `gtmos_*` localStorage key, transforms the value to the
 * Supabase table row shape, and inserts via the data-client. Idempotent —
 * sets a completion marker and refuses to re-run unless `force: true`.
 *
 * ─── Gating ──────────────────────────────────────────────────────────────
 * Behind Posthog feature flag `data_migration_live`. Default off. Founder
 * flips the flag for themselves first (Posthog → Feature flags → Add user
 * to allowlist), verifies end-to-end on their own account, then enables
 * for the remaining users.
 *
 * ─── Invocation ──────────────────────────────────────────────────────────
 * Two ways:
 *   (a) Dedicated UI page at /data-migration/ (Phase 2.3 Preact entry) —
 *       this is what founders + users will see.
 *   (b) Programmatic from any authenticated page: await runDataMigration().
 *       Returns a MigrationReport.
 *
 * ─── Invariants ──────────────────────────────────────────────────────────
 *   - Never writes to localStorage's source data. Reads are non-destructive.
 *     The founder can re-run the tool or roll back manually if needed.
 *   - All inserts go through the data-client, so RLS enforces workspace
 *     scoping at the DB layer. An anon or signed-out user's calls would
 *     fail before anything lands in production.
 *   - Every insert is captured as a Posthog event so migration outcomes
 *     are observable without polling the DB.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.3
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface MigrationOptions {
    /** If true, bypass the "already migrated" guard. Default false. */
    force?: boolean;
    /**
     * If true, perform every read + transform but skip the actual inserts.
     * Useful for preview UI so the founder can see what WILL migrate before
     * clicking the commit button. Default false.
     */
    dryRun?: boolean;
    /** Bypass the Posthog gate. Test-only. */
    __bypassFlag?: boolean;
    /**
     * Inject a pre-constructed data client. Test-only — production callers
     * get the default from getSupabaseClient().
     */
    dataClient?: DataClient;
    /**
     * Inject a storage implementation. Test-only — production reads
     * window.localStorage.
     */
    storage?: Storage;
}

export interface TableReport {
    readonly table: TableName;
    readonly keysRead: readonly string[];
    readonly rowsTransformed: number;
    readonly rowsInserted: number;
    readonly rowsSkipped: number;
    readonly errors: ReadonlyArray<{ key: string; reason: string }>;
}

export interface MigrationReport {
    readonly startedAt: string;
    readonly finishedAt: string;
    readonly dryRun: boolean;
    readonly tables: readonly TableReport[];
    readonly totalTransformed: number;
    readonly totalInserted: number;
    readonly totalErrors: number;
    readonly gatedBy?: "flag_off" | "already_migrated";
}

// ─── Constants ──────────────────────────────────────────────────────────

/**
 * Marker key written to localStorage after a successful non-dry-run migration.
 * The value is the ISO timestamp of completion. Presence of this key is what
 * runDataMigration() checks to refuse re-runs.
 *
 * Versioned (`v1`) so a future schema change can force a re-migration by
 * bumping the version.
 */
export const MIGRATION_COMPLETE_KEY = "gtmos_migrated_to_supabase_v1";

/**
 * Posthog feature flag that gates this tool. Set to true per-user in Posthog
 * to enable the migration UI / CLI for that user.
 */
export const MIGRATION_FEATURE_FLAG = "data_migration_live";

// ─── Entry point ────────────────────────────────────────────────────────

export async function runDataMigration(
    options: MigrationOptions = {}
): Promise<MigrationReport> {
    const startedAt = new Date().toISOString();
    const storage = options.storage ?? resolveLocalStorage();

    // Gate 1: feature flag
    if (!options.__bypassFlag && !isFeatureEnabled(MIGRATION_FEATURE_FLAG)) {
        return emptyReport({
            startedAt,
            dryRun: options.dryRun ?? false,
            gatedBy: "flag_off"
        });
    }

    // Gate 2: already-migrated check (skippable via force)
    if (!options.force && storage && storage.getItem(MIGRATION_COMPLETE_KEY)) {
        return emptyReport({
            startedAt,
            dryRun: options.dryRun ?? false,
            gatedBy: "already_migrated"
        });
    }

    const data = options.dataClient ?? createDataClient();
    const migrators = resolveMigrators();

    trackEvent("data_migration_started", {
        dryRun: options.dryRun ?? false,
        migratorCount: migrators.length
    });

    const tableReports: TableReport[] = [];
    let totalTransformed = 0;
    let totalInserted = 0;
    let totalErrors = 0;

    for (const migrator of migrators) {
        try {
            const report = await migrator.run({
                storage: storage ?? emptyStorage(),
                data,
                dryRun: options.dryRun ?? false
            });
            tableReports.push(report);
            totalTransformed += report.rowsTransformed;
            totalInserted += report.rowsInserted;
            totalErrors += report.errors.length;
        } catch (err) {
            reportError(err, { op: "runDataMigration", table: migrator.table });
            tableReports.push({
                table: migrator.table,
                keysRead: [],
                rowsTransformed: 0,
                rowsInserted: 0,
                rowsSkipped: 0,
                errors: [
                    {
                        key: "<unexpected>",
                        reason: err instanceof Error ? err.message : String(err)
                    }
                ]
            });
            totalErrors += 1;
        }
    }

    // Set the completion marker only on a real (non-dry) run with zero errors.
    // A partial success does NOT set the marker — the founder can re-run.
    const finishedAt = new Date().toISOString();
    if (!options.dryRun && totalErrors === 0 && storage) {
        storage.setItem(MIGRATION_COMPLETE_KEY, finishedAt);
    }

    trackEvent("data_migration_finished", {
        dryRun: options.dryRun ?? false,
        totalTransformed,
        totalInserted,
        totalErrors,
        markerSet: !options.dryRun && totalErrors === 0
    });

    return {
        startedAt,
        finishedAt,
        dryRun: options.dryRun ?? false,
        tables: tableReports,
        totalTransformed,
        totalInserted,
        totalErrors
    };
}

// ─── Migrator registry ──────────────────────────────────────────────────

/**
 * A per-table migrator. Knows which localStorage keys it owns, how to
 * transform them, and how to insert via the data-client.
 *
 * Implementations live in this file once the localStorage inventory is
 * final. Each should be small + testable in isolation.
 */
export interface Migrator {
    readonly table: TableName;
    run(ctx: MigratorContext): Promise<TableReport>;
}

export interface MigratorContext {
    readonly storage: Storage;
    readonly data: DataClient;
    readonly dryRun: boolean;
}

/**
 * Returns the full ordered list of migrators. Order matters for
 * foreign-key integrity — parent nouns before children.
 *
 * Starts empty; individual migrators land in Phase 2.3.C once the
 * localStorage inventory is returned by the Explore agent.
 */
function resolveMigrators(): Migrator[] {
    return MIGRATORS;
}

/**
 * Map from target noun table → localStorage keys whose payload gets migrated.
 *
 * Source: Explore-agent inventory of all localStorage reads/writes across
 * the legacy static app (2026-04-24). The inventory is documented in
 * CLAUDE.md Part V §1 session log entry for Phase 2.3.
 *
 * Pass-through strategy: we don't attempt to transform individual legacy
 * payloads into typed table columns. Each migrator inserts ONE row per
 * target table with all its assigned localStorage keys preserved verbatim
 * under `data.migrated_from_localstorage`. Per-room Phase 3+ migrations
 * consume that blob and break it into properly-typed rows as each room
 * takes over native Supabase reads.
 *
 * This is lossless (values byte-for-byte preserved), deterministic
 * (no field-guessing), and reversible (the blob is still there).
 *
 * `profiles` is intentionally NOT in this map — the table already has one
 * row per auth user (pre-Phase-2 schema), so merging onboarding/profile
 * localStorage into it requires room-specific knowledge that belongs in
 * the Phase 4 Onboarding + Settings migrations, not this generic tool.
 */
/**
 * Distinctive placeholder value used for NOT NULL label columns on legacy
 * tables (icps.name, deals.account_name, etc.). The pass-through migrator
 * inserts a single blob row per table — the actual values live in
 * data.migrated_from_localstorage. This placeholder lets Phase 3+ room
 * migrations detect blob rows by matching this string and unpacking them
 * into properly-typed per-item rows.
 */
const MIGRATION_BLOB_PLACEHOLDER = "__gtmos_migration_blob__";

/**
 * Per-table migrator configuration. Lives as an array so ordering is
 * explicit (parent nouns before children for FK integrity — not strictly
 * required today because FKs use ON DELETE SET NULL, but cheap to
 * preserve the discipline).
 *
 * `placeholderFields` covers NOT NULL label columns we can't derive from
 * localStorage. `requiresUserId` tables don't have the usual
 * `default auth.uid()` on user_id; the migrator injects it from
 * data.currentUserId().
 */
interface MigratorConfig {
    table: TableName;
    keys: string[];
    placeholderFields?: Record<string, string>;
    requiresUserId?: boolean;
    /**
     * Set to a column name (typically "user_id") to use upsert semantics
     * with that column as the conflict target. Required for tables that
     * enforce a 1-row-per-user invariant (e.g. pipeline_settings).
     */
    upsertOnConflict?: string;
}

const PASSTHROUGH_CONFIGS: MigratorConfig[] = [
    {
        table: "icps",
        keys: [
            "gtmos_icp_analytics",
            "gtmos_deal_links",
            "gtmos_sw_persona_maps",
            "gtmos_sw_prospects",
            "gtmos_sw_query_cards"
        ],
        placeholderFields: { name: MIGRATION_BLOB_PLACEHOLDER }
    },
    {
        table: "deals",
        keys: [
            "gtmos_deal_workspaces",
            "gtmos_deal_stage_history",
            "gtmos_deal_outcomes",
            "gtmos_deal_room_health"
        ],
        placeholderFields: { account_name: MIGRATION_BLOB_PLACEHOLDER }
    },
    {
        table: "sequences",
        keys: [
            "gtmos_angles",
            "gtmos_outbound_touches",
            "gtmos_linkedin_log",
            "gtmos_outbound_seed"
        ],
        placeholderFields: {
            name: MIGRATION_BLOB_PLACEHOLDER,
            sequence_key: MIGRATION_BLOB_PLACEHOLDER
        }
    },
    {
        // Signal Console hit Step 5 (drop legacy) on 2026-05-23. The
        // room is now cloud-native from day one — operators sign in and
        // accounts/signals flow through `signal_console_accounts` +
        // `signals` tables directly. No localStorage seeding required
        // for fresh accounts.
        //
        // The keys array stays for one final purpose: migrating the
        // Phase 2.3 (2026-04-24) seed-blob row for users whose legacy
        // data was captured during that one-shot migration. Once the
        // master `data_layer_parity_complete` flag flips on and the
        // 2026-04-24 blob is archived, this entry can be removed
        // entirely.
        table: "signal_console_accounts",
        keys: [
            "gtmos_sc_v4",
            "gtmos_sc_usage_v4",
            "gtmos_sc_morning_v4",
            "gtmos_sc_batches_v4",
            "gtmos_sc_guide_v1",
            "gtmos_signal_room_health",
            "gtmos_ta_signals"
        ],
        placeholderFields: { account_key: MIGRATION_BLOB_PLACEHOLDER }
    },
    {
        table: "discovery_frameworks",
        keys: ["gtmos_discovery_worked"],
        placeholderFields: {
            name: MIGRATION_BLOB_PLACEHOLDER,
            framework_key: MIGRATION_BLOB_PLACEHOLDER
        }
    },
    {
        table: "discovery_call_logs",
        keys: [
            "gtmos_discovery_stats",
            "gtmos_discovery_agenda",
            "gtmos_call_handoff",
            "gtmos_cold_call_log"
        ]
    },
    {
        table: "pipeline_settings",
        keys: [
            "gtmos_qw_inputs",
            "gtmos_quota_targets",
            "gtmos_territory",
            "gtmos_ta_setup",
            "gtmos_ta_focuses",
            "gtmos_ta_theses",
            "gtmos_ta_approaches",
            "gtmos_ta_accounts",
            "gtmos_ta_dispositions",
            "gtmos_ta_swap_history",
            "gtmos_ta_retier_history",
            "gtmos_ta_calibrations"
        ],
        requiresUserId: true,
        // Schema enforces 1 pipeline_settings row per user — upsert by user_id
        // so the migrator cleanly merges into an existing row instead of
        // colliding on the unique constraint.
        upsertOnConflict: "user_id"
    },
    {
        table: "studio_artifacts",
        keys: [
            "gtmos_playbook",
            "gtmos_playbook_notes",
            "gtmos_autopsy_log_v1",
            "gtmos_poc_data"
        ],
        requiresUserId: true,
        // Schema has three NOT NULL columns without defaults: studio,
        // artifact_type, title. Confirmed 2026-04-24 via
        // `select column_name, is_nullable, column_default from
        // information_schema.columns where table_name = 'studio_artifacts'`.
        //
        // `studio` additionally carries a CHECK constraint
        // (studio_artifacts_studio_check) restricting it to:
        //   'discovery', 'sequence_composer', 'trigger_angle', 'asset_builder',
        //   'conversion', 'cfo_negotiation', 'reply_engine', 'outbound_os',
        //   'quota_workback', 'thin_icp'.
        // We pick 'discovery' for the blob row — it's the broadest value and
        // Discovery Studio is the first Phase 4 room migration, so the blob
        // naturally "lives" there until unpacked. `artifact_type` + `title`
        // have no CHECK constraint; the placeholder string satisfies them.
        placeholderFields: {
            studio: "discovery",
            artifact_type: MIGRATION_BLOB_PLACEHOLDER,
            title: MIGRATION_BLOB_PLACEHOLDER
        }
    },
    {
        table: "proofs",
        keys: ["gtmos_cfo_worked_moves"]
    },
    {
        table: "advisor_deployments",
        keys: ["gtmos_advisor_deployments", "gtmos_advisor_registry"]
    },
    {
        table: "readiness_snapshots",
        keys: ["gtmos_readiness_snapshot"]
    },
    {
        table: "handoff_artifacts",
        keys: ["gtmos_handoff_exported"]
    }
];

const MIGRATORS: Migrator[] = PASSTHROUGH_CONFIGS.map(makePassthroughMigrator);

/**
 * Build a pass-through migrator from a per-table config.
 *
 * Reads every assigned localStorage key, stops short if no keys had values
 * (nothing to migrate), otherwise assembles one `data.migrated_from_localstorage`
 * blob and inserts a single row via the data-client.
 *
 * Inserts include:
 *   - any `placeholderFields` from config (covers NOT NULL label columns)
 *   - `user_id` if `requiresUserId: true` (for tables without auth.uid() default)
 *   - the migration blob in `data`
 *
 * Skip paths are counted in `rowsSkipped`, not `errors` — a user who never
 * used Deal Workspace legitimately has no `gtmos_deal_workspaces` key and
 * the migrator should silently skip `deals`.
 */
function makePassthroughMigrator(config: MigratorConfig): Migrator {
    const {
        table,
        keys,
        placeholderFields,
        requiresUserId,
        upsertOnConflict
    } = config;
    return {
        table,
        async run({ storage, data, dryRun }): Promise<TableReport> {
            const keysRead: string[] = [];
            const payload: Record<string, unknown> = {};
            const errors: Array<{ key: string; reason: string }> = [];

            for (const key of keys) {
                const raw = storage.getItem(key);
                if (raw === null) continue;
                keysRead.push(key);
                // Parse as JSON when possible; preserve as raw string otherwise.
                // Some legacy localStorage keys (e.g. gtmos_handoff_exported,
                // gtmos_product_category, gtmos_welcome_seen) were written as
                // bare strings or primitives, not JSON-wrapped values. The
                // migration blob keeps whatever the browser had — no data loss.
                let value: unknown = raw;
                try {
                    value = JSON.parse(raw);
                } catch {
                    // Raw string fallback — `value` is already `raw`.
                }
                payload[key] = value;
            }

            if (keysRead.length === 0) {
                // No data for this noun on this user — normal, not an error.
                return {
                    table,
                    keysRead,
                    rowsTransformed: 0,
                    rowsInserted: 0,
                    rowsSkipped: 0,
                    errors
                };
            }

            if (Object.keys(payload).length === 0) {
                // Found keys but nothing parsed cleanly. Don't insert an empty
                // blob — surface the parse errors to the user so they can
                // investigate. rowsTransformed stays 0 because no valid row
                // was assembled.
                return {
                    table,
                    keysRead,
                    rowsTransformed: 0,
                    rowsInserted: 0,
                    rowsSkipped: 0,
                    errors
                };
            }

            const rowsTransformed = 1;
            if (dryRun) {
                return {
                    table,
                    keysRead,
                    rowsTransformed,
                    rowsInserted: 0,
                    rowsSkipped: 1,
                    errors
                };
            }

            // Idempotency check — if a blob row already exists for this
            // table (from a previous partial migration), skip inserting a
            // duplicate. RLS scopes the query to the current user/workspace.
            // Upsert tables don't need this check because upsert is itself
            // idempotent on the conflict key.
            if (!upsertOnConflict) {
                try {
                    const existing = await data.client
                        .from(table)
                        .select("id")
                        .eq("data->>migration_version", "phase-2.3-passthrough")
                        .limit(1);
                    if (existing.data && existing.data.length > 0) {
                        return {
                            table,
                            keysRead,
                            rowsTransformed,
                            rowsInserted: 0,
                            rowsSkipped: 1,
                            errors
                        };
                    }
                } catch {
                    // If the existence check itself errors (RLS policy quirk,
                    // network blip), proceed with the insert — duplication is
                    // a softer failure than data loss.
                }
            }

            const row: Record<string, unknown> = {
                ...(placeholderFields ?? {}),
                data: {
                    migrated_from_localstorage: payload,
                    migrated_at: new Date().toISOString(),
                    migration_version: "phase-2.3-passthrough"
                }
            };

            if (requiresUserId) {
                const userId = await data.currentUserId();
                if (!userId) {
                    return {
                        table,
                        keysRead,
                        rowsTransformed,
                        rowsInserted: 0,
                        rowsSkipped: 0,
                        errors: [
                            ...errors,
                            {
                                key: "<user_id>",
                                reason:
                                    "table requires explicit user_id but no authenticated user found"
                            }
                        ]
                    };
                }
                row.user_id = userId;
            }

            try {
                if (upsertOnConflict) {
                    // Bypass the typed accessor — DataClient doesn't expose
                    // upsert in its public API yet (Phase 2.2 covered insert/
                    // update/delete only). Use the raw client.
                    const result = await data.client
                        .from(table)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .upsert(row as any, { onConflict: upsertOnConflict })
                        .select("id")
                        .single();
                    if (result.error) throw result.error;
                } else {
                    // Type-erase across the generic boundary — each concrete
                    // accessor has its own Insert type, but at this call site
                    // we only know `table: TableName`. Same idiomatic pattern
                    // as makeNounAccessor() in data-client.ts.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const accessor = (data as any)[toAccessorName(table)];
                    await accessor.insert(row);
                }
                return {
                    table,
                    keysRead,
                    rowsTransformed,
                    rowsInserted: 1,
                    rowsSkipped: 0,
                    errors
                };
            } catch (err) {
                const reason = stringifyError(err);
                reportError(err, { op: "passthroughMigrator", table });
                return {
                    table,
                    keysRead,
                    rowsTransformed,
                    rowsInserted: 0,
                    rowsSkipped: 0,
                    errors: [...errors, { key: "<insert>", reason }]
                };
            }
        }
    };
}

// Map table-name → accessor key on the data-client object.
// data-client.ts uses camelCase: signal_console_accounts → signalConsoleAccounts.
function toAccessorName(table: TableName): string {
    // Manual map is more honest than string transform; one-to-one with
    // what data-client.ts exposes.
    const MAP: Record<TableName, string> = {
        workspaces: "workspaces",
        workspace_members: "workspaceMembers",
        icps: "icps",
        deals: "deals",
        sequences: "sequences",
        signal_console_accounts: "signalConsoleAccounts",
        // Phase 4.5 Signal Console Step 2 (ADR-005). New signals table
        // has no 2026-04-24 migration-blob counterpart — it ships
        // empty and gets populated by Step 3 dual-write + future
        // generator writes.
        signals: "signals",
        discovery_frameworks: "discoveryFrameworks",
        discovery_call_logs: "discoveryCallLogs",
        pipeline_settings: "pipelineSettings",
        profiles: "profiles",
        studio_artifacts: "studioArtifacts",
        proofs: "proofs",
        advisor_deployments: "advisorDeployments",
        readiness_snapshots: "readinessSnapshots",
        handoff_artifacts: "handoffArtifacts",
        founding_gtm_shares: "foundingGtmShares",
        waitlist_signups: "waitlistSignups",
        // Phase A orchestration layer (ADR-004). These tables are
        // populated server-side (heartbeat Edge Function for
        // observations, runtime mutation for workspace_sessions) and
        // are NOT part of the localStorage → Supabase migration tool.
        // Listed here only to satisfy the exhaustive Record type.
        workspace_sessions: "workspaceSessions",
        observations: "observations",
        // Commercial identity layer (ADR-007). Authored in ICP Studio
        // (profile) + Signal Console (relationship flags), not migrated
        // from localStorage. Listed here only to satisfy the exhaustive
        // Record type.
        workspace_profile: "workspaceProfile",
        // Briefing room foundation (ADR-006, B.0a). Populated
        // server-side by the Briefing pipeline Edge Function — no
        // legacy localStorage data to migrate from. Listed here only
        // to satisfy the exhaustive Record type.
        briefing_runs: "briefingRuns",
        briefing_raw_items: "briefingRawItems",
        briefing_enriched_items: "briefingEnrichedItems",
        briefing_clusters: "briefingClusters",
        briefing_patterns: "briefingPatterns",
        briefing_audit_envelopes: "briefingAuditEnvelopes",
        briefing_pattern_feedback: "briefingPatternFeedback",
        briefing_pattern_eval: "briefingPatternEval",
        // Briefing Watchlist Triggers (ADR-006, B.3a). Operator-armed
        // standing orders + their fires — authored in the Briefing Watch
        // List, not migrated from localStorage. Listed here only to
        // satisfy the exhaustive Record type.
        briefing_watchlist_triggers: "briefingWatchlistTriggers",
        briefing_trigger_fires: "briefingTriggerFires",
        // Briefing Periphery Detection (ADR-006, B.4). Candidates +
        // watchlist entities — produced by the pipeline and authored
        // by the operator via the right-rail UI, not migrated from
        // localStorage. Listed here only to satisfy the exhaustive
        // Record type.
        briefing_periphery_candidates: "briefingPeripheryCandidates",
        briefing_watchlist_entities: "briefingWatchlistEntities"
    };
    return MAP[table];
}

// Exported so tests + the Preact UI can list what would run.
export function __getRegisteredMigrators(): readonly Migrator[] {
    return MIGRATORS;
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Turn any thrown error into a readable message. Supabase errors are plain
 * objects with `message`, `code`, `hint`, `details` — none of which survive
 * `String(err)` (which just produces "[object Object]").
 */
function stringifyError(err: unknown): string {
    if (err === null || err === undefined) return "unknown error";
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (typeof err === "object") {
        const e = err as Record<string, unknown>;
        const parts: string[] = [];
        if (typeof e.message === "string") parts.push(e.message);
        if (typeof e.code === "string" || typeof e.code === "number") {
            parts.push(`(code: ${e.code})`);
        }
        if (typeof e.hint === "string") parts.push(`hint: ${e.hint}`);
        if (typeof e.details === "string") parts.push(`details: ${e.details}`);
        if (parts.length > 0) return parts.join(" ");
        try {
            return JSON.stringify(err);
        } catch {
            return "error (unserializable)";
        }
    }
    return String(err);
}

function resolveLocalStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    if (typeof window.localStorage === "undefined") return null;
    return window.localStorage;
}

function emptyStorage(): Storage {
    // Test fallback. Not used in the browser path.
    const store: Record<string, string> = {};
    return {
        getItem: (k) => (k in store ? store[k]! : null),
        setItem: (k, v) => {
            store[k] = v;
        },
        removeItem: (k) => {
            delete store[k];
        },
        clear: () => {
            for (const k of Object.keys(store)) delete store[k];
        },
        key: (i) => Object.keys(store)[i] ?? null,
        get length() {
            return Object.keys(store).length;
        }
    };
}

function emptyReport(params: {
    startedAt: string;
    dryRun: boolean;
    gatedBy: MigrationReport["gatedBy"];
}): MigrationReport {
    return {
        startedAt: params.startedAt,
        finishedAt: params.startedAt,
        dryRun: params.dryRun,
        tables: [],
        totalTransformed: 0,
        totalInserted: 0,
        totalErrors: 0,
        gatedBy: params.gatedBy
    };
}

// ─── Shared transformation helpers (used by per-noun migrators) ────────

/**
 * Safely parse a JSON string from localStorage. Returns null if the value
 * is missing or unparseable. Never throws — bad JSON becomes a table-report
 * error, not a process crash.
 */
export function safeParse<T>(raw: string | null): T | null {
    if (raw === null || raw === "") return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

/**
 * Coerce any value to a string or return null. Used by migrators that
 * defensively fall back when a localStorage field isn't the expected shape.
 */
export function asString(v: unknown): string | null {
    if (typeof v === "string") return v;
    if (v === null || v === undefined) return null;
    return String(v);
}

/**
 * Coerce to number or null. Returns null for non-finite numbers as well.
 */
export function asNumber(v: unknown): number | null {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}
