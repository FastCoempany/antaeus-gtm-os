import { render } from "preact";
import { PocFramework } from "./PocFramework";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { patchDraft, setAllProofs, setLinkedDeals, startProofPersistence } from "./state";
import { loadProofs } from "./lib/persistence";
import { loadDealsForLinking } from "./lib/deal-sync";
import { readInboundDealId } from "./lib/handoff";

/**
 * Entry point for the PoC Framework Preact rebuild
 * (Phase 4 / Room 5 per ADR-001 §6).
 *
 * Served at /poc-framework/ in dev + prod. Behind Posthog feature
 * flag `room_poc_framework_v2`. Wave 6 will wire the legacy
 * `app/poc-framework/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. render — Preact mounts; Wave 1 renders empty state until
 *      Wave 4 wires persistence + Wave 5 wires deal sync
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "PoC Framework could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_poc_framework_v2");
if (!flagOn) {
    console.info(
        "[poc-framework] Feature flag room_poc_framework_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

// Wave 4 — seed proofs from gtmos_poc_data, then wire the persistence
// loop. Subsequent saveDraft/upsertProof calls write back automatically.
setAllProofs(loadProofs());
startProofPersistence();

// Wave 5 — load Deal Workspace deals for the linked-deal dropdown +
// honor inbound `?deal=<id>` URL param so a route-in from another room
// auto-populates the form's linkedDealId.
setLinkedDeals(loadDealsForLinking());
const inboundDealId = readInboundDealId();
if (inboundDealId) {
    patchDraft({ linkedDealId: inboundDealId });
}

render(<PocFramework />, root);
