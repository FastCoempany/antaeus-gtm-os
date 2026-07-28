import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { RoomChrome } from "@/lib/room-chrome";
import { FirstVisitPrimer } from "../components/FirstVisitPrimer";
import { StaleRunBanner } from "../components/StaleRunBanner";
import { BriefingLead } from "../components/BriefingLead";
import { PatternList } from "../components/PatternList";
import { ContrarianRail } from "../components/ContrarianRail";
import { PeripheryRail } from "../components/PeripheryRail";
import { WatchList } from "../components/WatchList";
import { BriefingFooter } from "../components/BriefingFooter";
import {
    armedTriggers,
    contrarianPatterns,
    decidePendingProposal,
    decisionBusyId,
    markPendingProposalViewed,
    patterns,
    pendingProposals,
    peripheryCandidates
} from "../state";
import {
    loadBriefingDrafts,
    clearBriefingDraft,
    roomLabelForPath,
    type BriefingDraftBreadcrumb
} from "@/lib/briefing-drafts";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import { loadWeather, type WeatherKind, type WeatherRead } from "./lib/weather";
import {
    workReads,
    collapsedRuns,
    readsLoaded,
    readsError,
    dismissingId,
    refreshReads,
    dismissRead
} from "./lib/reads";
import { worldEvents, worldEventsCount, bootWorldEvents } from "./lib/world-events";
import "./briefing-v4.css";

/**
 * BriefingV4 — the daily check-in reconciled to the LOCKED 2026-07-02
 * design (deliverables/mockups/briefing-daily-locked-2026-07-02.html):
 * one daily surface, work first. Bar + bell → the "Noticed" band
 * (Phase-F proposals) → the watching-for strip (armed triggers) →
 * YOUR WORK as the boss of the page (flat de-carded reads, tag chips,
 * green route links, long runs collapsed) → draft chips → the animated
 * atmosphere band (sky + greeting + Central clock + 7-day forecast) →
 * the controllable market ticker (live Patterns only — never a fake
 * feed) → the world-gathering strip → the full market sections (the
 * provocative obligations, untouched) → the cost footer.
 */

const clock = signal("");
const dateLine = signal("");
const weather = signal<WeatherRead | null>(null);
const forecastOpen = signal(false);
const noticedHidden = signal(false);
const drafts = signal<ReadonlyArray<BriefingDraftBreadcrumb>>([]);
let booted = false;
let lastMarkedViewed: string | null = null;

function fmtClock(): string {
    try {
        return new Date().toLocaleTimeString("en-US", {
            timeZone: "America/Chicago",
            hour: "numeric",
            minute: "2-digit"
        });
    } catch {
        return "";
    }
}

function fmtDate(): string {
    try {
        return new Date().toLocaleDateString("en-US", {
            timeZone: "America/Chicago",
            weekday: "long",
            month: "short",
            day: "numeric"
        });
    } catch {
        return "";
    }
}

function greetingWord(): string {
    let hour: number;
    try {
        hour = Number(
            new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Chicago",
                hour: "numeric",
                hour12: false
            }).format(new Date())
        );
    } catch {
        hour = new Date().getHours();
    }
    if (hour < 12) return t("Good morning.");
    if (hour < 17) return t("Good afternoon.");
    return t("Good evening.");
}

type SkyScene = "clear" | "clouds" | "rain" | "snow" | "night";

function sceneFor(kind: WeatherKind, isDay: boolean): SkyScene {
    if (!isDay) return "night";
    if (kind === "sun") return "clear";
    if (kind === "rain" || kind === "storm") return "rain";
    if (kind === "snow") return "snow";
    return "clouds";
}

/* Stable decorative particles (positions fixed at module load so
   re-renders don't reshuffle the sky). */
const DROPS = Array.from({ length: 40 }, (_, i) => ({
    left: `${(i * 7.3 + 3) % 100}%`,
    duration: `${0.5 + ((i * 13) % 10) / 18}s`,
    delay: `${((i * 29) % 100) / 100}s`
}));
const FLAKES = Array.from({ length: 30 }, (_, i) => ({
    left: `${(i * 9.1 + 5) % 100}%`,
    duration: `${2.4 + ((i * 17) % 10) / 5}s`,
    delay: `${((i * 41) % 200) / 100}s`
}));

