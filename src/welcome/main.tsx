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
        return new URLSearchParams(window.location.search).get("ds") === "1";
    } catch {
        return false;
    }
})();
const dsSurfaceOn = dsParam || isFeatureEnabled("room_welcome_v3");

render(dsSurfaceOn ? <WelcomeDS /> : <Welcome />, root);

// Boot the density gradient so the DS surface's primitives render at
// the workspace's chosen density (defensive — no-ops without a session).
void bootDensity();
