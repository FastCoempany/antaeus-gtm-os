import type { JSX } from "preact";
import { advisors, recentDeployments } from "../state";

/**
 * SecondaryStack — Wave 1 placeholder.
 *
 * Wave 4 fills this with three accordion sheets: Advisor registry
 * (form + list with cooldown pills + remove), Deployment loops
 * (recent deployments with outcome <select>), Desk read (4-stat
 * impact grid + readline list + cross-room handoff CTAs).
 */
export function SecondaryStack(): JSX.Element {
    const advisorCount = advisors.value.length;
    const deploymentCount = recentDeployments.value.length;
    return (
        <section class="ad-secondary" aria-label="Advisor secondary sheets">
            <article class="ad-sheet">
                <header class="ad-sheet__head">
                    <div>
                        <p class="ad-sheet__kicker">ADVISOR REGISTRY</p>
                        <h2 class="ad-sheet__title">
                            Add relationships, attach them to companies.
                        </h2>
                    </div>
                </header>
                <p class="ad-sheet__placeholder">
                    {advisorCount === 0
                        ? "No advisors registered yet. Wave 4 wires the Save advisor form."
                        : `${advisorCount} advisor${advisorCount === 1 ? "" : "s"} registered. Wave 4 wires the live registry list.`}
                </p>
            </article>
            <article class="ad-sheet">
                <header class="ad-sheet__head">
                    <div>
                        <p class="ad-sheet__kicker">DEPLOYMENT LOOPS</p>
                        <h2 class="ad-sheet__title">
                            Every ask should return as a deal update.
                        </h2>
                    </div>
                </header>
                <p class="ad-sheet__placeholder">
                    {deploymentCount === 0
                        ? "No advisor asks logged yet. Wave 4 wires the outcome stamps + this ledger."
                        : `${deploymentCount} loop${deploymentCount === 1 ? "" : "s"} tracked. Wave 4 wires the live ledger.`}
                </p>
            </article>
            <article class="ad-sheet ad-sheet--wide">
                <header class="ad-sheet__head">
                    <div>
                        <p class="ad-sheet__kicker">DESK READ</p>
                        <h2 class="ad-sheet__title">
                            System health for outside leverage.
                        </h2>
                    </div>
                </header>
                <p class="ad-sheet__placeholder">
                    Wave 4 wires the 4-cell impact grid + readline list.
                    Wave 5 wires the 3-CTA cross-room handoff strip
                    (Deal Workspace / Future Autopsy / PoC Framework).
                </p>
            </article>
        </section>
    );
}
