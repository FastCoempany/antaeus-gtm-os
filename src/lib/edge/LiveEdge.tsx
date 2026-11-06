import type { JSX } from "preact";
import { computed, effect, signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { isFeatureEnabled, reportError } from "@/lib/observability";
import { createDataClient } from "@/lib/data-client";
import { listObservations } from "@/lib/observations/reader";
import {
    WIRE_WINDOW_MS,
    ageLabel,
    mergeEvents,
    quietLine,
    readEdge,
    type EdgeEvent,
    type EdgeRead
} from "./edge-data";
import { liveEdgeOn, readEdgeOn, setLiveEdgeOn } from "./edge-prefs";
import { demoArrivals, demoBaseEvents, isDemoEnv } from "./demo-stream";
import "./edge.css";

/**
 * Recent activity panel. Internal LiveEdge names remain stable to avoid
 * unnecessary component/storage churn. The user-facing surface reports
 * today's activity count, buyer activity, automated updates, and accounts
 * without a recent response. Hiding the panel never disables capture.
 */

type VisualState = "on" | "stilling" | "off" | "waking";

const visual = signal<VisualState>(readEdgeOn() ? "on" : "off");
const localRead = signal<EdgeRead | null>(null);
const cloudEvents = signal<ReadonlyArray<EdgeEvent>>([]);
const demoEvents = signal<ReadonlyArray<EdgeEvent>>([]);
const demoBump = signal(0);
const wideEnough = signal(true);
const ageTick = signal(0);

let booted = false;
let transitioning = false;
let forceShown = false;
let forceHidden = false;

function reducedMotion(): boolean {
    try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        return false;
    }
}

function refreshLocal(): void {
    try {
        localRead.value = readEdge();
    } catch (err) {
        reportError(err, { where: "liveEdge.refreshLocal" });
    }
}

async function loadCloudEvents(): Promise<void> {
    if (isDemoEnv()) return;
    const floor = Date.now() - WIRE_WINDOW_MS;
    const out: EdgeEvent[] = [];
    try {
        const obs = await listObservations({ limit: 12 });
        for (const o of obs) {
            const ts = Date.parse(o.writtenAt);
            if (Number.isFinite(ts) && ts >= floor) {
                out.push({ id: `obs:${o.id}`, who: "machine", text: o.observationText, ts });
            }
        }
    } catch {
        // No session / no cloud — local activity remains available.
    }
    try {
        const data = createDataClient();
        const rows = (await data.capturedMeetings.list({ limit: 50 })) as ReadonlyArray<{
            id?: string;
            account_name?: string;
            title?: string;
            starts_at?: string;
            created_at?: string;
        }>;
        for (const r of rows) {
            const ts = Date.parse(r.created_at ?? r.starts_at ?? "");
            if (!Number.isFinite(ts) || ts < floor) continue;
            const name = (r.account_name ?? "").trim() || t("a watched account", { class: "body" });
            out.push({
                id: `cal:${r.id ?? ts}`,
                who: "machine",
                text: `${t("Calendar — a meeting with", { class: "body" })} ${name} ${t("is on the calendar.", { class: "body" })}`,
                ts
            });
        }
    } catch {
        // Cloud reads are supplementary, never required for local activity.
    }
    cloudEvents.value = out;
}

function startDemoStream(): void {
    if (!isDemoEnv()) return;
    demoEvents.value = demoBaseEvents();
    const arrivals = demoArrivals();
    arrivals.forEach((a, i) => {
        setTimeout(() => {
            try {
                const e = a.make(new Date());
                demoEvents.value = [e, ...demoEvents.value];
                if (a.counts) demoBump.value += 1;
            } catch {
                // Demo updates are non-critical.
            }
        }, 9000 + i * 10_000);
    });
}

export function turnEdgeOff(): void {
    if (transitioning || visual.value === "off") return;
    setLiveEdgeOn(false);
    if (reducedMotion()) {
        visual.value = "off";
        return;
    }
    transitioning = true;
    visual.value = "stilling";
    setTimeout(() => {
        visual.value = "off";
        transitioning = false;
    }, 430);
}

export function turnEdgeOn(): void {
    if (transitioning || visual.value === "on") return;
    setLiveEdgeOn(true);
    refreshLocal();
    if (reducedMotion()) {
        visual.value = "on";
        return;
    }
    transitioning = true;
    visual.value = "waking";
    setTimeout(() => {
        visual.value = "on";
        transitioning = false;
    }, 470);
}

function boot(): void {
    if (booted || typeof window === "undefined") return;
    booted = true;

    try {
        const p = new URLSearchParams(window.location.search).get("edge");
        forceShown = p === "1";
        forceHidden = p === "0";
    } catch {
        /* no-op */
    }

    try {
        const mq = window.matchMedia("(min-width: 1240px)");
        wideEnough.value = mq.matches;
        mq.addEventListener("change", (e) => {
            wideEnough.value = e.matches;
        });
    } catch {
        wideEnough.value = true;
    }

    refreshLocal();
    void loadCloudEvents();
    startDemoStream();

    setInterval(() => {
        ageTick.value += 1;
    }, 60_000);
    setInterval(() => {
        refreshLocal();
    }, 90_000);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            refreshLocal();
            void loadCloudEvents();
        }
    });
    window.addEventListener("storage", (e) => {
        if (e.key && e.key.startsWith("gtmos_")) {
            liveEdgeOn.value = readEdgeOn();
            refreshLocal();
        }
    });

    effect(() => {
        const wantOn = liveEdgeOn.value;
        const v = visual.value;
        if (wantOn && v === "off" && !transitioning) turnEdgeOn();
        if (!wantOn && v === "on" && !transitioning) turnEdgeOff();
    });

    effect(() => {
        const expanded = visual.value !== "off";
        const show = wideEnough.value && !forceHidden;
        try {
            document.body.classList.toggle("has-live-edge", show && expanded);
        } catch {
            /* no-op */
        }
    });
}

