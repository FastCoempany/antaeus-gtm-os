import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    activeDeals,
    wonDeals,
    lostDeals,
    dealFilter,
    setDealFilter,
    focusedDealId,
    setFocusedDealId,
    openDealEditor,
    exportDealsCsv,
    type DealFilter
} from "../state";
import type { RecoveryAssessment } from "../lib/recovery";
import { applyFilter, fmtMoney } from "../ds/lib/adapters";
import { DealDrawer } from "../ds/components/DealDrawer";
import { LossReasonModalDS } from "../ds/components/LossReasonModalDS";
import {
    hrefToFutureAutopsy,
    hrefToPocFramework,
    hrefToAdvisorDeploy,
    hrefToNegotiation
} from "../lib/handoff";
import {
    buildHero,
    rankedAssessments,
    horizonPercent,
    nineFields,
    LANE_META,
    LANE_ORDER,
    TIMELINE_ZONES,
    type DwView
} from "./lib/views";
import "./deal-workspace-v4.css";
import { GroundLine } from "@/lib/ground/GroundLine";

/**
 * DealWorkspaceV4 — the Diagnosis Table (canon §4.13), wired to
 * production. Three toggleable views (Focus / Timeline / List) off ONE
 * shared recovery engine; leads with pressure (which deals slip this
 * week + the smallest corrective move); the 9-field health drawer + the
 * loss-reason capture are the reused, signal-driven DS components. The
 * recovery engine, deal state, editor, and CSV export are reused
 * unchanged — presentation only.
 */

const dwView = signal<DwView>("focus");
// Deal.value is raw dollars everywhere in the codebase — use the
// shipped fmtMoney (÷1000 → "$84k"), never a naive "+k".
const money = fmtMoney;

const FILTERS: ReadonlyArray<{ key: DealFilter; label: string }> = [
    { key: "all", label: t("All") },
    { key: "at-risk", label: t("At risk") },
    { key: "stalled", label: t("Gone quiet") },
    { key: "this-quarter", label: t("This quarter") }
];

function discoveryHref(account: string): string {
    const q = encodeURIComponent(account);
    return `/discovery-studio/?account=${q}&returnTo=%2Fdeal-workspace%2F&returnLabel=Deal%20Workspace&fromMode=room&fromSurface=deal-workspace`;
}

function laneVars(cls: string): string {
    if (cls === "crit") return "--lc:var(--ds-red,#c0392b);--fsoft:rgba(192,57,43,.07)";
    if (cls === "risk") return "--lc:var(--ds-amber,#b5790f);--fsoft:rgba(181,121,15,.1)";
    return "--lc:var(--ds-forest,#1b5e3f);--fsoft:rgba(27,94,63,.07)";
}

function ActionButton({ a }: { a: RecoveryAssessment }): JSX.Element {
    const kind = a.lane === "critical" ? "hot" : a.lane === "at-risk" ? "warm" : "calm";
    return (
        <button type="button" class={`dw4-fix dw4-fix--${kind}`} onClick={() => openDealEditor(a.deal)}>
            {a.nextMove}
        </button>
    );
}

