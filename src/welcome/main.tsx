import { render } from "preact";
import { Welcome } from "./Welcome";
import { WelcomeDS } from "./ds/WelcomeDS";
import { WelcomeV4 } from "./v4/WelcomeV4";
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

// 2026-07 wire-up (canon §4.1) — the "flow's landing" is the production
// Welcome surface. Default on; room_welcome_v4_off is the kill-switch
// back to the DS surface (one Posthog toggle, no redeploy). ?v4=0 previews
// the DS surface, ?v4=1 forces the landing.
const v4Param = (() => {
    try {
        return new URLSearchParams(window.location.search).get("v4");
    } catch {
        return null;
    }
})();
const useV4 =
    v4Param === "1" ||
    (v4Param !== "0" && !isFeatureEnabled("room_welcome_v4_off"));

render(
    useV4 ? <WelcomeV4 /> : useDsSurface ? <WelcomeDS /> : <Welcome />,
    root
);

// Boot the density gradient so the DS surface's primitives render at
// the workspace's chosen density (defensive — no-ops without a session).
void bootDensity();
