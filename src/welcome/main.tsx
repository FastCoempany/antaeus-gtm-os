import { render } from "preact";
import { Welcome } from "./Welcome";
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

render(<Welcome />, root);
