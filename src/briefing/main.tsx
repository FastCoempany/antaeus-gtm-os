import { render } from "preact";
import { Briefing } from "./Briefing";
import { bootPatterns, bootTriggers } from "./state";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Briefing could not mount: #app root element missing from index.html"
    );
}

// Posthog flag exists for future targeting (per-user enable / disable,
// rollout staging). B.0b ships the room ungated — no legacy briefing
// room to redirect from. If the flag is off for a user we log it but
// still render; visibility can be tightened later by hiding the
// palette entry behind the same flag.
const flagOn = isFeatureEnabled("room_briefing_v2");
if (!flagOn) {
    console.info(
        "[briefing] Feature flag room_briefing_v2 is OFF for this user. Rendering anyway."
    );
}

render(<Briefing />, root);

// Load the latest run's Patterns after first paint. Defensive inside
// loadStandardPatterns — failures degrade to the empty state.
void bootPatterns();

// Load armed Watch List triggers + the fires they produced this week.
// Defensive inside the client — failures degrade to empty lists, so
// the Patterns still render.
void bootTriggers();
