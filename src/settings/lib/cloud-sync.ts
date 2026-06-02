import type { DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";

/**
 * Cloud-sync visibility helpers for the Settings room.
 *
 * Each migrated room has its own independent cloud-persistence loop
 * (boot / auto-save / realtime). The Settings room is where the
 * operator confirms the workspace is connected + sees per-noun row
 * counts to verify their data is actually in the cloud.
 */

export type CloudConnectionStatus =
    | "connected"
    | "no-credentials"
    | "auth-missing"
    | "error";

export interface CloudWorkspaceInfo {
    readonly id: string;
    readonly name: string;
    readonly createdAt: string | null;
}

export interface CloudConnectionState {
    readonly status: CloudConnectionStatus;
    readonly userEmail: string | null;
    readonly workspace: CloudWorkspaceInfo | null;
    readonly errorMessage: string | null;
}

export interface CloudRowCounts {
    readonly icps: number;
    readonly deals: number;
    readonly proofs: number;
    readonly advisorDeployments: number;
    readonly signalConsoleAccounts: number;
    readonly sequences: number;
    readonly discoveryCallLogs: number;
    readonly studioArtifacts: number;
    readonly pipelineSettings: number;
}

export const EMPTY_COUNTS: CloudRowCounts = {
    icps: 0,
    deals: 0,
    proofs: 0,
    advisorDeployments: 0,
    signalConsoleAccounts: 0,
    sequences: 0,
    discoveryCallLogs: 0,
    studioArtifacts: 0,
    pipelineSettings: 0
};

/**
 * Probe the cloud connection. Returns "no-credentials" when env vars
 * are missing (expected in dev), "auth-missing" when the SDK loaded
 * but no user session is active, "connected" when both pass, "error"
 * for anything else.
 */
export async function checkCloudConnection(
    factory: () => DataClient
): Promise<CloudConnectionState> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        return {
            status: "no-credentials",
            userEmail: null,
            workspace: null,
            errorMessage: err instanceof Error ? err.message : null
        };
    }
    try {
        const { data, error } = await client.client.auth.getUser();
        if (error) {
            reportError(error, { op: "settings.checkCloudConnection.auth" });
            return {
                status: "error",
                userEmail: null,
                workspace: null,
                errorMessage: error.message
            };
        }
        const user = data.user;
        if (!user) {
            return {
                status: "auth-missing",
                userEmail: null,
                workspace: null,
                errorMessage: null
            };
        }
        const workspace = await client.currentWorkspace();
        return {
            status: "connected",
            userEmail: user.email ?? null,
            workspace: workspace
                ? {
                      id: workspace.id,
                      name: workspace.name,
                      createdAt: workspace.created_at ?? null
                  }
                : null,
            errorMessage: null
        };
    } catch (err) {
        reportError(err, { op: "settings.checkCloudConnection" });
        return {
            status: "error",
            userEmail: null,
            workspace: null,
            errorMessage: err instanceof Error ? err.message : null
        };
    }
}

/**
 * Fetch row counts per noun. We use limit=1 + the row data we get back
 * by calling list with a small limit — the Supabase JS client does
 * NOT expose count without a separate `select(..., { count: 'exact' })`
 * which our typed data-client doesn't surface. As a pragmatic
 * substitute we call .list({ limit: 5000 }) per table; for early-stage
 * workspaces with low row counts this is fine.
 *
 * Returns EMPTY_COUNTS on error so the UI never crashes.
 */
