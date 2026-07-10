import { t } from "@/lib/voice/t";

/**
 * Bulk outreach counts — the five-second answer to the logging tax.
 *
 * The pace read measures your actuals from LOGGED touches, but nobody
 * hand-logs 90 sends a day — so pace read "behind" even when the work
 * happened. This lets the operator type one number at the end of the
 * day ("about 40 today") and have the pace math count it. Per-account
 * logging stays for the touches that matter (a reply, a meeting); the
 * daily volume count stops depending on it.
 *
 * Founder-directed 2026-07-09 (the capture pivot: count first, wires
 * later). Device-local by design — a daily tally, not a system record;
 * nothing downstream reads it except the pace actuals.
 */

export const BULK_OUTREACH_KEY = "gtmos_bulk_outreach_v1";

/** { "2026-07-09": 40, ... } — local-date keyed daily counts. */
export type BulkCounts = Readonly<Record<string, number>>;

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function store(s?: StorageLike | null): StorageLike | null {
    if (s) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

export function localDay(d: Date = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function readBulkCounts(s?: StorageLike | null): BulkCounts {
    const st = store(s);
    if (!st) return {};
    try {
        const raw = st.getItem(BULK_OUTREACH_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const out: Record<string, number> = {};
        for (const [k, v] of Object.entries(parsed)) {
            const n = typeof v === "number" ? v : Number(v);
            if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(n) && n > 0) {
                out[k] = Math.min(2000, Math.round(n));
            }
        }
        return out;
    } catch {
        return {};
    }
}

/**
 * Record today's count. REPLACES the day's number (the operator is
 * correcting the day's total, not appending) and returns the new map.
 */
export function logBulkOutreach(
    count: number,
    s?: StorageLike | null,
    now: Date = new Date()
): BulkCounts {
    const st = store(s);
    const n = Math.round(Number(count) || 0);
    const prev = readBulkCounts(st);
    if (n <= 0) return prev;
    const next: Record<string, number> = { ...prev, [localDay(now)]: Math.min(2000, n) };
    try {
        st?.setItem(BULK_OUTREACH_KEY, JSON.stringify(next));
    } catch {
        // Storage full/unavailable — the in-memory map still returns.
    }
    return next;
}

/** Hand-counted outreach for the current calendar month, keyed by day. */
export function bulkOutreachByDayThisMonth(
    s?: StorageLike | null,
    now: Date = new Date()
): Readonly<Record<string, number>> {
    const counts = readBulkCounts(s);
    const prefix = localDay(now).slice(0, 7);
    const out: Record<string, number> = {};
    for (const [day, n] of Object.entries(counts)) {
        if (day.startsWith(prefix)) out[day] = n;
    }
    return out;
}

/** Sum of hand-counted outreach for the current calendar month. */
export function bulkOutreachThisMonth(
    s?: StorageLike | null,
    now: Date = new Date()
): number {
    let total = 0;
    for (const n of Object.values(bulkOutreachByDayThisMonth(s, now))) total += n;
    return total;
}

/** Today's hand count, if any — lets the face show what's on record. */
export function bulkOutreachToday(
    s?: StorageLike | null,
    now: Date = new Date()
): number {
    return readBulkCounts(s)[localDay(now)] ?? 0;
}

/** Microcopy the face uses — kept here so the voice gate sees it. */
export const BULK_LABELS = {
    prompt: t("Sent more than you logged? Type today's real number.", { class: "body" }),
    action: t("Count it"),
    onRecord: t("on record for today")
} as const;
