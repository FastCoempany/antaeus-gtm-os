import { render } from "preact";
import { TerritoryArchitect } from "./TerritoryArchitect";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import {
    focusedIcp,
    patchThesisDraft,
    setAccounts,
    setApproaches,
    setTerritoryState,
    setTheses,
    startPersistence
} from "./state";
import {
    loadAccounts,
    loadApproaches,
    loadTerritoryState,
    loadTheses
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

setTheses(loadTheses());
setApproaches(loadApproaches());
setAccounts(loadAccounts());
setTerritoryState(loadTerritoryState());
startPersistence();

// Cross-room handoff: if a caller passed `?focusObject=<industry>`,
// prefill the segment field of the new-thesis draft + surface the
// inbound focus in the hero kicker so the operator sees the ICP
// context immediately. Phase 2.3 — focusedIcp also propagates into
// outbound handoff URLs so Sourcing / Signal Console land focused.
const ctx = readContinuity();
if (ctx.focusObject) {
    patchThesisDraft({ segment: ctx.focusObject });
    focusedIcp.value = ctx.focusObject;
}

render(<TerritoryArchitect />, root);

// Async cloud load for theses + approaches + accounts. Doesn't block
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
