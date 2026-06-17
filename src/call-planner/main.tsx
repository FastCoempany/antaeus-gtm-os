import { render } from "preact";
import { computed } from "@preact/signals";
import { CallPlanner } from "./CallPlanner";
import { CallPlannerDS } from "./ds/CallPlannerDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/call-planner-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { startUnsavedGuard } from "@/lib/unsaved-guard";
import {
    draft,
    hydrateDraftFromSnapshot,
    setAccountOptions,
    setContactName,
    setDealOptions,
    startAgendaAutosave
} from "./state";
import { loadAgendaSnapshot } from "./lib/persistence";
import { loadAccountOptions } from "./lib/account-loader";
import { loadDealOptions } from "./lib/deal-loader";
import { readInboundAccount } from "./lib/handoff";
import { bootCloudPersistence } from "./lib/cloud-persistence";

/**
 * Entry point for the Call Planner Preact rebuild
 * (Phase 4 / Room 9 per ADR-001 §6).
 *
 * Served at /call-planner/ in dev + prod. Behind Posthog feature flag
 * `room_call_planner_v2`. Wave 6 wires the legacy
 * `app/discovery-agenda/index.html` flag-redirect (note the legacy
 * path differs from the canonical room name per canon §4.11).
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. resume the prior draft from `gtmos_discovery_agenda` so the
 *      operator doesn't lose context across reloads
 *   3. start the autosave effect (mirrors snapshot writes back)
 *   4. render — Preact mounts the live planner
 *
 * Wave 5 adds the inbound `?account=` URL prefill + the account/deal
 * loaders that populate the Witness's matchedAccount + linked-deal
 * dropdown.
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Call Planner could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_call_planner_v2");
if (!flagOn) {
    console.info(
        "[call-planner] Feature flag room_call_planner_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

// Seed cross-room context: Signal Console accounts (drives matched
// account + dossier) + Deal Workspace deals (drives the linked-deal
// dropdown). Both readers are defensive — null storage / missing key
// → empty list.
setAccountOptions(loadAccountOptions());
setDealOptions(loadDealOptions());

// Restore the prior draft (so reload returns to the same plan), then
// honor URL `?account=` inbound. Inbound wins over the restored
// contact name so a fresh deep-link from another room takes priority.
const prior = loadAgendaSnapshot();
if (prior) hydrateDraftFromSnapshot(prior);
const inbound = readInboundAccount();
if (inbound) setContactName(inbound);

startAgendaAutosave();

// Unsaved-changes guard — autosave already writes drafts to
// localStorage as the operator types, but mid-typing the operator may
// have rich context not yet snapshotted. Fire beforeunload if any
// operator-authored field carries content.
const witnessDirty = computed(() => {
    const d = draft.value;
    return (
        (d.contactName ?? "").trim().length > 0 ||
        (d.customNotes ?? "").trim().length > 0 ||
        (d.linkedinUrl ?? "").trim().length > 0
    );
});
startUnsavedGuard(witnessDirty, "Call Planner");

// Design-system migration (canon §6, outbound flow: Call Planner closes
// the flow after the Live Instruments). The DS surface composes the
// component library; the existing room renders otherwise. The four-stop
// spine, the quality engine, persistence, and the handoffs are shared and
// unchanged. `?ds=1` is a preview escape-hatch.
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
    // safety net, reachable by flipping room_call_planner_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_call_planner_legacy");
}

render(useDsSurface ? <CallPlannerDS /> : <CallPlanner />, root);

// Boot the density gradient so the DS surface's primitives render at the
// workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Async cloud load. If the cloud has a recent agenda saved from
// another device, hydrate the draft from it (cloud is canonical
// for cross-device "what was I planning?" continuity).
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootCloudPersistence(client);
    } catch (err) {
        console.warn(
            "[call-planner] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
