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
 * OutdoorsEventsV4 (canon §4.22) — proximity + the get-there rail,
 * wired to production from the settled 2026-07-07 design. The scout:
 * "Run discovery now" is the working header; events sit on a single
 * PROXIMITY SPINE — your category (closest in) → your buyers (one ring
 * out) → their orbit (the outer ring) — the relevance tiering felt as
 * distance. Each de-carded row carries when · name · the one-line
 * reason · source, its live weather glance, and the GET-THERE rail
 * (flights / hotel / register / calendar — outbound links only, never
 * a stored itinerary), plus the mark control and dismiss. Add-by-hand
 * recedes to the bottom. Discovery, persistence, status lifecycle are
 * the shipped engine unchanged.
 */

const weatherMap = signal<Readonly<Record<string, WeatherGlance | null>>>({});

function WeatherGlyph({ w }: { w: WeatherGlance | null | undefined }): JSX.Element | null {
    if (!w) return null;
    const glyph = w.kind === "sun" ? "☀" : w.kind === "rain" ? "🌧" : "⛅";
    return <span class="oe4-wx" title={t("The forecast for the dates", { class: "body" })}>{glyph} {w.tempC}°</span>;
}

const RINGS: ReadonlyArray<{ key: "direct" | "adjacent" | "indirect"; label: string; sub: string }> = [
    { key: "direct", label: t("Your category — closest in", { class: "body" }), sub: t("gatherings squarely about what you sell", { class: "body" }) },
    { key: "adjacent", label: t("Your buyers — one ring out", { class: "body" }), sub: t("where the people you sell to already go", { class: "body" }) },
    { key: "indirect", label: t("Their orbit — the outer ring", { class: "body" }), sub: t("worth a look if you're already nearby", { class: "body" }) }
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
                    <a class="oe4-src" href={ev.sourceUrl} target="_blank" rel="noreferrer">{t("where the system found it →", { class: "body" })}</a>
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
                    <a class="oe4-ic" title={t("Register — on their site", { class: "body" })} href={ev.sourceUrl} target="_blank" rel="noreferrer">🎫</a>
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

    // Best-effort weather for dated rows with a place (16-day window).
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
                    <span class="oe4-r">{t("where your buyers gather · found for you", { class: "body" })}</span>
                </div>

                {/* discovery console — the working header */}
                <div class="oe4-console">
                    <div>
                        <div class="oe4-ch">{t("The system finds the gatherings — you decide which matter.", { class: "body" })}</div>
                        <div class="oe4-cs">
                            {run ? (
                                <>
                                    {t("Last swept")} {run.completedAt ? new Date(run.completedAt).toLocaleDateString() : t("just now")} ·{" "}
                                    {run.eventsWritten} {t("found")} · {run.status}
                                </>
                            ) : (
                                t("No sweep yet — run the first one.", { class: "body" })
                            )}
                            {discoveryError.value ? <span class="oe4-err"> · {discoveryError.value}</span> : null}
                        </div>
                    </div>
                    <button type="button" class="oe4-btn" disabled={discoveryBusy.value} onClick={() => void runDiscoveryNow()}>
                        {discoveryBusy.value ? t("Searching the world…") : t("Run discovery now")}
                    </button>
                </div>

                {/* the proximity spine */}
                {!loaded.value ? (
                    <div class="oe4-empty">{t("Loading…")}</div>
                ) : events.length === 0 ? (
                    <div class="oe4-empty">
                        <h3>{t("Nothing on the radar yet.")}</h3>
                        <p>{t("Run discovery and the system searches the world for gatherings in your category, one ring at a time.", { class: "body" })}</p>
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
                                    <span class="oe4-rl">{t("Added by hand")}</span>
                                    <span class="oe4-rn">{byHand.length}</span>
                                </div>
                                {byHand.map((ev) => <EventRow ev={ev} key={ev.id} />)}
                            </div>
                        ) : null}
                    </div>
                )}

                {/* add by hand — recedes to the bottom */}
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
                                {composerBusy.value ? t("Adding…") : t("Add it")}
                            </button>
                            <button type="button" class="oe4-ghost" onClick={closeComposer}>{t("Close")}</button>
                            {composerError.value ? <span class="oe4-err">{composerError.value}</span> : null}
                        </div>
                    ) : (
                        <button type="button" class="oe4-handbtn" onClick={openComposer}>
                            + {t("Add one by hand — a private invite the system can't see", { class: "body" })}
                        </button>
                    )}
                </div>
            </div>
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
