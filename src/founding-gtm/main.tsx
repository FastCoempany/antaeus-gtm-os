import { render } from "preact";
import { FoundingGtm } from "./FoundingGtm";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { setSectionsInput } from "./state";
import { loadSectionsInput } from "./lib/cross-room";

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
