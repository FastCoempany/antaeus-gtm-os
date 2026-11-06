import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    accountOptions,
    selectedAccount,
    setSelectedAccount,
    draft,
    patchDraft,
    callLog,
    callStats,
    logCall
} from "../state";
import { THREADS } from "../lib/threads";
import { saveCallEntry } from "../lib/cloud-persistence";
import { personalize } from "../lib/personalize";
import { OUTCOME_LABELS, type Outcome, type ThreadId } from "../lib/types";
import { hrefToSignalConsole, hrefToDealWorkspace } from "../lib/handoff";
import {
    loadCustomPushbacks,
    saveCustomPushbacks,
    addCustomPushback,
    removeCustomPushback,
    type CustomPushbackMap
} from "./lib/custom-pushbacks";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./cold-call-studio-v4.css";

/**
 * Cold Call Studio is a preparation and post-call logging surface. It uses
 * the selected account signal as a reason for the call, provides response
 * prompts for common buyer reactions, and records the outcome afterward.
 * A booked meeting creates a deal through the existing state-side effect.
 */

const customPb = signal<CustomPushbackMap>(loadCustomPushbacks());
const addingFor = signal<ThreadId | null>(null);
const addBuyer = signal("");
const addReply = signal("");
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2400);
}

/** Existing internal thread ids rendered as plain call-plan steps. */
const STEP_META: ReadonlyArray<{ id: ThreadId; name: string; par?: string }> = [
    { id: "opener", name: t("Open the call") },
    { id: "pressure", name: t("Understand the impact") },
    { id: "proof", name: t("Understand the current approach", { class: "body" }) },
    { id: "ask", name: t("Ask for the next conversation", { class: "body" }) },
    { id: "exit", name: t("Close the call") }
];

const FOLLOW_UP_POSSIBLE: ReadonlyArray<Outcome> = ["callback_scheduled", "referral"];
const OTHER_OUTCOMES: ReadonlyArray<Outcome> = ["voicemail", "rejected", "hung_up", "no_answer"];

function saveAdd(): void {
    const threadId = addingFor.value;
    if (!threadId) return;
    if (!addBuyer.value.trim() && !addReply.value.trim()) return;
    const next = addCustomPushback(customPb.value, threadId, addBuyer.value, addReply.value);
    customPb.value = next;
    saveCustomPushbacks(next);
    addingFor.value = null;
    addBuyer.value = "";
    addReply.value = "";
    toast(t("Response prompt saved."));
}

function removePb(threadId: ThreadId, id: string): void {
    const next = removeCustomPushback(customPb.value, threadId, id);
    customPb.value = next;
    saveCustomPushbacks(next);
}

function logOutcome(outcome: Outcome): void {
    const account = selectedAccount.value;
    if (!account) {
        toast(t("Select the account you called first.", { class: "body" }));
        return;
    }
    const entry = logCall(outcome);
    if (!entry) return;
    void saveCallEntry(entry);
    if (outcome === "meeting_booked") {
        toast(`${t("Meeting booked. A deal was created for", { class: "body" })} ${account.name}.`);
    } else {
        toast(`${t("Logged:")} ${OUTCOME_LABELS[outcome]}.`);
    }
}

