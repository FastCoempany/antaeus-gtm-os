import { t } from "@/lib/voice/t";
import { localDay, readBulkCounts } from "@/quota-workback/v4/lib/bulk-outreach";

/**
 * The Live Edge — data layer (founder-locked 2026-07-16).
 *
 * Pure, storage-injectable readers that project the left wall's three
 * layers from data the system ALREADY collects. The doctrine
 * (deliverables/plans/antaeus-live-edge-doctrine-and-build-plan-2026-07-16.md):
 * a renderer, not a new system — every line maps to an existing row
 * (outbound touches, cold-call log, LinkedIn log, bulk hand counts,
 * observations, watched accounts). A line that can't name its source
 * row doesn't render. Accumulator, not ticker: events hold their place
 * and re-stamp ages; a dead morning says so plainly.
 */

interface StorageLike {
    getItem(key: string): string | null;
}

function store(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function readJson<T>(s: StorageLike | null, key: string): T | null {
    if (!s) return null;
    try {
        const raw = s.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function stamp(v: unknown): number | null {
    if (typeof v !== "string" || !v) return null;
    const n = Date.parse(v);
    return Number.isFinite(n) ? n : null;
}

/** Who moved — the wire's three voices. */
export type EdgeVoice = "you" | "machine" | "buyer";

export interface EdgeEvent {
    readonly id: string;
    readonly who: EdgeVoice;
    /** A plain sentence a peer would say. */
    readonly text: string;
    readonly ts: number;
    /** A big buyer moment — holds the orange rule longer (rule 7). */
    readonly big?: boolean;
}

export interface EdgeRead {
    /** Messages & calls today — max(logged, hand count), quota's rule. */
    readonly todayCount: number;
    /** The Quota room's daily habit, if a plan exists. */
    readonly dailyGoal: number | null;
    /** Recent events, newest first, capped. */
    readonly events: ReadonlyArray<EdgeEvent>;
    /** The watched account quiet the longest (≥ QUIET_DAYS). */
    readonly stillQuiet: { readonly name: string; readonly days: number } | null;
    /** Everything that landed on the wire today, all voices. */
    readonly shiftTotal: number;
    /** Most recent event ever seen — the dead-morning honesty line. */
    readonly lastMovement: number | null;
}

/** How far back the wire reaches. Accumulator: two working days. */
export const WIRE_WINDOW_MS = 48 * 3600_000;
/** Max lines on the wire. */
export const WIRE_CAP = 8;
/** A watched account is "still quiet" after this many silent days. */
export const QUIET_DAYS = 5;

const OUTCOME_REPLY = new Set(["replied", "referred"]);

interface TouchRow {
    id?: string;
    account?: string;
    accountName?: string;
    contactName?: string;
    channel?: string;
    outcome?: string | null;
    outcomeDate?: string | null;
    createdAt?: string;
    savedAt?: string;
}
interface CallRow {
    id?: string;
    account?: string;
    accountName?: string;
    outcome?: string;
    createdAt?: string;
    at?: string;
}
interface LinkedInRow {
    id?: string;
    account?: string;
    accountName?: string;
    createdAt?: string;
    at?: string;
}
interface AccountRow {
    id?: string;
    name?: string;
    signals?: ReadonlyArray<{
        fetched_at?: string;
        published_date?: string;
        capturedAt?: string;
    }>;
    updated_at?: string;
    created_at?: string;
}

function accountLabel(r: { account?: string; accountName?: string }): string {
    const name = (r.accountName ?? r.account ?? "").trim();
    return name || t("an account");
}

function midnight(now: Date): number {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/**
 * Today's messages & calls — the same counting rule as the Quota
 * room's pace read (per local day, max of logged vs the hand count so
 * a corrected total never double-counts).
 */
export function readTodayCount(s?: StorageLike | null, now: Date = new Date()): number {
    const st = store(s);
    const dayStart = midnight(now);
    let logged = 0;
    const ob = readJson<{ touches?: ReadonlyArray<TouchRow> }>(st, "gtmos_outbound_touches");
    for (const x of ob?.touches ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.savedAt);
        if (ts != null && ts >= dayStart) logged += 1;
    }
    const li = readJson<{ actions?: ReadonlyArray<LinkedInRow> }>(st, "gtmos_linkedin_log");
    for (const x of li?.actions ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.at);
        if (ts != null && ts >= dayStart) logged += 1;
    }
    const cc = readJson<{ calls?: ReadonlyArray<CallRow> }>(st, "gtmos_cold_call_log");
    for (const x of cc?.calls ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.at);
        if (ts != null && ts >= dayStart) logged += 1;
    }
    const bulk =
        readBulkCounts(st as Parameters<typeof readBulkCounts>[0])[localDay(now)] ?? 0;
    return Math.max(logged, bulk);
}

/** The Quota room's daily habit — null when no plan is on record. */
export function readDailyGoal(s?: StorageLike | null): number | null {
    const st = store(s);
    const targets = readJson<Record<string, unknown>>(st, "gtmos_quota_targets");
    const n = Number(targets?.["touches_day"]);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/**
 * The wire — you / the machine / the buyers, merged by time. Local
 * sources only; the caller may append cloud-read machine events
 * (observations, calendar) via `mergeEvents`.
 */
export function readLocalEvents(
    s?: StorageLike | null,
    now: Date = new Date()
): ReadonlyArray<EdgeEvent> {
    const st = store(s);
    const floor = now.getTime() - WIRE_WINDOW_MS;
    const out: EdgeEvent[] = [];

    const ob = readJson<{ touches?: ReadonlyArray<TouchRow> }>(st, "gtmos_outbound_touches");
    for (const x of ob?.touches ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.savedAt);
        const name = accountLabel(x);
        if (ts != null && ts >= floor) {
            out.push({
                id: `touch:${x.id ?? ts}`,
                who: "you",
                text: `${t("You reached out to", { class: "body" })} ${name} ${t("— counted.", { class: "body" })}`,
                ts
            });
        }
        // The buyer's answer, when the operator marked one.
        const ots = stamp(x.outcomeDate ?? undefined);
        if (x.outcome && OUTCOME_REPLY.has(x.outcome) && ots != null && ots >= floor) {
            out.push({
                id: `reply:${x.id ?? ots}`,
                who: "buyer",
                text: `${name} ${t("replied to your outreach.", { class: "body" })}`,
                ts: ots,
                big: true
            });
        }
    }

    const cc = readJson<{ calls?: ReadonlyArray<CallRow> }>(st, "gtmos_cold_call_log");
    for (const x of cc?.calls ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.at);
        if (ts == null || ts < floor) continue;
        const name = accountLabel(x);
        if (x.outcome === "meeting_booked") {
            out.push({
                id: `ccm:${x.id ?? ts}`,
                who: "buyer",
                text: `${name} ${t("— a meeting came out of your cold call.", { class: "body" })}`,
                ts,
                big: true
            });
        } else {
            out.push({
                id: `cc:${x.id ?? ts}`,
                who: "you",
                text: `${t("You called", { class: "body" })} ${name}.`,
                ts
            });
        }
    }

    const li = readJson<{ actions?: ReadonlyArray<LinkedInRow> }>(st, "gtmos_linkedin_log");
    for (const x of li?.actions ?? []) {
        const ts = stamp(x.createdAt) ?? stamp(x.at);
        if (ts == null || ts < floor) continue;
        out.push({
            id: `li:${x.id ?? ts}`,
            who: "you",
            text: `${t("You made a LinkedIn touch on", { class: "body" })} ${accountLabel(x)}.`,
            ts
        });
    }

    return out.sort((a, b) => b.ts - a.ts);
}

