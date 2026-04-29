import { render } from "preact";
import { SignalConsole } from "./SignalConsole";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import {
    selectAccount,
    setAllAccounts,
    startExternalPublishing
} from "./state";
import { loadAccounts } from "./lib/persistence";
import { bootCloudPersistence } from "./lib/cloud-persistence";
import { publishHealthSnapshot } from "./lib/health-snapshot";
import { notifyBootResult } from "@/lib/cloud-sync-notify";

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

// Step 1 — synchronous seed from localStorage so the grid renders
// instantly with the operator's last-known accounts instead of
// flashing an empty state. This is the OFFLINE FALLBACK; cloud
// load below replaces it once Supabase resolves.
const seeded = loadAccounts();
setAllAccounts(seeded);

// Honor cross-room handoff: if a caller passed `?account=Acme` or
// `?focusObject=Acme`, auto-select that account so the operator
// lands on the focused card instead of the default top-of-grid.
// Match by id first, then by case-insensitive name.
const ctx = readContinuity();
const focus = ctx.focusObject;
if (focus) {
    const lower = focus.toLowerCase();
    const matched = seeded.find(
        (a) => a.id === focus || a.name.toLowerCase() === lower
    );
    if (matched) selectAccount(matched.id);
}

// Publish the health snapshot once on boot so Dashboard's aggregator
// has fresh data even before the first edit.
publishHealthSnapshot(seeded);

// Step 2 — wire the legacy mirror: every subsequent allAccounts
// mutation dual-writes to gtmos_sc_v4 + gtmos_signal_room_health.
// Legacy consumers (Dashboard's command-intelligence rail, Outbound
// Studio's persona match, Welcome's anchor count) keep working
// transparently throughout the cloud-sync rollout.
startExternalPublishing();

render(<SignalConsole />, root);

// Step 3 — async cloud load. Doesn't block first paint. If the
// cloud has rows, replace local state (cloud is canonical). If the
// cloud is empty AND localStorage seeded data, push the seed up
// (one-time migration). If Supabase env vars are missing or the
// network is hostile, the room stays usable with whatever
// localStorage seeded — no degradation, just no cross-device sync
// until the next session retries.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        const result = await bootCloudPersistence(client);
        notifyBootResult(
            { room: "Signal Console", rowCount: result.accountCount },
            result
        );
    } catch (err) {
        // Synchronous throw from createDataClient (env-var missing) —
        // surface a plain warning, not a Sentry report, since this is
        // expected in dev without Supabase configured.
        console.warn(
            "[signal-console] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
