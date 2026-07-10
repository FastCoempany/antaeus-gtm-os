import { createDataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";

/**
 * Captured meetings → the pace read. The calendar lane (auto-capture
 * stage 3) records meetings with watched accounts in the cloud
 * `captured_meetings` table; this hydrates a small month tally to the
 * device so the synchronous pace read can count them. Same posture as
 * the bulk hand count: a tally, merged as a floor (max), never an
 * add-on.
 */

export const CAPTURED_MEETINGS_KEY = "gtmos_captured_meetings_v1";

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function store(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Meetings already held this month, from the hydrated tally. */
export function capturedMeetingsThisMonth(
    s?: StorageLike | null,
    now: Date = new Date()
): number {
    const st = store(s);
    if (!st) return 0;
    try {
        const raw = st.getItem(CAPTURED_MEETINGS_KEY);
        if (!raw) return 0;
        const parsed = JSON.parse(raw) as { month?: unknown; held?: unknown };
        if (parsed.month !== monthKey(now)) return 0;
        const n = Number(parsed.held);
        return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
    } catch {
        return 0;
    }
}

/**
 * Pull the cloud rows and refresh the device tally. Fire-and-forget on
 * quota boot; failures leave the previous tally in place.
 */
export async function hydrateCapturedMeetings(
    s?: StorageLike | null,
    now: Date = new Date()
): Promise<number> {
    const st = store(s);
    try {
        const data = createDataClient();
        const rows = (await data.capturedMeetings.list({ limit: 500 })) as ReadonlyArray<{
            starts_at?: string;
        }>;
        const mk = monthKey(now);
        let held = 0;
        for (const r of rows) {
            const t = r.starts_at ? Date.parse(r.starts_at) : NaN;
            if (!Number.isFinite(t)) continue;
            const d = new Date(t);
            if (monthKey(d) === mk && t <= now.getTime()) held++;
        }
        st?.setItem(CAPTURED_MEETINGS_KEY, JSON.stringify({ month: mk, held }));
        return held;
    } catch (err) {
        reportError(err, { op: "quota.hydrateCapturedMeetings" });
        return capturedMeetingsThisMonth(st, now);
    }
}
