import { render } from "preact";
import { AdvisorDeploy } from "./AdvisorDeploy";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import {
    setAdvisors,
    setDealId,
    setDealOptions,
    setDeployments,
    startAdvisorPersistence,
    startDeploymentPersistence
} from "./state";
import { loadAdvisors, loadDeployments } from "./lib/persistence";
import { loadDeals } from "./lib/deal-loader";
import { readInboundDealId } from "./lib/handoff";
import { bootCloudPersistence } from "./lib/cloud-persistence";
import { bootAdvisorProfileCloudPersistence } from "./lib/cloud-persistence-profile";

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

// Wave 5 — seed deal options from Phase 4 / Room 1's mirror, then
// honor URL inbound (?deal= or fallback ?focusObject=). When the
// inbound value matches a deal, point the desk at it; otherwise
// fall back to the first active deal so the rep lands on a routeable
// surface (legacy lines 218 + 228-230: try-id-then-name).
//
// PR #26 Codex P2 fix: cross-room handoffs (e.g. PoC Framework →
// Advisor Deploy) thread account name in `?focusObject=` without a
// `deal=` param. Resolve by id first, then by accountName
// (case-insensitive) so those handoffs land on the right deal
// instead of falling through to "first active".
const deals = loadDeals();
setDealOptions(deals);
const inboundValue = readInboundDealId();
function resolveInboundDeal(value: string | null): string | null {
    if (!value) return null;
    const byId = deals.find((d) => d.id === value);
    if (byId) return byId.id;
    const lower = value.trim().toLowerCase();
    if (!lower) return null;
    const byName = deals.find(
        (d) => d.accountName.trim().toLowerCase() === lower
    );
    return byName ? byName.id : null;
}
const inbound = resolveInboundDeal(inboundValue);
if (inbound) {
    setDealId(inbound);
} else {
    const firstActive = deals.find(
        (d) => d.stage !== "closed-won" && d.stage !== "closed-lost"
    );
    if (firstActive) setDealId(firstActive.id);
}

startAdvisorPersistence();
startDeploymentPersistence();

render(<AdvisorDeploy />, root);

// Async cloud load for both deployment history (advisor_deployments
// table) and the advisor REGISTRY rolodex (studio_artifacts with
// kind='advisor.profile'). Both run in parallel so first paint isn't
// blocked. Each handles its own cloud / migrated / empty / local-only
// path independently.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await Promise.all([
            bootCloudPersistence(client),
            bootAdvisorProfileCloudPersistence(client)
        ]);
    } catch (err) {
        console.warn(
            "[advisor-deploy] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
