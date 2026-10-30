import type { Account, Signal } from "../../lib/types";
import { heat as heatOf, rankByHeat } from "../../lib/heat";

/**
 * Signal Console account-priority grouping.
 *
 * Stable internal band ids and the existing numeric heat engine remain in
 * place for compatibility. User-facing labels describe account priority,
 * signal recency, and the evidence that drives attention.
 */

export type AttentionBand = "now" | "warm" | "emerging" | "cold";

export interface BandMeta {
    readonly key: AttentionBand;
    readonly label: string;
    readonly why: string;
}

export const BAND_META: Record<AttentionBand, BandMeta> = {
    now: {
        key: "now",
        label: "High priority",
        why: "high account-priority score with recent activity"
    },
    warm: {
        key: "warm",
        label: "Priority declining",
        why: "the account still ranks highly, but its most recent signal is becoming older"
    },
    emerging: {
        key: "emerging",
        label: "New signals",
        why: "recent account activity increased this account's priority"
    },
    cold: {
        key: "cold",
        label: "Monitor",
        why: "low recent activity or no current high-priority signal"
    }
};

export const BAND_ORDER: ReadonlyArray<AttentionBand> = ["now", "warm", "emerging", "cold"];

const DAY = 86_400_000;

function daysSince(iso: string | undefined, now: number): number | null {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return null;
    return Math.max(0, (now - t) / DAY);
}

function signalDate(sig: Signal): string | undefined {
    return sig.published_date ?? sig.fetched_at;
}

/** Days since the freshest signal or the account's watch date. */
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

/**
 * Classify one account using the existing internal score plus signal age.
 * The stable thresholds remain unchanged; only the customer-facing names
 * for those groups have been translated.
 */
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
    /** Stable internal score field; present to the UI as account priority. */
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
            ? `${needNow} ${needNow === 1 ? "account is" : "accounts are"} currently high priority`
            : shape.warm > 0
              ? "No high-priority accounts right now; review accounts whose signals are becoming older"
              : "No current high-priority accounts; continue monitoring for new signals";

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
