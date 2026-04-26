import type { JSX } from "preact";
import { allAccounts, visibleAccounts } from "../state";
import { rankByHeat } from "../lib/heat";
import { AccountCard } from "./AccountCard";

/**
 * AccountGrid — Wave 3 implementation.
 *
 * Renders every visible account as a card, sorted by heat (descending,
 * stable on ties). Per canon §4.7: heat ranking IS the room's
 * organizing logic — no manual reorder, no drag handles, no manual
 * column choice. Stage is not truth unless heat backs it up.
 */
export function AccountGrid(): JSX.Element {
    const visible = visibleAccounts.value;
    const total = allAccounts.value.length;

    if (total === 0) {
        return (
            <section class="sc-grid sc-grid--empty" aria-label="Account grid">
                <p class="sc-grid__empty">
                    No accounts yet. Wave 4 wires persistence so accounts load
                    from `gtmos_sc_v4` (legacy) or the Phase 2.3 migration
                    blob; until then the room renders this empty shell.
                </p>
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
        <section class="sc-grid" aria-label="Account grid">
            <ul class="sc-grid__list">
                {ranked.map((a) => (
                    <li key={a.id}>
                        <AccountCard account={a} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
