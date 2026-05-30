import { render } from "preact";
import { Dashboard } from "./Dashboard";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import {
    bootMode,
    openReadinessDrawer,
    setEngineInput,
    setReadinessInput
} from "./state";
import { bootSnapshotAggregator } from "./lib/snapshot-aggregator";
import { aggregateReadinessInput } from "./lib/readiness-aggregator";
import { bootReadinessHistory } from "./lib/readiness-history";
import { warmUpMissingSnapshots } from "./lib/snapshot-warmup";

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

// Self-heal missing snapshot keys before the aggregator's first read.
// Covers the demo-seed lane (raw nouns landed but sibling rooms
// never booted to publish their snapshots) and cross-tab cold starts.
warmUpMissingSnapshots();

// Wave 5 — start the cross-room snapshot aggregator after first
// paint. It seeds engineInput synchronously (initial read) then
// listens for storage events + a 10s visibility-aware refresh.
bootSnapshotAggregator({
    onUpdate: (input) => {
        setEngineInput(input);
    }
});

// Phase 5.A Wave 3 — readiness aggregator. Reads cloud-mirrored
// localStorage from every cloud-synced room and builds a
// ReadinessInput. Seeds once synchronously; refreshes on the same
// storage events the snapshot aggregator listens to.
setReadinessInput(aggregateReadinessInput());
if (typeof window !== "undefined") {
    window.addEventListener("storage", () => {
        setReadinessInput(aggregateReadinessInput());
    });
    // Same-tab updates from sibling rooms fire on visibilitychange too,
    // because the user typically returns to the Dashboard tab.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            setReadinessInput(aggregateReadinessInput());
        }
    });
}

// Phase 5.A Wave 3 — verdict-history persister. Subscribes to the
// readiness summary signal; writes a row to readiness_snapshots
// (cloud) on every verdict transition. Idempotent: skips no-op
// transitions and re-runs.
bootReadinessHistory();

// Phase 5.A Wave 4 — `?readiness=1` URL hint auto-opens the drawer.
// Used by the legacy /app/readiness/ redirect stub so old bookmarks
// land on the Dashboard with the verdict surface already open.
try {
    if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("readiness") === "1") {
            openReadinessDrawer();
        }
    }
} catch {
    // ignore URL parse errors
}
