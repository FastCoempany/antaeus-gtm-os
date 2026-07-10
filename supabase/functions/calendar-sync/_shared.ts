/**
 * Calendar capture — pure helpers (vitest-importable).
 *
 * Stage 3 of the auto-capture path, the walk-off-the-street version:
 * the operator pastes their calendar's secret iCal link (Google /
 * Outlook / Apple all expose one — no OAuth, no admin). The sync
 * fetches the feed, keeps ONLY events that include an attendee at a
 * watched account, and records the meeting. Personal events are never
 * stored.
 */

export interface IcsEvent {
    readonly uid: string;
    readonly title: string;
    readonly startsAt: string; // ISO
    readonly endsAt: string | null;
    readonly attendees: ReadonlyArray<string>; // lowercased emails
    readonly organizer: string | null;
    readonly rrule: string | null;
}

/** Unfold RFC 5545 folded lines (CRLF followed by space/tab). */
export function unfoldIcs(text: string): string[] {
    const raw = text.split(/\r?\n/);
    const out: string[] = [];
    for (const line of raw) {
        if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
            out[out.length - 1] += line.slice(1);
        } else {
            out.push(line);
        }
    }
    return out.filter((l) => l.length > 0);
}

function parseIcsDate(prop: string, value: string): string | null {
    const v = value.trim();
    // 20260710T140000Z
    let m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (m) {
        return new Date(
            Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!)
        ).toISOString();
    }
    // 20260710T140000 (floating or TZID — treated as-is; minute-level
    // truth matters less than which day the meeting lands on)
    m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
    if (m) {
        return new Date(
            Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!)
        ).toISOString();
    }
    // All-day: 20260710 (VALUE=DATE) — anchor at noon UTC.
    m = v.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) {
        return new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, 12, 0, 0)).toISOString();
    }
    void prop;
    return null;
}

function emailFromCalAddress(value: string): string | null {
    const m = value.match(/mailto:([^\s;,]+)/i);
    if (!m) return null;
    const e = m[1]!.trim().toLowerCase();
    return e.includes("@") ? e : null;
}

/** Parse VEVENTs out of an ICS feed. Defensive — a bad event is skipped. */
export function parseIcs(text: string): IcsEvent[] {
    const lines = unfoldIcs(text);
    const events: IcsEvent[] = [];
    let cur: Record<string, string> | null = null;
    let attendees: string[] = [];
    for (const line of lines) {
        if (line === "BEGIN:VEVENT") {
            cur = {};
            attendees = [];
            continue;
        }
        if (line === "END:VEVENT") {
            if (cur) {
                const starts = parseIcsDate("DTSTART", cur["DTSTART"] ?? "");
                const uid = (cur["UID"] ?? "").trim();
                if (starts && uid) {
                    events.push({
                        uid,
                        title: (cur["SUMMARY"] ?? "").trim().slice(0, 200),
                        startsAt: starts,
                        endsAt: parseIcsDate("DTEND", cur["DTEND"] ?? ""),
                        attendees: [...new Set(attendees)],
                        organizer: cur["ORGANIZER_EMAIL"] ?? null,
                        rrule: cur["RRULE"] ?? null
                    });
                }
            }
            cur = null;
            continue;
        }
        if (!cur) continue;
        const idx = line.indexOf(":");
        if (idx < 0) continue;
        const nameWithParams = line.slice(0, idx);
        const value = line.slice(idx + 1);
        const name = nameWithParams.split(";")[0]!.toUpperCase();
        if (name === "ATTENDEE") {
            const e = emailFromCalAddress(value);
            if (e) attendees.push(e);
        } else if (name === "ORGANIZER") {
            const e = emailFromCalAddress(value);
            if (e) cur["ORGANIZER_EMAIL"] = e;
        } else if (!(name in cur)) {
            cur[name] = value;
        }
    }
    return events;
}

/**
 * Expand an event into occurrences inside [windowStart, windowEnd].
 * Single events pass through when in-window. Recurring events get a
 * simple DAILY/WEEKLY expansion (INTERVAL, UNTIL, COUNT honored,
 * capped at 60 occurrences) — enough for the standing account call;
 * exotic rules fall back to the base occurrence only.
 */
