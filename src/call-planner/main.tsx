import { render } from "preact";
import { CallPlanner } from "./CallPlanner";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { hydrateDraftFromSnapshot, startAgendaAutosave } from "./state";
import { loadAgendaSnapshot } from "./lib/persistence";

/**
 * Entry point for the Call Planner Preact rebuild
 * (Phase 4 / Room 9 per ADR-001 §6).
 *
 * Served at /call-planner/ in dev + prod. Behind Posthog feature flag
 * `room_call_planner_v2`. Wave 6 wires the legacy
 * `app/discovery-agenda/index.html` flag-redirect (note the legacy
 * path differs from the canonical room name per canon §4.11).
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. resume the prior draft from `gtmos_discovery_agenda` so the
 *      operator doesn't lose context across reloads
 *   3. start the autosave effect (mirrors snapshot writes back)
 *   4. render — Preact mounts the live planner
 *
 * Wave 5 adds the inbound `?account=` URL prefill + the account/deal
 * loaders that populate the Witness's matchedAccount + linked-deal
 * dropdown.
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Call Planner could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_call_planner_v2");
if (!flagOn) {
    console.info(
        "[call-planner] Feature flag room_call_planner_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

const prior = loadAgendaSnapshot();
if (prior) hydrateDraftFromSnapshot(prior);
startAgendaAutosave();

render(<CallPlanner />, root);
