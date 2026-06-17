import { render } from "preact";
import { FutureAutopsy } from "./FutureAutopsy";
import { FutureAutopsyDS } from "./ds/FutureAutopsyDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/future-autopsy-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import {
    selectDeal,
    setAllVitals,
    setTaskLog,
    startTaskLogPersistence
} from "./state";
import { loadDealsFromMirror } from "./lib/deal-loader";
import { computeVitalsForAll } from "./lib/vitals";
import { loadTaskLog } from "./lib/task-log";
import { bootCloudPersistence } from "./lib/cloud-persistence";
import { startAutopsySnapshotPersistence } from "./lib/autopsy-snapshot";

/**
 * Entry point for the Future Autopsy Preact rebuild
 * (Phase 4 / Room 4 per ADR-001 §6).
 *
 * Served at /future-autopsy/ in dev + prod. Behind Posthog feature
 * flag `room_future_autopsy_v2`. Wave 6 will wire the legacy
 * `app/future-autopsy/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; Wave 1 renders empty state until
 *      Wave 2 wires deal-loading from the Deal Workspace mirror
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Future Autopsy could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_future_autopsy_v2");
if (!flagOn) {
    console.info(
        "[future-autopsy] Feature flag room_future_autopsy_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

// Wave 2 — read deals from Phase 4 / Room 1's mirror + compute vitals
// before first render so the ledger is populated immediately.
const deals = loadDealsFromMirror();
const vitals = computeVitalsForAll(deals);
setAllVitals(vitals);

// Wave 5 — seed task-completion log from gtmos_autopsy_log_v1, then
// wire the persistence loop. Subsequent toggleTaskDone calls write
// back automatically.
setTaskLog(loadTaskLog());
startTaskLogPersistence();

// Per-deal autopsy snapshot. Captures the regenerated verdict + top
// cause + kill-switch whenever the operator pins a deal in the room,
// so Founding GTM §5 can read what the autopsy said. Local-only —
// the in-progress diagnosis is still re-derived from vitals on every
// open.
startAutopsySnapshotPersistence();

// Cross-room handoff: if a caller passed `?focusObject=<deal id or
// account name>`, auto-pin that case. Match deal id first, then
// case-insensitive name so both Deal Workspace handoffs (id-based)
// and PoC / Advisor handoffs (account-name-based) work.
const ctx = readContinuity();
const focus = ctx.focusObject;
if (focus) {
    const lower = focus.toLowerCase();
    const match = vitals.find(
        (v) => v.id === focus || v.name.toLowerCase() === lower
    );
    if (match) selectDeal(match.id);
}

// Design-system migration (canon §6, radiation order: Future Autopsy
// after Deal Workspace — the two Diagnosis Tables). The DS surface
// composes the component library; the existing room renders otherwise.
// The autopsy engine + state + cloud layer are shared and unchanged.
// `?ds=1` is a preview escape-hatch (mirrors ?demo=1 / ?qa=1).
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
    // safety net, reachable by flipping room_future_autopsy_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_future_autopsy_legacy");
}

render(useDsSurface ? <FutureAutopsyDS /> : <FutureAutopsy />, root);

// Boot the density gradient so the DS surface's primitives render at the
// workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Async cloud load. Doesn't block first paint. Replaces local task log
// if cloud has a row; migrates local up if cloud is empty + local has
// data.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootCloudPersistence(client);
    } catch (err) {
        console.warn(
            "[future-autopsy] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
