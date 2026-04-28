import { render } from "preact";
import { TerritoryArchitect } from "./TerritoryArchitect";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import {
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

render(<TerritoryArchitect />, root);
