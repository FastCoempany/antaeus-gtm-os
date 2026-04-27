import { render } from "preact";
import { OutboundStudio } from "./OutboundStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the Outbound Studio Preact rebuild
 * (Phase 4 / Room 6 per ADR-001 §6).
 *
 * Served at /outbound-studio/ in dev + prod. Behind Posthog feature
 * flag `room_outbound_studio_v2`. Wave 6 will wire the legacy
 * `app/outbound-studio/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; Wave 1 renders empty state until
 *      Wave 4 wires persistence + Wave 5 wires URL inbound + handoff
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Outbound Studio could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_outbound_studio_v2");
if (!flagOn) {
    console.info(
        "[outbound-studio] Feature flag room_outbound_studio_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<OutboundStudio />, root);
