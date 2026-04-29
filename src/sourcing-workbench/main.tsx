import { render } from "preact";
import { SourcingWorkbench } from "./SourcingWorkbench";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import {
    patchProspectDraft,
    setProspects,
    setQueryCards,
    startPersistence
} from "./state";
import { loadProspects, loadQueryCards } from "./lib/persistence";
import { readInboundAccount } from "./lib/handoff";
import { bootCloudPersistence } from "./lib/cloud-persistence";
import { notifyBootResult } from "@/lib/cloud-sync-notify";
import { bootRetryAutoFlush } from "@/lib/cloud-sync-queue";

/**
 * Entry point for the Sourcing Workbench Preact rebuild
 * (Phase 4 / Room 13 per ADR-001 §6).
 *
 * Served at /sourcing-workbench/ in dev + prod. Behind Posthog feature
 * flag `room_sourcing_workbench_v2`. The legacy
 * `app/sourcing-workbench/index.html` flag-redirect is wired in the
 * same wave as this boot file.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed query cards + prospects from localStorage
 *   3. honor `?account=` URL inbound by patching the prospect draft
 *   4. start persistence (mirrors writes back)
 *   5. render
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Sourcing Workbench could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_sourcing_workbench_v2");
if (!flagOn) {
    console.info(
        "[sourcing-workbench] Feature flag room_sourcing_workbench_v2 is OFF. " +
            "Rendering anyway for internal preview."
    );
}

setQueryCards(loadQueryCards());
setProspects(loadProspects());

const inboundAccount = readInboundAccount(window.location.search);
if (inboundAccount) {
    patchProspectDraft({ accountName: inboundAccount });
}

startPersistence();

render(<SourcingWorkbench />, root);

// Async cloud load. Doesn't block first paint.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        const result = await bootCloudPersistence(client);
        const total = result.queryCardsCount + result.prospectsCount;
        notifyBootResult(
            { room: "Sourcing Workbench", rowCount: total },
            result
        );
        bootRetryAutoFlush(() => createDataClient());
    } catch (err) {
        console.warn(
            "[sourcing-workbench] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
