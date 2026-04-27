import { render } from "preact";
import { ColdCallStudio } from "./ColdCallStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the Cold Call Studio Preact rebuild
 * (Phase 4 / Room 7 per ADR-001 §6).
 *
 * Served at /cold-call-studio/ in dev + prod. Behind Posthog feature
 * flag `room_cold_call_v2`. Wave 6 will wire the legacy
 * `app/cold-call-studio/index.html` flag-redirect.
 *
 * Boot order (Wave 1):
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; Wave 1 renders the empty layout
 *
 * Subsequent waves seed account options (Wave 5), the call log
 * (Wave 4), and honor URL inbound params (Wave 5).
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Cold Call Studio could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_cold_call_v2");
if (!flagOn) {
    console.info(
        "[cold-call-studio] Feature flag room_cold_call_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<ColdCallStudio />, root);
