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
import "./future-autopsy-v4.css";

/**
 * FutureAutopsyV4 (canon §4.14, protected room) — the countdown, wired
 * to production from the settled 2026-07-04 design. Steps through every
 * dying deal, worst first: the projected time of death as a decay line
 * (both futures at once), the evidence (the absences that kill it), the
 * CUTS — checkable countermeasures that bend the line, each carrying
 * the line to send — the causal pattern named, when to walk away, and
 * the reroute into the fixing room. The vitals/causes/autopsy
 * generator, task log, action-plan router, and handoffs are the shipped
 * engine unchanged. §13: no "/20", no naked verdict — qualification
 * reads as words.
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
        toast(t("Copying isn't available here — select the text by hand.", { class: "body" }));
        return;
    }
    navigator.clipboard.writeText(text).then(() => toast(done)).catch(() => toast(t("Couldn't copy — select the text by hand.", { class: "body" })));
}

/** Qualification in words, never a "/20" (§13). */
function qualWord(score: number): string {
    if (score >= 14) return t("solid");
    if (score >= 8) return t("workable");
    if (score > 0) return t("thin");
    return t("none yet");
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
                        <h3>{t("Nothing on the table.")}</h3>
                        <p>{t("When an open deal starts decaying in Deal Workspace, it lands here — with exactly how it dies and the cuts that stop it.", { class: "body" })}</p>
                        <a class="fa4-ghost" href="/deal-workspace/?returnTo=%2Ffuture-autopsy%2F&returnLabel=Future+Autopsy&fromMode=room&fromSurface=future-autopsy">{t("Open Deal Workspace →")}</a>
                    </div>
                </div>
                <GroundLine />
            </div>
        );
    }

    // The scene ALWAYS follows selectedVitals (which is what the autopsy
    // doc is generated from) — never a diverging universe index.
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
    // The decay line — now sits at quiet-days; death at the horizon.
    const total = Math.max(horizon, quiet + 1, 1);
    const nowPct = Math.min(92, Math.max(4, (quiet / (quiet + total)) * 100));

    const brief = [
        `${current.name} — ${money(current.value)} · ${current.stage}`,
        allDone ? doc.winStory : doc.loseStory,
        `${t("The cuts:")} ${doc.countermeasures.map((c) => `${dealTasks[c.taskId]?.done ? "✓" : "·"} ${c.label}`).join(" / ")}`,
        `${t("When to walk away:")} ${doc.killSwitch}`
    ].join("\n\n");

    return (
        <div class="fa4">
            <div class="fa4-wrap">
                <div class="fa4-top">
                    <span class="fa4-bname">{t("Future Autopsy")}</span>
                    <span class="fa4-r">{universe.length} {t("deals on the table · worst first", { class: "body" })}</span>
                </div>

                {/* stepper */}
                <div class="fa4-stepper">
                    <span class="fa4-lbl">{t("Pre-mortem · worst first")}</span>
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

                {/* the scene */}
                <h1 class="fa4-head">
                    {allDone ? (
                        <>{current.name} {t("is")} <b class="fa4-g">{t("back on a path to close-won.", { class: "body" })}</b></>
                    ) : (
                        <>{current.name} {t("is")} <b class="fa4-rr">{t("headed to close-lost")}</b> {t("— inside the next")} {horizon} {t("days if nothing changes.", { class: "body" })}</>
                    )}
                </h1>
                <p class="fa4-sub">
                    <b>{money(current.value)}</b> · {current.stage}
                    {quiet > 0 ? <> · {t("quiet")} {quiet}d</> : null}
                    {" — "}
                    {t("here's exactly how it dies, and the cuts that stop it.", { class: "body" })}
                </p>

                {/* the decay line — both futures at once */}
                <div class="fa4-line">
                    <div class={`fa4-track${allDone ? " is-won" : ""}`}>
                        <span class="fa4-now" style={`left:${nowPct}%`}><i /><em>{t("now")}{quiet > 0 ? ` · ${t("quiet")} ${quiet}d` : ""}</em></span>
                        <span class="fa4-death"><i /><em>{allDone ? t("close-won") : `${t("inside")} ${horizon}d · ${t("close-lost")}`}</em></span>
                    </div>
                </div>

                {/* vitals in words */}
                <div class="fa4-vitrow">
                    <span class="fa4-v"><span class="fa4-vk">{t("Qualification")}</span><span class={`fa4-vn${current.qualScore < 8 ? " is-risk" : ""}`}>{qualWord(current.qualScore)}</span></span>
                    <span class="fa4-v"><span class="fa4-vk">{t("Stage")}</span><span class="fa4-vn">{current.stage}</span></span>
                    <span class="fa4-v"><span class="fa4-vk">{t("Quiet for")}</span><span class={`fa4-vn${quiet >= 7 ? " is-risk" : quiet >= 3 ? " is-warn" : ""}`}>{quiet} {t("days")}</span></span>
                    <span class="fa4-v"><span class="fa4-vk">{t("Champion")}</span><span class={`fa4-vn${current.champion ? "" : " is-risk"}`}>{current.champion || t("none")}</span></span>
                    <span class="fa4-v"><span class="fa4-vk">{t("Who signs off")}</span><span class={`fa4-vn${current.economicBuyer ? "" : " is-risk"}`}>{current.economicBuyer || t("unknown")}</span></span>
                </div>

                {/* the evidence — what kills it */}
                <div class="fa4-absent">
                    <div class="fa4-ah">{t("What kills it — the evidence", { class: "body" })}</div>
                    {doc.chapters.slice(0, 4).map((ch) => (
                        <div class="fa4-arow" key={ch.cause}>
                            <span class="fa4-at">
                                {doc.causes.find((c) => c.id === ch.cause)?.label ??
                                    ch.cause.replace(/_/g, " ")}
                            </span>
                            <span class="fa4-aw">{ch.story}</span>
                        </div>
                    ))}
                </div>

                {/* the cuts — checkable, each with the line to send */}
                <div class="fa4-docket">
                    <div class="fa4-dh">{t("The cuts — each one bends the line", { class: "body" })}</div>
                    <div class="fa4-hint">{t("Check them off as you make them. Each carries the line to send.", { class: "body" })}</div>
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
                                        <div class="fa4-cwhy">{cut.why}</div>
                                    </div>
                                    {script ? (
                                        <button type="button" class="fa4-exp" onClick={() => (openScript.value = open ? null : cut.taskId)}>
                                            {open ? t("hide the line ▴") : t("the line to send ▾")}
                                        </button>
                                    ) : null}
                                </div>
                                {open && script ? (
                                    <div class="fa4-script">
                                        <div class="fa4-ss">“{script}”</div>
                                        <button type="button" class="fa4-cp" onClick={() => copyText(script, t("Line copied."))}>{t("Copy the line")}</button>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                {/* the finding */}
                <div class="fa4-finding">
                    <div>
                        <div class="fa4-fc">{t("The pattern")}</div>
                        <div class="fa4-pat">{doc.causes[0]?.label ?? t("Decay")}</div>
                        <p>{allDone ? doc.winStory : doc.loseStory}</p>
                    </div>
                    <div class="fa4-walk">
                        <div class="fa4-fc is-amber">{t("When to walk away")}</div>
                        <p>{doc.killSwitch}</p>
                    </div>
                </div>

                {/* intervene */}
                <div class="fa4-intervene">
                    {plan.primary ? (
                        <a class="fa4-primary" href={plan.primary.href}>{plan.primary.label}</a>
                    ) : null}
                    <button type="button" class="fa4-brief" onClick={() => copyText(brief, t("Brief copied — carry it out of the room.", { class: "body" }))}>
                        {t("Copy the brief")}
                    </button>
                    <span class="fa4-rrr">
                        {[plan.secondary, plan.tertiary].filter(Boolean).map((route) => (
                            <a key={route!.href} href={route!.href}>{route!.label}</a>
                        ))}
                    </span>
                </div>

                {universe.length > 1 ? (
                    <div class="fa4-nextline">
                        {t("Next on the table:")}{" "}
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
