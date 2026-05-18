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

// Phase 2.9 introduced an inboundReturn signal to surface the back
// affordance when Sarah arrived from a sibling room. Program 6 / PR 1
// retired that signal in favor of the canonical RoomChrome +
// BackButton pair — same continuity-param read, same safeReturnTo
// guard, applied uniformly to every room.

render(<Settings />, root);

// Async cloud probe — runs after first paint so the card never blocks
// render. Surfaces connection state + per-noun row counts the operator
// can use to confirm the cross-device sync is healthy.
void refreshCloudStatus();