export async function loadCloudRowCounts(
    factory: () => DataClient
): Promise<CloudRowCounts> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        reportError(err, { op: "settings.loadCloudRowCounts.factory" });
        return EMPTY_COUNTS;
    }
    try {
        const [
            icps,
            deals,
            proofs,
            advisorDeployments,
            signalConsoleAccounts,
            sequences,
            discoveryCallLogs,
            studioArtifacts,
            pipelineSettings
        ] = await Promise.all([
            client.icps.list({ limit: 5000 }).catch(() => []),
            client.deals.list({ limit: 5000 }).catch(() => []),
            client.proofs.list({ limit: 5000 }).catch(() => []),
            client.advisorDeployments.list({ limit: 5000 }).catch(() => []),
            client.signalConsoleAccounts
                .list({ limit: 5000 })
                .catch(() => []),
            client.sequences.list({ limit: 5000 }).catch(() => []),
            client.discoveryCallLogs.list({ limit: 5000 }).catch(() => []),
            client.studioArtifacts.list({ limit: 5000 }).catch(() => []),
            client.pipelineSettings.list({ limit: 100 }).catch(() => [])
        ]);
        return {
            icps: icps.length,
            deals: deals.length,
            proofs: proofs.length,
            advisorDeployments: advisorDeployments.length,
            signalConsoleAccounts: signalConsoleAccounts.length,
            sequences: sequences.length,
            discoveryCallLogs: discoveryCallLogs.length,
            studioArtifacts: studioArtifacts.length,
            pipelineSettings: pipelineSettings.length
        };
    } catch (err) {
        reportError(err, { op: "settings.loadCloudRowCounts" });
        return EMPTY_COUNTS;
    }
}

// ─── Cloud-export (Trust Annex: "export all my data") ────────────────

export interface CloudExportTableErr {
    readonly table: string;
    readonly reason: string;
}

export interface CloudExportSnapshot {
    readonly schemaVersion: 1;
    readonly source: "antaeus-cloud-export-v1";
    readonly capturedAt: string;
    readonly workspaceId: string | null;
    readonly userEmail: string | null;
    readonly tables: Readonly<Record<string, ReadonlyArray<unknown>>>;
    readonly perTableCount: Readonly<Record<string, number>>;
    readonly errors: ReadonlyArray<CloudExportTableErr>;
    readonly totalRows: number;
}

/**
 * Pull every row from every workspace-scoped table the operator
 * authored content into, plus the commercial-identity surfaces. The
 * scope mirrors `deleteCloudWorkspace` (so what you can export is
 * what you can delete), with two intentional additions:
 *
 *   - outdoors_events — added 2026-06-02 per ADR-016. Not yet in the
 *     delete scope; if it joins later, the export and delete shapes
 *     stay aligned.
 *   - workspace_profile — commercial identity (product_category,
 *     what_we_sell, value_prop). Operator-authored; the operator
 *     wants it in their portable copy.
 *
 * RLS scopes every read to the operator's workspace, so this never
 * leaks rows from other workspaces.
 *
 * Defensive: every table is fetched in its own try/catch. A single
 * table failing doesn't abort the export — that table just lands in
 * the errors array with an empty rows entry, and the rest of the
 * snapshot is preserved.
 */
