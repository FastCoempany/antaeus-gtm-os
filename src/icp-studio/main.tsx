import { render } from "preact";
import { IcpStudio } from "./IcpStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import {
    setSavedIcps,
    setTotalWorked,
    startAnalyticsPersistence
} from "./state";
import { loadAnalytics } from "./lib/persistence";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "ICP Studio could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_icp_studio_v2");
if (!flagOn) {
    console.info(
        "[icp-studio] Feature flag room_icp_studio_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

const seed = loadAnalytics();
setSavedIcps(seed.icps);
setTotalWorked(seed.totalWorked);
startAnalyticsPersistence();

render(<IcpStudio />, root);
