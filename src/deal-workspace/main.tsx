import { render } from "preact";
import { DealWorkspace } from "./DealWorkspace";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { bootPersistence } from "./lib/persistence";

/**
 * Entry point for the Deal Workspace Preact rebuild (Phase 4).
 *
 * Served at /deal-workspace/ in dev + prod. Behind Posthog feature flag
 * `room_deal_workspace_v2`. Wave 6 will wire the legacy `app/deal-
 * workspace/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; components read live signals (initially
 *      empty, showing the empty-state copy)
 *   3. bootPersistence (async) — load deals from Supabase, parse any
 *      Phase 2.3 migration blob, seed signals. Failures don't block
 *      render; the room stays usable in-memory.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 4
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Deal Workspace could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_deal_workspace_v2");
if (!flagOn) {
    console.info(
        "[deal-workspace] Feature flag room_deal_workspace_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<DealWorkspace />, root);

// Wave 2: kick off persistence after first paint. Don't block render
// on Supabase round-trip — the room shows empty state until deals load.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootPersistence(client);
    } catch (err) {
        // bootPersistence catches its own errors and reports via Sentry,
        // but a missing env var (Supabase URL/key) throws synchronously
        // from createDataClient. Catch + log so the room stays usable.
        console.warn(
            "[deal-workspace] Persistence layer disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
