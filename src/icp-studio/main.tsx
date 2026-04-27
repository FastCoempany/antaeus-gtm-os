import { render } from "preact";
import { IcpStudio } from "./IcpStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the ICP Studio Preact rebuild
 * (Phase 4 / Room 11 per ADR-001 §6).
 *
 * Served at /icp-studio/ in dev + prod. Behind Posthog feature flag
 * `room_icp_studio_v2`. Wave 6 wires the legacy
 * `app/icp-studio/index.html` flag-redirect.
 *
 * Boot order (Wave 1):
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts
 *
 * Wave 4 will seed savedIcps + totalWorked from
 * `gtmos_icp_analytics`. Wave 5 will publish ICP match scoring to
 * downstream rooms (Territory / Sourcing / Signal Console / Outbound
 * / Discovery / Readiness / Handoff).
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

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

render(<IcpStudio />, root);
