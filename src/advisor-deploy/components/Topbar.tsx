import type { JSX } from "preact";
import { advisors, recentDeployments, selectedDeal } from "../state";

/**
 * Topbar — Advisor Deploy header.
 *
 * Per canon §4.16 the room is a "private influence desk." Topbar
 * carries the kicker + a live count of advisors / asks logged and
 * the focused deal (when one is selected).
 */
export function Topbar(): JSX.Element {
    const advisorCount = advisors.value.length;
    const deploymentCount = recentDeployments.value.length;
    const deal = selectedDeal.value;
    const tail = `${advisorCount} ${advisorCount === 1 ? "advisor" : "advisors"} · ${deploymentCount} ${deploymentCount === 1 ? "ask logged" : "asks logged"}${deal ? ` · ${deal.accountName}` : ""}`;
    return (
        <header class="ad-topbar" aria-label="Advisor Deploy header">
            <div class="ad-topbar__mast">
                <p class="ad-topbar__kicker">ADVISOR DEPLOY · {tail}</p>
                <h1 class="ad-topbar__title">
                    Influence is an asset. Spend it precisely.
                </h1>
            </div>
        </header>
    );
}
