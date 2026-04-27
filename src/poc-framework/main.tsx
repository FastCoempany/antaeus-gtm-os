import { render } from "preact";
import { PocFramework } from "./PocFramework";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the PoC Framework Preact rebuild
 * (Phase 4 / Room 5 per ADR-001 §6).
 *
 * Served at /poc-framework/ in dev + prod. Behind Posthog feature
 * flag `room_poc_framework_v2`. Wave 6 will wire the legacy
 * `app/poc-framework/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; Wave 1 renders empty state until
 *      Wave 4 wires persistence + Wave 5 wires deal sync
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "PoC Framework could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_poc_framework_v2");
if (!flagOn) {
    console.info(
        "[poc-framework] Feature flag room_poc_framework_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<PocFramework />, root);
