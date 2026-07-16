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
 * QuotaWorkbackV4 (canon §4.18) — pace + fused strands, wired to
 * production. The annual number worked down to the one thing the seller
 * controls: what they do every working day. Two reads over the same
 * math: PLAN (setting the number, works on an empty workspace) and PACE
 * (a returning seller — projected landing vs target, needs-vs-actuals
 * in two fused strands, the believability judgment + pipeline coverage
 * welded into each column). The calc engine, benchmark bands, coverage,
 * and persistence are reused unchanged. §13-clean: messages & calls a
 * day, real opportunities, first meetings — no funnel jargon.
 */
const adjustOpen = signal(false);
const bulkDraft = signal("");
// Bumped after a bulk log so the memoized actuals re-read.
const bulkVersion = signal(0);

/**
 * The one-line hand count. Rendered in BOTH pace states — the operator
 * this exists for (did the outreach, logged nothing) starts in the
 * quiet state, and their first count is what turns the pace read on.
 */
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
    // The activity logs don't change mid-visit — read them once per
    // mount instead of re-parsing four JSON blobs on every keystroke.
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
                        {paceMode ? t("pace") : t("plan")} · {hasPlan ? `${fmtMoney(inp.quota)} ${t("by year-end")}` : t("set your number")}
                    </span>
                </div>

                {!hasPlan ? (
                    <div class="qw4-verd">
                        <div class="qw4-k qw4-k--plan">{t("Start with the number")}</div>
                        <div class="qw4-h">{t("What do you need to close this year?", { class: "body" })}</div>
                        <div class="qw4-s">
                            {t("Give the number and your typical deal, and the room works it down to the one thing you control — what you do every working day.", { class: "body" })}
                        </div>
                        <div class="qw4-planform">
                            <label class="qw4-pf">
                                <span>{t("Your number for the year ($)")}</span>
                                <input type="number" value={inp.quota || ""} placeholder="1200000"
                                    onInput={(e) => patchInputs({ quota: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                            </label>
                            <label class="qw4-pf">
                                <span>{t("Your typical deal ($)")}</span>
                                <input type="number" value={inp.acv || ""} placeholder="50000"
                                    onInput={(e) => patchInputs({ acv: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                            </label>
                        </div>
                    </div>
                ) : (
                    <>
                        <div class="qw4-verd">
                            <div class={`qw4-k${pace.onTarget ? " qw4-k--ok" : ""}`}>
                                {paceMode ? t("Where today's pace lands you") : t("What your number demands, every day")}
                            </div>
                            {paceMode ? (
                                <div class="qw4-h">
                                    {t("At the rate you're working, you finish the year around", { class: "body" })}{" "}
                                    <b class={pace.onTarget ? "qw4-good" : ""}>{fmtMoney(pace.projected)}</b>
                                    {pace.onTarget ? (
                                        <> — {t("on your number.", { class: "body" })}</>
                                    ) : (
                                        <>
                                            {" — "}{t("about", { class: "body" })} <b>{fmtMoney(pace.short)} {t("short.")}</b>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div class="qw4-h">
                                    {fmtMoney(inp.quota)} {t("means about", { class: "body" })} <b>{m.touchesDay} {t("messages & calls a day")}</b>
                                    {" — "}{t("that's the whole plan, worked backward.", { class: "body" })}
                                </div>
                            )}
                            {paceMode && !pace.onTarget && behindOutreach ? (
                                <div class="qw4-s">
                                    {t("Not because the number is wrong. Because you're doing", { class: "body" })}{" "}
                                    <b>{actuals.outreachPerDay} {t("outreach a day")}</b> {t("and the number needs", { class: "body" })}{" "}
                                    <b>{m.touchesDay}</b>. {t("Close that gap and the year adds up.", { class: "body" })}
                                </div>
                            ) : null}
                            <button type="button" class="qw4-link qw4-adjust" onClick={() => (adjustOpen.value = !adjustOpen.value)}>
                                {adjustOpen.value ? t("Done adjusting") : t("Change the number or assumptions", { class: "body" })}
                            </button>
                            {adjustOpen.value ? (
                                <div class="qw4-planform">
                                    <label class="qw4-pf">
                                        <span>{t("Your number for the year ($)")}</span>
                                        <input type="number" value={inp.quota || ""}
                                            onInput={(e) => patchInputs({ quota: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                    <label class="qw4-pf">
                                        <span>{t("Your typical deal ($)")}</span>
                                        <input type="number" value={inp.acv || ""}
                                            onInput={(e) => patchInputs({ acv: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                    <label class="qw4-pf">
                                        <span>{t("How often you win (%)")}</span>
                                        <input type="number" value={inp.win || ""}
                                            onInput={(e) => patchInputs({ win: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                    <label class="qw4-pf">
                                        <span>{t("Meetings that become real opportunities (%)", { class: "body" })}</span>
                                        <input type="number" value={inp.m2o || ""}
                                            onInput={(e) => patchInputs({ m2o: Number((e.currentTarget as HTMLInputElement).value) || 0 })} />
                                    </label>
                                    <label class="qw4-pf">
                                        <span>{t("How long a deal takes (days)")}</span>
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
                                        <span class="qw4-lbl">{t("on pace for")} {fmtMoney(pace.projected)}</span>
                                    </span>
                                    <span class="qw4-lblt">{fmtMoney(inp.quota)}</span>
                                </div>
                                <div class="qw4-tkx"><span>$0</span><span>{t("your target →")}</span></div>
                            </div>
                        ) : null}

                        <div class="qw4-strands">
                            {/* LEFT: what your number needs + is the plan real */}
                            <div class="qw4-st qw4-st--need">
                                <div class="qw4-cl">{t("What your number needs")}</div>
                                <div class="qw4-line"><span class="qw4-ln">{m.touchesDay}</span><span class="qw4-lt">{t("messages & calls")} <b>{t("a day")}</b></span></div>
                                <div class="qw4-line"><span class="qw4-ln">{meetingsNeedMonth}</span><span class="qw4-lt">{t("first meetings")} <b>{t("a month")}</b></span></div>
                                <div class="qw4-line"><span class="qw4-ln">{bench.coverage}×</span><span class="qw4-lt">{t("your number")} <b>{t("in open deals")}</b></span></div>
                                <div class="qw4-line"><span class="qw4-ln">{dealsNeedMonth}</span><span class="qw4-lt">{t("deals closed")} <b>{t("a month")}</b></span></div>
                                <div class="qw4-judge">
                                    <div class="qw4-jh">{t("Is the plan real?")}</div>
                                    <div class="qw4-jb">{believe.read}</div>
                                    {believe.cost ? <div class="qw4-jc">{believe.cost}</div> : null}
                                    {believe.fix ? (
                                        <button type="button" class="qw4-link" onClick={() => patchInputs({ [believe.fix!.key]: believe.fix!.value } as never)}>
                                            {t("Set it to")} {believe.fix.value}% {t("and re-run →")}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {/* RIGHT: where you actually are + do you have the pipeline */}
                            <div class="qw4-st qw4-st--real">
                                <div class="qw4-cl">{paceMode ? t("Where you actually are") : t("As you work, your real pace lands here", { class: "body" })}</div>
                                {paceMode ? (
                                    <>
                                        <div class="qw4-line">
                                            <span class={`qw4-ln ${behindOutreach ? "qw4-bad" : "qw4-good"}`}>{actuals.outreachPerDay}</span>
                                            <span class="qw4-lt">{t("a day this month")}</span>
                                            <span class={`qw4-gp ${behindOutreach ? "is-behind" : "is-ok"}`}>{behindOutreach ? `${outreachGap} ${t("short")}` : t("on track")}</span>
                                        </div>
                                        <BulkCountRow />
                                        <div class="qw4-line">
                                            <span class={`qw4-ln ${behindMeetings ? "qw4-bad" : "qw4-good"}`}>{actuals.meetingsThisMonth}</span>
                                            <span class="qw4-lt">{t("meetings booked so far")}</span>
                                            <span class={`qw4-gp ${behindMeetings ? "is-behind" : "is-ok"}`}>{behindMeetings ? t("behind") : t("on track")}</span>
                                        </div>
                                        <div class="qw4-line">
                                            <span class={`qw4-ln ${behindCoverage ? "qw4-bad" : "qw4-good"}`}>{cov.hasDeals ? `${covRatio.toFixed(1)}×` : "0×"}</span>
                                            <span class="qw4-lt">{cov.hasDeals ? `${fmtMoney(cov.raw)} ${t("in flight")}` : t("no open deals yet")}</span>
                                            <span class={`qw4-gp ${behindCoverage ? "is-behind" : "is-ok"}`}>{behindCoverage ? t("light") : t("covered")}</span>
                                        </div>
                                        <div class="qw4-line">
                                            <span class={`qw4-ln ${behindCloses ? "qw4-bad" : "qw4-good"}`}>{actuals.closedThisMonth}</span>
                                            <span class="qw4-lt">{t("closed this month")}</span>
                                            <span class={`qw4-gp ${behindCloses ? "is-behind" : "is-ok"}`}>{behindCloses ? t("behind") : t("on track")}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div class="qw4-quiet">{t("Once you start reaching out and logging deals, this column reads your real pace against the plan — every morning.", { class: "body" })}</div>
                                        <BulkCountRow />
                                    </>
                                )}
                                <div class="qw4-judge">
                                    <div class="qw4-jh">
                                        {t("Do you have the pipeline?")}
                                        <span class="qw4-rr">{cov.hasDeals ? `${covRatio.toFixed(1)}× / ${bench.coverage}×` : `0 / ${bench.coverage}×`}</span>
                                    </div>
                                    <div class="qw4-mini"><span class="qw4-f" style={`width:${covPct}%`} /><span class="qw4-m" /></div>
                                    <div class="qw4-jb">
                                        {cov.hasDeals ? (
                                            <>
                                                {t("You have", { class: "body" })} <b>{fmtMoney(cov.raw)}</b> {t("in open deals. Your number wants about", { class: "body" })}{" "}
                                                <b>{fmtMoney(Math.round(inp.quota * bench.coverage))}</b> {t("in flight to be safe", { class: "body" })}
                                                {covShort > 0 ? <> — {t("roughly", { class: "body" })} <b>{fmtMoney(covShort)} {t("short")}</b>. {t("The daily number is how you close it.", { class: "body" })}</> : <>. {t("You're covered.", { class: "body" })}</>}
                                            </>
                                        ) : (
                                            t("No open deals yet — the daily number above is how the pipeline gets built.", { class: "body" })
                                        )}
                                    </div>
                                    <a class="qw4-link" href={hrefToDealWorkspace()}>{t("See the open deals in Deal Workspace →", { class: "body" })}</a>
                                </div>
                            </div>
                        </div>

                        {paceMode && !pace.onTarget ? (
                            <div class="qw4-back">
                                <span class="qw4-bt">{t("Back on pace")}</span>
                                <span class="qw4-bb">
                                    {behindOutreach ? (
                                        <><b>{outreachGap} {t("more outreach a day")}</b>{behindCoverage ? <>, {t("plus close the pipeline gap.", { class: "body" })}</> : "."} </>
                                    ) : behindCoverage ? (
                                        <><b>{t("Build more pipeline")}</b> — {t("the daily work is there; the top of the funnel is light.", { class: "body" })} </>
                                    ) : (
                                        t("Keep the pace — the math says the year adds up from here.", { class: "body" })
                                    )}
                                </span>
                            </div>
                        ) : null}

                        <div class="qw4-hand">
                            <span class="qw4-hl">{t("Close the gap")}</span>
                            <a class="qw4-btn" href={hrefToOutboundStudio()}>{t("Run today's outreach →")}</a>
                            <a class="qw4-gh" href={hrefToColdCallStudio()}>{t("Build more pipeline")}</a>
                            <a class="qw4-gh" href={hrefToDealWorkspace()}>{t("Check the pipeline")}</a>
                        </div>
                    </>
                )}
            </div>
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
