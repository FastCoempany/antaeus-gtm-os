import type { Account, Signal } from "../../lib/types";
import { heat as heatOf, rankByHeat } from "../../lib/heat";

/**
 * Signal Console v4 — the Attention Router (canon §4.7). Groups the
 * watched field by WHERE ATTENTION SHOULD GO, not by a bare heat number:
 * four bands — act now / reach while warm / emerging / going cold —
 * from heat × freshness, so relevance is felt as distance. The heat
 * engine (heat/recency/rankByHeat) is reused unchanged; this module is
 * the band classifier + the shape/posture/health reads over it.
 *
 * A protected room (canon §5): signal interpretation, account-to-motion
 * logic, and account-priority meaning must survive — never a badge list.
 */

export type AttentionBand = "now" | "warm" | "emerging" | "cold";

export interface BandMeta {
    readonly key: AttentionBand;
    readonly label: string;
    readonly why: string;
}

export const BAND_META: Record<AttentionBand, BandMeta> = {
    now: { key: "now", label: "Act now", why: "hot, and something just moved" },
    warm: {
        key: "warm",
        label: "Reach while warm",
        why: "still hot, but the signal is aging — go before it cools"
    },
    emerging: {
        key: "emerging",
        label: "Emerging",
        why: "a fresh trigger, heat still building — get in early"
    },
    cold: { key: "cold", label: "Going cold", why: "was warm, now quiet" }
};

export const BAND_ORDER: ReadonlyArray<AttentionBand> = ["now", "warm", "emerging", "cold"];

const DAY = 86_400_000;

/** Days since a date string; null when unparseable. */
function daysSince(iso: string | undefined, now: number): number | null {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return null;
    return Math.max(0, (now - t) / DAY);
}

/** The freshest signal's date. */
function signalDate(sig: Signal): string | undefined {
    return sig.published_date ?? sig.fetched_at;
}

/**
 * How many days since the freshest thing on this account — a signal OR
 * the account being added (a brand-new watch is "fresh" so it lands in
 * Emerging, not Going cold, exactly as the mockup promises).
 */
export function freshestDays(account: Account, now: number): number | null {
    const candidates: number[] = [];
    for (const s of account.signals) {
        const d = daysSince(signalDate(s), now);
        if (d != null) candidates.push(d);
    }
    const created = daysSince(account.created_at, now);
    if (created != null) candidates.push(created);
    if (candidates.length === 0) return null;
    return Math.min(...candidates);
}

/** Classify one account into an attention band (heat × freshness). */
export function classifyBand(account: Account, now: number = Date.now()): AttentionBand {
    const h = heatOf(account, now);
    const fd = freshestDays(account, now);
    const fresh = fd != null && fd <= 2;
    if (h >= 78 && fresh) return "now";
    if (h >= 60) return "warm";
    if (fd != null && fd <= 7) return "emerging";
    return "cold";
}

export interface RankedAccount {
    readonly account: Account;
    readonly heat: number;
    readonly ageLabel: string;
}

export interface BandGroup extends BandMeta {
    readonly accounts: ReadonlyArray<RankedAccount>;
}

export interface AttentionField {
    readonly bands: ReadonlyArray<BandGroup>;
    readonly shape: Record<AttentionBand, number>;
    readonly posture: string;
    readonly needNow: number;
    readonly accountsWatched: number;
    readonly signalsThisWeek: number;
    readonly compounding: number;
    readonly stillWeak: number;
}

function ageLabel(account: Account, now: number): string {
    const fd = freshestDays(account, now);
    if (fd == null) return "no signals yet";
    if (fd < 1) {
        const hours = Math.max(1, Math.round(fd * 24));
        return `${hours}h ago`;
    }
    return `${Math.round(fd)}d ago`;
}

/** The whole attention field: bands (ranked within), the shape, posture, health. */
export function buildAttentionField(
    accounts: ReadonlyArray<Account>,
    now: number = Date.now()
): AttentionField {
    const buckets: Record<AttentionBand, Account[]> = { now: [], warm: [], emerging: [], cold: [] };
    let signalsThisWeek = 0;
    let compounding = 0;
    let stillWeak = 0;

    for (const a of accounts) {
        buckets[classifyBand(a, now)].push(a);
        for (const s of a.signals) {
            const d = daysSince(signalDate(s), now);
            if (d != null && d <= 7) signalsThisWeek += 1;
        }
        const h = heatOf(a, now);
        if (h >= 60) compounding += 1;
        else if (h < 40) stillWeak += 1;
    }

    const bands: BandGroup[] = BAND_ORDER.map((key) => ({
        ...BAND_META[key],
        accounts: rankByHeat(buckets[key], now).map((account) => ({
            account,
            heat: heatOf(account, now),
            ageLabel: ageLabel(account, now)
        }))
    }));

    const shape: Record<AttentionBand, number> = {
        now: buckets.now.length,
        warm: buckets.warm.length,
        emerging: buckets.emerging.length,
        cold: buckets.cold.length
    };
    const needNow = shape.now;
    const posture =
        needNow > 0
            ? `Motion-ready — ${needNow} ${needNow === 1 ? "needs" : "need"} action now`
            : shape.warm > 0
              ? "Warming up — reach the warm accounts before they cool"
              : "Research-heavy — build signal before you strike";

    return {
        bands,
        shape,
        posture,
        needNow,
        accountsWatched: accounts.length,
        signalsThisWeek,
        compounding,
        stillWeak
    };
}
