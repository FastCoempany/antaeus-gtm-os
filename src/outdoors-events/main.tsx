import { render } from "preact";
import { OutdoorsEvents } from "./OutdoorsEvents";
import { OutdoorsEventsDS } from "./ds/OutdoorsEventsDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/outdoors-events-ds.css";
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

// Design-system migration (canon §6, Live Instrument). The DS surface
// composes the component library; the existing room renders otherwise.
// The discovery client, persistence, tiering, and status lifecycle are
// shared and unchanged. `?ds=1` is a preview escape-hatch.
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
    // safety net, reachable by flipping room_outdoors_events_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_outdoors_events_legacy");
}

render(useDsSurface ? <OutdoorsEventsDS /> : <OutdoorsEvents />, root);

// Boot the density gradient so the DS surface's primitives render at
// the workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Load the operator's events + the latest discovery-run summary after
// first paint. Both defensive — failures degrade to empty state /
// no-run-yet.
void bootEvents();
void bootLatestRun();
