import type { AccentRole } from "@/components";
import type { CloudConnectionStatus } from "../../lib/cloud-sync";
import { cloudCounts } from "../../state";

/**
 * Pure adapters — map the Settings trust-annex state onto the design-
 * system tones the DS surface composes. The backup/restore, cloud
 * sync, export, delete, Phase F, and density engines are untouched.
 * Settings is a Trust Annex (canon §4.20): calm utility, no pulling
 * cell, no "next move" — the surface reports trust state and offers
 * recovery moves.
 */

const STATUS_TONE: Record<CloudConnectionStatus, AccentRole> = {
    connected: "green",
    "no-credentials": "amber",
    "auth-missing": "amber",
    error: "red"
};
export function cloudTone(status: CloudConnectionStatus): AccentRole {
    return STATUS_TONE[status];
}

const STATUS_LABEL: Record<CloudConnectionStatus, string> = {
    connected: "Connected",
    "no-credentials": "Not configured",
    "auth-missing": "Signed out",
    error: "Error"
};
export function cloudStatusLabel(status: CloudConnectionStatus): string {
    return STATUS_LABEL[status];
}

/** Total cloud rows in scope across every noun table. */
export function totalCloudRows(): number {
    const c = cloudCounts.value;
    return (
        c.icps +
        c.deals +
        c.proofs +
        c.advisorDeployments +
        c.signalConsoleAccounts +
        c.sequences +
        c.discoveryCallLogs +
        c.studioArtifacts +
        c.pipelineSettings
    );
}
