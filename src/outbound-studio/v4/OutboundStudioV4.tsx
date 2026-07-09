import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    rack,
    accountOptions,
    touchesForRack,
    canGenerate,
    currentSendLine,
    patchRack,
    setTemperature,
    toggleNoAsk,
    logTouchFromRack,
    saveAngleFromRack,
    setTouchOutcome,
    allTouches
} from "../state";
import { saveTouch, saveAngle } from "../lib/cloud-persistence";
import {
    PERSONA_LABELS,
    TEMPERATURES,
    CHANNEL_LABELS,
    TOUCH_OUTCOMES,
    TOUCH_OUTCOME_LABELS,
    TRIGGER_KEYS,
    type Persona,
    type Temperature,
    type TriggerKey,
    type TouchOutcome
} from "../lib/types";
import { TRIGGERS, CTA_LABELS } from "../lib/data";
import { hrefToSignalConsole } from "../lib/handoff";
import { GroundLine } from "@/lib/ground/GroundLine";
import "./outbound-studio-v4.css";

/**
 * OutboundStudioV4 (canon §4.8) — "where you are with them", wired to
 * production from the CHOSEN 2026-07-04 mockup. One real message, never
 * a blast: the who-line names the person, the 5-stage conversation
 * spine IS the temperature rack in plain words, the message is the
 * shipped generator's output, and the rail carries the why-now (the
 * account's live Signal Console headline), a per-stage coaching tip,
 * how-to-send, and the per-account sent log. The generator, rack
 * state, touch/angle persistence, and handoffs are reused unchanged —
 * plus one bug fix: the send line now leads with the account's REAL
 * signal headline instead of its company name.
 */

const editOpen = signal(false);
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2200);
}

/** The 5 temperatures said plainly — where you are with them (§13). */
const STAGE_LABELS: Record<Temperature, string> = {
    ice_cold: t("First time reaching out", { class: "body" }),
    cool: t("Following up"),
    warm: t("They replied"),
    hot: t("Back and forth"),
    closing: t("About to close")
};

const STAGE_TIPS: Record<Temperature, { hd: string; tip: string }> = {
    ice_cold: {
        hd: t("On a first message"),
        tip: t("Lead with what's happening at their company, not what you sell. One clear ask, easy to say yes to.", { class: "body" })
    },
    cool: {
        hd: t("Following up"),
        tip: t("Shorter than the first one. Add one new thing, and give them an easy out — \"or I'll just send it.\"", { class: "body" })
    },
    warm: {
        hd: t("They replied"),
        tip: t("Move fast — they're warm. Give them the exact thing they asked about, then offer two concrete times.", { class: "body" })
    },
    hot: {
        hd: t("In a back-and-forth"),
        tip: t("Keep the momentum. Confirm the next step, make the meeting worth more, and open the door to the rest of their team.", { class: "body" })
    },
    closing: {
        hd: t("About to close"),
        tip: t("Name the deadline. Ask what they need to say yes and make it effortless to remove.", { class: "body" })
    }
};

const BAND_LABEL: Record<string, string> = {
    ready: t("Ready to send"),
    workable: t("Workable"),
    thin: t("Thin")
};

const PERSONAS: ReadonlyArray<Persona> = ["csuite", "vp", "ic", "procurement"];

function copyMessage(content: string): void {
    if (!navigator.clipboard?.writeText) {
        toast(t("Copying isn't available here — select the text by hand.", { class: "body" }));
        return;
    }
    navigator.clipboard
        .writeText(content)
        .then(() => toast(t("Message copied.")))
        .catch(() => toast(t("Couldn't copy — select the text by hand.", { class: "body" })));
}

