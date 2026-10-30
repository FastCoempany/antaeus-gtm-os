import type { JSX } from "preact";
import { useMemo } from "preact/hooks";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { inputs, coverage, benchmark, metrics, patchInputs } from "../state";
import {
    hrefToOutboundStudio,
    hrefToColdCallStudio,
    hrefToDealWorkspace
} from "../lib/handoff";
import {
    readActuals,
    buildBelievability,
    buildPace,
    fmtMoney
} from "./lib/pace";
import { logBulkOutreach, bulkOutreachToday, BULK_LABELS } from "./lib/bulk-outreach";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./quota-workback-v4.css";

/**
 * QuotaWorkbackV4 — annual target workback plus current recorded state.
 * PLAN translates the annual target through the user's assumptions into
 * monthly and daily requirements. PROJECTION compares the target with
 * closed-won revenue plus stage-weighted open pipeline. Those are two
 * different calculations and the UI keeps them distinct.
 */
const adjustOpen = signal(false);
const bulkDraft = signal("");
// Bumped after a bulk log so the memoized actuals re-read.
const bulkVersion = signal(0);

/** One-line manual total for outreach completed today. */
function BulkCountRow(): JSX.Element {
    return (
        <div class="qw4-bulk">
            <span class="qw4-bp">{BULK_LABELS.prompt}</span>
            <input inputMode="numeric" value={bulkDraft.value} placeholder="40"
                onInput={(e) => (bulkDraft.value = (e.currentTarget as HTMLInputElement).value)} />
            <button type="button" disabled={!(Number(bulkDraft.value) > 0)}
                onClick={() => {
                    logBulkOutreach(Number(bulkDraft.value));
                    bulkDraft.value = "";
                    bulkVersion.value += 1;
                }}>
                {BULK_LABELS.action}
            </button>
            {bulkOutreachToday() > 0 ? (
                <span class="qw4-bq">{bulkOutreachToday()} {BULK_LABELS.onRecord}</span>
            ) : null}
        </div>
    );
}

