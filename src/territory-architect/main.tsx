import { render } from "preact";
import { TerritoryArchitect } from "./TerritoryArchitect";
import { TerritoryArchitectDS } from "./ds/TerritoryArchitectDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/territory-architect-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import {
    focusedIcp,
    patchThesisDraft,
    setAccounts,
    setApproaches,
    setTerritoryState,
    setFocuses,
    startPersistence
} from "./state";
import {
    loadAccounts,
    loadApproaches,
    loadTerritoryState,
    loadFocuses
} from "./lib/persistence";
import { bootCloudPersistence } from "./lib/cloud-persistence";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Territory Architect could not mount: #app root element missing"
    );
}

const flagOn = isFeatureEnabled("room_territory_architect_v2");
if (!flagOn) {
    console.info(
        "[territory-architect] Feature flag room_territory_architect_v2 OFF. Rendering anyway."
    );
}

setFocuses(loadFocuses());
setApproaches(loadApproaches());
setAccounts(loadAccounts());
setTerritoryState(loadTerritoryState());
startPersistence();

// Cross-room handoff: if a caller passed `?focusObject=<industry>`,
// prefill the segment field of the new-focus draft + surface the
// inbound focus in the hero kicker so the operator sees the ICP
// context immediately. Phase 2.3 — focusedIcp also propagates into
// outbound handoff URLs so Sourcing / Signal Console land focused.
const ctx = readContinuity();
if (ctx.focusObject) {
    patchThesisDraft({ segment: ctx.focusObject });
    focusedIcp.value = ctx.focusObject;
}

// Design-system migration (canon §6, strategy flow: Territory Architect
// after ICP Studio). The DS surface composes the component library; the
// existing room renders otherwise. The field-read + allocation engine,
// persistence, and the handoffs are shared and unchanged. `?ds=1` is a
// preview escape-hatch (mirrors ?demo=1 / ?qa=1).
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
    // safety net, reachable by flipping room_territory_architect_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_territory_architect_legacy");
}

render(useDsSurface ? <TerritoryArchitectDS /> : <TerritoryArchitect />, root);

// Boot the density gradient so the DS surface's primitives render at the
// workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Async cloud load for focuses + approaches + accounts. Doesn't block
// first paint. Replaces local state if cloud has rows; migrates local
// up if cloud is empty. Realtime keeps cross-tab + cross-device
// mutations flowing.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootCloudPersistence(client);
    } catch (err) {
        console.warn(
            "[territory-architect] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
