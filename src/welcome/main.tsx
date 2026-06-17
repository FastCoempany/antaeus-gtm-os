import { render } from "preact";
import { Welcome } from "./Welcome";
import { WelcomeDS } from "./ds/WelcomeDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/welcome-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { refreshFromStorage } from "./state";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Welcome could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_welcome_v2");
if (!flagOn) {
    console.info(
        "[welcome] Feature flag room_welcome_v2 is OFF. Rendering anyway for internal preview."
    );
}

refreshFromStorage();

// Design-system migration (canon §6, foundation flow). The DS surface
// composes the component library; the existing room renders otherwise.
// The activation model + milestone ladder + ranked-action builder are
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
    // safety net, reachable by flipping room_welcome_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_welcome_legacy");
}

render(useDsSurface ? <WelcomeDS /> : <Welcome />, root);

// Boot the density gradient so the DS surface's primitives render at
// the workspace's chosen density (defensive — no-ops without a session).
void bootDensity();
