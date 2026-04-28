import { render } from "preact";
import { Onboarding } from "./Onboarding";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Onboarding could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_onboarding_v2");
if (!flagOn) {
    console.info(
        "[onboarding] Feature flag room_onboarding_v2 is OFF. Rendering anyway for internal preview."
    );
}

render(<Onboarding />, root);