function Sky({ scene }: { scene: SkyScene }): JSX.Element {
    return (
        <div class={`bfv4d-sky bfv4d-sky--${scene}`} aria-hidden="true">
            {scene === "clear" ? <div class="bfv4d-sun" /> : null}
            {scene === "night" ? <div class="bfv4d-moon" /> : null}
            {scene === "clouds" || scene === "rain" ? (
                <>
                    <div class="bfv4d-cloud bfv4d-cloud--1" />
                    <div class="bfv4d-cloud bfv4d-cloud--2" />
                </>
            ) : null}
            {scene === "rain"
                ? DROPS.map((d, i) => (
                      <span
                          key={i}
                          class="bfv4d-drop"
                          style={{ left: d.left, animationDuration: d.duration, animationDelay: d.delay }}
                      />
                  ))
                : null}
            {scene === "snow"
                ? FLAKES.map((f, i) => (
                      <span
                          key={i}
                          class="bfv4d-flake"
                          style={{ left: f.left, animationDuration: f.duration, animationDelay: f.delay }}
                      />
                  ))
                : null}
        </div>
    );
}

/* ── the controllable ticker (rAF marquee · hover pauses · ‹ › nudge) ── */
interface TickerItem {
    readonly key: string;
    readonly tag: string;
    readonly text: string;
    readonly anchor: string;
}

function buildTickerItems(): ReadonlyArray<TickerItem> {
    const items: TickerItem[] = [];
    for (const p of patterns.value.slice(0, 6)) {
        items.push({ key: `p-${p.id}`, tag: "pattern", text: p.title, anchor: "#bf-patterns" });
    }
    for (const c of contrarianPatterns.value.slice(0, 3)) {
        items.push({ key: `c-${c.id}`, tag: "challenge", text: c.title, anchor: "#bf-contrarian" });
    }
    for (const pc of peripheryCandidates.value.slice(0, 3)) {
        items.push({
            key: `b-${pc.id}`,
            tag: "blind spot",
            text: pc.entity_name,
            anchor: "#bf-periphery"
        });
    }
    return items;
}

function startTicker(): () => void {
    const win = document.getElementById("bfv4-twin");
    const track = document.getElementById("bfv4-track");
    const ticker = document.getElementById("bfv4-ticker");
    if (!win || !track || !ticker) return () => undefined;
    let offset = 0;
    let half = 0;
    let paused = false;
    let last: number | null = null;
    let raf = 0;
    const measure = (): void => {
        half = track.scrollWidth / 2;
    };
    const wrap = (): void => {
        if (half > 0) {
            if (-offset >= half) offset += half;
            if (offset > 0) offset -= half;
        }
    };
    const apply = (): void => {
        track.style.transform = `translateX(${offset}px)`;
    };
    const loop = (ts: number): void => {
        if (last === null) last = ts;
        const dt = ts - last;
        last = ts;
        if (!paused) {
            offset -= 0.045 * dt;
            wrap();
            apply();
        }
        raf = requestAnimationFrame(loop);
    };
    const enter = (): void => {
        paused = true;
    };
    const leave = (): void => {
        paused = false;
        last = null;
    };
    const nudge = (px: number): void => {
        offset += px;
        wrap();
        track.style.transition = "transform .35s cubic-bezier(.22,.61,.36,1)";
        apply();
        setTimeout(() => {
            track.style.transition = "none";
        }, 370);
    };
    const left = document.getElementById("bfv4-tleft");
    const right = document.getElementById("bfv4-tright");
    const onLeft = (): void => nudge(320);
    const onRight = (): void => nudge(-320);
    ticker.addEventListener("mouseenter", enter);
    ticker.addEventListener("mouseleave", leave);
    left?.addEventListener("click", onLeft);
    right?.addEventListener("click", onRight);
    measure();
    const t1 = setTimeout(measure, 500);
    raf = requestAnimationFrame(loop);
    return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t1);
        ticker.removeEventListener("mouseenter", enter);
        ticker.removeEventListener("mouseleave", leave);
        left?.removeEventListener("click", onLeft);
        right?.removeEventListener("click", onRight);
    };
}

