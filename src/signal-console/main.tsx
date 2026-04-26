import { render } from "preact";
import { SignalConsole } from "./SignalConsole";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { setAllAccounts, startExternalPublishing } from "./state";
import { loadAccounts } from "./lib/persistence";
import { publishHealthSnapshot } from "./lib/health-snapshot";

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

// Seed from gtmos_sc_v4 (legacy localStorage) before first render so
// the grid renders with data instead of flashing the empty state.
const seeded = loadAccounts();
setAllAccounts(seeded);

// Publish the health snapshot once on boot so Dashboard's aggregator
// has fresh data even before the first edit.
publishHealthSnapshot(seeded);

// Wire the auto-publish loop: every subsequent allAccounts mutation
// dual-writes to gtmos_sc_v4 + gtmos_signal_room_health.
startExternalPublishing();

render(<SignalConsole />, root);
