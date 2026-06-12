import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { callStats, selectedAccountName } from "../state";

/**
 * Topbar — kicker + headline (demoted) + a single live meta line.
 *
 * Cold Call Studio audit (2026-05):
 *   - BackButton removed — primary destination.
 *   - "Calls family · Live instrument" kicker replaced with the
 *     operator-facing kicker pattern the rest of the rooms use
 *     ("COLD CALL STUDIO · N calls logged").
 *   - H1 demoted from hero weight — the thread rail is the page's
 *     working hero.
 *   - Subtitle paragraph ("Six threads. Pull one at a time…") retired
 *     — design philosophy, not operator info.
 *   - Meta line simplified: "Talk loom · Acme" → "Acme on line"
 *     (more direct), or hidden when no account is selected.
 */
export function Topbar(): JSX.Element {
    const stats = callStats.value;
    const account = selectedAccountName.value;
    return (
        <header class="cc-topbar" aria-label={t("Cold Call Studio header")}>
            <p class="cc-topbar__kicker">
                COLD CALL STUDIO ·{" "}
                {stats.total > 0
                    ? `${stats.total} ${stats.total === 1 ? "call" : "calls"} logged${
                          stats.meetings > 0
                              ? ` · ${stats.meetings} meetings`
                              : ""
                      }`
                    : "no calls yet"}
            </p>
            <h1 class="cc-topbar__title">
                Weave opener, objection, proof, and ask into one live route.
            </h1>
            {account ? (
                <p class="cc-topbar__on-line" role="status">
                    On line: <strong>{account}</strong>
                </p>
            ) : null}
        </header>
    );
}