/** Merge local + cloud-read events: dedupe by id, sort, cap. */
export function mergeEvents(
    ...lists: ReadonlyArray<ReadonlyArray<EdgeEvent>>
): ReadonlyArray<EdgeEvent> {
    const seen = new Set<string>();
    const out: EdgeEvent[] = [];
    for (const list of lists) {
        for (const e of list) {
            if (seen.has(e.id)) continue;
            seen.add(e.id);
            out.push(e);
        }
    }
    return out.sort((a, b) => b.ts - a.ts).slice(0, WIRE_CAP);
}

/**
 * The most recent movement across ALL local sources — even outside the
 * wire window. Feeds the dead-morning honesty line.
 */
export function readLastMovement(
    s?: StorageLike | null
): number | null {
    const st = store(s);
    let last: number | null = null;
    const consider = (ts: number | null): void => {
        if (ts != null && (last == null || ts > last)) last = ts;
    };
    const ob = readJson<{ touches?: ReadonlyArray<TouchRow> }>(st, "gtmos_outbound_touches");
    for (const x of ob?.touches ?? []) consider(stamp(x.createdAt) ?? stamp(x.savedAt));
    const cc = readJson<{ calls?: ReadonlyArray<CallRow> }>(st, "gtmos_cold_call_log");
    for (const x of cc?.calls ?? []) consider(stamp(x.createdAt) ?? stamp(x.at));
    const li = readJson<{ actions?: ReadonlyArray<LinkedInRow> }>(st, "gtmos_linkedin_log");
    for (const x of li?.actions ?? []) consider(stamp(x.createdAt) ?? stamp(x.at));
    return last;
}

