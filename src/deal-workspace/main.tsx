import { render } from "preact";
import { DealWorkspace } from "./DealWorkspace";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the Deal Workspace Preact rebuild (Phase 4).
 *
 * Served at /deal-workspace/ in dev + prod. Behind Posthog feature flag
 * `room_deal_workspace_v2`. Wave 6 will wire the legacy `app/deal-
 * workspace/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; components read live signals
 *   3. (Wave 4) bootPersistence — load deals from Supabase, subscribe
 *      to realtime updates, debounced auto-save on signal changes
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 4
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Deal Workspace could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_deal_workspace_v2");
if (!flagOn) {
    console.info(
        "[deal-workspace] Feature flag room_deal_workspace_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<DealWorkspace />, root);
