import { render } from "preact";
import { initObservability } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { resolveShareToken } from "../founding-gtm/lib/share";
import { FoundingGtmShare } from "./FoundingGtmShare";
import { snapshotSignal, statusSignal } from "./state";

/**
 * Read-mode entry point for Founding GTM share links.
 *
 * Served at /founding-gtm-share/?t=<token>. Anonymous. Reads the token
 * from the URL search params, calls the resolve_founding_gtm_share
 * SECURITY DEFINER RPC, and renders the seven authored sections
 * frozen at link-creation time. NO writable controls anywhere.
 *
 * The recipient is not an Antaeus user (per the canon §4.19 locked
 * design — anonymous URL token). They never see the operator's other
 * rooms; the snapshot is the entire content surface.
 *
 * Ref: canon §4.19 + this PR's commit message
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Founding GTM Share could not mount: #app missing from index.html"
    );
}

const params =
    typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
const token = params?.get("t")?.trim() ?? "";

if (!token) {
    statusSignal.value = "missing-token";
    render(<FoundingGtmShare />, root);
} else {
    statusSignal.value = "loading";
    render(<FoundingGtmShare />, root);

    void (async () => {
        try {
            const client = createDataClient();
            const snapshot = await resolveShareToken(client, token);
            if (!snapshot) {
                statusSignal.value = "not-found";
                return;
            }
            snapshotSignal.value = snapshot;
            statusSignal.value = "ready";
        } catch (err) {
            console.warn(
                "[founding-gtm-share] Resolve failed:",
                err instanceof Error ? err.message : String(err)
            );
            statusSignal.value = "not-found";
        }
    })();
}
