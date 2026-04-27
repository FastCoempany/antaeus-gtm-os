import { render } from "preact";
import { CallPlanner } from "./CallPlanner";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the Call Planner Preact rebuild
 * (Phase 4 / Room 9 per ADR-001 §6).
 *
 * Served at /call-planner/ in dev + prod. Behind Posthog feature flag
 * `room_call_planner_v2`. Wave 6 wires the legacy
 * `app/discovery-agenda/index.html` flag-redirect (note the legacy
 * path differs from the canonical room name per canon §4.11).
 *
 * Boot order (Wave 1):
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts the placeholder layout
 *
 * Subsequent waves seed the account + deal options (Wave 5), wire
 * persistence (Wave 4), and honor URL inbound (Wave 5).
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Call Planner could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_call_planner_v2");
if (!flagOn) {
    console.info(
        "[call-planner] Feature flag room_call_planner_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<CallPlanner />, root);
