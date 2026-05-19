import type { JSX } from "preact";
import { allAccounts, inboundFocus, visibleAccounts } from "../state";
import { rankByHeat } from "../lib/heat";
import { AccountCard } from "./AccountCard";
import { AddAccountForm } from "./AddAccountForm";
import { HeatBandBanner } from "./HeatBandBanner";

/**
 * AccountGrid — heat-ranked account cards.
 *
 * Per canon §4.7: heat ranking IS the room's organizing logic. No
 * manual reorder, no drag handles, no manual column choice. Stage is
 * not truth unless heat backs it up.
 *
 * Signal Console audit (2026-05) deltas:
 *   - Empty state rewritten to operator-direct prose with the Add
 *     form embedded as the dominant CTA (was: developer narration
 *     mentioning "Wave 4", "gtmos_sc_v4", and "empty shell").
 *   - HeatBandBanner shows above the grid on first non-empty load
 *     (dismissable, once per workspace).
 */
export function AccountGrid(): JSX.Element {
    const visible = visibleAccounts.value;
    const total = allAccounts.value.length;

    if (total === 0) {
        // Phase 2.3 — if upstream (ICP Studio / Territory / Sourcing)
        // handed us a focusObject, surface it in the empty state so
        // the operator sees the ICP context the radar is targeting
        // against, and the inbound account hint is acknowledged.
        const focus = inboundFocus.value;
        return (
            <section class="sc-grid sc-grid--empty" aria-label="Get started">
                <div class="sc-empty">
                    <p class="sc-empty__kicker">
                        {focus
                            ? `TARGETING: ${focus}`
                            : "NO ACCOUNTS ON THE RADAR YET"}
                    </p>
                    <h2 class="sc-empty__title">
                        {focus
                            ? `Add the first ${focus.toLowerCase().includes("freight") || focus.toLowerCase().includes("logistics") ? "company" : "account"} that fits the ICP.`
                            : "Drop in the first one — anything you've been watching."}
                    </h2>
                    <p class="sc-empty__body">
                        {focus
                            ? `Anything you've been watching that matches the ICP. Once one account is in, the room starts ranking accounts by how hot their signals are.`
                            : "A customer mentioned them. An exec from the company posted something. You saw them in a competitor's case study. The room starts ranking accounts by signal strength the moment one account is in."}
                    </p>
                    <AddAccountForm embedded />
                </div>
            </section>
        );
    }

    if (visible.length === 0) {
        return (
            <section class="sc-grid sc-grid--empty" aria-label="Account grid">
                <p class="sc-grid__empty">No accounts match the current filter.</p>
            </section>
        );
    }

    const ranked = rankByHeat(visible);

    return (
        <>
            <HeatBandBanner />
            <section class="sc-grid" aria-label="Account grid">
                <ul class="sc-grid__list">
                    {ranked.map((a) => (
                        <li key={a.id}>
                            <AccountCard account={a} />
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
}
