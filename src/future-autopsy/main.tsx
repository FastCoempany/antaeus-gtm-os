import { render } from "preact";
import { FutureAutopsy } from "./FutureAutopsy";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { setAllVitals } from "./state";
import { loadDealsFromMirror } from "./lib/deal-loader";
import { computeVitalsForAll } from "./lib/vitals";

/**
 * Entry point for the Future Autopsy Preact rebuild
 * (Phase 4 / Room 4 per ADR-001 §6).
 *
 * Served at /future-autopsy/ in dev + prod. Behind Posthog feature
 * flag `room_future_autopsy_v2`. Wave 6 will wire the legacy
 * `app/future-autopsy/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; Wave 1 renders empty state until
 *      Wave 2 wires deal-loading from the Deal Workspace mirror
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Future Autopsy could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_future_autopsy_v2");
if (!flagOn) {
    console.info(
        "[future-autopsy] Feature flag room_future_autopsy_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

// Wave 2 — read deals from Phase 4 / Room 1's mirror + compute vitals
// before first render so the ledger is populated immediately. The
// legacy room re-runs this on storage events; Wave 5 will re-add that
// listener loop.
const deals = loadDealsFromMirror();
const vitals = computeVitalsForAll(deals);
setAllVitals(vitals);

render(<FutureAutopsy />, root);
