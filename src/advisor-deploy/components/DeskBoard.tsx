import type { JSX } from "preact";
import { selectedAdvisor, selectedDeal } from "../state";

/**
 * DeskBoard — Wave 1 placeholder.
 *
 * Wave 3 fills this with: hero (title + spend-read aside) + 3-cell
 * route bar (Deal / Carrier / Ask moment) + the desktop layout
 * (proof blotter + rolodex + ask sheet + 3 stamps + desk-edge).
 */
export function DeskBoard(): JSX.Element {
    const deal = selectedDeal.value;
    const advisor = selectedAdvisor.value;
    return (
        <section class="ad-desk" aria-labelledby="adDeskTitle">
            <div class="ad-desk__hero">
                <div>
                    <p class="ad-desk__kicker">PRIVATE INFLUENCE DESK</p>
                    <h1 class="ad-desk__title" id="adDeskTitle">
                        Prepare one backchannel ask before you spend trust.
                    </h1>
                    <p class="ad-desk__note">
                        Choose the live deal, pick the carrier, and ship
                        only the ask that is specific enough for an
                        advisor to act on without interpreting the deal.
                    </p>
                </div>
                <aside class="ad-desk__read" aria-label="Spend read">
                    <p class="ad-desk__read-kicker">SPEND READ</p>
                    <p class="ad-desk__read-state">Wave 2 wires this</p>
                </aside>
            </div>
            <div class="ad-desk__placeholder">
                <p>
                    {deal
                        ? `Deal active: ${deal.accountName}.`
                        : "No deal selected."}{" "}
                    {advisor
                        ? `Carrier: ${advisor.name}.`
                        : "No advisor selected."}{" "}
                    Wave 3 wires the live desktop (proof blotter +
                    rolodex + ask sheet + outcome stamps).
                </p>
            </div>
        </section>
    );
}