export async function exportCloudWorkspace(
    factory: () => DataClient
): Promise<CloudExportSnapshot> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        reportError(err, { op: "settings.exportCloudWorkspace.factory" });
        return {
            schemaVersion: 1,
            source: "antaeus-cloud-export-v1",
            capturedAt: new Date().toISOString(),
            workspaceId: null,
            userEmail: null,
            tables: {},
            perTableCount: {},
            errors: [
                {
                    table: "<client>",
                    reason: err instanceof Error ? err.message : String(err)
                }
            ],
            totalRows: 0
        };
    }

    // Workspace + user metadata for the export envelope. Both reads
    // are defensive — a failure on either leaves the field null but
    // does not abort the export.
    let workspaceId: string | null = null;
    let userEmail: string | null = null;
    try {
        const ws = await client.currentWorkspace();
        workspaceId = ws?.id ?? null;
    } catch (err) {
        reportError(err, { op: "settings.exportCloudWorkspace.workspace" });
    }
    try {
        const userId = await client.currentUserId();
        if (userId) {
            // The data-client exposes currentUserId, but not email.
            // Read email defensively off the raw supabase client.
            const auth = (client.client as { auth?: unknown }).auth;
            if (
                auth &&
                typeof auth === "object" &&
                "getUser" in auth &&
                typeof (auth as { getUser: unknown }).getUser === "function"
            ) {
                const res = await (
                    auth as { getUser: () => Promise<{ data: { user: { email?: string | null } | null } }> }
                ).getUser();
                userEmail = res.data.user?.email ?? null;
            }
        }
    } catch (err) {
        reportError(err, { op: "settings.exportCloudWorkspace.user" });
    }

    const tableReaders: Array<{
        readonly label: string;
        readonly fetch: () => Promise<ReadonlyArray<unknown>>;
    }> = [
        // ── Mirror of the delete scope ─────────────────────────
        { label: "icps", fetch: () => client.icps.list({ limit: 5000 }) },
        { label: "deals", fetch: () => client.deals.list({ limit: 5000 }) },
        { label: "proofs", fetch: () => client.proofs.list({ limit: 5000 }) },
        {
            label: "advisor_deployments",
            fetch: () => client.advisorDeployments.list({ limit: 5000 })
        },
        {
            label: "signal_console_accounts",
            fetch: () => client.signalConsoleAccounts.list({ limit: 5000 })
        },
        {
            label: "sequences",
            fetch: () => client.sequences.list({ limit: 5000 })
        },
        {
            label: "discovery_call_logs",
            fetch: () => client.discoveryCallLogs.list({ limit: 5000 })
        },
        {
            label: "studio_artifacts",
            fetch: () => client.studioArtifacts.list({ limit: 5000 })
        },
        {
            label: "pipeline_settings",
            fetch: () => client.pipelineSettings.list({ limit: 100 })
        },
        {
            label: "discovery_frameworks",
            fetch: () => client.discoveryFrameworks.list({ limit: 5000 })
        },
        {
            label: "readiness_snapshots",
            fetch: () => client.readinessSnapshots.list({ limit: 5000 })
        },
        {
            label: "handoff_artifacts",
            fetch: () => client.handoffArtifacts.list({ limit: 5000 })
        },
        // ── Additions beyond the delete scope ──────────────────
        {
            label: "outdoors_events",
            fetch: () => client.outdoorsEvents.list({ limit: 5000 })
        },
        {
            label: "workspace_profile",
            fetch: () => client.workspaceProfile.list({ limit: 1 })
        }
    ];

    const tables: Record<string, ReadonlyArray<unknown>> = {};
    const perTableCount: Record<string, number> = {};
    const errors: CloudExportTableErr[] = [];
    let totalRows = 0;

    for (const t of tableReaders) {
        try {
            const rows = await t.fetch();
            tables[t.label] = rows;
            perTableCount[t.label] = rows.length;
            totalRows += rows.length;
        } catch (err) {
            errors.push({
                table: t.label,
                reason: err instanceof Error ? err.message : String(err)
            });
            tables[t.label] = [];
            perTableCount[t.label] = 0;
            reportError(err, {
                op: "settings.exportCloudWorkspace.list",
                table: t.label
            });
        }
    }

    return {
        schemaVersion: 1,
        source: "antaeus-cloud-export-v1",
        capturedAt: new Date().toISOString(),
        workspaceId,
        userEmail,
        tables,
        perTableCount,
        errors,
        totalRows
    };
}

// ─── Cloud-delete (Trust Annex: "delete my data") ─────────────────────

export interface CloudDeleteResult {
    readonly totalDeleted: number;
    readonly perTable: Readonly<Record<string, number>>;
    readonly errors: ReadonlyArray<string>;
    readonly cancelled: boolean;
}

const EMPTY_DELETE_RESULT: CloudDeleteResult = {
    totalDeleted: 0,
    perTable: {},
    errors: [],
    cancelled: false
};

/**
 * Wipe every row in the workspace's data tables for the current user.
 * Returns a per-table delete count + any errors.
 *
 * Scope: every "noun" table the operator authors content into.
 * Excludes `workspaces`, `workspace_members`, `profiles` — those are
 * identity surfaces, not workspace content, and deleting them would
 * also delete the user's ability to sign in (per RLS).
 *
 * RLS gates the deletes to the operator's workspace, so a Worker-side
 * call could only ever touch rows the operator already owns — the
 * fan-out is safe even without explicit workspace_id filtering.
 *
 * The data-client doesn't expose batch delete; we list, then delete
 * one-by-one. Typical workspace size is < 200 rows total, so the
 * loop completes in a couple of seconds.
 */
