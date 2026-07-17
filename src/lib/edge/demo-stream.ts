import { t } from "@/lib/voice/t";
import type { EdgeEvent } from "./edge-data";

/**
 * The demo lane's scripted sample stream (doctrine §3). "Launch
 * interactive demo" boots with the edge ON and this stream running so
 * a first-time viewer sees it alive in the first ten seconds instead
 * of an honest-but-empty margin.
 *
 * Gated HARD on the demo env (`sessionStorage.gtmos_env_mode ===
 * "demo"`, same gate as the demo Briefing Patterns) — a real workspace
 * never sees a scripted event. Every scripted event is a kind the real
 * system genuinely produces (a reply landing, a send captured, a
 * calendar confirm, a heartbeat read, a call logged) — the demo never
 * performs a capability that doesn't exist.
 */

export function isDemoEnv(): boolean {
    try {
        return (
            typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("gtmos_env_mode") === "demo"
        );
    } catch {
        return false;
    }
}

/** Which book the demo seeded — drives the scripted roster names. */
function demoMode(): "ent" | "smb" {
    try {
        const raw = localStorage.getItem("gtmos_demo_seed_meta");
        if (raw && (JSON.parse(raw) as { mode?: string }).mode === "smb") return "smb";
    } catch {
        // fall through to the enterprise cast
    }
    return "ent";
}

interface DemoCast {
    readonly bigReply: string;
    readonly sentTo: string;
    readonly calWith: string;
    readonly hbQuiet: string;
    readonly arriveSend: string;
    readonly arriveReply: string;
    readonly arriveCall: string;
    readonly arriveCal: string;
    readonly arriveHb: string;
}

function cast(): DemoCast {
    return demoMode() === "smb"
        ? {
              bigReply: "Sweetgreen",
              sentTo: "Notion",
              calWith: "Chomps",
              hbQuiet: "OLIPOP",
              arriveSend: "sofia@notion.so",
              arriveReply: "Warby Parker",
              arriveCall: "Portillo's",
              arriveCal: "Gymshark",
              arriveHb: "Liquid Death"
          }
        : {
              bigReply: "Starbucks",
              sentTo: "Boeing",
              calWith: "United Airlines",
              hbQuiet: "Nordstrom",
              arriveSend: "karen.mitchell@boeing.com",
              arriveReply: "Databricks",
              arriveCall: "CoreWeave",
              arriveCal: "Marriott",
              arriveHb: "United Airlines"
          };
}

/** The standing sample wire the demo boots with. */
export function demoBaseEvents(now: Date = new Date()): ReadonlyArray<EdgeEvent> {
    const ts = (minsAgo: number): number => now.getTime() - minsAgo * 60_000;
    const c = cast();
    return [
        {
            id: "demo:reply-big",
            who: "buyer",
            text: `${c.bigReply} ${t("replied to your outreach after 20 quiet days.", { class: "body" })}`,
            ts: ts(28),
            big: true
        },
        {
            id: "demo:send-base",
            who: "you",
            text: `${t("You reached out to", { class: "body" })} ${c.sentTo} ${t("— counted.", { class: "body" })}`,
            ts: ts(64)
        },
        {
            id: "demo:cal-base",
            who: "machine",
            text: `${t("Calendar — Thursday with", { class: "body" })} ${c.calWith} ${t("is confirmed.", { class: "body" })}`,
            ts: ts(180)
        },
        {
            id: "demo:hb-base",
            who: "machine",
            text: `${t("Heartbeat —", { class: "body" })} ${c.hbQuiet} ${t("still has no dated next step.", { class: "body" })}`,
            ts: ts(195)
        }
    ];
}

export interface DemoArrival {
    readonly event: EdgeEvent;
    /** Whether the count strand ticks up with this arrival. */
    readonly counts: boolean;
}

/** The first minute's arrivals, in order. Timestamps stamped at fire time. */
export function demoArrivals(): ReadonlyArray<Omit<DemoArrival, "event"> & {
    readonly make: (now: Date) => EdgeEvent;
}> {
    return [
        {
            counts: true,
            make: (now) => ({
                id: "demo:arrive-send",
                who: "you",
                text: `${t("Captured your send to", { class: "body" })} ${cast().arriveSend} ${t("— counted.", { class: "body" })}`,
                ts: now.getTime()
            })
        },
        {
            counts: false,
            make: (now) => ({
                id: "demo:arrive-reply",
                who: "buyer",
                text: `${cast().arriveReply} ${t("replied to your outreach.", { class: "body" })}`,
                ts: now.getTime(),
                big: true
            })
        },
        {
            counts: true,
            make: (now) => ({
                id: "demo:arrive-call",
                who: "you",
                text: `${t("You called", { class: "body" })} ${cast().arriveCall}.`,
                ts: now.getTime()
            })
        },
        {
            counts: false,
            make: (now) => ({
                id: "demo:arrive-cal",
                who: "machine",
                text: `${t("Calendar — tomorrow with", { class: "body" })} ${cast().arriveCal} ${t("is confirmed.", { class: "body" })}`,
                ts: now.getTime()
            })
        },
        {
            counts: false,
            make: (now) => ({
                id: "demo:arrive-hb",
                who: "machine",
                text: `${t("Heartbeat —", { class: "body" })} ${cast().arriveHb} ${t("has gone quiet for 6 days.", { class: "body" })}`,
                ts: now.getTime()
            })
        }
    ];
}
