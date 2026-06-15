import { render } from "preact";
import { QuotaWorkback } from "./QuotaWorkback";
import { QuotaWorkbackDS } from "./ds/QuotaWorkbackDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/quota-workback-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import {
    refreshCoverage,
    setInputs,
    startCoverageRecompute,
    startPersistence
} from "./state";
import { loadInputs } from "./lib/persistence";
import {
    bootCloudPersistence,
    startCloudAutoSave
} from "./lib/cloud-persistence";

/**
 * Entry point for the Quota Workback Preact rebuild
 * (Phase 4 / Room 14 per ADR-001 §6).
 *
 * Served at /quota-workback/ in dev + prod. Behind Posthog feature
 * flag `room_quota_workback_v2`.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed inputs from gtmos_qw_inputs (or gtmos_outbound_seed fallback)
 *   3. refresh coverage from gtmos_deal_workspaces using the current
 *      benchmark target multiple (so `needed` and the panel agree)
 *   4. start the coverage-recompute effect (re-fires when quota or
 *      benchmark.coverage changes; also installs a cross-tab storage
 *      listener so deal edits in Deal Workspace land here live)
 *   5. start the persistence effect (mirrors writes back, with an
 *      explicit initial save so downstream snapshots aren't stale)
 *   6. render
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Quota Workback could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_quota_workback_v2");
if (!flagOn) {
    console.info(
        "[quota-workback] Feature flag room_quota_workback_v2 is OFF. " +
            "Rendering anyway for internal preview."
    );
}

const seeded = loadInputs();
setInputs(seeded);
refreshCoverage();

startCoverageRecompute();
startPersistence();

// Design-system migration (canon §6, synthesis flow). The DS surface
// composes the component library; the existing room renders otherwise.
// The workback math, the benchmarks, the coverage computation,
// persistence, and the downstream seeds are shared and unchanged. `?ds=1`
// is a preview escape-hatch.
const dsParam = (() => {
    try {
        return new URLSearchParams(window.location.search).get("ds") === "1";
    } catch {
        return false;
    }
})();
const dsSurfaceOn = dsParam || isFeatureEnabled("room_quota_workback_v3");

render(dsSurfaceOn ? <QuotaWorkbackDS /> : <QuotaWorkback />, root);

// Boot the density gradient so the DS surface's primitives render at the
// workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Async cloud load. If the cloud has saved inputs, hydrate from them
// (cross-device "same plan everywhere"). If cloud is empty + local
// has non-default inputs, push them up. Then wire the auto-save
// effect — every input mutation mirrors to cloud (debounced).
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootCloudPersistence(client);
        startCloudAutoSave();
    } catch (err) {
        console.warn(
            "[quota-workback] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