export function OutboundStudioV4(): JSX.Element {
    const r = rack.value;
    const out = currentSendLine.value;
    const ok = canGenerate.value;
    const options = accountOptions.value;
    const matched = options.find(
        (a) => a.name.toLowerCase() === r.accountName.trim().toLowerCase()
    );
    const touches = touchesForRack.value;
    const tip = STAGE_TIPS[r.temperature];
    const stageIdx = TEMPERATURES.indexOf(r.temperature);
    const trigger = TRIGGERS[r.trigger];

    return (
        <div class="ob4">
            <div class="ob4-wrap">
                <div class="ob4-top">
                    <span class="ob4-bname">{t("Outbound Studio")}</span>
                    <span class="ob4-r">{t("one real message · not a blast", { class: "body" })}</span>
                </div>

                {/* who line */}
                <div class="ob4-who">
                    {t("Writing to")} <b>{r.contactName.trim() || t("(name the person)")}</b>
                    {", "}{t("a")} <b>{PERSONA_LABELS[r.persona]}</b> {t("at")}{" "}
                    <b>{r.accountName.trim() || t("(name the account)")}</b>
                    <button type="button" class="ob4-ed" onClick={() => (editOpen.value = !editOpen.value)}>
                        {editOpen.value ? t("done ▴") : t("change ▾")}
                    </button>
                </div>

                {editOpen.value ? (
                    <div class="ob4-rack">
                        <label class="ob4-fld">
                            <span>{t("Account")}</span>
                            <input list="ob4-accts" value={r.accountName}
                                placeholder="e.g. Ramp"
                                onInput={(e) => patchRack({ accountName: (e.currentTarget as HTMLInputElement).value })} />
                            <datalist id="ob4-accts">
                                {options.slice(0, 20).map((a) => <option value={a.name} key={a.id} />)}
                            </datalist>
                        </label>
                        <label class="ob4-fld">
                            <span>{t("The person")}</span>
                            <input value={r.contactName} placeholder="e.g. Sarah Chen"
                                onInput={(e) => patchRack({ contactName: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                        <div class="ob4-fld">
                            <span>{t("Their seat")}</span>
                            <div class="ob4-pbtns">
                                {PERSONAS.map((p) => (
                                    <button type="button" key={p}
                                        class={`ob4-pb${r.persona === p ? " is-on" : ""}`}
                                        onClick={() => patchRack({ persona: p })}>
                                        {PERSONA_LABELS[p]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <label class="ob4-fld">
                            <span>{t("What's happening there (the trigger)", { class: "body" })}</span>
                            <select value={r.trigger}
                                onChange={(e) => patchRack({ trigger: (e.currentTarget as HTMLSelectElement).value as TriggerKey })}>
                                {TRIGGER_KEYS.map((k) => (
                                    <option value={k} key={k}>{TRIGGERS[k].label}</option>
                                ))}
                            </select>
                        </label>
                        <label class="ob4-fld ob4-fld--wide">
                            <span>{t("A question they asked (optional)", { class: "body" })}</span>
                            <input value={r.nextQuestion ?? ""} placeholder={t("e.g. How fast can we be live?", { class: "body" })}
                                onInput={(e) => patchRack({ nextQuestion: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                    </div>
                ) : null}

                {/* the 5-stage conversation spine (= temperature, plainly) */}
                <div class="ob4-spinel">{t("Where are you with them?")}</div>
                <div class="ob4-spine">
                    {TEMPERATURES.map((temp, i) => (
                        <button type="button" key={temp}
                            class={`ob4-stage${temp === r.temperature ? " is-on" : i < stageIdx ? " is-done" : ""}`}
                            onClick={() => setTemperature(temp)}>
                            <span class="ob4-sn">{t("Stage")} {i + 1}</span>
                            <span class="ob4-st">{STAGE_LABELS[temp]}</span>
                        </button>
                    ))}
                </div>

                <div class="ob4-body">
                    <div>
                        <div class="ob4-msghd">
                            <span class="ob4-mh">{t("The message")} · {STAGE_LABELS[r.temperature].toLowerCase()}</span>
                            {ok ? (
                                <span class={`ob4-ready is-${out.motionBand}`}>
                                    <span class="ob4-rdot" />{BAND_LABEL[out.motionBand]}
                                </span>
                            ) : null}
                        </div>
                        {ok ? (
                            <div class="ob4-msg">{out.content}</div>
                        ) : (
                            <div class="ob4-msg ob4-msg--empty">
                                {t("Name the account and the person above, and the message writes itself here — built from what's actually happening at their company.", { class: "body" })}
                            </div>
                        )}
                        <div class="ob4-acts">
                            <button type="button" class="ob4-send" disabled={!ok} onClick={() => copyMessage(out.content)}>
                                {t("Copy the message")}
                            </button>
                            <button type="button" class="ob4-g" disabled={!ok}
                                onClick={() => {
                                    const logged = logTouchFromRack();
                                    // Cloud write too — a local-only log is
                                    // clobbered when cloud replaces local on boot.
                                    if (logged) {
                                        void saveTouch(logged);
                                        toast(`${t("Logged as sent to")} ${r.accountName.trim()}.`);
                                    }
                                }}>
                                {t("Mark it sent")}
                            </button>
                            <button type="button" class={`ob4-g${r.noAsk ? " is-on" : ""}`} onClick={() => { toggleNoAsk(); toast(rack.value.noAsk ? t("Dropped the ask — value only.", { class: "body" }) : t("Ask added back.")); }}>
                                {t("Give value only")}
                            </button>
                            <button type="button" class="ob4-save" disabled={!ok}
                                onClick={() => {
                                    const res = saveAngleFromRack();
                                    if (res.saved) {
                                        void saveAngle(res.angle);
                                        toast(t("Saved to reuse."));
                                    }
                                    else if (res.reason === "duplicate") toast(t("Already saved this one."));
                                }}>
                                ★ {t("Save this one")}
                            </button>
                        </div>
                    </div>

                    <div class="ob4-rail">
                        <div class="ob4-why">
                            <div class="ob4-wl">
                                {t("Why now — what's happening", { class: "body" })}
                                {matched ? (
                                    <a class="ob4-src" href={hrefToSignalConsole(matched.name)}>◆ {t("Signal Console")}</a>
                                ) : null}
                            </div>
                            <div class="ob4-wt">
                                {matched?.topSignal ? (
                                    <>{matched.name} — <b>{matched.topSignal}</b></>
                                ) : (
                                    <>
                                        {trigger.meaning}{" "}
                                        <span class="ob4-wq">{t("(no live signal on this account yet — the trigger you picked carries the message)", { class: "body" })}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div class="ob4-tip"><b>{tip.hd}</b>{tip.tip}</div>
                        <div class="ob4-how">
                            <div class="ob4-hr"><span class="ob4-hk">{t("Send by")}</span><span class="ob4-hv">{CHANNEL_LABELS[out.channel]}</span></div>
                            <div class="ob4-hr"><span class="ob4-hk">{t("Attach")}</span><span class="ob4-hv">{out.assetLabel}</span></div>
                            <div class="ob4-hr"><span class="ob4-hk">{t("The ask")}</span><span class="ob4-hv">{r.noAsk ? t("nothing — just value") : CTA_LABELS[out.ctaKey]}</span></div>
                        </div>
                        {r.accountName.trim() ? (
                            <div class="ob4-sent">
                                <div class="ob4-sh">{t("Sent to")} {r.accountName.trim()}</div>
                                {touches.length === 0 ? (
                                    <div class="ob4-none">{t("Nothing sent yet — this is the first touch.", { class: "body" })}</div>
                                ) : (
                                    touches.slice(0, 6).map((touch) => (
                                        <div class="ob4-sr" key={touch.id}>
                                            <span class="ob4-sd">{new Date(touch.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                                            <select
                                                class={`ob4-so${touch.outcome === "replied" || touch.outcome === "meeting_booked" ? " is-good" : ""}`}
                                                value={touch.outcome ?? ""}
                                                onChange={(e) => {
                                                    const v = (e.currentTarget as HTMLSelectElement).value;
                                                    setTouchOutcome(touch.id, (v || null) as TouchOutcome | null);
                                                    const updated = allTouches.value.find((x) => x.id === touch.id);
                                                    if (updated) void saveTouch(updated);
                                                }}>
                                                <option value="">{t("no reply yet")}</option>
                                                {TOUCH_OUTCOMES.map((o) => (
                                                    <option value={o} key={o}>{TOUCH_OUTCOME_LABELS[o]}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {toastMsg.value ? <div class="ob4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
        </div>
    );
}
