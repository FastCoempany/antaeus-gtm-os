import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { logOutcome } from "../state";
import { OUTCOMES, OUTCOME_LABELS, type Outcome } from "../lib/types";

/**
 * Handoff — Wave 4 implementation (outcome capture only).
 *
 * Wave 5 wires the 3 cross-room route CTAs (Open Discovery Studio /
 * Open Deal Workspace / Copy brief). Wave 4 ships the outcome buttons
 * that bump `gtmos_discovery_stats` + persist `gtmos_call_handoff` so
 * the next session sees the latest call truth.
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
    }
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
                </div>
                {toast ? (
                    <span class="cp-handoff__toast" role="status">
                        {toast}
                    </span>
                ) : null}
            </header>
            <p class="cp-handoff__copy">
                Wave 5 wires the 3-route dock (Open Discovery Studio /
                Open Deal Workspace / Copy agenda brief). For now, log
                the outcome of the call you just ran — totals + advance
                rate are shared with Cold Call Studio's discovery stats.
            </p>
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
        </section>
    );
}
