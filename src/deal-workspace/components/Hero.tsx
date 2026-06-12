import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { exportDealsCsv, setDealFilter, setFolioTab } from "../state";

/**
 * Hero — left column of the stage-grid per variant-B.
 *
 * Deal Workspace audit (2026-05):
 *   - H1 demoted from hero weight; sub paragraph dropped (design
 *     documentation that competed with the work).
 *   - Three action buttons retired — they overlapped with the new
 *     deal list and FilterBar. The "open at-risk" intent is now the
 *     filter bar's primary chip; "one-session win" is reachable via
 *     the FolioDock tab.
 *   - Single quiet action remains: "Find weakest" — sets the filter
 *     + dock tab so the operator's first move from the hero is
 *     unambiguous.
 */
export function Hero(): JSX.Element {
    return (
        <section class="dw-hero" aria-label={t("Deal workspace headline")}>
            <p class="dw-hero__eyebrow">{t("Deal review")}</p>
            <h1 class="dw-hero__title">
                {t("Make the board confess where it is weak.", {
                    class: "body"
                })}
            </h1>
            <button
                type="button"
                class="dw-hero__btn dw-hero__btn--primary"
                onClick={() => {
                    setDealFilter("at-risk");
                    setFolioTab("queue");
                }}
            >
                {t("Find weakest")} →
            </button>
            <button
                type="button"
                class="dw-hero__export"
                onClick={() => {
                    void exportDealsCsv();
                }}
                title={t("Download your pipeline as CSV", { class: "body" })}
            >
                {t("Export pipeline (CSV)")}
            </button>
        </section>
    );
}
