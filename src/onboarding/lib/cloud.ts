import type { DataClient } from "@/lib/data-client";
import type { Json } from "@/lib/database-helpers";
import { reportError, trackEvent } from "@/lib/observability";
import { buildOnboardingAnswers } from "./seed";
import type { OnboardingDraft } from "./types";

/**
 * Onboarding cloud persistence (ADR-007).
 *
 * Onboarding completion + answers are a workspace-level fact. Before
 * ADR-007 they lived only in localStorage (`gtmos_onboarding`), so a
 * user who onboarded on one device was re-onboarded on the next. This
 * module mirrors completion to the `workspace_profile` table
 * (onboarding_completed + onboarding_answers columns) so it persists
 * cross-device.
 *
 * Single source of truth (ADR-007): this writes ONLY the two
 * onboarding columns. It never touches product_category / value_prop —
 * those are owned by ICP Studio's commercial-profile surface. The
 * workspace_profile row is shared; each owner patches only its own
 * fields, so neither clobbers the other.
 *
 * Every function catches + reports; nothing throws. A persistence
 * outage leaves the localStorage seed (still written synchronously by
 * seedFromDraft) as the fallback.
 */

/**
 * Mirror onboarding completion to workspace_profile. Upserts: updates
 * the onboarding columns when a row already exists (e.g. ICP Studio
 * created it for the commercial profile), inserts a new row with the
 * workspace_id PK otherwise.
 */
export async function persistOnboardingToCloud(
    client: DataClient,
    draft: OnboardingDraft,
    opts: { now?: number } = {}
): Promise<{ persisted: boolean }> {
    try {
        const answers = buildOnboardingAnswers(draft) as Json;
        const rows = await client.workspaceProfile.list({ limit: 1 });
        if (rows.length > 0 && rows[0]) {
            await client.workspaceProfile.update(rows[0].workspace_id, {
                onboarding_completed: true,
                onboarding_answers: answers
            });
            trackEvent("onboarding_cloud_persist", { mode: "update" });
            return { persisted: true };
        }
        const workspace = await client.currentWorkspace();
        const wsId = workspace?.id ?? null;
        if (!wsId) {
            reportError(
                new Error("no workspace id for onboarding cloud persist"),
                { op: "onboarding.persistOnboardingToCloud" }
            );
            return { persisted: false };
        }
        await client.workspaceProfile.insert({
            workspace_id: wsId,
            onboarding_completed: true,
            onboarding_answers: answers
        });
        void opts.now;
        trackEvent("onboarding_cloud_persist", { mode: "insert" });
        return { persisted: true };
    } catch (err) {
        reportError(err, { op: "onboarding.persistOnboardingToCloud" });
        return { persisted: false };
    }
}

/**
 * Read whether this workspace has already completed onboarding in the
 * cloud. Used by the boot gate to catch the cross-device case: a fresh
 * device whose localStorage doesn't yet know the user onboarded
 * elsewhere. Returns false on any error (fail open — never trap a user
 * out of onboarding because a read failed).
 */
export async function isOnboardingCompleteInCloud(
    client: DataClient
): Promise<boolean> {
    try {
        const rows = await client.workspaceProfile.list({ limit: 1 });
        return rows.length > 0 && rows[0]?.onboarding_completed === true;
    } catch (err) {
        reportError(err, { op: "onboarding.isOnboardingCompleteInCloud" });
        return false;
    }
}
