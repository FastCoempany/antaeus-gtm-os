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

/** The standing sample wire the demo boots with. */
export function demoBaseEvents(now: Date = new Date()): ReadonlyArray<EdgeEvent> {
    const ts = (minsAgo: number): number => now.getTime() - minsAgo * 60_000;
    return [
        {
            id: "demo:reply-northwind",
            who: "buyer",
            text: `Northwind ${t("replied to your outreach after 20 quiet days.", { class: "body" })}`,
            ts: ts(28),
            big: true
        },
        {
            id: "demo:send-ramp",
            who: "you",
            text: `${t("You reached out to", { class: "body" })} Ramp ${t("— counted.", { class: "body" })}`,
            ts: ts(64)
        },
        {
            id: "demo:cal-vanta",
            who: "machine",
            text: `${t("Calendar — Thursday with", { class: "body" })} Vanta ${t("is confirmed.", { class: "body" })}`,
            ts: ts(180)
        },
        {
            id: "demo:hb-northwind",
            who: "machine",
            text: `${t("Heartbeat —", { class: "body" })} Northwind ${t("still has no dated next step.", { class: "body" })}`,
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
                text: `${t("Captured your send to", { class: "body" })} dana@ramp.com ${t("— counted.", { class: "body" })}`,
                ts: now.getTime()
            })
        },
        {
            counts: false,
            make: (now) => ({
                id: "demo:arrive-reply",
                who: "buyer",
                text: `Mercury ${t("replied to your outreach.", { class: "body" })}`,
                ts: now.getTime(),
                big: true
            })
        },
        {
            counts: true,
            make: (now) => ({
                id: "demo:arrive-call",
                who: "you",
                text: `${t("You called", { class: "body" })} Torch Labs.`,
                ts: now.getTime()
            })
        },
        {
            counts: false,
            make: (now) => ({
                id: "demo:arrive-cal",
                who: "machine",
                text: `${t("Calendar — tomorrow with", { class: "body" })} Beacon Health ${t("is confirmed.", { class: "body" })}`,
                ts: now.getTime()
            })
        },
        {
            counts: false,
            make: (now) => ({
                id: "demo:arrive-hb",
                who: "machine",
                text: `${t("Heartbeat —", { class: "body" })} Coreline ${t("has gone quiet for 6 days.", { class: "body" })}`,
                ts: now.getTime()
            })
        }
    ];
}
