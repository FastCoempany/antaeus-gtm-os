import { render } from "preact";
import { SourcingWorkbench } from "./SourcingWorkbench";
import { SourcingWorkbenchDS } from "./ds/SourcingWorkbenchDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/sourcing-workbench-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import {
    inboundFocus,
    patchProspectDraft,
    setProspects,
    setQueryCards,
    startPersistence
} from "./state";
import { loadProspects, loadQueryCards } from "./lib/persistence";
import { readInboundAccount } from "./lib/handoff";
import { bootCloudPersistence } from "./lib/cloud-persistence";

/**
 * Entry point for the Sourcing Workbench Preact rebuild
 * (Phase 4 / Room 13 per ADR-001 §6).
 *
 * Served at /sourcing-workbench/ in dev + prod. Behind Posthog feature
 * flag `room_sourcing_workbench_v2`. The legacy
 * `app/sourcing-workbench/index.html` flag-redirect is wired in the
 * same wave as this boot file.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed query cards + prospects from localStorage
 *   3. honor `?account=` URL inbound by patching the prospect draft
 *   4. start persistence (mirrors writes back)
 *   5. render
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Sourcing Workbench could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_sourcing_workbench_v2");
if (!flagOn) {
    console.info(
        "[sourcing-workbench] Feature flag room_sourcing_workbench_v2 is OFF. " +
            "Rendering anyway for internal preview."
    );
}

setQueryCards(loadQueryCards());
setProspects(loadProspects());

const inboundAccount = readInboundAccount(window.location.search);
if (inboundAccount) {
    patchProspectDraft({ accountName: inboundAccount });
}

// Phase 2.3 — Strategy flow inbound focus. ICP Studio / Territory
// Architect pass `?focusObject=<industry>` when handing off; we
// surface it in the topbar kicker + propagate through outbound
// handoffs so the next room (Signal Console) also lands focused.
const ctx = readContinuity();
if (ctx.focusObject) {
    inboundFocus.value = ctx.focusObject;
}

startPersistence();

// Design-system migration (canon §6, strategy flow: Sourcing Workbench
// after Territory Architect — finishing the strategy flow). The DS
// surface composes the component library; the existing room renders
// otherwise. The read + quality engine, persistence, and the handoffs
// are shared and unchanged. `?ds=1` is a preview escape-hatch.
const dsParam = (() => {
    try {
        return new URLSearchParams(window.location.search).get("ds") === "1";
    } catch {
        return false;
    }
})();
const dsSurfaceOn = dsParam || isFeatureEnabled("room_sourcing_workbench_v3");

render(dsSurfaceOn ? <SourcingWorkbenchDS /> : <SourcingWorkbench />, root);

// Boot the density gradient so the DS surface's primitives render at the
// workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Async cloud load. Doesn't block first paint.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootCloudPersistence(client);
    } catch (err) {
        console.warn(
            "[sourcing-workbench] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
