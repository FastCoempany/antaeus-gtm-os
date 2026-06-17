import { render } from "preact";
import { Onboarding } from "./Onboarding";
import { OnboardingDS } from "./ds/OnboardingDS";
import { bootDensity } from "@/lib/density";
import "@/styles/tokens.css";
import "@/components/components.css";
import "./ds/onboarding-ds.css";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { isOnboardingCompleteInCloud } from "./lib/cloud";
import { isOnboardingComplete } from "./lib/seed";

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Onboarding could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_onboarding_v2");
if (!flagOn) {
    console.info(
        "[onboarding] Feature flag room_onboarding_v2 is OFF. Rendering anyway for internal preview."
    );
}

// Design-system migration (canon §6, foundation flow). The DS surface
// composes the component library; the existing room renders otherwise.
// The seed pipeline, validation, and cloud mirror are shared and
// unchanged. `?ds=1` is a preview escape-hatch.
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
    // safety net, reachable by flipping room_onboarding_legacy ON in Posthog.
    useDsSurface = !isFeatureEnabled("room_onboarding_legacy");
}

render(useDsSurface ? <OnboardingDS /> : <Onboarding />, root);

// Boot the density gradient so the DS surface's primitives render at
// the workspace's chosen density (defensive — no-ops without a session).
void bootDensity();

// ADR-007 cross-device gate. If this workspace already completed
// onboarding (recorded in workspace_profile.onboarding_completed) but
// THIS device's localStorage doesn't know it — a fresh device / cleared
// cache — mirror the completion marker down + send the operator to
// Welcome instead of making them re-onboard. Respects the ?qa=1 /
// ?demo=1 escape hatch so CI smoke + demo seeding still exercise the
// flow. Fire-and-forget; never blocks first paint.
void (async (): Promise<void> => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    if (search.includes("qa=1") || search.includes("demo=1")) return;
    if (isOnboardingComplete()) return; // this device already knows

    try {
        const client = createDataClient();
        const doneInCloud = await isOnboardingCompleteInCloud(client);
        if (!doneInCloud) return;
        const iso = new Date().toISOString();
        window.localStorage.setItem(
            "gtmos_onboarding",
            JSON.stringify({ completed: true, completedAt: iso, source: "cloud-gate" })
        );
        window.localStorage.setItem("gtmos_onboarding_completed_at", iso);
        window.location.replace("/welcome/");
    } catch {
        // isOnboardingCompleteInCloud already reports; fail open — the
        // operator just sees the onboarding flow.
    }
})();
