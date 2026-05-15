import { render } from "preact";
import { effect } from "@preact/signals";
import { Negotiation } from "./Negotiation";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import {
    allNegotiations,
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
import {
    bootCloudPersistence,
    startCloudAutoSave
} from "./lib/cloud-persistence";

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

// Seed cross-room linked deals + saved negotiations + lessons learned
// from localStorage. Cloud boot below replaces these with canonical
// cloud state when it returns.
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

// Async cloud boot — replaces local state if cloud has rows; migrates
// local up if cloud is empty. Auto-save effect starts after boot
// settles so the first cloud write doesn't double-fire from the
// migration insert + the effect's first run.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootCloudPersistence(client);
    } catch (err) {
        console.warn(
            "[negotiation] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    } finally {
        startCloudAutoSave();
    }
})();
