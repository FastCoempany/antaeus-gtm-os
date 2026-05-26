import type { DataClient } from "@/lib/data-client";
import { reportError, trackEvent } from "@/lib/observability";
import {
    type CommercialProfile,
    profileToInsert,
    profileToUpdate,
    rowToProfile
} from "./commercial-profile";
import {
    commercialProfile,
    profileRowExists,
    setCommercialProfile,
    setProfileLoaded,
    setProfileRowExists
} from "../state";

/**
 * Commercial-profile cloud persistence (ADR-007).
 *
 * The workspace_profile table is one-row-per-workspace (PK is
 * workspace_id). Boot loads that row (RLS scopes to the operator's
 * workspace); saves upsert it. The room edits only the three
 * commercial fields — onboarding_* columns are owned by the
 * Onboarding room and never touched here.
 *
 * Every function catches + reports; nothing throws. A persistence
 * outage leaves the banner showing the last in-memory state.
 */

let clientRef: DataClient | null = null;
let workspaceIdRef: string | null = null;

/** Test-only — inject a stub client + workspace id. */
export function __setProfileDepsForTests(
    client: DataClient | null,
    workspaceId: string | null
): void {
    clientRef = client;
    workspaceIdRef = workspaceId;
}

export interface ProfileBootResult {
    readonly mode: "loaded" | "empty" | "offline";
}

/**
 * Boot-time load. Called once after first paint; does not block
 * render. Loads the workspace_profile row if present and populates
 * the editable signal. If no row exists yet, the banner stays empty
 * and the first save will insert.
 */
export async function bootProfile(
    client: DataClient
): Promise<ProfileBootResult> {
    clientRef = client;
    try {
        const workspace = await client.currentWorkspace();
        workspaceIdRef = workspace?.id ?? null;

        const rows = await client.workspaceProfile.list({ limit: 1 });
        if (rows.length > 0 && rows[0]) {
            setCommercialProfile(rowToProfile(rows[0]));
            setProfileRowExists(true);
            setProfileLoaded(true);
            // The PK is the workspace id; trust the row over
            // currentWorkspace() in case the latter was null.
            workspaceIdRef = rows[0].workspace_id ?? workspaceIdRef;
            trackEvent("icp_profile_boot", { mode: "loaded" });
            return { mode: "loaded" };
        }
        setProfileRowExists(false);
        setProfileLoaded(true);
        trackEvent("icp_profile_boot", { mode: "empty" });
        return { mode: "empty" };
    } catch (err) {
        reportError(err, { op: "icp-studio.bootProfile" });
        setProfileLoaded(true);
        return { mode: "offline" };
    }
}

/**
 * Persist the current commercial profile. Upserts: update when a row
 * already exists (patching only the three commercial fields, never
 * onboarding state), insert when it doesn't. Returns the saved
 * profile or the in-memory one on failure.
 */
export async function saveProfile(
    profile: CommercialProfile
): Promise<CommercialProfile> {
    if (!clientRef) return profile;
    try {
        if (profileRowExists.value && workspaceIdRef) {
            const row = await clientRef.workspaceProfile.update(
                workspaceIdRef,
                profileToUpdate(profile)
            );
            const saved = rowToProfile(row);
            setCommercialProfile(saved);
            trackEvent("icp_profile_save", { mode: "update" });
            return saved;
        }

        // Insert path — need the workspace id for the PK.
        let wsId = workspaceIdRef;
        if (!wsId) {
            const workspace = await clientRef.currentWorkspace();
            wsId = workspace?.id ?? null;
            workspaceIdRef = wsId;
        }
        if (!wsId) {
            // No workspace resolvable (offline / unauthenticated) —
            // keep the in-memory edit; next save retries.
            reportError(new Error("no workspace id for profile insert"), {
                op: "icp-studio.saveProfile"
            });
            return profile;
        }
        const row = await clientRef.workspaceProfile.insert(
            profileToInsert(wsId, profile)
        );
        const saved = rowToProfile(row);
        setCommercialProfile(saved);
        setProfileRowExists(true);
        trackEvent("icp_profile_save", { mode: "insert" });
        return saved;
    } catch (err) {
        reportError(err, { op: "icp-studio.saveProfile" });
        return profile;
    }
}

/** Read-only accessor for the in-memory profile (convenience for callers). */
export function currentProfile(): CommercialProfile {
    return commercialProfile.value;
}
