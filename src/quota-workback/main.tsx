import { render } from "preact";
import { QuotaWorkback } from "./QuotaWorkback";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { setCoverage, setInputs, startPersistence } from "./state";
import { loadInputs } from "./lib/persistence";
import { computeCoverage } from "./lib/coverage";

/**
 * Entry point for the Quota Workback Preact rebuild
 * (Phase 4 / Room 14 per ADR-001 §6).
 *
 * Served at /quota-workback/ in dev + prod. Behind Posthog feature
 * flag `room_quota_workback_v2`.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed inputs from gtmos_qw_inputs (or gtmos_outbound_seed fallback)
 *   3. compute live coverage from gtmos_deal_workspaces
 *   4. start the persistence effect (mirrors writes back)
 *   5. render
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Quota Workback could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_quota_workback_v2");
if (!flagOn) {
    console.info(
        "[quota-workback] Feature flag room_quota_workback_v2 is OFF. " +
            "Rendering anyway for internal preview."
    );
}

const seeded = loadInputs();
setInputs(seeded);
setCoverage(computeCoverage(seeded.quota));

startPersistence();

render(<QuotaWorkback />, root);
