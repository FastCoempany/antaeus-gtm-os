import type { JSX } from "preact";
import type { Account } from "../lib/types";
import { heatBand, heatCls, heat as heatScore } from "../lib/heat";

interface Props {
    readonly account: Account;
    readonly now?: number;
}

/**
 * HeatBadge — the numeric score + band label rendered on each card.
 *
 * Colour comes from heatCls (h-hot / h-warm / h-med / h-cool) so the
 * legacy room's CSS variable mapping carries forward without
 * retranslation.
 */
export function HeatBadge({ account, now }: Props): JSX.Element {
    const score = heatScore(account, now);
    const cls = heatCls(score);
    const band = heatBand(score);
    return (
        <span class={`sc-heat sc-heat--${cls}`} aria-label={`Heat ${score} (${band})`}>
            <span class="sc-heat__score">{score}</span>
            <span class="sc-heat__band">{band}</span>
        </span>
    );
}
