import { render } from "preact";
import { ColdCallStudio } from "./ColdCallStudio";
import { initObservability, isFeatureEnabled } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import {
    setAccountOptions,
    setCallLog,
    setCompanyName,
    setSelectedAccount,
    startCallLogPersistence
} from "./state";
import { loadCallLog, loadCompanyName } from "./lib/persistence";
import { loadAccountOptions } from "./lib/account-loader";
import { readInboundAccount } from "./lib/handoff";
import { bootCloudPersistence } from "./lib/cloud-persistence";
import { notifyBootResult } from "@/lib/cloud-sync-notify";

/**
 * Entry point for the Cold Call Studio Preact rebuild
 * (Phase 4 / Room 7 per ADR-001 §6).
 *
 * Served at /cold-call-studio/ in dev + prod. Behind Posthog feature
 * flag `room_cold_call_v2`. Wave 6 will wire the legacy
 * `app/cold-call-studio/index.html` flag-redirect.
 *
 * Boot order:
 *   1. initObservability — Sentry + Posthog
 *   2. seed call log + company name from localStorage
 *   3. start the call-log persistence loop (mirrors writes back)
 *   4. render — Preact mounts the live console
 *
 * Wave 5 will seed accountOptions + honor URL inbound params.
 *
 * Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6
 */

initObservability();

const root = document.getElementById("app");
if (!root) {
    throw new Error(
        "Cold Call Studio could not mount: #app root element missing from index.html"
    );
}

const flagOn = isFeatureEnabled("room_cold_call_v2");
if (!flagOn) {
    console.info(
        "[cold-call-studio] Feature flag room_cold_call_v2 is OFF for this user. " +
            "Rendering anyway (Waves 1-5 are internal-test only)."
    );
}

setCallLog(loadCallLog());
setCompanyName(loadCompanyName());

// Wave 5 — seed Signal Console accounts + honor URL inbound. The
// inbound parameter wins; otherwise auto-select the hottest account
// (loadAccountOptions returns the list ranked by heat desc) so the
// rep lands on a dialable surface.
const accounts = loadAccountOptions();
setAccountOptions(accounts);

const requested = readInboundAccount();
if (requested) {
    const lower = requested.toLowerCase();
    const match = accounts.find((a) => a.name.toLowerCase() === lower);
    if (match) setSelectedAccount(match.name);
} else if (accounts.length > 0) {
    const top = accounts[0];
    if (top) setSelectedAccount(top.name);
}

startCallLogPersistence();

render(<ColdCallStudio />, root);

// Async cloud load for call log. Doesn't block first paint.
void (async (): Promise<void> => {
    try {
        const client = createDataClient();
        const result = await bootCloudPersistence(client);
        notifyBootResult(
            { room: "Cold Call Studio", rowCount: result.callCount },
            result
        );
    } catch (err) {
        console.warn(
            "[cold-call-studio] Cloud sync disabled:",
            err instanceof Error ? err.message : String(err)
        );
    }
})();
