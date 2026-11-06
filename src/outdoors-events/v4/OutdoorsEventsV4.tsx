import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    allEvents,
    loaded,
    draft,
    composerOpen,
    composerBusy,
    composerError,
    latestRun,
    discoveryBusy,
    discoveryError,
    eventsByTier,
    patchDraft,
    openComposer,
    closeComposer,
    runDiscoveryNow,
    saveDraft,
    changeStatus,
    removeEvent
} from "../state";
import {
    OUTDOORS_EVENT_STATUSES,
    STATUS_LABEL,
    type OutdoorsEvent,
    type OutdoorsEventStatus
} from "../lib/types";
import { weatherFor, flightsHref, hotelsHref, calendarIcs, type WeatherGlance } from "./lib/get-there";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./outdoors-events-v4.css";

/**
 * Outdoors Events displays sourced, currently scheduled events grouped by
 * relevance to the operator's category and buyer context. Each row keeps
 * the source URL beside the generated relevance reason and provides
 * outbound travel/calendar links. Manual events remain a separate group.
 */

const weatherMap = signal<Readonly<Record<string, WeatherGlance | null>>>({});

function WeatherGlyph({ w }: { w: WeatherGlance | null | undefined }): JSX.Element | null {
    if (!w) return null;
    const glyph = w.kind === "sun" ? "☀" : w.kind === "rain" ? "🌧" : "⛅";
    return <span class="oe4-wx" title={t("Forecast for the event dates", { class: "body" })}>{glyph} {w.tempC}°</span>;
}

const RINGS: ReadonlyArray<{ key: "direct" | "adjacent" | "indirect"; label: string; sub: string }> = [
    { key: "direct", label: t("Directly relevant to your category", { class: "body" }), sub: t("events focused directly on your market", { class: "body" }) },
    { key: "adjacent", label: t("Adjacent to your buyer context", { class: "body" }), sub: t("events focused on the roles, functions, or problems you sell into", { class: "body" }) },
    { key: "indirect", label: t("Broader related events", { class: "body" }), sub: t("events that may be useful for your territory or travel plans", { class: "body" }) }
];

function fmtWhen(ev: OutdoorsEvent): string {
    if (!ev.startDate) return t("date not set");
    const s = new Date(ev.startDate);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    if (ev.endDate && ev.endDate !== ev.startDate) {
        return `${s.toLocaleDateString(undefined, opts)} – ${new Date(ev.endDate).toLocaleDateString(undefined, opts)}`;
    }
    return s.toLocaleDateString(undefined, opts);
}

function EventRow({ ev }: { ev: OutdoorsEvent }): JSX.Element {
    const w = weatherMap.value[ev.id];
    return (
        <div class="oe4-row">
            <span class="oe4-when">{fmtWhen(ev)}</span>
            <div class="oe4-body">
                <div class="oe4-name">
                    {ev.name}
                    {ev.whereAt ? <span class="oe4-where"> · {ev.whereAt}</span> : null}
                    <WeatherGlyph w={w} />
                </div>
                {ev.relevanceReason ? <div class="oe4-reason">{ev.relevanceReason}</div> : null}
                {ev.sourceUrl ? (
                    <a class="oe4-src" href={ev.sourceUrl} target="_blank" rel="noreferrer">{t("View source →", { class: "body" })}</a>
                ) : null}
            </div>
            <span class="oe4-rail">
                {ev.whereAt ? (
                    <>
                        <a class="oe4-ic" title={t("Check flights")} href={flightsHref(ev.whereAt, ev.startDate)} target="_blank" rel="noreferrer">✈</a>
                        <a class="oe4-ic" title={t("Hotels nearby")} href={hotelsHref(ev.whereAt, ev.startDate)} target="_blank" rel="noreferrer">🛏</a>
                    </>
                ) : null}
                {ev.sourceUrl ? (
                    <a class="oe4-ic" title={t("Open event site", { class: "body" })} href={ev.sourceUrl} target="_blank" rel="noreferrer">🎫</a>
                ) : null}
                <a class="oe4-ic" title={t("Add to calendar")} href={calendarIcs(ev.name, ev.startDate, ev.endDate, ev.whereAt)} download={`${ev.name.slice(0, 40)}.ics`}>📅</a>
            </span>
            <select
                class="oe4-status"
                value={ev.status}
                onChange={(e) => void changeStatus(ev.id, (e.currentTarget as HTMLSelectElement).value as OutdoorsEventStatus)}
            >
                {OUTDOORS_EVENT_STATUSES.map((st) => (
                    <option value={st} key={st}>{STATUS_LABEL[st]}</option>
                ))}
            </select>
            <button type="button" class="oe4-x" title={t("Dismiss")} onClick={() => void removeEvent(ev.id)}>×</button>
        </div>
    );
}

