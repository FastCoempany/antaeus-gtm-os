import type { AccentRole } from "@/components";
import type { Account, HeatBand } from "../../lib/types";
import { heat as heatScore, heatMetrics } from "../../lib/heat";
import { getAccountExecutionContext } from "../../lib/execution-context";
import {
    hrefToDealWorkspace,
    hrefToOutbound
} from "../../lib/handoff";

/**
 * Pure adapters — map the Signal Console heat engine + execution
 * context onto the design-system components the DS surface composes.
 * The engine is untouched; these translate Accounts into card tone,
 * the heat Meter's read, and the Wayfinder pulling cell. Kept pure so
 * the mapping is unit-tested without rendering.
 */

/**
 * Heat band → the card's gauge/edge tone. Hot is the window-closing
 * urgency (red); Active is the motion-ready warm band (amber); Watch
 * is informational (blue); Low is the quiet neutral rule (no tone).
 * Orange is deliberately NOT used here — it stays rationed for the one
 * dominant move (the pulling cell + the primary CTA).
 */
const BAND_TONE: Record<HeatBand, AccentRole | undefined> = {
    Hot: "red",
    Active: "amber",
    Watch: "blue",
    Low: undefined
};

export function heatTone(band: HeatBand): AccentRole | undefined {
    return BAND_TONE[band];
}

/**
 * The heat Meter's read sentence (the library's one data-viz primitive
 * always pairs the bar with the sentence that carries the value). Heat
 * is a bounded 0–99 score; the read names the band + the count behind
 * it. "Hot · 84 — 3 signals, 1 recent".
 */
export interface HeatRead {
    readonly ratio: number;
    readonly read: string;
    readonly tone: AccentRole | undefined;
    readonly score: number;
    readonly band: HeatBand;
}

export function heatRead(account: Account, now?: number): HeatRead {
    const m = heatMetrics(account, now);
    const recentPhrase =
        m.recentCount > 0 ? `, ${m.recentCount} recent` : "";
    const signalPhrase =
        m.signalCount === 1 ? "1 signal" : `${m.signalCount} signals`;
    return {
        ratio: m.heat / 99,
        read: `${m.band} · ${m.heat} — ${signalPhrase}${recentPhrase}`,
        tone: heatTone(m.band),
        score: m.heat,
        band: m.band
    };
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the hottest account's one next move. If a
 * live deal exists the move is to open it; otherwise it's to compose
 * outbound at the account's temperature. The reasons carry the heat
 * read + the freshest signal headline. Absent when the radar is empty.
 */
export function toPulling(
    accounts: ReadonlyArray<Account>,
    now?: number
): PullingData | undefined {
    if (accounts.length === 0) return undefined;
    let top: Account | undefined;
    let topHeat = -1;
    for (const a of accounts) {
        const h = heatScore(a, now);
        if (h > topHeat) {
            topHeat = h;
            top = a;
        }
    }
    if (!top) return undefined;
    const exec = getAccountExecutionContext(top);
    const read = heatRead(top, now);
    const freshest = top.signals.find(
        (s) => s.status !== "flagged" && s.flagged !== true
    );
    const reasons: string[] = [read.read];
    const headline = freshest?.headline ?? freshest?.title;
    if (headline) reasons.push(headline);

    if (exec.hasActiveDeal) {
        return {
            verb: "Open the deal",
            object: top.name,
            href: hrefToDealWorkspace(top.name),
            reasons
        };
    }
    return {
        verb: "Compose outbound",
        object: top.name,
        href: hrefToOutbound(top.name, exec.temperature),
        reasons
    };
}
