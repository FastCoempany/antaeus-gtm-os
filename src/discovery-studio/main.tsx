import { render } from "preact";
import { DiscoveryStudio } from "./DiscoveryStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { loadFrameworksIntoRegistry } from "./lib/load-frameworks";

/**
 * Entry point for the Discovery Studio Preact rebuild.
 *
 * Served at /discovery-studio/ in dev + prod. Behind Posthog feature
 * flag `room_discovery_v2`. Wave 6 will wire the legacy `app/discovery-
 * studio/index.html` flag-redirect; for now the room is reachable at
 * its URL even without the flag (Wave 1+2 are internal-test only).
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. loadFrameworksIntoRegistry — read window.DISCOVERY_SEGMENT_RUNTIME
 *      which the legacy <script> tags in index.html populated. Project
 *      into the typed Framework[] and push into the signal.
 *   3. render — Preact mounts; components read live signals.
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

const loaded = loadFrameworksIntoRegistry();
console.info(
    `[discovery-studio] Loaded ${loaded} framework(s) from window.DISCOVERY_SEGMENT_RUNTIME`
);

const flagOn = isFeatureEnabled("room_discovery_v2");
if (!flagOn) {
    console.info(
        "[discovery-studio] Feature flag room_discovery_v2 is OFF for this user. " +
            "Rendering anyway (Wave 1/2 are internal-test only)."
    );
}

render(<DiscoveryStudio />, root);