export function occurrencesInWindow(
    ev: IcsEvent,
    windowStart: Date,
    windowEnd: Date
): string[] {
    const startMs = Date.parse(ev.startsAt);
    if (!Number.isFinite(startMs)) return [];
    const inWindow = (t: number): boolean =>
        t >= windowStart.getTime() && t <= windowEnd.getTime();

    if (!ev.rrule) {
        return inWindow(startMs) ? [new Date(startMs).toISOString()] : [];
    }
    const params: Record<string, string> = {};
    for (const part of ev.rrule.split(";")) {
        const [k, v] = part.split("=");
        if (k && v) params[k.toUpperCase()] = v;
    }
    const freq = params["FREQ"];
    const stepDays =
        freq === "DAILY" ? 1 : freq === "WEEKLY" ? 7 : null;
    if (!stepDays) {
        return inWindow(startMs) ? [new Date(startMs).toISOString()] : [];
    }
    const interval = Math.max(1, Number(params["INTERVAL"] ?? 1) || 1);
    const until = params["UNTIL"] ? parseIcsDate("UNTIL", params["UNTIL"]) : null;
    const untilMs = until ? Date.parse(until) : Number.POSITIVE_INFINITY;
    const count = Number(params["COUNT"] ?? NaN);
    const out: string[] = [];
    let t = startMs;
    let n = 0;
    while (t <= windowEnd.getTime() && t <= untilMs && n < 60) {
        if (Number.isFinite(count) && n >= count) break;
        if (inWindow(t)) out.push(new Date(t).toISOString());
        t += stepDays * interval * 86_400_000;
        n++;
    }
    return out;
}

export interface WatchedAccount {
    readonly name: string;
    readonly domain?: string | null;
}

// Same registrable-domain logic as the inbound-email function
// (duplicated deliberately — each Edge Function bundles standalone).
const TWO_LABEL_SUFFIXES = new Set([
    "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk",
    "com.au", "net.au", "org.au",
    "co.jp", "or.jp", "ne.jp",
    "co.in", "net.in", "org.in",
    "com.br", "com.mx", "com.ar", "com.sg", "com.hk", "com.tr",
    "co.nz", "co.za", "co.kr", "com.cn", "com.tw"
]);

function rootDomain(host: string): string {
    const parts = host.toLowerCase().split(".").filter(Boolean);
    const lastTwo = parts.slice(-2).join(".");
    if (TWO_LABEL_SUFFIXES.has(lastTwo) && parts.length >= 3) {
        return parts.slice(-3).join(".");
    }
    return lastTwo;
}

export function matchAccount(
    emails: ReadonlyArray<string>,
    accounts: ReadonlyArray<WatchedAccount>
): string | null {
    const domains = emails
        .map((a) => a.split("@")[1] ?? "")
        .filter(Boolean)
        .map((d) => d.toLowerCase());
    if (domains.length === 0) return null;
    for (const acc of accounts) {
        const accDomain = (acc.domain ?? "").toLowerCase().replace(/^www\./, "");
        if (!accDomain) continue;
        for (const d of domains) {
            if (d === accDomain || rootDomain(d) === rootDomain(accDomain)) {
                return acc.name;
            }
        }
    }
    for (const acc of accounts) {
        const squashed = acc.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (squashed.length < 4) continue;
        for (const d of domains) {
            if (rootDomain(d).replace(/[^a-z0-9]/g, "").includes(squashed)) {
                return acc.name;
            }
        }
    }
    return null;
}

export interface MatchedMeeting {
    readonly icsUid: string;
    readonly title: string;
    readonly startsAt: string;
    readonly endsAt: string | null;
    readonly accountName: string;
    readonly attendees: ReadonlyArray<string>;
}

/**
 * The whole read: parse the feed, window it, and keep only meetings
 * with an attendee (or organizer) at a watched account. Everything
 * else is discarded and never stored.
 */
export function matchedMeetingsFromIcs(
    icsText: string,
    accounts: ReadonlyArray<WatchedAccount>,
    now: Date = new Date(),
    pastDays = 7,
    futureDays = 14
): MatchedMeeting[] {
    const windowStart = new Date(now.getTime() - pastDays * 86_400_000);
    const windowEnd = new Date(now.getTime() + futureDays * 86_400_000);
    const out: MatchedMeeting[] = [];
    for (const ev of parseIcs(icsText)) {
        const people = ev.organizer
            ? [...ev.attendees, ev.organizer]
            : [...ev.attendees];
        if (people.length === 0) continue;
        const account = matchAccount(people, accounts);
        if (!account) continue;
        for (const startsAt of occurrencesInWindow(ev, windowStart, windowEnd)) {
            out.push({
                icsUid: ev.uid,
                title: ev.title,
                startsAt,
                endsAt: ev.endsAt,
                accountName: account,
                attendees: people
            });
        }
    }
    return out;
}
