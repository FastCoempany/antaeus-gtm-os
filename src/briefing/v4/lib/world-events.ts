/**
 * v4 world strip — "where your world is gathering" (locked design
 * 2026-07-02). A read-only glance at up to three upcoming Outdoors
 * Events rows. Read-only and defensive: any failure (no session, no
 * table, demo mode without rows) degrades to the plain navigation
 * link — the strip never blocks the room and never writes.
 */
import { signal, type Signal } from "@preact/signals";
import { createDataClient } from "@/lib/data-client";
import { chicagoWallParts } from "@/lib/time/chicago";

export interface WorldEvent {
    readonly id: string;
    readonly name: string;
    readonly when: string | null;
    readonly where: string | null;
}

export const worldEvents: Signal<ReadonlyArray<WorldEvent>> = signal([]);
export const worldEventsCount = signal(0);

function shortWhen(iso: string | null): string | null {
    if (!iso) return null;
    try {
        const d = new Date(`${iso}T12:00:00`);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
        return null;
    }
}

/** Today's date in the app's operating timezone (America/Chicago), as YYYY-MM-DD. */
export function chicagoTodayIso(at: Date = new Date()): string {
    const p = chicagoWallParts(at);
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * True when an event has not ended yet. Uses end_date when present, else
 * start_date. Undated events stay in (the operator may still be deciding),
 * but sort after dated ones.
 */
export function isUpcoming(row: Record<string, unknown>, todayIso: string): boolean {
    const end = typeof row.end_date === "string" && row.end_date ? row.end_date : null;
    const start = typeof row.start_date === "string" && row.start_date ? row.start_date : null;
    const last = end ?? start;
    if (!last) return true;
    return last.slice(0, 10) >= todayIso;
}

export async function bootWorldEvents(): Promise<void> {
    try {
        const data = createDataClient();
        const rows = await data.outdoorsEvents.list({ limit: 40 });
        const today = chicagoTodayIso();
        const live = (rows as ReadonlyArray<Record<string, unknown>>)
            .filter((r) => {
                const status = typeof r.status === "string" ? r.status : "";
                return status !== "archived" && status !== "passed" && isUpcoming(r, today);
            })
            .sort((a, b) => {
                const da = typeof a.start_date === "string" ? a.start_date : "9999";
                const db = typeof b.start_date === "string" ? b.start_date : "9999";
                return da.localeCompare(db);
            });
        worldEventsCount.value = live.length;
        worldEvents.value = live.slice(0, 3).map((r) => ({
            id: String(r.id ?? ""),
            name: typeof r.name === "string" ? r.name : "",
            when: shortWhen(typeof r.start_date === "string" ? r.start_date : null),
            where: typeof r.where_at === "string" && r.where_at ? r.where_at : null
        })).filter((e) => e.name.length > 0);
    } catch {
        worldEvents.value = [];
        worldEventsCount.value = 0;
    }
}

/** @internal — reset module state between tests. */
export function __resetWorldEventsForTests(): void {
    worldEvents.value = [];
    worldEventsCount.value = 0;
}
