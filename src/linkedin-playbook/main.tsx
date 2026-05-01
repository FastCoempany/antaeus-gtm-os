import { render } from "preact";
import { LinkedinPlaybook } from "./LinkedinPlaybook";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import {
    patchDraft,
    setActions,
    setBestIcp,
    setHottestAccount,
    setLatestTouch,
    startActionsPersistence
} from "./state";
import { loadActions } from "./lib/persistence";
import {
    loadBestIcp,
    loadHottestAccount,
    loadLatestTouch
} from "./lib/context";
import { readInboundAccount } from "./lib/handoff";
import { bootCloudPersistence } from "./lib/cloud-persistence";
import { notifyBootResult } from "@/lib/cloud-sync-notify";
import { bootRetryAutoFlush } from "@/lib/cloud-sync-queue";

/**
 * Entry point for the LinkedIn Playbook Preact rebuild
 * (Phase 4 / Room 8 per ADR-001 §6).
 *
 * Served at /linkedin-playbook/ in dev + prod. Behind Posthog feature
 * flag `room_linkedin_playbook_v2`. Wave 6 wires the legacy
 * `app/linkedin-playbook/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed action log from `gtmos_linkedin_log`
 *   3. start the actions persistence loop (mirrors writes back)
 *   4. render — Preact mounts the live booth + ledger
 *
 * Wave 5 adds the inbound cross-room context loaders + URL `?account=`
 * pickup.
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "LinkedIn Playbook could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_linkedin_playbook_v2");
if (!flagOn) {
    console.info(
        "[linkedin-playbook] Feature flag room_linkedin_playbook_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

setActions(loadActions());

// Wave 5 — seed the inbound cross-room context. Each loader reads a
// specific Phase 4 mirror key (gtmos_icp_analytics / gtmos_sc_v4 /
// gtmos_outbound_touches) and is defensively null-safe; missing keys
// just leave the corresponding signal at null.
setBestIcp(loadBestIcp());
setHottestAccount(loadHottestAccount());
setLatestTouch(loadLatestTouch());

// Wave 5 — honor URL inbound. If `?account=` (or fallback `?focusObject=`)
// is set, pre-fill the ledger draft so the rep can log a cue against
// that account in one motion.
const inbound = readInboundAccount();
if (inbound) patchDraft({ accountName: inbound });

startActionsPersistence();

render(<LinkedinPlaybook />, root);

// Async cloud load for action history. Doesn't block first paint.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        const result = await bootCloudPersistence(client);
        notifyBootResult(
            { room: "LinkedIn Playbook", rowCount: result.actionCount },
            result
        );
        bootRetryAutoFlush(() => createDataClient());
    } catch (err) {
        console.warn(
            "[linkedin-playbook] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
