import { render } from "preact";
import { AdvisorDeploy } from "./AdvisorDeploy";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import {
    setAdvisors,
    setDeployments,
    startAdvisorPersistence,
    startDeploymentPersistence
} from "./state";
import { loadAdvisors, loadDeployments } from "./lib/persistence";

/**
 * Entry point for the Advisor Deploy Preact rebuild
 * (Phase 4 / Room 10 per ADR-001 §6).
 *
 * Served at /advisor-deploy/ in dev + prod. Behind Posthog feature
 * flag `room_advisor_deploy_v2`. Wave 6 wires the legacy
 * `app/advisor-deploy/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed advisors + deployments from localStorage
 *   3. start the persistence loops (mirror writes back)
 *   4. render — Preact mounts the live desk
 *
 * Wave 5 adds the inbound cross-room context loaders + URL `?deal=`.
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Advisor Deploy could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_advisor_deploy_v2");
if (!flagOn) {
    console.info(
        "[advisor-deploy] Feature flag room_advisor_deploy_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

setAdvisors(loadAdvisors());
setDeployments(loadDeployments());
startAdvisorPersistence();
startDeploymentPersistence();

render(<AdvisorDeploy />, root);
