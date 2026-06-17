import { render } from "preact";
import { LinkedinPlaybook } from "./LinkedinPlaybook";
import { LinkedinPlaybookDS } from "./ds/LinkedinPlaybookDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/linkedin-playbook-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import {
    patchDraft,
    setActions,
    setBestIcp,
    setHottestAccount,
    setLatestTouch,
    startActionsPersistence
} from "./state";
import { loadActions } from "./lib/persistence";
import {
    loadBestIcp,
    loadHottestAccount,
    loadLatestTouch
} from "./lib/context";
import { readInboundAccount } from "./lib/handoff";
import { bootCloudPersistence } from "./lib/cloud-persistence";

/**
 * Entry point for the LinkedIn Playbook Preact rebuild
 * (Phase 4 / Room 8 per ADR-001 §6).
 *
 * Served at /linkedin-playbook/ in dev + prod. Behind Posthog feature
 * flag `room_linkedin_playbook_v2`. Wave 6 wires the legacy
 * `app/linkedin-playbook/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed action log from `gtmos_linkedin_log`
 *   3. start the actions persistence loop (mirrors writes back)
 *   4. render — Preact mounts the live booth + ledger
 *
 * Wave 5 adds the inbound cross-room context loaders + URL `?account=`
 * pickup.
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

setActions(loadActions());

// Wave 5 — seed the inbound cross-room context. Each loader reads a
// specific Phase 4 mirror key (gtmos_icp_analytics / gtmos_sc_v4 /
// gtmos_outbound_touches) and is defensively null-safe; missing keys
// just leave the corresponding signal at null.
setBestIcp(loadBestIcp());
setHottestAccount(loadHottestAccount());
setLatestTouch(loadLatestTouch());

// Wave 5 — honor URL inbound. If `?account=` (or fallback `?focusObject=`)
// is set, pre-fill the ledger draft so the rep can log a cue against
// that account in one motion.
const inbound = readInboundAccount();
if (inbound) patchDraft({ accountName: inbound });

startActionsPersistence();

// Design-system migration (canon §6, outbound flow: LinkedIn Playbook
// after Cold Call Studio). The DS surface composes the component library;
// the existing room renders otherwise. The cue ladder, the motion engine,
// persistence, and the handoffs are shared and unchanged. `?ds=1` is a
// preview escape-hatch.
const dsParam = (() => {
    try {
        return new URLSearchParams(window.location.search).get("ds");
    } catch {
        return null;
    }
})();
let useDsSurface: boolean;
if (dsParam === "1") {
    useDsSurface = true;
} else if (dsParam === "0") {
    useDsSurface = false;
} else {
    // Default to the new design-system surface; the legacy surface is the
    // safety net, reachable by flipping room_linkedin_playbook_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_linkedin_playbook_legacy");
}

render(useDsSurface ? <LinkedinPlaybookDS /> : <LinkedinPlaybook />, root);

// Boot the density gradient so the DS surface's primitives render at the
// workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Async cloud load for action history. Doesn't block first paint.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        await bootCloudPersistence(client);
    } catch (err) {
        console.warn(
            "[linkedin-playbook] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
