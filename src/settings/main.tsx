import { render } from "preact";
import { Settings } from "./Settings";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { refreshAll, refreshCloudStatus } from "./state";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Settings could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_settings_v2");
if (!flagOn) {
    console.info(
        "[settings] Feature flag room_settings_v2 is OFF. Rendering anyway for internal preview."
    );
}

refreshAll();

render(<Settings />, root);

// Async cloud probe — runs after first paint so the card never blocks
// render. Surfaces connection state + per-noun row counts the operator
// can use to confirm the cross-device sync is healthy.
void refreshCloudStatus();
