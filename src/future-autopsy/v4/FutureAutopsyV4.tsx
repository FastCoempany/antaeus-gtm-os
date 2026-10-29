import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    autopsyUniverse,
    selectedVitals,
    currentAutopsy,
    selectDeal,
    taskLog,
    toggleTaskDone
} from "../state";
import { buildActionPlan } from "../lib/action-plan";
import type { Vitals } from "../lib/types";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./future-autopsy-v4.css";

/**
 * Future Autopsy — deal-risk review.
 *
 * The room separates observed deal conditions from the risk assessment
 * and corrective actions. It does not present a modeled future outcome
 * as an observed fact or imply that one recorded factor caused a loss.
 */

const openScript = signal<string | null>(null);
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2000);
}

function copyText(text: string, done: string): void {
    if (!navigator.clipboard?.writeText) {
        toast(t("Copying isn't available here — select the text manually.", { class: "body" }));
        return;
    }
    navigator.clipboard.writeText(text).then(() => toast(done)).catch(() => toast(t("Couldn't copy — select the text manually.", { class: "body" })));
}

function qualWord(score: number): string {
    if (score >= 14) return t("solid");
    if (score >= 8) return t("workable");
    if (score > 0) return t("limited");
    return t("none yet");
}

function riskWord(score: number): string {
    if (score >= 60) return t("High");
    if (score >= 45) return t("Moderate");
    return t("Low");
}

function plainTaskWhy(taskId: string, fallback: string): string {
    const reads: Record<string, string> = {
        get_dated_nextstep: "A dated next step creates a specific buyer commitment.",
        map_decision_process: "An explicit decision process clarifies approval steps and ownership.",
        bring_eb_in: "The economic buyer has not been identified or engaged.",
        confirm_champion: "No confirmed internal owner is currently driving the purchase.",
        quantify_impact: "Quantified impact gives the buyer a measurable basis for evaluation.",
        clarify_use_case: "A specific use case helps stakeholders evaluate the same outcome.",
        name_competition: "Naming the alternative makes the decision context explicit.",
        surface_risks: "Recorded blockers can be addressed before they create additional delay.",
        set_exec_readout: "An executive review connects deal evidence to final approval.",
        write_mutual_plan: "A shared plan establishes owners, dates, and next steps.",
        multi_thread: "Multiple engaged stakeholders reduce dependence on a single contact."
    };
    return reads[taskId] ?? fallback;
}

function money(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
    return `$${Math.round(v)}`;
}

