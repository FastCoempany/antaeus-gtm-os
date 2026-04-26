import { render } from "preact";
import { Dashboard } from "./Dashboard";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { bootMode, setEngineInput } from "./state";
import { bootSnapshotAggregator } from "./lib/snapshot-aggregator";

/**
 * Entry point for the Dashboard Preact rebuild
 * (Phase 4 / Room 2 per ADR-001 §6).
 *
 * Served at /dashboard/ in dev + prod. Behind Posthog feature flag
 * `room_dashboard_v2`. Wave 6 will wire the legacy
 * `app/dashboard/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. bootMode — read URL ?mode= → localStorage → default into
 *      commandMode signal before first render so SSR/hydration cost
 *      is zero
 *   3. render — Preact mounts; placeholder views show empty state
 *      until Wave 2's ranking engine + Wave 5's snapshot aggregator
 *      land
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

bootMode();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Dashboard could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_dashboard_v2");
if (!flagOn) {
    console.info(
        "[dashboard] Feature flag room_dashboard_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<Dashboard />, root);

// Wave 5 — start the cross-room snapshot aggregator after first
// paint. It seeds engineInput synchronously (initial read) then
// listens for storage events + a 10s visibility-aware refresh.
bootSnapshotAggregator({
    onUpdate: (input) => {
        setEngineInput(input);
    }
});
