import { render } from "preact";
import { computed } from "@preact/signals";
import { DealWorkspace } from "./DealWorkspace";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { readContinuity } from "@/lib/continuity";
import { createDataClient } from "@/lib/data-client";
import { startUnsavedGuard } from "@/lib/unsaved-guard";
import { bootPersistence, loadFromLegacyMirror } from "./lib/persistence";
import { allDeals, editingDeal, openDealEditor } from "./state";

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

// Unsaved-changes guard — fire beforeunload while the inline deal-
// health form is open (editingDeal !== null). The form's draft state
// lives inside the DealHealthForm component, so we can't observe
// exact field-level dirtiness from here; "editor open" is a safe
// approximation that prevents accidental nav-away mid-edit.
const editorOpen = computed(() => editingDeal.value !== null);
startUnsavedGuard(editorOpen, "Deal Workspace");

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
        // Phase 2.6 — when env-missing throws BEFORE bootPersistence
        // runs, the in-loadDeals fallback never fires. Seed from the
        // legacy mirror here so demo + dev walks populate the room.
        loadFromLegacyMirror();
    }

    // Cross-room handoff: if a caller passed `?focusObject=` (or
    // `?deal=` historically), auto-open the deal-health modal once
    // deals have loaded. Match by id first, then by case-insensitive
    // accountName so PoC / Future Autopsy / Advisor handoffs all work
    // (some thread the deal id, others thread the account name).
    const ctx = readContinuity();
    const focus = ctx.focusObject;
    if (focus) {
        const lower = focus.toLowerCase();
        const match = allDeals.value.find(
            (d) =>
                d.id === focus ||
                d.accountName.toLowerCase() === lower
        );
        if (match) openDealEditor(match);
    }
})();
