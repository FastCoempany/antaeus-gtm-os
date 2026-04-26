import type { Account, HeatBand, HeatMetrics, Signal } from "./types";

/**
 * Phase 4 / Room 3 Wave 2 — heat scoring.
 *
 * Faithful port of the legacy `app/signal-console/index.html` heat
 * functions (lines 1271-1333). No behavioral changes — same inputs
 * produce identical outputs.
 *
 * Per canon §4.7 (Signal Console mind):
 *   heat = signal count × type weight × source credibility × recency decay
 *
 * Concretely (legacy implementation):
 *   for each non-flagged signal:
 *     base = is_ai ? 18 : 12
 *     conf_bonus = confidence >= 0.9 ? 5 : 0
 *     heat += (base + conf_bonus) * recency_decay(signal)
 *   heat = clamp(round(heat), 0, 99)
 *
 * Recency decay falls in 6 steps from 1.0 (≤14 days) to 0.1 (>180 days).
 * Heat band: ≥91 Hot, ≥75 Active, ≥50 Watch, else Low.
 *
 * Heat is computed (not stored). Source-of-truth: signals + their
 * timestamps. Storing heat would let it go stale.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Pure for testing — defaults to wallclock if `now` is omitted. */
export function recency(sig: Signal | null | undefined, now: number = Date.now()): number {
    const stamp = sig?.published_date ?? sig?.fetched_at ?? sig?.capturedAt ?? "2024-01-01";
    const t = new Date(stamp).getTime();
    if (Number.isNaN(t)) return 0.1;
    const days = (now - t) / DAY_MS;
    if (days <= 14) return 1;
    if (days <= 30) return 0.9;
    if (days <= 60) return 0.75;
    if (days <= 90) return 0.55;
    if (days <= 180) return 0.3;
    return 0.1;
}

function isFlagged(sig: Signal): boolean {
    if (sig.status === "flagged") return true;
    if (sig.flagged === true) return true;
    return false;
}

function isAi(sig: Signal): boolean {
    return !!(sig.is_ai || sig.ai);
}

function activeSignals(account: Account): ReadonlyArray<Signal> {
    return account.signals.filter((s) => !isFlagged(s));
}

export function heat(account: Account, now: number = Date.now()): number {
    const sigs = activeSignals(account);
    let score = 0;
    for (const s of sigs) {
        const base = isAi(s) ? 18 : 12;
        const conf = (s.confidence ?? 0.65) >= 0.9 ? 5 : 0;
        score += (base + conf) * recency(s, now);
    }
    return Math.min(99, Math.max(0, Math.round(score)));
}

/**
 * Heat band — same 4-state vocabulary the legacy room exposes. Keep
 * the cutoffs verbatim; downstream rooms (Dashboard) bind to these
 * labels.
 */
export function heatBand(score: number): HeatBand {
    if (score >= 91) return "Hot";
    if (score >= 75) return "Active";
    if (score >= 50) return "Watch";
    return "Low";
}

/**
 * Heat band's CSS class (h-hot / h-warm / h-med / h-cool). Preserved
 * for parity with the legacy classnames so reused styles don't have
 * to be retranslated.
 */
export function heatCls(score: number): string {
    if (score >= 91) return "h-hot";
    if (score >= 75) return "h-warm";
    if (score >= 50) return "h-med";
    return "h-cool";
}

export function heatMetrics(account: Account, now: number = Date.now()): HeatMetrics {
    const sigs = activeSignals(account);
    const recentCount = sigs.filter((s) => recency(s, now) >= 0.75).length;
    const highConfidenceCount = sigs.filter((s) => (s.confidence ?? 0) >= 0.9).length;
    const aiCount = sigs.filter(isAi).length;
    const triggerCount = sigs.filter((s) => s.cat === "trigger_event").length;
    const avgRecency = sigs.length
        ? sigs.reduce((acc, s) => acc + recency(s, now), 0) / sigs.length
        : 0;
    const score = heat(account, now);
    return {
        heat: score,
        band: heatBand(score),
        signalCount: sigs.length,
        recentCount,
        highConfidenceCount,
        aiCount,
        triggerCount,
        avgRecency: Math.round(avgRecency * 100)
    };
}

/**
 * Sort accounts by heat (desc). Stable on equal score — preserves
 * the input order so the operator's manual additions don't reshuffle.
 */
export function rankByHeat(
    accounts: ReadonlyArray<Account>,
    now: number = Date.now()
): ReadonlyArray<Account> {
    const scored = accounts.map((a, i) => ({ a, i, h: heat(a, now) }));
    scored.sort((x, y) => {
        if (y.h !== x.h) return y.h - x.h;
        return x.i - y.i;
    });
    return scored.map((s) => s.a);
}
