import { isFeatureEnabled } from "./observability";

/**
 * Centralized feature-flag keys for the Phase 4.5 data-layer parity work
 * (ADR-005). Catches typos at the call site + provides a single place to
 * see every parity flag that exists.
 *
 * Convention:
 *   <room>_data_parity_write — Step 3 dual-write gate
 *   <room>_data_parity_read  — Step 4 flip-read gate
 *
 * Both per-room flags retire at Step 5 (drop legacy). The master umbrella
 * `data_layer_parity_complete` flag stays off until every room's Step 5
 * has merged; flipping it on causes code paths that still read the
 * 2026-04-24 migration blob to error loudly.
 */

// ─── Master umbrella flag ───────────────────────────────────────────────

export const DATA_LAYER_PARITY_COMPLETE = "data_layer_parity_complete";

/**
 * Returns true when every Phase 4.5 room retrofit has hit Step 5 and the
 * master umbrella flag has been flipped on in Posthog. Until then, code
 * paths that still need the 2026-04-24 migration blob as a fallback are
 * permitted; after, those paths should error loudly so we catch missed
 * migrations.
 */
export function isDataLayerParityComplete(): boolean {
    return isFeatureEnabled(DATA_LAYER_PARITY_COMPLETE);
}

// ─── Per-room flag keys ─────────────────────────────────────────────────

export const DATA_PARITY_FLAGS = {
    signalConsole: {
        write: "signal_console_data_parity_write",
        read: "signal_console_data_parity_read"
    },
    dealWorkspace: {
        write: "deal_workspace_data_parity_write",
        read: "deal_workspace_data_parity_read"
    },
    outboundStudio: {
        write: "outbound_studio_data_parity_write",
        read: "outbound_studio_data_parity_read"
    },
    discoveryStudio: {
        write: "discovery_studio_data_parity_write",
        read: "discovery_studio_data_parity_read"
    },
    pocFramework: {
        write: "poc_framework_data_parity_write",
        read: "poc_framework_data_parity_read"
    },
    coldCallStudio: {
        write: "cold_call_studio_data_parity_write",
        read: "cold_call_studio_data_parity_read"
    },
    linkedinPlaybook: {
        write: "linkedin_playbook_data_parity_write",
        read: "linkedin_playbook_data_parity_read"
    },
    icpStudio: {
        write: "icp_studio_data_parity_write",
        read: "icp_studio_data_parity_read"
    },
    territoryArchitect: {
        write: "territory_architect_data_parity_write",
        read: "territory_architect_data_parity_read"
    },
    sourcingWorkbench: {
        write: "sourcing_workbench_data_parity_write",
        read: "sourcing_workbench_data_parity_read"
    },
    callPlanner: {
        write: "call_planner_data_parity_write",
        read: "call_planner_data_parity_read"
    },
    advisorDeploy: {
        write: "advisor_deploy_data_parity_write",
        read: "advisor_deploy_data_parity_read"
    },
    futureAutopsy: {
        write: "future_autopsy_data_parity_write",
        read: "future_autopsy_data_parity_read"
    },
    quotaWorkback: {
        write: "quota_workback_data_parity_write",
        read: "quota_workback_data_parity_read"
    },
    welcome: {
        write: "welcome_data_parity_write",
        read: "welcome_data_parity_read"
    },
    onboarding: {
        write: "onboarding_data_parity_write",
        read: "onboarding_data_parity_read"
    },
    settings: {
        write: "settings_data_parity_write",
        read: "settings_data_parity_read"
    }
} as const;

export type RoomParityFlagKey = keyof typeof DATA_PARITY_FLAGS;

/**
 * Returns true when the given room's Step 3 (dual-write) gate is open. When
 * false, the room continues to write only to localStorage.
 */
export function isRoomParityWriteEnabled(room: RoomParityFlagKey): boolean {
    return isFeatureEnabled(DATA_PARITY_FLAGS[room].write);
}

/**
 * Returns true when the given room's Step 4 (flip-read) gate is open. When
 * false, the room continues to read primarily from localStorage. When true,
 * the room reads from Supabase first with localStorage as a fallback for
 * rows that haven't been backfilled yet.
 */
export function isRoomParityReadEnabled(room: RoomParityFlagKey): boolean {
    return isFeatureEnabled(DATA_PARITY_FLAGS[room].read);
}
