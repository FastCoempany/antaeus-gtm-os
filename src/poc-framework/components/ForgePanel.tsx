import type { JSX } from "preact";

/**
 * ForgePanel — Wave 1 placeholder (left, dark "forge" half).
 *
 * Per canon §4.15 + Part II §4.8: dark forge / cream cast hybrid.
 * The forge is where the operator shapes the proof — claim, owner,
 * metric, kill rule. Wave 3 wires the form + heat ledger.
 */
export function ForgePanel(): JSX.Element {
    return (
        <section class="poc-forge" aria-label="Proof forge">
            <p class="poc-forge__kicker">FORGE</p>
            <h2 class="poc-forge__title">Shape the molds.</h2>
            <p class="poc-forge__placeholder">
                Wave 3 wires the proof form (account / vendor / owner /
                success criteria / kill rules / duration / outcome) plus
                the heat ledger (claim / owner / kill).
            </p>
        </section>
    );
}
