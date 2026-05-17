import type { JSX } from "preact";
import { recentIcps, removeSavedIcp, totalWorked } from "../state";
import type { QualityTier } from "../lib/types";
import {
    hrefToOutboundStudio,
    hrefToSignalConsole,
    hrefToSourcingWorkbench,
    hrefToTerritoryArchitect
} from "../lib/handoff";
import { deleteIcpInCloud } from "../lib/cloud-persistence";

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
                <p class="icp-analytics__kicker">SAVED ICPS</p>
                <h2 class="icp-analytics__title">
                    Your saved wedges, sharpest first.
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
                    No saved ICPs yet. Fill in the inputs above and click
                    "Save ICP to library" to start the library.
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
                                    onClick={() => {
                                        removeSavedIcp(icp.id);
                                        void deleteIcpInCloud(icp.id);
                                    }}
                                    aria-label={`Remove ${icp.industry}`}
                                >
                                    Remove
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <footer class="icp-outflow" aria-label="Use this ICP">
                <p class="icp-outflow__kicker">USE THIS ICP</p>
                <p class="icp-outflow__copy">
                    {recent[0]?.industry
                        ? `Take ${recent[0].industry} downstream — territory, prospects, live signals, or outbound.`
                        : "Save your first ICP above to start handing it off."}
                </p>
                <nav class="icp-handoffs" aria-label="Cross-room handoff">
                    <a
                        class="icp-handoff icp-handoff--primary"
                        href={hrefToTerritoryArchitect(
                            recent[0]?.industry ?? ""
                        )}
                    >
                        Build the territory
                    </a>
                    <a
                        class="icp-handoff"
                        href={hrefToSourcingWorkbench(
                            recent[0]?.industry ?? ""
                        )}
                    >
                        Source named prospects
                    </a>
                    <a
                        class="icp-handoff"
                        href={hrefToSignalConsole(recent[0]?.industry ?? "")}
                    >
                        Rank live signals
                    </a>
                    <a
                        class="icp-handoff"
                        href={hrefToOutboundStudio(recent[0]?.industry ?? "")}
                    >
                        Compose outbound
                    </a>
                </nav>
            </footer>
        </section>
    );
}
