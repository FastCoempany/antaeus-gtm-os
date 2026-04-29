import type { JSX } from "preact";
import { useState } from "preact/hooks";
import {
    currentCompany,
    draft,
    linkedDeal,
    logOutcome,
    persistAgendaState
} from "../state";
import { buildAgendaBrief } from "../lib/brief";
import { evaluateQuality } from "../lib/quality";
import {
    hrefToDealWorkspace,
    hrefToDiscoveryStudio
} from "../lib/handoff";
import { saveAgendaSnapshotToCloud } from "../lib/cloud-persistence";
import {
    matchedAccount,
    dealOptions
} from "../state";
import { OUTCOMES, OUTCOME_LABELS, type Outcome } from "../lib/types";

/**
 * Handoff — Wave 5 implementation.
 *
 * Three cross-room route CTAs (per legacy lines 855-873):
 *   - Open Discovery — writes the call_handoff payload first, then
 *     opens /app/discovery-studio/ with continuity params + ?account=
 *   - Open Deal Workspace — same persist-then-route, threading
 *     ?deal=<id> when a deal is linked
 *   - Copy agenda brief — copies buildAgendaBrief() output to clipboard
 *
 * Plus the outcome buttons (Wave 4) that bump
 * `gtmos_discovery_stats` + persist `gtmos_call_handoff`.
 *
 * The two cross-room anchor hrefs are computed at render time so they
 * stay live even when the operator hasn't typed anything yet (the
 * destination room will land on its empty state); the handoff PAYLOAD
 * is only written on click via persistAgendaState(null).
 */
export function Handoff(): JSX.Element {
    const [toast, setToast] = useState<string>("");
    function flash(msg: string): void {
        setToast(msg);
        setTimeout(() => setToast(""), 1800);
    }

    function onOutcome(o: Outcome): void {
        const result = logOutcome(o);
        flash(
            `Logged ${OUTCOME_LABELS[o].toLowerCase()} (score ${result.snapshot.score}/100).`
        );
        void saveAgendaSnapshotToCloud(result.snapshot);
    }

    const d = draft.value;
    const m = matchedAccount.value;
    const linked = linkedDeal.value;
    const company = currentCompany.value;
    const focusLabel =
        d.contactName.trim() || company || "Call Planner";

    function copyBrief(): void {
        const brief = buildAgendaBrief({
            draft: d,
            matchedAccount: m,
            linkedDeal: linked
        });
        if (
            typeof navigator === "undefined" ||
            !navigator.clipboard ||
            !navigator.clipboard.writeText
        ) {
            flash("Copy unavailable.");
            return;
        }
        navigator.clipboard
            .writeText(brief)
            .then(() => flash("Agenda brief copied."))
            .catch(() => flash("Copy failed."));
    }

    function openDiscovery(): void {
        // Persist as a call_plan first so Discovery Studio reads the
        // current agenda from gtmos_call_handoff on its boot.
        const result = persistAgendaState(null);
        void saveAgendaSnapshotToCloud(result.snapshot);
        if (typeof window === "undefined") return;
        window.location.href = hrefToDiscoveryStudio(
            focusLabel,
            company || ""
        );
    }

    function openDealWorkspace(): void {
        // Same persist-then-route. Thread ?deal=<id> so Deal Workspace
        // jumps to the linked deal directly.
        const result = persistAgendaState(null);
        void saveAgendaSnapshotToCloud(result.snapshot);
        if (typeof window === "undefined") return;
        const dealId = result.snapshot.linkedDeal || "";
        window.location.href = hrefToDealWorkspace(
            focusLabel,
            company || "",
            dealId
        );
    }

    // Sanity-check that all imports stay used by referencing evaluateQuality
    // for the readiness hint copy below.
    const quality = evaluateQuality({
        draft: d,
        matchedAccount: m,
        linkedDeal: linked
    });
    const readinessHint =
        quality.band === "credible"
            ? "Plan is credible. Run the call."
            : quality.band === "workable"
              ? "Plan is workable. Tighten the gaps before you dial."
              : "Plan is thin. Walk through the gates before sending the calendar invite.";
    void dealOptions;

    return (
        <section
            class="cp-handoff"
            aria-label="Cross-room handoff + outcomes"
        >
            <header class="cp-handoff__head">
                <div>
                    <p class="cp-handoff__kicker">ROUTE THE TRUTH FORWARD</p>
                    <h2 class="cp-handoff__title">
                        Do not let the script die in prep.
                    </h2>
                    <p class="cp-handoff__copy">{readinessHint}</p>
                </div>
                {toast ? (
                    <span class="cp-handoff__toast" role="status">
                        {toast}
                    </span>
                ) : null}
            </header>

            <nav class="cp-routes" aria-label="Cross-room routes">
                <button
                    type="button"
                    class="cp-route cp-route--primary"
                    onClick={openDiscovery}
                    data-cp-route="discovery-studio"
                >
                    Open Discovery
                </button>
                <button
                    type="button"
                    class="cp-route"
                    onClick={openDealWorkspace}
                    data-cp-route="deal-workspace"
                >
                    {linked ? "Open linked deal" : "Open Deal Workspace"}
                </button>
                <button
                    type="button"
                    class="cp-route cp-route--ghost"
                    onClick={copyBrief}
                    data-cp-route="copy-brief"
                >
                    Copy agenda brief
                </button>
            </nav>

            <hr class="cp-handoff__rule" aria-hidden="true" />

            <div class="cp-outcome-section">
                <p class="cp-outcome-section__label">Log call outcome</p>
                <div
                    class="cp-outcomes"
                    role="group"
                    aria-label="Log call outcome"
                >
                    {OUTCOMES.map((o) => (
                        <button
                            key={o}
                            type="button"
                            class={`cp-outcome cp-outcome--${o}`}
                            onClick={() => onOutcome(o)}
                            data-cp-outcome={o}
                        >
                            {OUTCOME_LABELS[o]}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
