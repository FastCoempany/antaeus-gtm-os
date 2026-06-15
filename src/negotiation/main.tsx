import { render } from "preact";
import { computed, effect } from "@preact/signals";
import { Negotiation } from "./Negotiation";
import { NegotiationDS } from "./ds/NegotiationDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/negotiation-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { startUnsavedGuard } from "@/lib/unsaved-guard";
import { readContinuity } from "@/lib/continuity";
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

// Phase 4 — honor full continuity context, not just `?deal=`. If
// Sarah lands here from Deal Workspace's HandoffStrip, focusObject
// carries the account name and `?deal=` carries the id; we use the
// id (canonical pointer) to auto-select. focusObject is informational
// only — RouteRack reads from the deal record once setDealId resolves.
if (typeof window !== "undefined") {
    const search = window.location.search;
    const inboundDealId = readInboundDealId(search);
    if (inboundDealId) {
        setDealId(inboundDealId);
    } else {
        // Fall back to focusObject when the source room didn't thread
        // a deal id (Settings or Welcome handoffs, hypothetically).
        const continuity = readContinuity(search);
        if (continuity.focusObject) {
            // No id, just a name — match against linkedDeals by name.
            const match = loadDealsForLinking().find(
                (d) =>
                    d.accountName.toLowerCase() ===
                    continuity.focusObject!.toLowerCase()
            );
            if (match) setDealId(match.id);
        }
    }
}

// Design-system migration (canon §6, recovery flow — completes the
// Deal Workspace ↔ Negotiation ↔ Advisor Deploy triangle on the
// library). The DS surface composes the component library; the existing
// room renders otherwise. The seed scripts, the persistence, the
// cross-room handoff, and the cloud sync are shared and unchanged.
// `?ds=1` is a preview escape-hatch.
const dsParam = (() => {
    try {
        return new URLSearchParams(window.location.search).get("ds") === "1";
    } catch {
        return false;
    }
})();
const dsSurfaceOn = dsParam || isFeatureEnabled("room_negotiation_v3");

render(dsSurfaceOn ? <NegotiationDS /> : <Negotiation />, root);

// Boot the density gradient so the DS surface's primitives render at the
// workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

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
