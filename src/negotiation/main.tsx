import { render } from "preact";
import { computed, effect } from "@preact/signals";
import { Negotiation } from "./Negotiation";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { startUnsavedGuard } from "@/lib/unsaved-guard";
import {
    allNegotiations,
    draft,
    learnings,
    setAllNegotiations,
    setDealId,
    setLinkedDeals
} from "./state";
import {
    loadLearnings,
    loadNegotiations,
    saveLearnings,
    saveNegotiations
} from "./lib/persistence";
import {
    loadDealsForLinking,
    readInboundDealId
} from "./lib/cross-room";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Negotiation could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_negotiation_v2");
if (!flagOn) {
    console.info(
        "[negotiation] Feature flag room_negotiation_v2 is OFF for this user. Rendering anyway."
    );
}

// Phase 3 boot — seed cross-room linked deals + saved negotiations
// + lessons learned from localStorage (cloud-sync follows as a Phase 5
// hygiene PR, mirroring to a Supabase studio_artifacts row with
// kind='negotiation').
setLinkedDeals(loadDealsForLinking());
setAllNegotiations(loadNegotiations());

// Honor `?deal=<id>` URL inbound for the Deal Workspace handoff.
if (typeof window !== "undefined") {
    const inboundDealId = readInboundDealId(window.location.search);
    if (inboundDealId) setDealId(inboundDealId);
}

render(<Negotiation />, root);

// Persistence effects — mirror state to localStorage on change.
effect(() => {
    saveNegotiations(allNegotiations.value);
});
effect(() => {
    saveLearnings(learnings.value);
});

// Refresh linked deals when storage changes elsewhere (cross-tab).
if (typeof window !== "undefined") {
    window.addEventListener("storage", () => {
        setLinkedDeals(loadDealsForLinking());
    });
}

// Prime learnings from disk.
const initialLearnings = loadLearnings();
if (initialLearnings.length > 0) {
    learnings.value = initialLearnings;
}

// Unsaved-changes guard — fire beforeunload if the draft carries
// meaningful operator content that hasn't been frozen into a saved
// negotiation. counterparty + counterpartyName + startingPosition +
// walkawayPosition + openingLine + notes are the operator-authored
// fields; presence of any non-empty trimmed value is dirty.
const draftDirty = computed(() => {
    const d = draft.value;
    if (d.status === "closed") return false;
    return (
        (d.counterpartyName ?? "").trim().length > 0 ||
        (d.startingPosition ?? "").trim().length > 0 ||
        (d.walkawayPosition ?? "").trim().length > 0 ||
        (d.openingLine ?? "").trim().length > 0 ||
        (d.notes ?? "").trim().length > 0
    );
});
startUnsavedGuard(draftDirty, "Negotiation");
