import { render } from "preact";
import { OutboundStudio } from "./OutboundStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import {
    patchRack,
    setAccountOptions,
    setAllAngles,
    setAllTouches,
    startAnglePersistence,
    startTouchPersistence
} from "./state";
import { loadAngles, loadTouches } from "./lib/persistence";
import { loadAccountOptions } from "./lib/account-loader";
import { readInboundRack } from "./lib/handoff";

/**
 * Entry point for the Outbound Studio Preact rebuild
 * (Phase 4 / Room 6 per ADR-001 §6).
 *
 * Served at /outbound-studio/ in dev + prod. Behind Posthog feature
 * flag `room_outbound_studio_v2`. Wave 6 will wire the legacy
 * `app/outbound-studio/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; Wave 1 renders empty state until
 *      Wave 4 wires persistence + Wave 5 wires URL inbound + handoff
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Outbound Studio could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_outbound_studio_v2");
if (!flagOn) {
    console.info(
        "[outbound-studio] Feature flag room_outbound_studio_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

// Wave 4 — seed touches + angles from localStorage, then start the
// persistence loops. Subsequent log-touch / save-angle calls write
// back automatically.
setAllTouches(loadTouches());
setAllAngles(loadAngles());
startTouchPersistence();
startAnglePersistence();

// Wave 5 — load Signal Console accounts for the dropdown + honor
// inbound URL params (?account=, ?temperature=, ?trigger=, ?persona=)
// from cross-room handoffs.
setAccountOptions(loadAccountOptions());
const inbound = readInboundRack();
if (Object.keys(inbound).length > 0) {
    patchRack(inbound);
}

render(<OutboundStudio />, root);