export function QuotaWorkbackV4(): JSX.Element {
    const inp = inputs.value;
    const bench = benchmark.value;
    const m = metrics.value;
    const cov = coverage.value;
    const actuals = useMemo(() => readActuals(), [bulkVersion.value]);
    const believe = buildBelievability(inp, bench, m);
    const pace = buildPace(inp.quota, actuals, cov);
    const hasPlan = inp.quota > 0;
    const paceMode = hasPlan && actuals.hasActivity;

    const covRatio = cov.hasDeals ? cov.ratio : 0;
    const covPct = bench.coverage > 0 ? Math.min(100, Math.round((covRatio / bench.coverage) * 100)) : 0;
    const covShort = Math.max(0, Math.round(cov.needed));

    const meetingsNeedMonth = m.meetingsMonth;
    const dealsNeedMonth = Math.max(1, Math.round(m.dealsMonth));

    const behindOutreach = actuals.outreachPerDay < m.touchesDay;
    const behindMeetings = actuals.meetingsThisMonth < meetingsNeedMonth;
    const behindCoverage = cov.hasDeals ? covRatio < bench.coverage : true;
    const behindCloses = actuals.closedThisMonth < dealsNeedMonth;
    const outreachGap = Math.max(0, Math.ceil(m.touchesDay - actuals.outreachPerDay));

    return (
        <div class="qw4">
            <div class="qw4-wrap">
                <div class="qw4-top">
                    <span class="qw4-bname">{t("Quota Workback")}</span>
                    <span class="qw4-r">
                        {paceMode ? t("projection") : t("plan")} · {hasPlan ? `${fmtMoney(inp.quota)} ${t("annual target")}` : t("set your target")}
                    </span>
                </div>

                {!hasPlan ? (
                    <div class="qw4-verd">
                        <div class="qw4-k qw4-k--plan">{t("Start with the annual target")}</div>
                        <div class="qw4-h">{t("How much revenue do you need to close this year?", { class: "body" })}</div>
                        <div class="qw4-s">
                            {t("Enter the annual target and your typical deal size. Antaeus uses your conversion assumptions to estimate the monthly and daily activity required.", { class: "body" })}
                        </div>
                        <div class="qw4-planform">
                            <label class="qw4-pf">
                                <span>{t("Annual target ($)")}</span>
                                <input type="number" value={inp.quota || ""} placeholder="1200000"
                                    onInput={(e) => patchInputs({ quota: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                            </label>
                            <label class="qw4-pf">
                                <span>{t("Typical deal size ($)")}</span>
                                <input type="number" value={inp.acv || ""} placeholder="50000"
                                    onInput={(e) => patchInputs({ acv: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                            </label>
                        </div>
                    </div>
                ) : (
                    <>
                        <div class="qw4-verd">
                            <div class={`qw4-k${pace.onTarget ? " qw4-k--ok" : ""}`}>
                                {paceMode ? t("Closed revenue plus weighted pipeline") : t("Activity required by current assumptions")}
                            </div>
                            {paceMode ? (
                                <div class="qw4-h">
                                    {t("Closed-won revenue plus stage-weighted open pipeline currently totals", { class: "body" })}{" "}
                                    <b class={pace.onTarget ? "qw4-good" : ""}>{fmtMoney(pace.projected)}</b>
                                    {pace.onTarget ? (
                                        <>. {t("That is at or above the annual target.", { class: "body" })}</>
                                    ) : (
                                        <>
                                            {", "}{t("which is about", { class: "body" })} <b>{fmtMoney(pace.short)} {t("below the annual target")}</b>.
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div class="qw4-h">
                                    {t("Under the current assumptions, a", { class: "body" })} {fmtMoney(inp.quota)} {t("annual target requires about", { class: "body" })}{" "}
                                    <b>{m.touchesDay} {t("messages and calls per working day")}</b>.
                                </div>
                            )}
                            {paceMode && !pace.onTarget && behindOutreach ? (
                                <div class="qw4-s">
                                    {t("You are averaging", { class: "body" })}{" "}
                                    <b>{actuals.outreachPerDay} {t("outreach actions per working day this month", { class: "body" })}</b>. {t("The current model requires", { class: "body" })}{" "}
                                    <b>{m.touchesDay}</b>, {t("a gap of", { class: "body" })} <b>{outreachGap} {t("per day")}</b>.
                                </div>
                            ) : null}
                            <button type="button" class="qw4-link qw4-adjust" onClick={() => (adjustOpen.value = !adjustOpen.value)}>
                                {adjustOpen.value ? t("Done adjusting") : t("Change the target or assumptions", { class: "body" })}
                            </button>
                            {adjustOpen.value ? (
                                <div class="qw4-planform">
                                    <label class="qw4-pf">
                                        <span>{t("Annual target ($)")}</span>
                                        <input type="number" value={inp.quota || ""}
                                            onInput={(e) => patchInputs({ quota: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                    <label class="qw4-pf">
                                        <span>{t("Typical deal size ($)")}</span>
                                        <input type="number" value={inp.acv || ""}
                                            onInput={(e) => patchInputs({ acv: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                    <label class="qw4-pf">
                                        <span>{t("Win rate (%)")}</span>
                                        <input type="number" value={inp.win || ""}
                                            onInput={(e) => patchInputs({ win: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                    <label class="qw4-pf">
                                        <span>{t("First meetings that become qualified opportunities (%)", { class: "body" })}</span>
                                        <input type="number" value={inp.m2o || ""}
                                            onInput={(e) => patchInputs({ m2o: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                    <label class="qw4-pf">
                                        <span>{t("Working days per month")}</span>
                                        <input type="number" value={inp.days || ""}
                                            onInput={(e) => patchInputs({ days: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                </div>
                            ) : null}
                        </div>

                        {paceMode ? (
                            <div class="qw4-track">
                                <div class="qw4-tk">
                                    <span class={`qw4-proj${pace.onTarget ? " qw4-proj--ok" : ""}`} style={`width:${Math.round(pace.pct * 100)}%`}>
                                        <span class="qw4-lbl">{t("closed + weighted pipeline")} {fmtMoney(pace.projected)}</span>
                                    </span>
                                    <span class="qw4-lblt">{fmtMoney(inp.quota)}</span>
                                </div>
                                <div class="qw4-tkx"><span>$0</span><span>{t("annual target →")}</span></div>
                            </div>
                        ) : null}

                        <div class="qw4-strands">
                            <div class="qw4-st qw4-st--need">
                                <div class="qw4-cl">{t("Activity and pipeline required by current assumptions", { class: "body" })}</div>
                                <div class="qw4-line"><span class="qw4-ln">{m.touchesDay}</span><span class="qw4-lt">{t("messages & calls")} <b>{t("per working day")}</b></span></div>
                                <div class="qw4-line"><span class="qw4-ln">{meetingsNeedMonth}</span><span class="qw4-lt">{t("first meetings")} <b>{t("per month")}</b></span></div>
                                <div class="qw4-line"><span class="qw4-ln">{bench.coverage}×</span><span class="qw4-lt">{t("annual target")} <b>{t("in open pipeline")}</b></span></div>
                                <div class="qw4-line"><span class="qw4-ln">{dealsNeedMonth}</span><span class="qw4-lt">{t("closed-won deals")} <b>{t("per month")}</b></span></div>
                                <div class="qw4-judge">
                                    <div class="qw4-jh">{t("Assumption check")}</div>
                                    <div class="qw4-jb">{believe.read}</div>
                                    {believe.cost ? <div class="qw4-jc">{believe.cost}</div> : null}
                                    {believe.fix ? (
                                        <button type="button" class="qw4-link" onClick={() => patchInputs({ [believe.fix!.key]: believe.fix!.value } as never)}>
                                            {t("Set it to")} {believe.fix.value}% {t("and recalculate →")}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            <div class="qw4-st qw4-st--real">
                                <div class="qw4-cl">{paceMode ? t("Current recorded activity and pipeline") : t("Recorded activity will appear here", { class: "body" })}</div>
                                {paceMode ? (
                                    <>
                                        <div class="qw4-line">
                                            <span class={`qw4-ln ${behindOutreach ? "qw4-bad" : "qw4-good"}`}>{actuals.outreachPerDay}</span>
                                            <span class="qw4-lt">{t("outreach per working day this month")}</span>
                                            <span class={`qw4-gp ${behindOutreach ? "is-behind" : "is-ok"}`}>{behindOutreach ? `${outreachGap} ${t("below requirement")}` : t("meets requirement")}</span>
                                        </div>
                                        <BulkCountRow />
                                        <div class="qw4-line">
                                            <span class={`qw4-ln ${behindMeetings ? "qw4-bad" : "qw4-good"}`}>{actuals.meetingsThisMonth}</span>
                                            <span class="qw4-lt">{t("first meetings recorded this month")}</span>
                                            <span class={`qw4-gp ${behindMeetings ? "is-behind" : "is-ok"}`}>{behindMeetings ? t("below requirement") : t("meets requirement")}</span>
                                        </div>
                                        <div class="qw4-line">
                                            <span class={`qw4-ln ${behindCoverage ? "qw4-bad" : "qw4-good"}`}>{cov.hasDeals ? `${covRatio.toFixed(1)}×` : "0×"}</span>
                                            <span class="qw4-lt">{cov.hasDeals ? `${fmtMoney(cov.raw)} ${t("in open pipeline")}` : t("no open deals recorded")}</span>
                                            <span class={`qw4-gp ${behindCoverage ? "is-behind" : "is-ok"}`}>{behindCoverage ? t("below benchmark") : t("meets benchmark")}</span>
                                        </div>
                                        <div class="qw4-line">
                                            <span class={`qw4-ln ${behindCloses ? "qw4-bad" : "qw4-good"}`}>{actuals.closedThisMonth}</span>
                                            <span class="qw4-lt">{t("closed-won deals this month")}</span>
                                            <span class={`qw4-gp ${behindCloses ? "is-behind" : "is-ok"}`}>{behindCloses ? t("below requirement") : t("meets requirement")}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div class="qw4-quiet">{t("Once outreach and deals are recorded, this column compares those records with the current plan assumptions.", { class: "body" })}</div>
                                        <BulkCountRow />
                                    </>
                                )}
                                <div class="qw4-judge">
                                    <div class="qw4-jh">
                                        {t("Pipeline coverage")}
                                        <span class="qw4-rr">{cov.hasDeals ? `${covRatio.toFixed(1)}× / ${bench.coverage}×` : `0 / ${bench.coverage}×`}</span>
                                    </div>
                                    <div class="qw4-mini"><span class="qw4-f" style={`width:${covPct}%`} /><span class="qw4-m" /></div>
                                    <div class="qw4-jb">
                                        {cov.hasDeals ? (
                                            <>
                                                {t("You have", { class: "body" })} <b>{fmtMoney(cov.raw)}</b> {t("in open pipeline. Using the", { class: "body" })}{" "}
                                                <b>{bench.coverage}×</b> {t("coverage benchmark for this ACV band, the modeled target is", { class: "body" })}{" "}
                                                <b>{fmtMoney(Math.round(inp.quota * bench.coverage))}</b>
                                                {covShort > 0 ? <>. {t("That is roughly", { class: "body" })} <b>{fmtMoney(covShort)} {t("below the modeled coverage target")}</b>.</> : <>. {t("Recorded pipeline is at or above the modeled coverage target.", { class: "body" })}</>}
                                            </>
                                        ) : (
                                            t("No open deals are recorded yet. The activity model above shows the outreach requirement under the current assumptions.", { class: "body" })
                                        )}
                                    </div>
                                    <a class="qw4-link" href={hrefToDealWorkspace()}>{t("See open deals in Deal Workspace →", { class: "body" })}</a>
                                </div>
                            </div>
                        </div>

                        {paceMode && !pace.onTarget ? (
                            <div class="qw4-back">
                                <span class="qw4-bt">{t("Actions to increase coverage")}</span>
                                <span class="qw4-bb">
                                    {behindOutreach ? (
                                        <><b>{outreachGap} {t("additional outreach actions per working day under the current model", { class: "body" })}</b>{behindCoverage ? <>, {t("plus additional qualified pipeline to reach the coverage benchmark.", { class: "body" })}</> : "."} </>
                                    ) : behindCoverage ? (
                                        <><b>{t("Add qualified pipeline")}</b> — {t("recorded outreach meets the modeled requirement, but open pipeline is below the coverage benchmark.", { class: "body" })} </>
                                    ) : (
                                        t("Recorded outreach and pipeline coverage meet the modeled thresholds. Review open-deal progression and close timing next.", { class: "body" })
                                    )}
                                </span>
                            </div>
                        ) : null}

                        <div class="qw4-hand">
                            <span class="qw4-hl">{t("Actions to increase coverage")}</span>
                            <a class="qw4-btn" href={hrefToOutboundStudio()}>{t("Run today's outreach →")}</a>
                            <a class="qw4-gh" href={hrefToColdCallStudio()}>{t("Build more pipeline")}</a>
                            <a class="qw4-gh" href={hrefToDealWorkspace()}>{t("Check open deals")}</a>
                        </div>
                    </>
                )}
            </div>
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
