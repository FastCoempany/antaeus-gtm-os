import type { JSX } from "preact";
import { recentIcps } from "../state";

/**
 * AnalyticsPanel — Wave 1 placeholder.
 *
 * Wave 4 fills this with the ICP library cards + cross-room outflow
 * preview ("This ICP becomes the Match score in Territory / Sourcing /
 * Signal Console / Outbound / Discovery / Readiness / Handoff").
 */
export function AnalyticsPanel(): JSX.Element {
    const recent = recentIcps.value;
    return (
        <section class="icp-analytics" aria-label="ICP analytics">
            <p class="icp-analytics__kicker">SAVED LIBRARY</p>
            <h2 class="icp-analytics__title">
                Each saved ICP becomes the filter every downstream room
                inherits.
            </h2>
            {recent.length === 0 ? (
                <p class="icp-analytics__empty">
                    No saved ICPs yet. Wave 4 wires the library list +
                    cross-room outflow preview.
                </p>
            ) : (
                <ul class="icp-analytics__list">
                    {recent.slice(0, 5).map((icp) => (
                        <li key={icp.id} class="icp-analytics__row">
                            <strong>{icp.industry || "Untitled"}</strong>
                            <small>
                                {icp.qualityScore}/100 quality · {icp.buyer}
                            </small>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
