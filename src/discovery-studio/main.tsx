import { render } from "preact";
import { DiscoveryStudio } from "./DiscoveryStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the Discovery Studio Preact rebuild.
 *
 * Served at /discovery-studio/ in dev + prod (Vite multi-entry; the
 * flattenSrcPages plugin in vite.config.ts moves it from
 * dist/src/discovery-studio/ to dist/discovery-studio/).
 *
 * Behind Posthog feature flag `room_discovery_v2`. The legacy
 * `app/discovery-studio/index.html` redirects here when the flag is
 * on (Wave 6 wires the redirect script).
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 3
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Discovery Studio could not mount: #app root element missing from index.html"
    );
}

// Boot-time flag check is informational for now — Wave 6 enforces it via
// the legacy redirect. If a user lands here without the flag (e.g. by
// typing the URL directly), we still render the new room; the flag is
// the cutover gate, not an access gate.
const flagOn = isFeatureEnabled("room_discovery_v2");
if (!flagOn) {
    console.info(
        "[discovery-studio] Feature flag room_discovery_v2 is OFF for this user. " +
            "Rendering anyway (Wave 1 is internal-test only)."
    );
}

render(<DiscoveryStudio />, root);
