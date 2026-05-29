import { render } from "preact";
import { Briefing } from "./Briefing";
import {
    bootBriefingLead,
    bootContrarian,
    bootCostSummary,
    bootPatternMarks,
    bootPatterns,
    bootPeriphery,
    bootTriggers
} from "./state";
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

// Load periphery candidates for the latest run. The rail renders
// nothing when there are none, so a failed read is invisible to the
// operator (the Patterns + Watch List still render).
void bootPeriphery();

// Load contrarian Patterns (pattern_type='contrarian'). Most runs
// won't have any — the LLM is instructed to refuse when no evidence-
// backed challenge exists, and the rail renders nothing when the list
// is empty. So a failed read is also invisible to the operator.
void bootContrarian();

// Load the "Read This Week" lead from the latest completed run.
// Renders nothing when the latest run produced no lead (refused, or
// pre-B.9a).
void bootBriefingLead();

// Load the rolling 7-day cost summary for the footer. Always renders
// once loaded — the cost telemetry is the trust signal that lets the
// operator lean on the auto-run.
void bootCostSummary();

// Load the operator's current Used / Met / Noise marks on Patterns.
// Defensive inside the client — failures degrade to "no marks" (the
// MarksBar just shows the unmarked state). The marks loop back to
// the cluster scorer on the next pipeline run.
void bootPatternMarks();
