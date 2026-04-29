import { render } from "preact";
import { FutureAutopsy } from "./FutureAutopsy";
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
import { notifyBootResult } from "@/lib/cloud-sync-notify";

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

render(<FutureAutopsy />, root);

// Async cloud load. Doesn't block first paint. Replaces local task log
// if cloud has a row; migrates local up if cloud is empty + local has
// data.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        const result = await bootCloudPersistence(client);
        notifyBootResult({ room: "Future Autopsy" }, result);
    } catch (err) {
        console.warn(
            "[future-autopsy] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
