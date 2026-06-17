import { render } from "preact";
import { IcpStudio } from "./IcpStudio";
import { IcpStudioDS } from "./ds/IcpStudioDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/icp-studio-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { readContinuity } from "@/lib/continuity";
import {
    patchDraft,
    setSavedIcps,
    setTotalWorked,
    startAnalyticsPersistence
} from "./state";
import { loadAnalytics } from "./lib/persistence";
import { bootCloudPersistence } from "./lib/cloud-persistence";
import { bootProfile } from "./lib/profile-persistence";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "ICP Studio could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_icp_studio_v2");
if (!flagOn) {
    console.info(
        "[icp-studio] Feature flag room_icp_studio_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

// Step 1 — synchronous seed from localStorage so the room renders
// instantly with the operator's last-known ICP library instead of
// flashing an empty state. This is the OFFLINE FALLBACK; cloud load
// below replaces it once Supabase resolves.
const seed = loadAnalytics();
setSavedIcps(seed.icps);
setTotalWorked(seed.totalWorked);
startAnalyticsPersistence();

// Cross-room handoff: if a caller passed `?focusObject=<industry>`,
// pre-fill the industry-custom field so the operator lands with
// their ICP already partially shaped.
const ctx = readContinuity();
if (ctx.focusObject) {
    patchDraft({ industry: "custom", industryCustom: ctx.focusObject });
}

// Design-system migration (canon §6, radiation order: ICP Studio opens
// the Decision Bench family + the strategy flow). The DS surface composes
// the component library; the existing room renders otherwise. The build +
// quality engine, persistence, and the commercial profile are shared and
// unchanged. `?ds=1` is a preview escape-hatch (mirrors ?demo=1 / ?qa=1).
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
    // safety net, reachable by flipping room_icp_studio_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_icp_studio_legacy");
}

render(useDsSurface ? <IcpStudioDS /> : <IcpStudio />, root);

// Boot the density gradient so the DS surface's primitives render at the
// workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// Step 2 — async cloud load. Doesn't block first paint. If cloud has
// rows, replace local state (cloud is canonical). If cloud is empty
// AND localStorage seeded data, push the seed up (one-time migration).
// If Supabase env vars are missing or the network is hostile, the
// room stays usable with whatever localStorage seeded — no degradation,
// just no cross-device sync until the next session retries.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        // ICP rows + the commercial profile share one client + boot
        // window. Profile (ADR-007) loads in parallel with the ICP
        // rows; neither blocks first paint.
        await Promise.all([
            bootCloudPersistence(client),
            bootProfile(client)
        ]);
    } catch (err) {
        console.warn(
            "[icp-studio] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