/**
 * Still quiet — the watched account silent the longest. Silence =
 * no new signal on the account AND no outreach to it, for ≥ QUIET_DAYS.
 * (The heartbeat's signal_decay read, rendered standing.)
 */
export function readStillQuiet(
    s?: StorageLike | null,
    now: Date = new Date()
): { name: string; days: number } | null {
    const st = store(s);
    const sc = readJson<{ accounts?: ReadonlyArray<AccountRow> }>(st, "gtmos_sc_v4");
    const accounts = sc?.accounts ?? [];
    if (!accounts.length) return null;

    // Last outreach per account name (case-insensitive).
    const lastTouch = new Map<string, number>();
    const noteTouch = (name: string | undefined, ts: number | null): void => {
        const key = (name ?? "").trim().toLowerCase();
        if (!key || ts == null) return;
        const prev = lastTouch.get(key);
        if (prev == null || ts > prev) lastTouch.set(key, ts);
    };
    const ob = readJson<{ touches?: ReadonlyArray<TouchRow> }>(st, "gtmos_outbound_touches");
    for (const x of ob?.touches ?? []) {
        noteTouch(x.accountName ?? x.account, stamp(x.createdAt) ?? stamp(x.savedAt));
    }
    const cc = readJson<{ calls?: ReadonlyArray<CallRow> }>(st, "gtmos_cold_call_log");
    for (const x of cc?.calls ?? []) {
        noteTouch(x.accountName ?? x.account, stamp(x.createdAt) ?? stamp(x.at));
    }

    let worst: { name: string; days: number } | null = null;
    for (const a of accounts) {
        const name = (a.name ?? "").trim();
        if (!name) continue;
        let lastSeen: number | null = null;
        for (const sig of a.signals ?? []) {
            const ts =
                stamp(sig.published_date) ?? stamp(sig.fetched_at) ?? stamp(sig.capturedAt);
            if (ts != null && (lastSeen == null || ts > lastSeen)) lastSeen = ts;
        }
        const touched = lastTouch.get(name.toLowerCase());
        if (touched != null && (lastSeen == null || touched > lastSeen)) lastSeen = touched;
        if (lastSeen == null) lastSeen = stamp(a.updated_at) ?? stamp(a.created_at);
        if (lastSeen == null) continue;
        const days = Math.floor((now.getTime() - lastSeen) / 86_400_000);
        if (days >= QUIET_DAYS && (worst == null || days > worst.days)) {
            worst = { name, days };
        }
    }
    return worst;
}

/** Age stamp for a wire line — re-written in place as time passes. */
export function ageLabel(ts: number, now: Date = new Date()): string {
    const diff = Math.max(0, now.getTime() - ts);
    if (diff < 60_000) return t("just now");
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}${t("m")}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t("h")}`;
    const days = Math.floor(hours / 24);
    if (days === 1) return t("yesterday");
    return `${days}${t("d")}`;
}

/** The dead-morning honesty line, when nothing landed today. */
export function quietLine(lastMovement: number | null, now: Date = new Date()): string {
    if (lastMovement == null) {
        return t("Nothing captured yet — the wire fills as you work.", { class: "body" });
    }
    const when = new Date(lastMovement);
    const sameDay =
        when.getFullYear() === now.getFullYear() &&
        when.getMonth() === now.getMonth() &&
        when.getDate() === now.getDate();
    const clock = when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (sameDay) {
        return `${t("Quiet since", { class: "body" })} ${clock}.`;
    }
    const yd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const wasYesterday =
        when.getFullYear() === yd.getFullYear() &&
        when.getMonth() === yd.getMonth() &&
        when.getDate() === yd.getDate();
    const dayWord = wasYesterday
        ? t("yesterday")
        : ageLabel(lastMovement, now) + ` ${t("ago")}`;
    return `${t("Nothing yet today — last movement", { class: "body" })} ${dayWord}${t(", at", { class: "body" })} ${clock}.`;
}

/** One read for the whole rail (local sources; cloud merges on top). */
export function readEdge(s?: StorageLike | null, now: Date = new Date()): EdgeRead {
    const st = store(s);
    const events = mergeEvents(readLocalEvents(st, now));
    const dayStart = midnight(now);
    const todayOnWire = events.filter((e) => e.ts >= dayStart).length;
    const todayCount = readTodayCount(st, now);
    return {
        todayCount,
        dailyGoal: readDailyGoal(st),
        events,
        stillQuiet: readStillQuiet(st, now),
        shiftTotal: Math.max(todayCount, todayOnWire),
        lastMovement: readLastMovement(st)
    };
}
