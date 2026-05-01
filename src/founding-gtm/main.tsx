import { render } from "preact";
import { FoundingGtm } from "./FoundingGtm";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import {
    authoredSections,
    setCeremonyEvent,
    setSectionsInput
} from "./state";
import { loadSectionsInput } from "./lib/cross-room";
import { startHealthPublishing } from "./lib/health-publisher";
import { bootCeremonyMoment } from "./lib/ceremony";
import { countReady } from "./lib/sections";
import { createDataClient } from "@/lib/data-client";
import { VERDICT_LABEL } from "@/lib/readiness";
import { openCeremony } from "./state";

/**
 * Entry point for the Founding GTM Preact rebuild
 * (Phase 5.B per ADR-001 §6 + canon §4.19).
 *
 * Served at /founding-gtm/ in dev + prod. Behind Posthog feature
 * flag `room_founding_gtm_v2`. Wave 5 wires the legacy
 * `app/founding-gtm/index.html` flag-redirect.
 *
 * Wave 1 (this commit): structural shell — seven section frames
 * with canonical titles + empty-state copy. Wave 2 wires the
 * cross-room readers; Wave 3 fills the section authoring engines;
 * Wave 4 publishes the section-readiness count + ceremony moment
 * subscriber.
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Founding GTM could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_founding_gtm_v2");
if (!flagOn) {
    console.info(
        "[founding-gtm] Feature flag room_founding_gtm_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-4 are internal-test only)."
    );
}

// Wave 2 + 3 — load cross-room data from cloud-mirrored localStorage,
// then re-aggregate on storage events + visibility change so the room
// reflects sibling-room writes without a refresh.
setSectionsInput(loadSectionsInput());
if (typeof window !== "undefined") {
    window.addEventListener("storage", () => {
        setSectionsInput(loadSectionsInput());
    });
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            setSectionsInput(loadSectionsInput());
        }
    });
}

render(<FoundingGtm />, root);

// Wave 4 — section-readiness publisher. Writes
// `gtmos_founding_gtm_health` to localStorage on every section
// status change. Phase 5.A's readiness aggregator reads this for
// the proof dimension; the §4.17 "Hire-ready, repeatable" gate
// requires sections_ready ≥ 5.
startHealthPublishing();

// Wave 4 — ceremony moment subscriber. Queries the latest
// readiness_snapshots row and fires the set-piece overlay if it
// represents the first upward transition into `inheritable_with_
// guardrails` for this workspace. Idempotent via localStorage flag.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootCeremonyMoment({
            client,
            onFire: (transition) => {
                const counts = countReady(authoredSections.value);
                setCeremonyEvent({
                    fromLabel: VERDICT_LABEL[transition.from],
                    toLabel: VERDICT_LABEL[transition.to],
                    // The "before" count approximation: the moment the
                    // verdict moved up, the kit was probably one
                    // section behind its current state. If we have ≥1
                    // section ready, attribute one of those to the
                    // transition; otherwise show same-as-current.
                    sectionsBefore: Math.max(0, counts.ready - 1),
                    sectionsAfter: counts.ready
                });
                openCeremony();
            }
        });
    } catch {
        // No-op when cloud sync isn't configured (env-var-missing).
        // The room still renders + the publisher still writes locally.
    }
})();
