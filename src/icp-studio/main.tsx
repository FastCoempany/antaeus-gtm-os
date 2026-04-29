import { render } from "preact";
import { IcpStudio } from "./IcpStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import {
    patchDraft,
    setSavedIcps,
    setTotalWorked,
    startAnalyticsPersistence
} from "./state";
import { loadAnalytics } from "./lib/persistence";
import { bootCloudPersistence } from "./lib/cloud-persistence";
import { notifyBootResult } from "@/lib/cloud-sync-notify";
import { bootRetryAutoFlush } from "@/lib/cloud-sync-queue";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "ICP Studio could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_icp_studio_v2");
if (!flagOn) {
    console.info(
        "[icp-studio] Feature flag room_icp_studio_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

// Step 1 — synchronous seed from localStorage so the room renders
// instantly with the operator's last-known ICP library instead of
// flashing an empty state. This is the OFFLINE FALLBACK; cloud load
// below replaces it once Supabase resolves.
const seed = loadAnalytics();
setSavedIcps(seed.icps);
setTotalWorked(seed.totalWorked);
startAnalyticsPersistence();

// Cross-room handoff: if a caller passed `?focusObject=<industry>`,
// pre-fill the industry-custom field so the operator lands with
// their thesis already partially shaped.
const ctx = readContinuity();
if (ctx.focusObject) {
    patchDraft({ industry: "custom", industryCustom: ctx.focusObject });
}

render(<IcpStudio />, root);

// Step 2 — async cloud load. Doesn't block first paint. If cloud has
// rows, replace local state (cloud is canonical). If cloud is empty
// AND localStorage seeded data, push the seed up (one-time migration).
// If Supabase env vars are missing or the network is hostile, the
// room stays usable with whatever localStorage seeded — no degradation,
// just no cross-device sync until the next session retries.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        const result = await bootCloudPersistence(client);
        notifyBootResult(
            { room: "ICP Studio", rowCount: result.icpCount },
            result
        );
        // Wire the offline retry queue: on online / visibilitychange /
        // every 30s, flush any saves that failed during a hostile-network
        // window. Idempotent; safe to call once per page load.
        bootRetryAutoFlush(() => createDataClient());
    } catch (err) {
        console.warn(
            "[icp-studio] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
