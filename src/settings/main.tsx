import { render } from "preact";
import { Settings } from "./Settings";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { readContinuity, safeReturnTo } from "@/lib/continuity";
import { inboundReturn, refreshAll, refreshCloudStatus } from "./state";

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

// Phase 2.9 — read inbound continuity. When Sarah arrives from a
// sibling room with `?returnTo=&returnLabel=`, surface a back
// affordance in the Topbar so her path back stays honest.
// safeReturnTo prevents open-redirect (paths only, no //).
const ctx = readContinuity();
const safe = safeReturnTo(ctx.returnTo);
if (safe && ctx.returnLabel) {
    inboundReturn.value = { path: safe, label: ctx.returnLabel };
}

render(<Settings />, root);

// Async cloud probe — runs after first paint so the card never blocks
// render. Surfaces connection state + per-noun row counts the operator
// can use to confirm the cross-device sync is healthy.
void refreshCloudStatus();
