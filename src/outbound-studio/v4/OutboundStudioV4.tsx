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
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./outbound-studio-v4.css";

/**
 * Outbound Studio drafts one account-specific message from the account,
 * contact, outreach stage, selected trigger, and any available Signal
 * Console evidence. The generator does not invent proof or buyer intent.
 */

const editOpen = signal(false);
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2200);
}

/** Existing internal stage keys rendered in ordinary sales language. */
const STAGE_LABELS: Record<Temperature, string> = {
    ice_cold: t("First outreach"),
    cool: t("Following up"),
    warm: t("Contact replied"),
    hot: t("Active conversation"),
    closing: t("Approval / contract")
};

const STAGE_TIPS: Record<Temperature, { hd: string; tip: string }> = {
    ice_cold: {
        hd: t("First outreach"),
        tip: t("Lead with the account-specific event or signal. Ask one clear question instead of assuming the buyer has a problem.", { class: "body" })
    },
    cool: {
        hd: t("Follow-up"),
        tip: t("Keep the follow-up shorter than the first message, add one new piece of information, and make the response easy.", { class: "body" })
    },
    warm: {
        hd: t("After a reply"),
        tip: t("Address what the contact actually asked or said. Offer a concrete next step without adding assumptions that were not discussed.", { class: "body" })
    },
    hot: {
        hd: t("Active conversation"),
        tip: t("Confirm the open question or next step and keep the message focused on what has already been discussed.", { class: "body" })
    },
    closing: {
        hd: t("Approval / contract"),
        tip: t("Ask which approval or contract item is still open and route the right documentation or person to it.", { class: "body" })
    }
};

const BAND_LABEL: Record<string, string> = {
    ready: t("Full account context"),
    workable: t("Partial account context"),
    thin: t("Missing account context")
};

const PERSONAS: ReadonlyArray<Persona> = ["csuite", "vp", "ic", "procurement"];

function copyMessage(content: string): void {
    if (!navigator.clipboard?.writeText) {
        toast(t("Copying is not available here. Select the text manually.", { class: "body" }));
        return;
    }
    navigator.clipboard
        .writeText(content)
        .then(() => toast(t("Message copied.")))
        .catch(() => toast(t("Could not copy. Select the text manually.", { class: "body" })));
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
                    <span class="ob4-r">{t("one account-specific message", { class: "body" })}</span>
                </div>

                <div class="ob4-who">
                    {t("Drafting for")} <b>{r.contactName.trim() || t("(add contact)")}</b>
                    {", "}{t("a")} <b>{PERSONA_LABELS[r.persona]}</b> {t("at")}{" "}
                    <b>{r.accountName.trim() || t("(add account)")}</b>
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
                            <span>{t("Contact")}</span>
                            <input value={r.contactName} placeholder="e.g. Sarah Chen"
                                onInput={(e) => patchRack({ contactName: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                        <div class="ob4-fld">
                            <span>{t("Role")}</span>
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
                            <span>{t("Reason for outreach")}</span>
                            <select value={r.trigger}
                                onChange={(e) => patchRack({ trigger: (e.currentTarget as HTMLSelectElement).value as TriggerKey })}>
                                {TRIGGER_KEYS.map((k) => (
                                    <option value={k} key={k}>{TRIGGERS[k].label}</option>
                                ))}
                            </select>
                        </label>
                        <label class="ob4-fld ob4-fld--wide">
                            <span>{t("Buyer question (optional)", { class: "body" })}</span>
                            <input value={r.nextQuestion ?? ""} placeholder={t("e.g. How fast can we be live?", { class: "body" })}
                                onInput={(e) => patchRack({ nextQuestion: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                    </div>
                ) : null}

                <div class="ob4-spinel">{t("Current outreach stage")}</div>
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
                            <span class="ob4-mh">{STAGE_LABELS[r.temperature]} {t("message")}</span>
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
                                {t("Enter the account and contact above. Antaeus drafts a message using the selected outreach stage, relevant account context, and any available signal.", { class: "body" })}
                            </div>
                        )}
                        <div class="ob4-acts">
                            <button type="button" class="ob4-send" disabled={!ok} onClick={() => copyMessage(out.content)}>
                                {t("Copy message")}
                            </button>
                            <button type="button" class="ob4-g" disabled={!ok}
                                onClick={() => {
                                    const logged = logTouchFromRack();
                                    if (logged) {
                                        void saveTouch(logged);
                                        toast(`${t("Logged as sent to")} ${r.accountName.trim()}.`);
                                    }
                                }}>
                                {t("Mark sent")}
                            </button>
                            <button type="button" class={`ob4-g${r.noAsk ? " is-on" : ""}`} onClick={() => { toggleNoAsk(); toast(rack.value.noAsk ? t("Meeting request removed.") : t("Meeting request restored.")); }}>
                                {r.noAsk ? t("Restore meeting request") : t("Remove meeting request")}
                            </button>
                            <button type="button" class="ob4-save" disabled={!ok}
                                onClick={() => {
                                    const res = saveAngleFromRack();
                                    if (res.saved) {
                                        void saveAngle(res.angle);
                                        toast(t("Outreach approach saved."));
                                    }
                                    else if (res.reason === "duplicate") toast(t("This approach is already saved."));
                                }}>
                                ★ {t("Save approach")}
                            </button>
                        </div>
                    </div>

                    <div class="ob4-rail">
                        <div class="ob4-why">
                            <div class="ob4-wl">
                                {t("Reason for outreach")}
                                {matched ? (
                                    <a class="ob4-src" href={hrefToSignalConsole(matched.name)}>◆ {t("Signal Console")}</a>
                                ) : null}
                            </div>
                            <div class="ob4-wt">
                                {matched?.topSignal ? (
                                    <>{matched.name}: <b>{matched.topSignal}</b></>
                                ) : (
                                    <>
                                        <b>{t("Selected trigger:")}</b> {trigger.meaning}{" "}
                                        <span class="ob4-wq">{t("No current account signal is available, so the selected trigger is being used as the reason for outreach.", { class: "body" })}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div class="ob4-tip"><b>{tip.hd}</b>{tip.tip}</div>
                        <div class="ob4-how">
                            <div class="ob4-hr"><span class="ob4-hk">{t("Suggested channel")}</span><span class="ob4-hv">{CHANNEL_LABELS[out.channel]}</span></div>
                            <div class="ob4-hr"><span class="ob4-hk">{t("Suggested material")}</span><span class="ob4-hv">{out.assetLabel}</span></div>
                            <div class="ob4-hr"><span class="ob4-hk">{t("Call to action")}</span><span class="ob4-hv">{CTA_LABELS[out.ctaKey]}</span></div>
                        </div>
                        {r.accountName.trim() ? (
                            <div class="ob4-sent">
                                <div class="ob4-sh">{t("Outreach log")} · {r.accountName.trim()}</div>
                                {touches.length === 0 ? (
                                    <div class="ob4-none">{t("No outreach is logged for this account yet.", { class: "body" })}</div>
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
            <LiveEdge />
        </div>
    );
}
