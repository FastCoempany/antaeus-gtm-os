import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { signal, type Signal } from "@preact/signals";

/**
 * One-time Briefing explainer. It distinguishes account/deal changes,
 * market analysis, conflicting evidence, suggested accounts, and saved
 * monitoring rules without requiring private Antaeus terminology.
 */

const STORAGE_KEY = "gtmos_briefing_primer_seen_v2";
const dismissedSignal: Signal<boolean | null> = signal(null);

function readSeen(): boolean {
    if (typeof window === "undefined") return true;
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
        return true;
    }
}

function writeSeen(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
        // Storage disabled — the primer may reappear on a later visit.
    }
}

function dismiss(): void {
    writeSeen();
    dismissedSignal.value = true;
}

export function FirstVisitPrimer(): JSX.Element | null {
    if (dismissedSignal.value === null) {
        dismissedSignal.value = readSeen();
    }
    if (dismissedSignal.value) return null;

    return (
        <aside class="bf-primer" role="note" aria-label={t("What Briefing shows")}>
            <div class="bf-primer__head">
                <p class="bf-primer__kicker">{t("ABOUT BRIEFING")}</p>
                <button
                    type="button"
                    class="bf-primer__close"
                    onClick={dismiss}
                    aria-label={t("Dismiss primer")}
                    title={t("Dismiss")}
                >
                    ×
                </button>
            </div>
            <h2 class="bf-primer__headline">
                {t("Briefing summarizes changes in your deals and accounts, along with relevant developments in your market.", { class: "body" })}
            </h2>
            <p class="bf-primer__body">
                {t("Your account and deal activity is refreshed every 30 minutes. Market analysis is refreshed on Monday mornings.", { class: "body" })}
            </p>
            <ul class="bf-primer__list">
                <li>
                    <strong>{t("Changes in your deals and accounts")}</strong> — {t("material changes in active deals, watched accounts, and pilot evidence. Dismiss items that are not useful.", { class: "body" })}
                </li>
                <li>
                    <strong>{t("Market patterns")}</strong> — {t("recurring developments across your target market. Open the supporting evidence or continue into the relevant workspace.", { class: "body" })}
                </li>
                <li>
                    <strong>{t("Evidence that conflicts with an assumption")}</strong> — {t("cases where current data does not support an assumption recorded in your workspace.", { class: "body" })}
                </li>
                <li>
                    <strong>{t("Accounts to consider")}</strong> — {t("companies that repeatedly appear in relevant evidence but are not currently on your watchlist.", { class: "body" })}
                </li>
                <li>
                    <strong>{t("Saved monitoring rules")}</strong> — {t("events you have asked Antaeus to watch for. Matching events appear here when new data meets a rule.", { class: "body" })}
                </li>
            </ul>
            <button
                type="button"
                class="bf-primer__ack"
                onClick={dismiss}
            >
                {t("Got it")}
            </button>
        </aside>
    );
}

/** @internal — reset module signal between tests. */
export function __resetFirstVisitPrimerForTests(): void {
    dismissedSignal.value = null;
}
