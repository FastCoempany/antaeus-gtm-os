import { render } from "preact";
import { Settings } from "./Settings";
import { SettingsDS } from "./ds/SettingsDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/settings-ds.css";
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

// Design-system migration (canon §6, trust flow). The DS surface
// composes the component library; the existing room renders otherwise.
// The backup/restore, cloud sync, export, delete, Phase F, and density
// engines are shared and unchanged. `?ds=1` is a preview escape-hatch.
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
    // safety net, reachable by flipping room_settings_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_settings_legacy");
}

render(useDsSurface ? <SettingsDS /> : <Settings />, root);

// Boot the density gradient so the DS surface's primitives render at
// the workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Async cloud probe — runs after first paint so the card never blocks
// render. Surfaces connection state + per-noun row counts the operator
// can use to confirm the cross-device sync is healthy.
void refreshCloudStatus();
