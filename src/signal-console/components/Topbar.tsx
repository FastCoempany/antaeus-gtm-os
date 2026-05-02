import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { allAccounts } from "../state";

/**
 * Topbar — kicker + serif thesis title + account count meter.
 *
 * Per canon §4.7 (Live Instrument family): "the live radar where
 * account heat becomes real work." The topbar is calm; the work is
 * the account grid below it.
 */
export function Topbar(): JSX.Element {
    const count = allAccounts.value.length;
    return (
        <header class="sc-topbar">
            <BackButton />
            <p class="sc-topbar__kicker">
                SIGNAL CONSOLE ·{" "}
                {count > 0
                    ? `${count} account${count === 1 ? "" : "s"} loaded`
                    : "no accounts yet"}
            </p>
            <h1 class="sc-topbar__title">
                Where account heat becomes real work.
            </h1>
            <p class="sc-topbar__sub">
                Signals are time-limited. Heat ranks them. Motion comes from
                the account ledger — not from research piling up.
            </p>
        </header>
    );
}
