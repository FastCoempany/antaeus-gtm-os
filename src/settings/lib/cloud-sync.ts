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
