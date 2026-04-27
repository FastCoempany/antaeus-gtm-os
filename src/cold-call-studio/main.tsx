import { render } from "preact";
import { ColdCallStudio } from "./ColdCallStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import {
    setCallLog,
    setCompanyName,
    startCallLogPersistence
} from "./state";
import { loadCallLog, loadCompanyName } from "./lib/persistence";

/**
 * Entry point for the Cold Call Studio Preact rebuild
 * (Phase 4 / Room 7 per ADR-001 §6).
 *
 * Served at /cold-call-studio/ in dev + prod. Behind Posthog feature
 * flag `room_cold_call_v2`. Wave 6 will wire the legacy
 * `app/cold-call-studio/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed call log + company name from localStorage
 *   3. start the call-log persistence loop (mirrors writes back)
 *   4. render — Preact mounts the live console
 *
 * Wave 5 will seed accountOptions + honor URL inbound params.
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Cold Call Studio could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_cold_call_v2");
if (!flagOn) {
    console.info(
        "[cold-call-studio] Feature flag room_cold_call_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

setCallLog(loadCallLog());
setCompanyName(loadCompanyName());
startCallLogPersistence();

render(<ColdCallStudio />, root);
