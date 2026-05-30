import { render } from "preact";
import { DiscoveryStudio } from "./DiscoveryStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import { loadFrameworksIntoRegistry } from "./lib/load-frameworks";
import { bootPersistence } from "./lib/persistence";
import { startCallLogPersistence } from "./lib/call-log";
import { focusedAccount } from "./state";

/**
 * Entry point for the Discovery Studio Preact rebuild.
 *
 * Served at /discovery-studio/ in dev + prod. Behind Posthog feature
 * flag `room_discovery_v2`. Wave 6 will wire the legacy `app/discovery-
 * studio/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. loadFrameworksIntoRegistry — read window.DISCOVERY_SEGMENT_RUNTIME
 *      (populated by the legacy <script> tags) into the typed registry
 *   3. render — Preact mounts; components read live signals
 *   4. bootPersistence (async) — load last session from Supabase or
 *      unpack the Phase 2.3 migration blob, seed signals, start
 *      auto-save. Persistence runs after first paint so the UI doesn't
 *      block on a slow round-trip.
 *
 * Persistence failures don't block the room — bootPersistence catches
 * everything and falls back to in-memory state.
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

// Phase 2.5 — read inbound cross-room handoff. Call Planner /
// Dashboard / Cold Call pass `?focusObject=<account>` (or `?account=`)
// telling Discovery which account this call is with. Surfaces in the
// kicker tail + propagates through outbound handoffs so Deal
// Workspace / Future Autopsy / Call Planner land focused.
const ctx = readContinuity();
const inboundParams =
    typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
const inboundAccount =
    ctx.focusObject ||
    (inboundParams ? inboundParams.get("account") : null) ||
    "";
if (inboundAccount) {
    focusedAccount.value = inboundAccount;
}

const flagOn = isFeatureEnabled("room_discovery_v2");
if (!flagOn) {
    console.info(
        "[discovery-studio] Feature flag room_discovery_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-4 are internal-test only)."
    );
}

render(<DiscoveryStudio />, root);

// Per-call log. Wired synchronously (no cloud round-trip — local
// localStorage) so a completed call commits even if cloud persistence
// is offline. The effect is idempotent and disposes-clean for tests.
startCallLogPersistence();

// Wave 4: kick off persistence after first paint. Don't block render
// on Supabase round-trip; if it fails, the room still works in-memory.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootPersistence(client);
    } catch (err) {
        // bootPersistence catches its own errors and reports via Sentry,
        // but a missing env var (Supabase URL/key) throws synchronously
        // from createDataClient. Catch + log so the room stays usable.
        console.warn(
            "[discovery-studio] Persistence layer disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