// ── LIST view ──────────────────────────────────────────────────────────
function ListView({ items }: { items: ReadonlyArray<RecoveryAssessment> }): JSX.Element {
    const groups = LANE_ORDER.map((lane) => ({
        meta: LANE_META[lane],
        rows: items.filter((a) => a.lane === lane)
    })).filter((g) => g.rows.length > 0);

    return (
        <>
            {groups.map((g) => (
                <div class={`dw4-lane dw4-${g.meta.cls}`} key={g.meta.key} style={laneVars(g.meta.cls)}>
                    <div class="dw4-lanehd">
                        <span class="dw4-d" />
                        <span class="dw4-lt">{g.meta.title}</span>
                        <span class="dw4-ls">— {g.meta.sub}</span>
                        <span class="dw4-ln">{g.rows.length}</span>
                    </div>
                    {g.rows.map((a) => (
                        <div class={`dw4-lrow dw4-${g.meta.cls}`} key={a.deal.id} style={laneVars(g.meta.cls)}>
                            <div class="dw4-tick" />
                            <div>
                                <div class="dw4-a" onClick={() => setFocusedDealId(a.deal.id)}>{a.deal.accountName}</div>
                                <div class="dw4-v">{money(a.deal.value)}</div>
                                <span class="dw4-stg">{a.deal.stage}</span>
                            </div>
                            <div class="dw4-why">
                                {a.causes.length > 0 ? <span class="dw4-c">{a.causes.join(" · ")}</span> : null}
                                {a.lane === "healthy" ? t("On track — let it run, don't let it drift.", { class: "body" }) : a.nextMove}
                            </div>
                            <div class="dw4-act">
                                <ActionButton a={a} />
                                <div class="dw4-sub">
                                    <a onClick={() => openDealEditor(a.deal)}>{t("Open")}</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
}

// ── FOCUS view ─────────────────────────────────────────────────────────
function FocusView({ items }: { items: ReadonlyArray<RecoveryAssessment> }): JSX.Element {
    if (items.length === 0) {
        return <div class="dw4-calmnote"><b>{t("Nothing live.")}</b> {t("Add a deal, or wait for one from a cold call.", { class: "body" })}</div>;
    }
    const focal = items.find((a) => a.deal.id === focusedDealId.value) ?? items[0]!;
    const cls = LANE_META[focal.lane].cls;
    const fields = nineFields(focal.deal);
    const rest = items.filter((a) => a.deal.id !== focal.deal.id);

    return (
        <div class="dw4-split">
            <div class={`dw4-focal dw4-${cls}`} style={laneVars(cls)}>
                <div class="dw4-fhd">
                    <div class="dw4-fl">
                        <span class="dw4-d" />
                        {focal.lane === "healthy" ? t("On track") : t("Slipping now")}
                        {focal.deal.value >= 100 ? t(" · your biggest deal") : ""}
                    </div>
                    <div class="dw4-nm">{focal.deal.accountName} <span class="dw4-fv">{money(focal.deal.value)}</span></div>
                    <div class="dw4-fstg">{focal.deal.stage}</div>
                </div>
                <div class="dw4-diag">
                    <div class="dw4-diagc">{focal.lane === "healthy" ? t("Where it stands") : t("Why it's slipping")}</div>
                    <div class="dw4-diagt">
                        {focal.causes.length > 0 ? `${focal.causes.join(" · ")}. ` : ""}
                        {focal.nextMove}
                    </div>
                </div>
                <div class="dw4-actbar">
                    <ActionButton a={focal} />
                    <button type="button" class="dw4-gh" onClick={() => openDealEditor(focal.deal)}>{t("Open full deal")}</button>
                    <a class="dw4-gh" href={hrefToFutureAutopsy(focal.deal.accountName)}>{t("Pre-mortem")}</a>
                </div>
                <div class="dw4-health">
                    <div class="dw4-hh">
                        {t("Deal health")}
                        <button type="button" class="dw4-e" onClick={() => openDealEditor(focal.deal)}>{t("edit all 9 →")}</button>
                    </div>
                    <div class="dw4-hgrid">
                        {fields.map((f) => (
                            <div class={`dw4-hf${f.v ? "" : " dw4-gap"}`} key={f.k}>
                                <span class="dw4-hk">{f.k}</span>
                                <span class="dw4-hval">{f.v || t("not named")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div class="dw4-queue">
                <div class="dw4-qh"><span>{t("The rest, ranked")}</span><span class="dw4-qn">{rest.length}</span></div>
                {rest.map((a) => (
                    <div class="dw4-qr" key={a.deal.id} style={`--qc:${a.lane === "critical" ? "var(--ds-red,#c0392b)" : a.lane === "at-risk" ? "var(--ds-amber,#b5790f)" : "var(--ds-forest,#1b5e3f)"}`} onClick={() => setFocusedDealId(a.deal.id)}>
                        <div>
                            <div class="dw4-qa">{a.deal.accountName}</div>
                            <div class="dw4-qwhy">{a.causes[0] ?? t("on track")}</div>
                        </div>
                        <span class="dw4-qv">{money(a.deal.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── TIMELINE view ──────────────────────────────────────────────────────
function TimelineView({ items }: { items: ReadonlyArray<RecoveryAssessment> }): JSX.Element {
    const red = items.filter((a) => a.lane === "critical");
    return (
        <>
            <div class="dw4-tlwrap">
                <div class="dw4-tlzones">
                    {TIMELINE_ZONES.map((z) => (
                        <div class={`dw4-zone dw4-${z.cls}`} key={z.cls}>
                            <div class="dw4-zt">{z.zt}</div>
                            <div class="dw4-zs">{z.zs}</div>
                        </div>
                    ))}
                </div>
                <div class="dw4-track">
                    <div class="dw4-v1" /><div class="dw4-v2" /><div class="dw4-now" /><div class="dw4-nowl">{t("now")}</div>
                    {items.map((a, i) => {
                        const x = horizonPercent(a);
                        const y = 14 + (i % 3) * 64;
                        const pc = a.lane === "critical" ? "var(--ds-red,#c0392b)" : a.lane === "at-risk" ? "var(--ds-amber,#b5790f)" : "var(--ds-forest,#1b5e3f)";
                        return (
                            <div class="dw4-pill" key={a.deal.id} style={`left:${x}%;top:${y}px;--pc:${pc}`} onClick={() => setFocusedDealId(a.deal.id)}>
                                <span class="dw4-pa">{a.deal.accountName}</span>
                                <span class="dw4-pv">{money(a.deal.value)}</span>
                                <span class="dw4-pwhy">{a.causes[0] ?? (a.lane === "healthy" ? t("on track") : t("watch"))}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {red.length > 0 ? (
                <>
                    <div class="dw4-acthd">{t("Act this week — the red zone", { class: "body" })}</div>
                    {red.map((a) => (
                        <div class="dw4-arow" key={a.deal.id}>
                            <div class="dw4-tick" style="background:var(--ds-red,#c0392b)" />
                            <div>
                                <div class="dw4-a" onClick={() => setFocusedDealId(a.deal.id)}>{a.deal.accountName}</div>
                                <div class="dw4-v">{money(a.deal.value)} · {a.deal.stage}</div>
                            </div>
                            <div class="dw4-why"><span class="dw4-c">{a.causes.join(" · ")}</span>{a.nextMove}</div>
                            <ActionButton a={a} />
                        </div>
                    ))}
                </>
            ) : (
                <div class="dw4-calmnote"><b>{t("Red zone clear.")}</b> {t("Nothing slips this week — the pressure has moved to the right.", { class: "body" })}</div>
            )}
        </>
    );
}

export function DealWorkspaceV4(): JSX.Element {
    const active = activeDeals.value;
    const items = applyFilter(rankedAssessments(active), dealFilter.value);
    const hero = buildHero(active);
    const view = dwView.value;
    const won = wonDeals.value;
    const lost = lostDeals.value;

    return (
        <div class="dw4">
            <div class="dw4-topbar">
                <span class="dw4-brand"><b>{t("ANTAEUS")}</b> · {t("Deal Workspace")}</span>
                <span class="dw4-tstat">
                    <b>{hero.liveCount}</b> {t("live")} · <b>{money(hero.pipelineValue)}</b> {t("pipeline")}
                </span>
            </div>
            <div class="dw4-pad">
                <div class={`dw4-hero${hero.calm ? " dw4-hero--calm" : ""}`}>
                    <h1 class="dw4-h1">
                        {hero.calm ? (
                            <><b>{t("Nothing slipping.")}</b> {t("Every live deal has a next step.", { class: "body" })}</>
                        ) : (
                            <><b>{hero.atRiskCount === 1 ? t("One deal") : `${hero.atRiskCount} ${t("deals")}`}</b> {t("will slip this week if you do nothing.", { class: "body" })}</>
                        )}
                    </h1>
                    <div class="dw4-hr">
                        <div class="dw4-big">{hero.calm ? "$0" : money(hero.atRiskValue)}</div>
                        <div class="dw4-l2">{t("at risk right now")}</div>
                    </div>
                </div>

                <div class="dw4-bar">
                    <div class="dw4-filters">
                        {FILTERS.map((f) => (
                            <span class={`dw4-chip${dealFilter.value === f.key ? " is-on" : ""}`} key={f.key} onClick={() => setDealFilter(f.key)}>
                                {f.label}
                            </span>
                        ))}
                    </div>
                    <div class="dw4-vtoggle">
                        {(["focus", "timeline", "list"] as const).map((v) => (
                            <button type="button" class={dwView.value === v ? "is-on" : ""} key={v} onClick={() => (dwView.value = v)}>
                                {v === "focus" ? t("Focus") : v === "timeline" ? t("Timeline") : t("List")}
                            </button>
                        ))}
                    </div>
                </div>

                <div class="dw4-view">
                    {items.length === 0 ? (
                        <div class="dw4-calmnote">{dealFilter.value === "all"
                            ? t("No live deals yet. Add one, or wait for one from a cold call.", { class: "body" })
                            : t("No deals match the current filter.", { class: "body" })}</div>
                    ) : view === "list" ? (
                        <ListView items={items} />
                    ) : view === "timeline" ? (
                        <TimelineView items={items} />
                    ) : (
                        <FocusView items={items} />
                    )}
                </div>

                <div class="dw4-closed">
                    <span><b class="dw4-won">{won.length} {t("won")}</b> {t("this quarter")}</span>
                    <span><b class="dw4-lost">{lost.length} {t("lost")}</b></span>
                    <button type="button" class="dw4-exp" onClick={() => exportDealsCsv()}>{t("Export pipeline (CSV) ↓")}</button>
                </div>

                <div class="dw4-handoff">
                    <div class="dw4-hoh">{t("Take a deal somewhere it gets resolved", { class: "body" })}</div>
                    <div class="dw4-hrow">
                        <a class="dw4-hbtn" href={hrefToFutureAutopsy()}>{t("Pre-mortem a deal")}</a>
                        <a class="dw4-hbtn" href={hrefToPocFramework()}>{t("Run a pilot")}</a>
                        <a class="dw4-hbtn" href={hrefToAdvisorDeploy()}>{t("Call in a favor")}</a>
                        <a class="dw4-hbtn" href={discoveryHref("")}>{t("Prep the next call")}</a>
                        <a class="dw4-hbtn" href={hrefToNegotiation()}>{t("Getting to signed")}</a>
                    </div>
                </div>
            </div>

            <DealDrawer />
            <LossReasonModalDS />
            {/* The Ground — the app's one jump summon (2026-07-08):
                touch the ground line (or press G) and the motion map
                rises from beneath the room. */}
            <GroundLine />

        </div>
    );
}
