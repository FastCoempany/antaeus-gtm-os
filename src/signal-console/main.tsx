import { render } from "preact";
import { SignalConsole } from "./SignalConsole";
import { SignalConsoleDS } from "./ds/SignalConsoleDS";
import { SignalConsoleV4 } from "./v4/SignalConsoleV4";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/signal-console-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import {
    inboundFocus,
    selectAccount,
    setAllAccounts,
    startExternalPublishing
} from "./state";
import { loadAccounts } from "./lib/persistence";
import { bootCloudPersistence, saveAccount } from "./lib/cloud-persistence";
import { publishHealthSnapshot } from "./lib/health-snapshot";
import { buildManualAccount, allAccounts } from "./state";
import { clearInboundQueue, readInboundQueue } from "./lib/inbound-queue";

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
    if (matched) {
        selectAccount(matched.id);
    } else {
        // Phase 2.3 — no matching account yet. Stash the inbound
        // focus so AccountGrid's empty-state surface can show what
        // ICP the radar is targeting against.
        inboundFocus.value = focus;
    }
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

// Design-system migration (canon §6, radiation order: Signal Console
// after the Dashboard). The DS surface composes the component library;
// the existing room renders otherwise. The engine + state + cloud layer
// below are shared and unchanged. `?ds=1` is a preview escape-hatch
// (mirrors ?demo=1 / ?qa=1) so the surface can be previewed without the
// Posthog flag.
const dsParam = (() => {
    try {
        return new URLSearchParams(window.location.search).get("ds");
    } catch {
        return null;
    }
})();
let useDsSurface: boolean;
if (dsParam === "1") {
    useDsSurface = true;
} else if (dsParam === "0") {
    useDsSurface = false;
} else {
    // Default to the new design-system surface; the legacy surface is the
    // safety net, reachable by flipping room_signal_console_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_signal_console_legacy");
}

// 2026-07 wire-up (canon §4.7) — the Attention Router is the production
// Signal Console. Default on; room_signal_console_v4_off is the
// kill-switch back to the DS surface. ?v4=0 previews the DS surface.
const v4Param = (() => {
    try {
        return new URLSearchParams(window.location.search).get("v4");
    } catch {
        return null;
    }
})();
const useV4 =
    v4Param === "1" ||
    (v4Param !== "0" && !isFeatureEnabled("room_signal_console_v4_off"));
render(
    useV4 ? <SignalConsoleV4 /> : useDsSurface ? <SignalConsoleDS /> : <SignalConsole />,
    root
);

// Boot the density gradient so the DS surface's primitives render at
// the workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Step 3 — async cloud load. Doesn't block first paint. If the
// cloud has rows, replace local state (cloud is canonical). If the
// cloud is empty AND localStorage seeded data, push the seed up
// (one-time migration). If Supabase env vars are missing or the
// network is hostile, the room stays usable with whatever
// localStorage seeded — no degradation, just no cross-device sync
// until the next session retries.
void (async (): Promise<void> => {
    let cloudMode: string | null = null;
    try {
        const client = createDataClient();
        const boot = await bootCloudPersistence(client);
        cloudMode = boot.mode;
    } catch (err) {
        // Synchronous throw from createDataClient (env-var missing) —
        // surface a plain warning, not a Sentry report, since this is
        // expected in dev without Supabase configured.
        console.warn(
            "[signal-console] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
    // Drain the cross-room inbound queue (Prospecting Desk sends land
    // here). Runs AFTER cloud boot so the new accounts survive the
    // cloud-replaces-local step, and goes through saveAccount so each
    // one persists to the cloud + mirror through the canonical path.
    // Skip when the cloud list FAILED ("local-only" with a live client)
    // — draining then could insert cloud duplicates of accounts the
    // cloud already has; the queue simply waits for the next clean boot.
    if (cloudMode === "local-only") return;
    try {
        const queue = readInboundQueue();
        if (queue.length > 0) {
            const existing = new Set(
                allAccounts.value.map((a) => a.name.toLowerCase())
            );
            for (const entry of queue) {
                if (existing.has(entry.name.toLowerCase())) continue;
                const account = buildManualAccount({
                    name: entry.name,
                    industry: entry.industry,
                    notes: entry.note
                });
                await saveAccount(account);
                existing.add(entry.name.toLowerCase());
            }
            clearInboundQueue();
        }
    } catch (err) {
        console.warn(
            "[signal-console] Inbound queue drain failed:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
