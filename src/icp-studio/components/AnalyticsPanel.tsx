import type { JSX } from "preact";
import { recentIcps, removeSavedIcp, totalWorked } from "../state";
import type { QualityTier } from "../lib/types";

/**
 * AnalyticsPanel — Wave 4 implementation.
 *
 * Renders the saved ICP library + the "downstream uses" preview.
 * Wave 5 will wire the actual cross-room handoff CTAs (Open Territory
 * Architect, Open Sourcing Workbench, etc.) but the outflow note is
 * already in canon §4.4 — surface it now so operators see the chain.
 */

const TIER_LABELS: Readonly<Record<QualityTier, string>> = {
    sharp: "Sharp",
    workable: "Workable",
    forming: "Forming",
    broad: "Broad"
};

function fmtDate(iso: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    }).format(d);
}

function tierFromScore(score: number): QualityTier {
    if (score >= 85) return "sharp";
    if (score >= 70) return "workable";
    if (score >= 50) return "forming";
    return "broad";
}

export function AnalyticsPanel(): JSX.Element {
    const recent = recentIcps.value;
    const worked = totalWorked.value;
    const sharpCount = recent.filter(
        (i) => tierFromScore(i.qualityScore) === "sharp"
    ).length;
    const workableCount = recent.filter(
        (i) => tierFromScore(i.qualityScore) === "workable"
    ).length;

    return (
        <section class="icp-analytics" aria-label="ICP analytics">
            <header class="icp-analytics__head">
                <p class="icp-analytics__kicker">SAVED LIBRARY</p>
                <h2 class="icp-analytics__title">
                    Each saved ICP becomes the filter every downstream room
                    inherits.
                </h2>
            </header>

            <div class="icp-stats" aria-label="ICP library stats">
                <div class="icp-stat">
                    <p class="icp-stat__value">{recent.length}</p>
                    <p class="icp-stat__label">saved</p>
                </div>
                <div class="icp-stat">
                    <p class="icp-stat__value icp-stat__value--green">
                        {sharpCount}
                    </p>
                    <p class="icp-stat__label">sharp</p>
                </div>
                <div class="icp-stat">
                    <p class="icp-stat__value icp-stat__value--orange">
                        {workableCount}
                    </p>
                    <p class="icp-stat__label">workable</p>
                </div>
                <div class="icp-stat">
                    <p class="icp-stat__value">{worked}</p>
                    <p class="icp-stat__label">sessions</p>
                </div>
            </div>

            {recent.length === 0 ? (
                <p class="icp-analytics__empty">
                    No saved ICPs yet. Compose the wedge above and click
                    "Save ICP to library" to populate this list.
                </p>
            ) : (
                <ul class="icp-library">
                    {recent.slice(0, 8).map((icp) => {
                        const tier = tierFromScore(icp.qualityScore);
                        return (
                            <li
                                key={icp.id}
                                class={`icp-library__row icp-library__row--${tier}`}
                            >
                                <div class="icp-library__main">
                                    <strong>
                                        {icp.industry || "Untitled"}
                                    </strong>
                                    <small>
                                        {icp.buyer} ·{" "}
                                        {icp.pain || "—"} · {fmtDate(icp.updatedAt)}
                                    </small>
                                </div>
                                <span
                                    class={`icp-library__score icp-library__score--${tier}`}
                                >
                                    {icp.qualityScore}/100 · {TIER_LABELS[tier]}
                                </span>
                                <button
                                    type="button"
                                    class="icp-library__remove"
                                    onClick={() => removeSavedIcp(icp.id)}
                                    aria-label={`Remove ${icp.industry}`}
                                >
                                    Remove
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <footer class="icp-outflow" aria-label="Downstream uses">
                <p class="icp-outflow__kicker">DOWNSTREAM USES</p>
                <ul class="icp-outflow__list">
                    <li>
                        <strong>Territory Architect:</strong> tiers + theses
                        match against this ICP's industry/buyer/pain.
                    </li>
                    <li>
                        <strong>Sourcing Workbench:</strong> query cards filter
                        by industry + size + geo from this wedge.
                    </li>
                    <li>
                        <strong>Signal Console:</strong> account heat
                        prioritizes ICP-match accounts first.
                    </li>
                    <li>
                        <strong>Outbound Studio + Discovery Studio:</strong>{" "}
                        persona + trigger context flows through.
                    </li>
                    <li>
                        <strong>Readiness + Handoff:</strong> ICP sharpness
                        feeds the readiness score + the export package.
                    </li>
                </ul>
            </footer>
        </section>
    );
}
