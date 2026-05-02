import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { advisors, recentDeployments, selectedDeal } from "../state";

/**
 * Topbar — Wave 1.
 *
 * Per canon §4.16 the room is a "private influence desk." Topbar
 * carries the kicker + 4 quick action chips (legacy lines 53-57:
 * Reset route / Copy ask / Export pack / Log send) and a live count.
 * Wave 4 wires the action chips' onClick handlers into the persistence
 * layer.
 */
export function Topbar(): JSX.Element {
    const advisorCount = advisors.value.length;
    const deploymentCount = recentDeployments.value.length;
    const deal = selectedDeal.value;
    return (
        <header class="ad-topbar" aria-label="Advisor Deploy header">
            <BackButton />
            <div class="ad-topbar__mast">
                <p class="ad-topbar__kicker">
                    Live instrument · Backchannel desk
                </p>
                <h1 class="ad-topbar__title">
                    Influence is an asset. Spend it precisely.
                </h1>
                <p class="ad-topbar__count">
                    {advisorCount} {advisorCount === 1 ? "advisor" : "advisors"}{" "}
                    · {deploymentCount}{" "}
                    {deploymentCount === 1 ? "loop" : "loops"}
                    {deal ? ` · ${deal.accountName}` : ""}
                </p>
            </div>
            <div class="ad-topbar__actions" aria-hidden="true">
                {/* Wave 4 wires these to live persistence handlers. */}
            </div>
        </header>
    );
}
