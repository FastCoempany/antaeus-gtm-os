import type { JSX } from "preact";
import { useState } from "preact/hooks";

/**
 * HeatBandBanner — one-time explainer for the heat band thresholds.
 *
 * Per Signal Console audit (2026-05): the first time Sarah sees a card
 * reading "Heat 64 · Watch" she has no idea if that's good or bad.
 * This banner names the bands once + can be dismissed permanently.
 *
 * Dismissal persists via localStorage so the operator only ever sees
 * this once per browser. The banner uses semantic colors that match
 * the heat-badge classes so the operator pattern-matches across views.
 */

const DISMISS_KEY = "gtmos_sc_heat_bands_dismissed";

function readDismissed(): boolean {
    try {
        return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
        return false;
    }
}

function persistDismissal(): void {
    try {
        localStorage.setItem(DISMISS_KEY, "1");
    } catch {
        // Hostile localStorage (quota / privacy mode) → banner re-appears
        // next session. Acceptable for an explainer this small.
    }
}

export function HeatBandBanner(): JSX.Element | null {
    const [dismissed, setDismissed] = useState(readDismissed());
    if (dismissed) return null;

    function handleDismiss(): void {
        persistDismissal();
        setDismissed(true);
    }

    return (
        <aside class="sc-heat-banner" aria-label="How heat scores work">
            <div class="sc-heat-banner__body">
                <p class="sc-heat-banner__kicker">How heat works</p>
                <p class="sc-heat-banner__copy">
                    Each card's heat score blends signal volume, recency, and
                    confidence into one number, then bands it:
                </p>
                <ul class="sc-heat-banner__bands">
                    <li>
                        <span class="sc-heat-banner__chip sc-heat-banner__chip--hot">
                            91+ Hot
                        </span>{" "}
                        — act this week, the window is now
                    </li>
                    <li>
                        <span class="sc-heat-banner__chip sc-heat-banner__chip--active">
                            75+ Active
                        </span>{" "}
                        — motion-ready, the room treats these as primary work
                    </li>
                    <li>
                        <span class="sc-heat-banner__chip sc-heat-banner__chip--watch">
                            50+ Watch
                        </span>{" "}
                        — keep an eye on; not urgent
                    </li>
                    <li>
                        <span class="sc-heat-banner__chip sc-heat-banner__chip--low">
                            &lt;50 Low
                        </span>{" "}
                        — quiet, but staying on the board doesn't cost anything
                    </li>
                </ul>
            </div>
            <button
                type="button"
                class="sc-heat-banner__close"
                onClick={handleDismiss}
                aria-label="Dismiss heat band explainer"
            >
                ×
            </button>
        </aside>
    );
}