export function OutdoorsEventsV4(): JSX.Element {
    const events = allEvents.value;
    const grouped = eventsByTier.value;
    const tierMap: Readonly<Record<string, ReadonlyArray<OutdoorsEvent>>> = Object.fromEntries(
        grouped.tiers.map((x) => [x.tier, x.events])
    );
    const run = latestRun.value;
    const d = draft.value;

    useEffect(() => {
        for (const ev of events) {
            if (!ev.whereAt || weatherMap.value[ev.id] !== undefined) continue;
            void weatherFor(ev.whereAt, ev.startDate).then((w) => {
                weatherMap.value = { ...weatherMap.value, [ev.id]: w };
            });
        }
    }, [events]);

    const byHand = grouped.untiered;

    return (
        <div class="oe4">
            <div class="oe4-wrap">
                <div class="oe4-top">
                    <span class="oe4-bname">{t("Outdoors Events")}</span>
                    <span class="oe4-r">{t("events relevant to your market and buyer context", { class: "body" })}</span>
                </div>

                <div class="oe4-console">
                    <div>
                        <div class="oe4-ch">{t("Search current event sources, then decide which events are worth pursuing.", { class: "body" })}</div>
                        <div class="oe4-cs">
                            {run ? (
                                <>
                                    {t("Last search")} {run.completedAt ? new Date(run.completedAt).toLocaleDateString() : t("just now")} ·{" "}
                                    {run.eventsWritten} {t("events returned")} · {run.status}
                                </>
                            ) : (
                                t("No event search has been run yet.", { class: "body" })
                            )}
                            {discoveryError.value ? <span class="oe4-err"> · {discoveryError.value}</span> : null}
                        </div>
                    </div>
                    <button type="button" class="oe4-btn" disabled={discoveryBusy.value} onClick={() => void runDiscoveryNow()}>
                        {discoveryBusy.value ? t("Searching event sources…") : t("Find relevant events")}
                    </button>
                </div>

                {!loaded.value ? (
                    <div class="oe4-empty">{t("Loading…")}</div>
                ) : events.length === 0 ? (
                    <div class="oe4-empty">
                        <h3>{t("No events found yet.")}</h3>
                        <p>{t("Run event discovery to search for currently scheduled events relevant to your category and buyer context.", { class: "body" })}</p>
                    </div>
                ) : (
                    <div class="oe4-spine">
                        {RINGS.map((ring, i) => {
                            const list = tierMap[ring.key] ?? [];
                            if (list.length === 0) return null;
                            return (
                                <div class={`oe4-ring is-r${i}`} key={ring.key}>
                                    <div class="oe4-rh">
                                        <span class="oe4-rl">{ring.label}</span>
                                        <span class="oe4-rs">{ring.sub}</span>
                                        <span class="oe4-rn">{list.length}</span>
                                    </div>
                                    {list.map((ev) => <EventRow ev={ev} key={ev.id} />)}
                                </div>
                            );
                        })}
                        {byHand.length > 0 ? (
                            <div class="oe4-ring is-hand">
                                <div class="oe4-rh">
                                    <span class="oe4-rl">{t("Added manually")}</span>
                                    <span class="oe4-rn">{byHand.length}</span>
                                </div>
                                {byHand.map((ev) => <EventRow ev={ev} key={ev.id} />)}
                            </div>
                        ) : null}
                    </div>
                )}

                <div class="oe4-hand">
                    {composerOpen.value ? (
                        <div class="oe4-form">
                            <input value={d.name} placeholder={t("Event name")}
                                onInput={(e) => patchDraft({ name: (e.currentTarget as HTMLInputElement).value })} />
                            <input value={d.whereAt} placeholder={t("City / venue")}
                                onInput={(e) => patchDraft({ whereAt: (e.currentTarget as HTMLInputElement).value })} />
                            <input type="date" value={d.startDate}
                                onInput={(e) => patchDraft({ startDate: (e.currentTarget as HTMLInputElement).value })} />
                            <button type="button" class="oe4-btn" disabled={composerBusy.value || !d.name.trim()}
                                onClick={() => void saveDraft()}>
                                {composerBusy.value ? t("Adding…") : t("Add event")}
                            </button>
                            <button type="button" class="oe4-ghost" onClick={closeComposer}>{t("Close")}</button>
                            {composerError.value ? <span class="oe4-err">{composerError.value}</span> : null}
                        </div>
                    ) : (
                        <button type="button" class="oe4-handbtn" onClick={openComposer}>
                            + {t("Add event manually", { class: "body" })}
                        </button>
                    )}
                </div>
            </div>
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
