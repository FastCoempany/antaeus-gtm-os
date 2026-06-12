import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { hottestAccount, stats } from "../state";

/**
 * Topbar — kicker + headline (demoted) + a single status line.
 *
 * LinkedIn Playbook audit (2026-05):
 *   - BackButton removed — primary destination.
 *   - "Outbound channel · Live instrument" kicker (internal arch
 *     language) replaced with the standard operator-facing pattern
 *     every other room uses.
 *   - H1 demoted from hero weight — the cue booth is the page's
 *     working hero.
 *   - Subtitle paragraph ("Five cues, ladder-ordered…") retired —
 *     was design documentation. The 5-cue ladder visible below
 *     conveys this on render.
 *   - Meta line simplified: "Cue booth · Acme" → "On the radar:
 *     Acme" (when an account is hottest); count + acceptance moved
 *     into the kicker.
 */
export function Topbar(): JSX.Element {
    const s = stats.value;
    const acct = hottestAccount.value;
    return (
        <header class="lp-topbar" aria-label={t("LinkedIn Playbook header")}>
            <p class="lp-topbar__kicker">
                LINKEDIN PLAYBOOK ·{" "}
                {s.total > 0
                    ? `${s.total} ${s.total === 1 ? "cue" : "cues"} logged${
                          s.acceptRate > 0
                              ? ` · ${s.acceptRate}% accepted`
                              : ""
                      }`
                    : "no cues yet"}
            </p>
            <h1 class="lp-topbar__title">
                Enter only when the room gives a cue.
            </h1>
            {acct ? (
                <p class="lp-topbar__on-radar" role="status">
                    On the radar: <strong>{acct.name}</strong>
                </p>
            ) : null}
        </header>
    );
}