export async function deleteCloudWorkspace(
    factory: () => DataClient
): Promise<CloudDeleteResult> {
    let client: DataClient;
    try {
        client = factory();
    } catch (err) {
        reportError(err, { op: "settings.deleteCloudWorkspace.factory" });
        return {
            ...EMPTY_DELETE_RESULT,
            cancelled: true,
            errors: [
                err instanceof Error ? err.message : String(err) || "no-client"
            ]
        };
    }

    const tables: Array<{
        readonly label: string;
        readonly fetch: () => Promise<ReadonlyArray<{ readonly id: string }>>;
        readonly remove: (id: string) => Promise<unknown>;
    }> = [
        {
            label: "icps",
            fetch: () => client.icps.list({ limit: 5000 }),
            remove: (id) => client.icps.remove(id)
        },
        {
            label: "deals",
            fetch: () => client.deals.list({ limit: 5000 }),
            remove: (id) => client.deals.remove(id)
        },
        {
            label: "proofs",
            fetch: () => client.proofs.list({ limit: 5000 }),
            remove: (id) => client.proofs.remove(id)
        },
        {
            label: "advisor_deployments",
            fetch: () => client.advisorDeployments.list({ limit: 5000 }),
            remove: (id) => client.advisorDeployments.remove(id)
        },
        {
            label: "signal_console_accounts",
            fetch: () => client.signalConsoleAccounts.list({ limit: 5000 }),
            remove: (id) => client.signalConsoleAccounts.remove(id)
        },
        {
            label: "sequences",
            fetch: () => client.sequences.list({ limit: 5000 }),
            remove: (id) => client.sequences.remove(id)
        },
        {
            label: "discovery_call_logs",
            fetch: () => client.discoveryCallLogs.list({ limit: 5000 }),
            remove: (id) => client.discoveryCallLogs.remove(id)
        },
        {
            label: "studio_artifacts",
            fetch: () => client.studioArtifacts.list({ limit: 5000 }),
            remove: (id) => client.studioArtifacts.remove(id)
        },
        {
            label: "pipeline_settings",
            fetch: () => client.pipelineSettings.list({ limit: 100 }),
            remove: (id) => client.pipelineSettings.remove(id)
        },
        {
            label: "discovery_frameworks",
            fetch: () => client.discoveryFrameworks.list({ limit: 5000 }),
            remove: (id) => client.discoveryFrameworks.remove(id)
        },
        {
            label: "readiness_snapshots",
            fetch: () => client.readinessSnapshots.list({ limit: 5000 }),
            remove: (id) => client.readinessSnapshots.remove(id)
        },
        {
            label: "handoff_artifacts",
            fetch: () => client.handoffArtifacts.list({ limit: 5000 }),
            remove: (id) => client.handoffArtifacts.remove(id)
        }
    ];

    const perTable: Record<string, number> = {};
    const errors: string[] = [];
    let totalDeleted = 0;

    for (const t of tables) {
        try {
            const rows = await t.fetch();
            let deleted = 0;
            for (const row of rows) {
                try {
                    await t.remove(row.id);
                    deleted += 1;
                } catch (err) {
                    errors.push(
                        `${t.label}: ${
                            err instanceof Error ? err.message : String(err)
                        }`
                    );
                    reportError(err, {
                        op: "settings.deleteCloudWorkspace.remove",
                        table: t.label,
                        id: row.id
                    });
                }
            }
            perTable[t.label] = deleted;
            totalDeleted += deleted;
        } catch (err) {
            errors.push(
                `${t.label} (list): ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
            perTable[t.label] = 0;
            reportError(err, {
                op: "settings.deleteCloudWorkspace.list",
                table: t.label
            });
        }
    }

    return {
        totalDeleted,
        perTable,
        errors,
        cancelled: false
    };
}