export function FutureAutopsyV4(): JSX.Element {
    const universe = autopsyUniverse.value;
    const vitals = selectedVitals.value;
    const doc = currentAutopsy.value;
    const log = taskLog.value;

    if (universe.length === 0) {
        return (
            <div class="fa4">
                <div class="fa4-wrap">
                    <div class="fa4-top"><span class="fa4-bname">{t("Future Autopsy")}</span></div>
                    <div class="fa4-empty">
                        <h3>{t("No open deals currently require a risk review.")}</h3>
                        <p>{t("When Deal Workspace identifies elevated risk, the deal appears here with the observed risk factors and recommended corrective actions.", { class: "body" })}</p>
                        <a class="fa4-ghost" href="/deal-workspace/?returnTo=%2Ffuture-autopsy%2F&returnLabel=Future+Autopsy&fromMode=room&fromSurface=future-autopsy">{t("Open Deal Workspace →")}</a>
                    </div>
                </div>
                <GroundLine />
                <LiveEdge />
            </div>
        );
    }

    const current = vitals ?? universe[0]!;
    const uIdx = universe.findIndex((v) => v.id === current.id);
    const idx = uIdx >= 0 ? uIdx : 0;

    function step(delta: number): void {
        const next = universe[(idx + delta + universe.length) % universe.length];
        if (next) {
            selectDeal(next.id);
            openScript.value = null;
        }
    }

    if (!doc) return <div class="fa4" />;

    const dealTasks = log[current.id]?.tasks ?? {};
    const doneCount = doc.countermeasures.filter((c) => dealTasks[c.taskId]?.done).length;
    const allDone = doneCount === doc.countermeasures.length && doc.countermeasures.length > 0;
    const plan = buildActionPlan(doc);
    const horizon = doc.horizonDays;
    const quiet = current.staleDays;
    const total = Math.max(horizon, quiet + 1, 1);
    const nowPct = Math.min(92, Math.max(4, (quiet / (quiet + total)) * 100));
    const risk = riskWord(current.riskScore);
    const factorSummary = doc.causes.map((c) => c.label).slice(0, 4).join(" ");

    const brief = [
        `${current.name} — ${money(current.value)} · ${current.stage}`,
        `${t("Deal risk:")} ${risk}`,
        `${t("Observed risk factors:")} ${factorSummary || t("No additional factors recorded.")}`,
        `${t("Recommended corrective actions:")} ${doc.countermeasures.map((c) => `${dealTasks[c.taskId]?.done ? "✓" : "·"} ${c.label}`).join(" / ")}`,
        `${t("When to consider closing the deal:")} ${doc.killSwitch}`
    ].join("\n\n");

    return (
        <div class="fa4">
            <div class="fa4-wrap">
                <div class="fa4-top">
                    <span class="fa4-bname">{t("Future Autopsy")}</span>
                    <span class="fa4-r">{universe.length} {t("deals reviewed · highest risk first", { class: "body" })}</span>
                </div>

                <div class="fa4-stepper">
                    <span class="fa4-lbl">{t("Deal risk · highest risk first")}</span>
                    <button type="button" class="fa4-arrow" onClick={() => step(-1)} title={t("previous")}>‹</button>
                    <div class="fa4-ticks">
                        {universe.map((v: Vitals, i: number) => (
                            <button type="button" key={v.id}
                                class={`fa4-tick${i === idx ? " is-on" : ""}`}
                                style={`--tc:${v.riskScore >= 60 ? "var(--ds-red, #c0392b)" : v.riskScore >= 45 ? "var(--ds-amber, #b5790f)" : "var(--ds-forest, #1b5e3f)"}`}
                                title={v.name}
                                onClick={() => { selectDeal(v.id); openScript.value = null; }} />
                        ))}
                    </div>
                    <button type="button" class="fa4-arrow" onClick={() => step(1)} title={t("next")}>›</button>
                    <span class="fa4-pos">{idx + 1} / {universe.length}</span>
                </div>

                <h1 class="fa4-head">
                    {allDone ? (
                        <>{t("Corrective actions completed for")} <b class="fa4-g">{current.name}</b>.</>
                    ) : (
                        <><b class="fa4-rr">{current.name}</b> {t("has")} {risk.toLowerCase()} {t("deal risk based on the current recorded evidence.", { class: "body" })}</>
                    )}
                </h1>
                <p class="fa4-sub">
                    <b>{money(current.value)}</b> · {current.stage}
                    {quiet > 0 ? <> · {t("no recorded buyer activity for")} {quiet} {t("days")}</> : null}
                    {" · "}
                    {t("Review the evidence and corrective actions below.", { class: "body" })}
                </p>

                <div class="fa4-line">
                    <div class={`fa4-track${allDone ? " is-won" : ""}`}>
                        <span class="fa4-now" style={`left:${nowPct}%`}><i /><em>{t("current")}{quiet > 0 ? ` · ${quiet}d ${t("without recorded buyer activity")}` : ""}</em></span>
                        <span class="fa4-death"><i /><em>{allDone ? t("actions completed") : `${t("risk review window")} · ${horizon}d`}</em></span>
                    </div>
                </div>

                <div class="fa4-vitrow">
                    <span class="fa4-v"><span class="fa4-vk">{t("Qualification")}</span><span class={`fa4-vn${current.qualScore < 8 ? " is-risk" : ""}`}>{qualWord(current.qualScore)}</span></span>
                    <span class="fa4-v"><span class="fa4-vk">{t("Stage")}</span><span class="fa4-vn">{current.stage}</span></span>
                    <span class="fa4-v"><span class="fa4-vk">{t("Last buyer activity")}</span><span class={`fa4-vn${quiet >= 7 ? " is-risk" : quiet >= 3 ? " is-warn" : ""}`}>{quiet} {t("days ago")}</span></span>
                    <span class="fa4-v"><span class="fa4-vk">{t("Champion")}</span><span class={`fa4-vn${current.champion ? "" : " is-risk"}`}>{current.champion || t("none recorded")}</span></span>
                    <span class="fa4-v"><span class="fa4-vk">{t("Economic buyer")}</span><span class={`fa4-vn${current.economicBuyer ? "" : " is-risk"}`}>{current.economicBuyer || t("unknown")}</span></span>
                </div>

                <div class="fa4-absent">
                    <div class="fa4-ah">{t("Why risk is high · evidence", { class: "body" })}</div>
                    {doc.chapters.slice(0, 4).map((ch) => (
                        <div class="fa4-arow" key={ch.cause}>
                            <span class="fa4-at">
                                {doc.causes.find((c) => c.id === ch.cause)?.label ?? ch.cause.replace(/_/g, " ")}
                            </span>
                            <span class="fa4-aw">{t("This condition is present in the current deal data.", { class: "body" })}</span>
                        </div>
                    ))}
                </div>

                <div class="fa4-docket">
                    <div class="fa4-dh">{t("Recommended corrective actions", { class: "body" })}</div>
                    <div class="fa4-hint">{t("Complete each action as it happens. Open an action to view the suggested message.", { class: "body" })}</div>
                    {doc.countermeasures.map((cut) => {
                        const isDone = !!dealTasks[cut.taskId]?.done;
                        const open = openScript.value === cut.taskId;
                        const script = cut.script ? cut.script(current) : null;
                        return (
                            <div class={`fa4-crow${isDone ? " is-done" : ""}`} key={cut.taskId}>
                                <div class="fa4-ctop">
                                    <button type="button" class="fa4-chk" onClick={() => toggleTaskDone(current.id, cut.taskId)}>{isDone ? "✓" : ""}</button>
                                    <div>
                                        <div class="fa4-clab">{cut.label}</div>
                                        <div class="fa4-cwhy">{plainTaskWhy(cut.taskId, cut.why)}</div>
                                    </div>
                                    {script ? (
                                        <button type="button" class="fa4-exp" onClick={() => (openScript.value = open ? null : cut.taskId)}>
                                            {open ? t("hide suggested message ▴") : t("suggested message ▾")}
                                        </button>
                                    ) : null}
                                </div>
                                {open && script ? (
                                    <div class="fa4-script">
                                        <div class="fa4-ss">“{script}”</div>
                                        <button type="button" class="fa4-cp" onClick={() => copyText(script, t("Message copied."))}>{t("Copy message")}</button>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <div class="fa4-finding">
                    <div>
                        <div class="fa4-fc">{t("Risk summary")}</div>
                        <div class="fa4-pat">{risk} {t("risk")}</div>
                        <p>{factorSummary || t("No additional risk factors are currently recorded.", { class: "body" })}</p>
                    </div>
                    <div class="fa4-walk">
                        <div class="fa4-fc is-amber">{t("When to consider closing the deal")}</div>
                        <p>{doc.killSwitch}</p>
                    </div>
                </div>

                <div class="fa4-intervene">
                    {plan.primary ? (
                        <a class="fa4-primary" href={plan.primary.href}>{plan.primary.label}</a>
                    ) : null}
                    <button type="button" class="fa4-brief" onClick={() => copyText(brief, t("Risk summary copied.", { class: "body" }))}>
                        {t("Copy risk summary")}
                    </button>
                    <span class="fa4-rrr">
                        {[plan.secondary, plan.tertiary].filter(Boolean).map((route) => (
                            <a key={route!.href} href={route!.href}>{route!.label}</a>
                        ))}
                    </span>
                </div>

                {universe.length > 1 ? (
                    <div class="fa4-nextline">
                        {t("Next deal by risk:")}{" "}
                        <button type="button" class="fa4-go" onClick={() => step(1)}>
                            {universe[(idx + 1) % universe.length]!.name} →
                        </button>
                    </div>
                ) : null}
            </div>
            {toastMsg.value ? <div class="fa4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
        </div>
    );
}