export function BriefingV4(): JSX.Element {
    const tickerItems = buildTickerItems();

    useEffect(() => {
        clock.value = fmtClock();
        dateLine.value = fmtDate();
        const id = setInterval(() => (clock.value = fmtClock()), 30_000);
        if (!booted) {
            booted = true;
            void refreshReads();
            void bootWorldEvents();
            void loadWeather().then((w) => {
                weather.value = w;
            });
            drafts.value = loadBriefingDrafts();
        }
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape") forecastOpen.value = false;
        };
        document.addEventListener("keydown", onKey);
        return () => {
            clearInterval(id);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    useEffect(() => {
        if (tickerItems.length >= 2) return startTicker();
        return undefined;
    }, [tickerItems.length]);

    const w = weather.value;
    const scene = w ? sceneFor(w.current.kind, w.current.isDay) : "clear";
    const noticed = pendingProposals.value[0] ?? null;
    const showNoticed = noticed !== null && !noticedHidden.value;
    if (noticed && showNoticed && lastMarkedViewed !== noticed.id) {
        lastMarkedViewed = noticed.id;
        markPendingProposalViewed(noticed.id);
    }
    const reads = workReads.value;
    const runs = collapsedRuns.value;
    const draftList = drafts.value;

    return (
        <>
            <a class="bf-skip-link" href="#bf-room-main">
                {t("Skip to your work", { class: "body" })}
            </a>
            <RoomChrome kicker="BRIEFING" />
            <main id="bf-room-main" class="bf-room bfv4d">
                <FirstVisitPrimer />
                <div class="bfv4d-col">
                    {/* bar: room name · date · bell */}
                    <div class="bfv4d-bar">
                        <span class="bfv4d-name">{t("BRIEFING")}</span>
                        <span class="bfv4d-date">{dateLine.value}</span>
                        {noticed ? (
                            <button
                                type="button"
                                class={`bfv4d-bell${noticedHidden.value ? " has" : ""}`}
                                aria-label={t("Show what the system noticed")}
                                onClick={() => (noticedHidden.value = !noticedHidden.value)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                                <span class="bfv4d-bell-dot" />
                            </button>
                        ) : null}
                    </div>

                    {/* the Noticed band — Phase-F proposals, one at a time */}
                    {showNoticed && noticed ? (
                        <div class="bfv4d-noticed">
                            <span class="bfv4d-noticed-l">{t("NOTICED")}</span>
                            <span class="bfv4d-noticed-t">
                                {noticed.whatNoticed} {noticed.whatChanges}
                            </span>
                            <span class="bfv4d-noticed-b">
                                <button
                                    type="button"
                                    class="bfv4d-sbtn bfv4d-sbtn--yes"
                                    disabled={decisionBusyId.value === noticed.id}
                                    onClick={() => void decidePendingProposal(noticed.id, "accepted")}
                                >
                                    {t("Yes, make the change", { class: "label" })}
                                </button>
                                <button
                                    type="button"
                                    class="bfv4d-sbtn"
                                    disabled={decisionBusyId.value === noticed.id}
                                    onClick={() => void decidePendingProposal(noticed.id, "snoozed")}
                                >
                                    {t("Later", { class: "label" })}
                                </button>
                                <button
                                    type="button"
                                    class="bfv4d-noticed-x"
                                    aria-label={t("Dismiss this suggestion")}
                                    onClick={() => void decidePendingProposal(noticed.id, "dismissed")}
                                >
                                    ✕
                                </button>
                            </span>
                        </div>
                    ) : null}

                    {/* watching-for strip — the armed standing orders */}
                    {armedTriggers.value.length > 0 ? (
                        <div class="bfv4d-watch">
                            <span class="bfv4d-watch-l">{t("WATCHING FOR")}</span>
                            {armedTriggers.value.slice(0, 3).map((tr) => (
                                <span class="bfv4d-wchip" key={tr.id}>
                                    <span class="bfv4d-wdot" />
                                    {tr.natural_language}
                                </span>
                            ))}
                            <a class="bfv4d-addt" href="#bf-watchlist">
                                {t("+ watch for something new", { class: "label" })}
                            </a>
                        </div>
                    ) : null}

                    {/* YOUR WORK — the boss of the page */}
                    <div class="bfv4d-workh">
                        <span class="bfv4d-workt">{t("Your work")}</span>
                        <span class="bfv4d-works">{t("inside your deals and accounts", { class: "body" })}</span>
                        {readsLoaded.value ? (
                            <span class="bfv4d-workn">{reads.length}</span>
                        ) : null}
                    </div>
                    <div class="bfv4d-scroll">
                        {readsError.value ? (
                            <p class="bfv4d-quiet" role="alert">{t("Couldn't load your reads.", { class: "body" })}</p>
                        ) : !readsLoaded.value ? (
                            <p class="bfv4d-quiet">{t("Reading your work…", { class: "body" })}</p>
                        ) : reads.length === 0 ? (
                            <p class="bfv4d-quiet">
                                {t("Nothing to flag in your work right now. The system checks every half hour — when something starts slipping, it shows up here.", { class: "body" })}
                            </p>
                        ) : (
                            <>
                                {reads.map((r) => (
                                    <div class={`bfv4d-read${r.tone === "forest" ? " is-compound" : ""}`} key={r.id}>
                                        <div class="bfv4d-read-top">
                                            <span class={`bfv4d-tag bfv4d-tag--${r.tone}`}>{r.tag}</span>
                                            <span class="bfv4d-read-txt">{r.text}</span>
                                            <button
                                                type="button"
                                                class="bfv4d-read-x"
                                                aria-label={t("Dismiss this read")}
                                                disabled={dismissingId.value === r.id}
                                                onClick={() => void dismissRead(r.id)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {r.route ? (
                                            <a class="bfv4d-route" href={r.route.href}>
                                                {t("Open in", { class: "label" })} {r.route.roomLabel}{" "}
                                                <span class="bfv4d-route-a">→</span>
                                            </a>
                                        ) : null}
                                    </div>
                                ))}
                                {runs.map((run) => (
                                    <div class="bfv4d-read bfv4d-read--run" key={run.generator}>
                                        <span class="bfv4d-read-txt bfv4d-read-more">
                                            + {run.count} {run.label}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* draft chips */}
                    {draftList.length > 0 ? (
                        <div class="bfv4d-drafts">
                            <span class="bfv4d-drafts-l">{t("DRAFTS")}</span>
                            {draftList.map((d) => (
                                <span class="bfv4d-dchip" key={`${d.roomPath}-${d.acknowledgedAt}`}>
                                    ✎ {d.label}
                                    <a class="bfv4d-dchip-o" href={d.roomPath}>
                                        {t("Open", { class: "label" })} · {roomLabelForPath(d.roomPath)}
                                    </a>
                                    <button
                                        type="button"
                                        class="bfv4d-dchip-x"
                                        aria-label={t("Clear this draft")}
                                        onClick={() => {
                                            clearBriefingDraft(d.roomPath, d.label, d.acknowledgedAt);
                                            drafts.value = loadBriefingDrafts();
                                        }}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* the atmosphere — sky, greeting, clock, forecast */}
                <div class="bfv4d-atmo">
                    <Sky scene={scene} />
                    <div class="bfv4d-atmo-in">
                        <div>
                            <div class="bfv4d-greet">{greetingWord()}</div>
                            {clock.value ? (
                                <div class="bfv4d-clock">
                                    {clock.value} · {w?.current.place ?? t("Chicago")}
                                </div>
                            ) : null}
                        </div>
                        <div class="bfv4d-wxrow">
                            <div>
                                {w ? <span class="bfv4d-temp">{w.current.tempF}°</span> : null}
                                {w ? <span class="bfv4d-cond">{w.current.label}</span> : null}
                            </div>
                            {w && w.days.length > 0 ? (
                                <button
                                    type="button"
                                    class="bfv4d-fcbtn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        forecastOpen.value = !forecastOpen.value;
                                    }}
                                >
                                    {t("7-day forecast", { class: "label" })} ↗
                                </button>
                            ) : null}
                        </div>
                    </div>
                    {w && w.days.length > 0 ? (
                        <div class={`bfv4d-fc${forecastOpen.value ? " open" : ""}`}>
                            <button
                                type="button"
                                class="bfv4d-fc-x"
                                aria-label={t("Close the forecast")}
                                onClick={() => (forecastOpen.value = false)}
                            >
                                ✕
                            </button>
                            {w.days.map((d) => (
                                <div class="bfv4d-fday" key={d.day}>
                                    <b>{d.day}</b>
                                    <div class="bfv4d-fhi">{d.hiF}°</div>
                                    <div class="bfv4d-flo">{d.loF}°</div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* the market ticker — live reads only, never a fake feed */}
                {tickerItems.length >= 2 ? (
                    <div class="bfv4d-ticker" id="bfv4-ticker">
                        <span class="bfv4d-ticker-l">
                            <span class="bfv4d-ticker-d" />
                            {t("THE MARKET")}
                        </span>
                        <button type="button" class="bfv4d-tarrow bfv4d-tarrow--l" id="bfv4-tleft" aria-label={t("Scrub the ticker back")}>‹</button>
                        <div class="bfv4d-twin" id="bfv4-twin">
                            <div class="bfv4d-track" id="bfv4-track">
                                {[...tickerItems, ...tickerItems].map((item, i) => (
                                    <span class="bfv4d-titem" key={`${item.key}-${i}`}>
                                        <span class="bfv4d-ttag">{item.tag}</span>
                                        <span class="bfv4d-ttxt">{item.text}</span>
                                        <a class="bfv4d-troute" href={item.anchor}>
                                            {t("Read it", { class: "label" })} ↓
                                        </a>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button type="button" class="bfv4d-tarrow bfv4d-tarrow--r" id="bfv4-tright" aria-label={t("Scrub the ticker forward")}>›</button>
                    </div>
                ) : null}

                {/* where your world is gathering */}
                <div class="bfv4d-world">
                    <span class="bfv4d-world-l">{t("WHERE YOUR WORLD IS GATHERING")}</span>
                    {worldEvents.value.map((ev) => (
                        <span class="bfv4d-wevent" key={ev.id}>
                            <span class="bfv4d-wedot" />
                            <b>{ev.name}</b>
                            {ev.when ? ` · ${ev.when}` : ""}
                            {ev.where ? ` · ${ev.where}` : ""}
                        </span>
                    ))}
                    <a class="bfv4d-wmore" href="/outdoors-events/">
                        {worldEventsCount.value > 3
                            ? `${worldEventsCount.value - 3} ${t("more in Outdoors Events", { class: "label" })} →`
                            : `${t("Outdoors Events", { class: "label" })} →`}
                    </a>
                </div>

                {/* the market, in full — the provocative obligations, untouched */}
                <div class="bfv4d-col bfv4d-deep">
                    <StaleRunBanner />
                    <div class="bfv4d-workh bfv4d-deep-h">
                        <span class="bfv4d-workt">{t("Your market, in full")}</span>
                        <span class="bfv4d-works">{t("every read links to its evidence", { class: "body" })}</span>
                    </div>
                    <BriefingLead />
                    <div id="bf-patterns"><PatternList /></div>
                    <div id="bf-contrarian"><ContrarianRail /></div>
                    <div id="bf-periphery"><PeripheryRail /></div>
                    <div id="bf-watchlist"><WatchList /></div>
                </div>
                <BriefingFooter />
            </main>
            <GroundLine />
            <LiveEdge />
        </>
    );
}
