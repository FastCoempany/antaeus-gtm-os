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
