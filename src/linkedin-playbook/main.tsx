import { render } from "preact";
import { LinkedinPlaybook } from "./LinkedinPlaybook";
import { initObservability, isFeatureEnabled } from "@/lib/observability";

/**
 * Entry point for the LinkedIn Playbook Preact rebuild
 * (Phase 4 / Room 8 per ADR-001 §6).
 *
 * Served at /linkedin-playbook/ in dev + prod. Behind Posthog feature
 * flag `room_linkedin_playbook_v2`. Wave 6 wires the legacy
 * `app/linkedin-playbook/index.html` flag-redirect.
 *
 * Boot order (Wave 1):
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts
 *
 * Subsequent waves seed the action log (Wave 4) + the inbound cross-
 * room context (Wave 5).
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "LinkedIn Playbook could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_linkedin_playbook_v2");
if (!flagOn) {
    console.info(
        "[linkedin-playbook] Feature flag room_linkedin_playbook_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

render(<LinkedinPlaybook />, root);
