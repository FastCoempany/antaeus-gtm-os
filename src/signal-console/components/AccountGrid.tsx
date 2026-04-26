import type { JSX } from "preact";
import { visibleAccounts, allAccounts } from "../state";

/**
 * AccountGrid — Wave 1 placeholder.
 *
 * Per canon §4.7 the grid is the room's primary working surface:
 * accounts ranked by heat, each card showing signals + execution
 * context. Wave 3 wires the cards + heat sort + expand/collapse.
 *
 * Wave 1 renders the empty / no-match shells so layout + smoke test
 * land cleanly.
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

    return (
        <section class="sc-grid" aria-label="Account grid">
            <p class="sc-grid__placeholder">
                Wave 3 wires the account cards. {visible.length} account
                {visible.length === 1 ? "" : "s"} would render here.
            </p>
        </section>
    );
}