export function ColdCallStudioV4(): JSX.Element {
    const account = selectedAccount.value;
    const options = accountOptions.value;
    const d = draft.value;
    const stats = callStats.value;
    const log = callLog.value;
    const ctx = {
        accountName: account?.name ?? "",
        topSignal: account?.topSignal ?? ""
    };
    const pct = stats.total > 0 ? Math.round((stats.meetings / stats.total) * 100) : 0;
    const recent = log.slice(0, 2);

    return (
        <div class="cc4">
            <div class="cc4-wrap">
                <div class="cc4-top">
                    <span class="cc4-bname">{t("Cold Call Studio")}</span>
                    <span class="cc4-r">{t("prepare before the call · log the outcome after", { class: "body" })}</span>
                </div>

                <div class="cc4-pre">
                    <div class="cc4-cell cc4-who">
                        <div class="cc4-k">{t("Account and contact")}</div>
                        <div class="cc4-v">
                            <select
                                class="cc4-acct"
                                value={account?.name ?? ""}
                                onChange={(e) => setSelectedAccount((e.currentTarget as HTMLSelectElement).value || null)}
                            >
                                <option value="">{t("Select an account…")}</option>
                                {options.map((a) => (
                                    <option value={a.name} key={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {account && account.heat > 75 ? <span class="cc4-hot">{t("HIGH PRIORITY")}</span> : null}
                        </div>
                        <input
                            class="cc4-contact"
                            value={d.contactName}
                            placeholder={t("Contact name · role", { class: "body" })}
                            onInput={(e) => patchDraft({ contactName: (e.currentTarget as HTMLInputElement).value })}
                        />
                    </div>
                    <div class="cc4-cell cc4-reason">
                        <div class="cc4-k">
                            {t("Reason for the call")}
                            {account ? (
                                <a class="cc4-src" href={hrefToSignalConsole(account.name)}>◆ {t("Signal Console")}</a>
                            ) : null}
                        </div>
                        <div class="cc4-v">
                            {account?.topSignal ? (
                                <span class="cc4-hi">{account.topSignal}</span>
                            ) : account ? (
                                t("No current account signal is available. Use another evidence-based reason for the call or return after the account has a relevant signal.", { class: "body" })
                            ) : (
                                t("Select an account to review its current signal.", { class: "body" })
                            )}
                        </div>
                        <div class="cc4-note">{t("Use the account signal as the reason for the call. Let the buyer tell you whether it creates a problem internally.", { class: "body" })}</div>
                    </div>
                    <div class="cc4-cell cc4-goal">
                        <div class="cc4-k">{t("Call goal")}</div>
                        <div class="cc4-v">{t("Determine whether a 20-minute follow-up is warranted", { class: "body" })}</div>
                    </div>
                </div>

                <div class="cc4-planhd">
                    <span class="cc4-h">{t("Call plan")}</span>
                    <span class="cc4-s">{t("Review the plan before dialing.", { class: "body" })}</span>
                </div>
                {STEP_META.map((step, i) => {
                    const thread = THREADS.find((th) => th.id === step.id);
                    if (!thread) return null;
                    const custom = customPb.value[step.id] ?? [];
                    return (
                        <div class="cc4-step" key={step.id}>
                            <div class="cc4-sh">
                                <span class="cc4-n">{i + 1}</span>
                                <span class="cc4-nm">{step.name}{step.par ? <span class="cc4-par"> {step.par}</span> : null}</span>
                            </div>
                            <div class="cc4-say">
                                <span class="cc4-tag">{t("Suggested line")}</span>
                                <span class="cc4-line">{personalize(thread.say, ctx)}</span>
                            </div>
                            <div class="cc4-push">
                                <div class="cc4-pbhead"><span class="cc4-c1">{t("If they say")}</span><span class="cc4-c2">{t("Suggested response")}</span><span /></div>
                                {thread.replies.map((rep) => (
                                    <div class="cc4-pb" key={rep.id}>
                                        <span class="cc4-q">{personalize(rep.buyer, ctx)}</span>
                                        <span class="cc4-a">{personalize(rep.reply, ctx)}</span>
                                        <span />
                                    </div>
                                ))}
                                {custom.map((rep) => (
                                    <div class="cc4-pb is-yours" key={rep.id}>
                                        <span class="cc4-q">{rep.buyer || t("(buyer response)")}</span>
                                        <span class="cc4-a">{rep.reply || t("(your response)")}</span>
                                        <button type="button" class="cc4-rm" title={t("remove")} onClick={() => removePb(step.id, rep.id)}>✕</button>
                                    </div>
                                ))}
                                {addingFor.value === step.id ? (
                                    <div class="cc4-addrow">
                                        <input value={addBuyer.value} placeholder={t("Buyer response")}
                                            onInput={(e) => (addBuyer.value = (e.currentTarget as HTMLInputElement).value)} />
                                        <input value={addReply.value} placeholder={t("Response to use next time", { class: "body" })}
                                            onInput={(e) => (addReply.value = (e.currentTarget as HTMLInputElement).value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") saveAdd(); }} />
                                        <button type="button" class="cc4-addok" onClick={saveAdd}>{t("Save")}</button>
                                    </div>
                                ) : (
                                    <button type="button" class="cc4-addpb" onClick={() => { addingFor.value = step.id; addBuyer.value = ""; addReply.value = ""; }}>
                                        + {t("Add a buyer response you hear", { class: "body" })}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div class="cc4-after">
                    <div class="cc4-ah"><span class="cc4-ak">{t("After the call")}</span><h3>{t("Record the outcome")}</h3></div>
                    <button type="button" class="cc4-win" disabled={!account} onClick={() => logOutcome("meeting_booked")}>
                        <span class="cc4-ic">📅</span>
                        <span class="cc4-wt">
                            {t("Booked a meeting")}
                            <span class="cc4-wsub">{t("Creates a deal in Deal Workspace", { class: "body" })}</span>
                        </span>
                        <span class="cc4-go">{account ? t("log outcome →") : t("select an account first")}</span>
                    </button>
                    <div class="cc4-og">
                        <div class="cc4-grp is-alive">
                            <div class="cc4-gl">{t("Follow-up possible")}</div>
                            <div class="cc4-pills">
                                {FOLLOW_UP_POSSIBLE.map((o) => (
                                    <button type="button" class="cc4-out" key={o} disabled={!account} onClick={() => logOutcome(o)}>
                                        {o === "callback_scheduled" ? t("Callback requested") : t("Referral provided")}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div class="cc4-grp">
                            <div class="cc4-gl">{t("Other outcomes")}</div>
                            <div class="cc4-pills">
                                {OTHER_OUTCOMES.map((o) => (
                                    <button type="button" class="cc4-out" key={o} disabled={!account} onClick={() => logOutcome(o)}>
                                        {o === "rejected" ? t("Not interested") : OUTCOME_LABELS[o].replace(/^./, (c) => c.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <textarea
                        class="cc4-notes"
                        value={d.notes}
                        placeholder={t("What did you learn? One line is enough.", { class: "body" })}
                        onInput={(e) => patchDraft({ notes: (e.currentTarget as HTMLTextAreaElement).value })}
                    />
                    <div class="cc4-week">
                        <span class="cc4-wn">{t("Recorded:")} <b>{stats.meetings} {t("meetings booked")}</b></span>
                        <span class="cc4-bar"><span class="cc4-fill" style={`width:${Math.min(100, pct)}%`} /></span>
                        <span class="cc4-wr">
                            <b>{stats.total}</b> {t("calls")}{stats.total > 0 ? <> · <b>{pct}%</b> {t("resulted in a booked meeting", { class: "body" })}</> : null}
                            {recent.length > 0 ? <> · {t("most recent:")} {recent.map((c) => `${c.accountName || "—"} (${OUTCOME_LABELS[c.outcome]})`).join(" · ")}</> : null}
                        </span>
                        {stats.meetings > 0 && account ? (
                            <a class="cc4-dw" href={hrefToDealWorkspace(account.name)}>{t("Open Deal Workspace →")}</a>
                        ) : null}
                    </div>
                </div>
            </div>
            {toastMsg.value ? <div class="cc4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
