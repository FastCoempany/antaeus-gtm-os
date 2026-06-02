import { render } from "preact";
import { OutdoorsEvents } from "./OutdoorsEvents";
import { bootEvents, bootLatestRun } from "./state";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the Outdoors Events room (ADR-015 + ADR-016).
 *
 * Served at /outdoors-events/. Live Instrument family. Discovery
 * surface: the system finds category-relevant gatherings; the operator
 * marks + dismisses. Manual add is a secondary fallback.
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Outdoors Events could not mount: #app root element missing from index.html"
    );
}

// Posthog flag exists for future targeting. The room ships ungated —
// no legacy room to redirect from. If the flag is off we log it but
// still render.
const flagOn = isFeatureEnabled("room_outdoors_events_v1");
if (!flagOn) {
    console.info(
        "[outdoors-events] Feature flag room_outdoors_events_v1 is OFF for this user. Rendering anyway."
    );
}

render(<OutdoorsEvents />, root);

// Load the operator's events + the latest discovery-run summary after
// first paint. Both defensive — failures degrade to empty state /
// no-run-yet.
void bootEvents();
void bootLatestRun();
