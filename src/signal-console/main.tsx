import { render } from "preact";
import { SignalConsole } from "./SignalConsole";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the Signal Console Preact rebuild
 * (Phase 4 / Room 3 per ADR-001 §6).
 *
 * Served at /signal-console/ in dev + prod. Behind Posthog feature
 * flag `room_signal_console_v2`. Wave 6 will wire the legacy
 * `app/signal-console/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; Wave 1 renders empty state
 *   3. (Wave 4 will boot persistence — read gtmos_sc_v4, seed
 *      allAccounts signal, publish gtmos_signal_room_health)
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Signal Console could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_signal_console_v2");
if (!flagOn) {
    console.info(
        "[signal-console] Feature flag room_signal_console_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<SignalConsole />, root);
