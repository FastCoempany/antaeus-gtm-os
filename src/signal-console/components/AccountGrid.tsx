import type { JSX } from "preact";
import { allAccounts, visibleAccounts } from "../state";
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
        return (
            <section class="sc-grid sc-grid--empty" aria-label="Get started">
                <div class="sc-empty">
                    <p class="sc-empty__kicker">No accounts on the radar yet</p>
                    <h2 class="sc-empty__title">
                        Drop in the first one — anything you've been watching.
                    </h2>
                    <p class="sc-empty__body">
                        A customer mentioned them. An exec from the company
                        posted something. You saw them in a competitor's
                        case study. Whatever caught your attention. The room
                        starts ranking heat the moment one account is in.
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