const displayEvents = computed<ReadonlyArray<EdgeEvent>>(() => {
    const local = localRead.value?.events ?? [];
    return mergeEvents(demoEvents.value, cloudEvents.value, local);
});

function onStripMove(e: MouseEvent): void {
    const strip = e.currentTarget as HTMLElement;
    const whis = strip.querySelector<HTMLElement>(".ledge-whis");
    if (!whis) return;
    const r = strip.getBoundingClientRect();
    const y = Math.max(34, Math.min(r.height - 34, e.clientY - r.top));
    whis.style.top = `${y}px`;
}

const VOICE_LABEL: Record<EdgeEvent["who"], string> = {
    you: t("you"),
    machine: t("automated updates"),
    buyer: t("buyer activity")
};

export function LiveEdge(): JSX.Element | null {
    boot();
    void ageTick.value;
    if (forceHidden) return null;
    if (!forceShown && isFeatureEnabled("live_edge_off")) return null;
    if (!wideEnough.value) return null;

    const state = visual.value;
    const read = localRead.value;
    const now = new Date();
    const count = (read?.todayCount ?? 0) + demoBump.value;
    const goal = read?.dailyGoal ?? null;
    const events = displayEvents.value;
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEvents = events.filter((e) => e.ts >= dayStart).length;
    const shift = Math.max((read?.shiftTotal ?? 0) + demoBump.value, todayEvents);
    const lastMovement = events.length
        ? Math.max(read?.lastMovement ?? 0, events[0].ts)
        : (read?.lastMovement ?? null);
    const quietToday = todayEvents === 0;
    const pct = goal ? Math.max(2, Math.min(100, Math.round((count / goal) * 100))) : 0;

    return (
        <div class={`ledge is-${state}`} data-edge-state={state}>
            <aside class="ledge-rail" aria-label={t("Recent activity", { class: "body" })}>
                <div class="ledge-head">
                    <span class="ledge-dot" aria-hidden="true" />
                    <span class="ledge-hk">{t("Recent activity")}</span>
                    <button
                        type="button"
                        class="ledge-off"
                        onClick={turnEdgeOff}
                        title={t("Hide recent activity", { class: "body" })}
                    >
                        {t("Hide")}
                    </button>
                </div>
                <div class="ledge-count">
                    <div class="ledge-crow">
                        <span class="ledge-n">{count}</span>
                        {goal ? <span class="ledge-goal">/ {goal} {t("today")}</span> : <span class="ledge-goal">{t("today")}</span>}
                    </div>
                    <div class="ledge-cl">{t("messages & calls — logged or captured", { class: "body" })}</div>
                    <div class="ledge-track" aria-hidden="true">
                        <i style={{ width: `${pct}%` }} />
                    </div>
                </div>
                <div class="ledge-wire">
                    {quietToday ? (
                        <div class="ledge-quiet">{quietLine(lastMovement, now)}</div>
                    ) : null}
                    {events.map((e) => (
                        <div
                            class={`ledge-line is-${e.who}${e.big ? " is-big" : ""}${now.getTime() - e.ts < 20_000 ? " is-fresh" : ""}`}
                            key={e.id}
                        >
                            <span class="ledge-tag">{VOICE_LABEL[e.who]}</span>
                            <span class="ledge-tx">{e.text}</span>
                            <span class="ledge-when">{ageLabel(e.ts, now)}</span>
                        </div>
                    ))}
                    {!events.length && !quietToday ? (
                        <div class="ledge-quiet">{quietLine(lastMovement, now)}</div>
                    ) : null}
                </div>
                <div class="ledge-foot">
                    {read?.stillQuiet ? (
                        <div>
                            {t("No recent response")} · <b>{read.stillQuiet.name}</b> · {read.stillQuiet.days}
                            {t("d")}
                        </div>
                    ) : null}
                    <div>
                        {t("Today")} · <b>{shift}</b> {t("messages & calls recorded", { class: "body" })}
                    </div>
                </div>
            </aside>

            <button
                type="button"
                class="ledge-strip"
                onClick={turnEdgeOn}
                onMouseMove={onStripMove}
                aria-label={t("Recent activity is hidden — click to show", { class: "body" })}
            >
                <span class="ledge-hair" aria-hidden="true" />
                <span class="ledge-whis">{t("Recent activity is hidden — click to show", { class: "body" })}</span>
            </button>
        </div>
    );
}

/** @internal test reset. */
export function __resetLiveEdgeForTests(): void {
    visual.value = "on";
    localRead.value = null;
    cloudEvents.value = [];
    demoEvents.value = [];
    demoBump.value = 0;
}
