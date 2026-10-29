import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    prospects,
    queryCards,
    stats,
    inboundFocus,
    prospectDraft,
    queryCardDraft,
    patchProspectDraft,
    patchQueryCardDraft,
    saveProspectFromDraft,
    saveQueryCardFromDraft,
    patchProspect,
    setProspectStage
} from "../state";
import type { Prospect } from "../lib/types";
import { getProspectQuality } from "../lib/quality";
import { computeLoomRead } from "../lib/loom-read";
import { hrefToSignalConsole, hrefToOutboundStudio } from "../lib/handoff";
import { saveProspect, saveQueryCard } from "../lib/cloud-persistence";
import { enqueueInboundAccount } from "@/signal-console/lib/inbound-queue";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./prospecting-desk-v4.css";

/**
 * Prospecting Desk stores target-account criteria, lets the seller add
 * companies found through their research, and requires three qualification
 * checks before an account can be sent to Signal Console. It does not claim
 * to run a live company search.
 */

const selectedId = signal<string | null>(null);
const addOpen = signal(false);
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2600);
}

/** Companies added but not yet sent or set aside. */
function addedPool(list: ReadonlyArray<Prospect>): ReadonlyArray<Prospect> {
    return list.filter((p) => p.stage === "captured" || p.stage === "researched");
}

function answered(p: Prospect): { q1: boolean; q2: boolean; q3: boolean; left: number } {
    const q1 = p.notes.trim().length > 0;
    const q2 = p.entryPoint.trim().length > 0;
    const q3 = p.approach.trim().length > 0;
    return { q1, q2, q3, left: [q1, q2, q3].filter((x) => !x).length };
}

/**
 * Keep the stored stage synchronized with the three qualification fields.
 * All three complete promotes the account to ready; removing an answer
 * moves it back to researched.
 */
function patchQuestion(p: Prospect, part: Partial<Prospect>): void {
    patchProspect(p.id, part);
    const next = { ...p, ...part } as Prospect;
    const a = answered(next);
    if (a.left === 0 && next.stage !== "ready" && next.stage !== "pushed") {
        setProspectStage(p.id, "ready");
    } else if (a.left > 0 && next.stage === "ready") {
        setProspectStage(p.id, "researched");
    }
}

function persistProspect(id: string): void {
    const updated = prospects.value.find((x) => x.id === id);
    if (updated) void saveProspect(updated);
}

function sendProspect(p: Prospect): void {
    const ok = enqueueInboundAccount({
        name: p.accountName,
        note: [p.entryPoint, p.approach].filter(Boolean).join(" · ") || undefined,
        from: "prospecting-desk"
    });
    if (!ok) {
        toast(`${t("Could not queue")} ${p.accountName}. ${t("Try again.")}`);
        return;
    }
    setProspectStage(p.id, "pushed");
    persistProspect(p.id);
    if (selectedId.value === p.id) selectedId.value = null;
    toast(`${p.accountName} ${t("was queued for Signal Console and will appear when that room next loads.", { class: "body" })}`);
}

function setAside(p: Prospect): void {
    setProspectStage(p.id, "dropped");
    persistProspect(p.id);
    if (selectedId.value === p.id) selectedId.value = null;
    toast(`${p.accountName} ${t("was set aside from the current target list.", { class: "body" })}`);
}

function saveSearch(): void {
    const saved = saveQueryCardFromDraft();
    if (saved) void saveQueryCard(saved);
    if (saved) toast(t("Target criteria saved. Add relevant companies below.", { class: "body" }));
}

function addCompany(): void {
    const saved = saveProspectFromDraft();
    if (saved) {
        void saveProspect(saved);
        addOpen.value = false;
        selectedId.value = saved.id;
        toast(`${saved.accountName} ${t("was added to Prospecting Desk.")}`);
    }
}

export function ProspectingDeskV4(): JSX.Element {
    const all = prospects.value;
    const s = stats.value;
    const added = addedPool(all);
    const ready = all.filter((p) => p.stage === "ready");
    const sent = all.filter((p) => p.stage === "pushed");
    const read = computeLoomRead({ prospects: all, stats: s });
    const cards = queryCards.value;
    const qd = queryCardDraft.value;
    const pd = prospectDraft.value;
    const focus = inboundFocus.value;

    const sel = selectedId.value ? all.find((p) => p.id === selectedId.value) ?? null : null;
    const selOpen =
        sel && (sel.stage === "captured" || sel.stage === "researched" || sel.stage === "ready")
            ? sel
            : null;
    const a = selOpen ? answered(selOpen) : null;
    const q = selOpen ? getProspectQuality(selOpen) : null;

    return (
        <div class="pd4">
            <div class="pd4-wrap">
                <div class="pd4-bar">
                    <span class="pd4-bname">{t("Prospecting Desk")}</span>
                    <span class="pd4-tstat">
                        <b>{ready.length}</b> {t("confirmed")} · <b>{added.length}</b> {t("awaiting qualification")}
                    </span>
                </div>

                <h1 class="pd4-lead">{t("Save target criteria, qualify accounts, then send confirmed accounts to Signal Console.", { class: "body" })}</h1>
                <div class="pd4-leadsub">
                    {t("Companies remain in Prospecting Desk until their qualification checks are complete or you set them aside.", { class: "body" })}
                    {focus ? <> {t("Current focus:")} <b>{focus}</b>.</> : null}
                </div>

                <div class="pd4-deskread">
                    <span class={`pd4-band is-${read.band}`}>{read.bandLabel}</span>
                    <span class="pd4-rd">{read.weekRead}</span>
                    <span class="pd4-mv"><b>{t("Next")}</b>{read.operatorMove}</span>
                </div>

                {/* ── 1 · TARGET CRITERIA ─────────────────────────── */}
                <div class="pd4-stage"><span class="pd4-num">1</span><span class="pd4-st">{t("Target criteria")}</span><span class="pd4-sd">{t("Save the account criteria you are researching, then add relevant companies.", { class: "body" })}</span><span class="pd4-line" /></div>
                <div class="pd4-describe">
                    <div class="pd4-dl">{t("Describe the target accounts")}</div>
                    <div class="pd4-drow">
                        <input
                            value={qd.query}
                            placeholder={t("e.g. Series-B fintech companies that just raised · companies with a new RevOps leader", { class: "body" })}
                            onInput={(e) => patchQueryCardDraft({ query: (e.currentTarget as HTMLInputElement).value })}
                            onKeyDown={(e) => { if (e.key === "Enter") saveSearch(); }}
                        />
                        <button type="button" class="pd4-go" disabled={!qd.query.trim()} onClick={saveSearch}>
                            {t("Save criteria")}
                        </button>
                    </div>
                    <div class="pd4-hint">
                        {t("Saved criteria remain available here. This room does not run a live company search; add the relevant companies you find through your research.", { class: "body" })}
                    </div>
                </div>

                {cards.length > 0 ? (
                    <div class="pd4-grp">
                        <div class="pd4-grptt">{t("Saved target criteria")} <span class="pd4-n">· {cards.length}</span></div>
                        {cards.slice(0, 6).map((c) => {
                            const fromThis = all.filter((p) => p.sourceQueryId === c.id).length;
                            return (
                                <div class="pd4-srow" key={c.id}>
                                    <span class="pd4-sdot" />
                                    <div class="pd4-sbody">
                                        <div class="pd4-q">{c.query}</div>
                                        {c.intent ? <div class="pd4-h">{c.intent}</div> : null}
                                    </div>
                                    <span class="pd4-sn">{fromThis > 0 ? <><b>{fromThis}</b> {t("companies added")}</> : t("no companies added yet")}</span>
                                    <button
                                        type="button"
                                        class="pd4-run"
                                        onClick={() => {
                                            patchProspectDraft({ sourceQueryId: c.id });
                                            addOpen.value = true;
                                        }}
                                    >
                                        {t("+ Add a company")}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : null}

                <div class={`pd4-add${addOpen.value ? " is-open" : ""}`}>
                    <button type="button" class="pd4-addhead" onClick={() => (addOpen.value = !addOpen.value)}>
                        {addOpen.value ? t("Close") : t("+ Add a company", { class: "body" })}
                    </button>
                    {addOpen.value ? (
                        <div class="pd4-addgrid">
                            <label class="pd4-fld">
                                <span>{t("Company")}</span>
                                <input value={pd.accountName} placeholder="e.g. Vanta"
                                    onInput={(e) => patchProspectDraft({ accountName: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="pd4-fld">
                                <span>{t("Contact")}</span>
                                <input value={pd.contactName} placeholder="e.g. Miguel Lopez"
                                    onInput={(e) => patchProspectDraft({ contactName: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="pd4-fld">
                                <span>{t("Role")}</span>
                                <input value={pd.contactTitle} placeholder="e.g. Head of RevOps"
                                    onInput={(e) => patchProspectDraft({ contactTitle: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="pd4-fld">
                                <span>{t("Related target criteria")}</span>
                                <select value={pd.sourceQueryId}
                                    onChange={(e) => patchProspectDraft({ sourceQueryId: (e.currentTarget as HTMLSelectElement).value })}>
                                    <option value="">{t("Added independently")}</option>
                                    {cards.map((c) => <option value={c.id} key={c.id}>{c.query.slice(0, 60)}</option>)}
                                </select>
                            </label>
                            <div class="pd4-fld pd4-fld--btn">
                                <button type="button" class="pd4-save" disabled={!pd.accountName.trim()} onClick={addCompany}>
                                    {t("Add company")}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* ── 2 · QUALIFY ─────────────────────────────────── */}
                <div class="pd4-stage"><span class="pd4-num">2</span><span class="pd4-st">{t("Qualify")}</span><span class="pd4-sd">{t("Answer three qualification questions before an account can be sent to Signal Console.", { class: "body" })}</span><span class="pd4-line" /></div>
                <div class="pd4-research">
                    <div class="pd4-rail pd4-rail--l">
                        <div class="pd4-rh">
                            <div class="pd4-rk">{t("Awaiting qualification")} <span class="pd4-rn">{added.length}</span></div>
                            <div class="pd4-rs">{t("Open an account to complete its qualification checks.", { class: "body" })}</div>
                        </div>
                        {added.length === 0 ? (
                            <div class="pd4-emptyr">{t("No accounts are awaiting qualification. Add a company above.", { class: "body" })}</div>
                        ) : (
                            added.slice(0, 30).map((p) => {
                                const pq = getProspectQuality(p);
                                return (
                                    <button type="button" class={`pd4-rr${selOpen?.id === p.id ? " is-active" : ""}`} key={p.id} onClick={() => (selectedId.value = p.id)}>
                                        <div class="pd4-ra">{p.accountName} <span class="pd4-rsc">{pq.score}</span></div>
                                        {p.contactName ? <div class="pd4-rc">{p.contactName}{p.contactTitle ? ` · ${p.contactTitle}` : ""}</div> : null}
                                        <div class="pd4-rnote">{answered(p).left === 0 ? t("qualification complete") : `${answered(p).left} ${t("checks remaining")}`}</div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div class="pd4-mid">
                        {selOpen && a && q ? (
                            <>
                                <div class="pd4-mhead">
                                    <div class="pd4-mk">{t("Qualifying")}</div>
                                    <div class="pd4-mname">{selOpen.accountName}</div>
                                    {selOpen.contactName ? <div class="pd4-mc">{selOpen.contactName}{selOpen.contactTitle ? ` · ${selOpen.contactTitle}` : ""}</div> : null}
                                    <div class={`pd4-meta${a.left === 0 ? " is-ok" : ""}`}>
                                        {t("qualification score")} {q.score} · {a.left === 0 ? t("complete") : `${a.left} ${t("check")}${a.left === 1 ? "" : "s"} ${t("remaining")}`}
                                    </div>
                                </div>
                                <div class="pd4-persona">
                                    <span class="pd4-ptag">{t("Target contact")}{focus ? ` · ${focus}` : ""}</span>
                                    {t("Prefer the person who owns the problem or the decision related to it.", { class: "body" })}
                                </div>
                                <div class="pd4-qs">
                                    <div class={`pd4-qq ${a.q1 ? "is-done" : "is-todo"}`}>
                                        <div class="pd4-box">{a.q1 ? "✓" : ""}</div>
                                        <div>
                                            <div class="pd4-qt">{t("Does this account match the target criteria?", { class: "body" })}</div>
                                            <input class="pd4-fill" value={selOpen.notes}
                                                placeholder={t("e.g. Yes — the RevOps leader owns the forecast rebuild and the company just raised", { class: "body" })}
                                                onInput={(e) => patchQuestion(selOpen, { notes: (e.currentTarget as HTMLInputElement).value })}
                                                onChange={() => persistProspect(selOpen.id)} />
                                        </div>
                                    </div>
                                    <div class={`pd4-qq ${a.q2 ? "is-done" : "is-todo"}`}>
                                        <div class="pd4-box">{a.q2 ? "✓" : ""}</div>
                                        <div>
                                            <div class="pd4-qt">{t("What is the reason or path into the account?", { class: "body" })}</div>
                                            <input class="pd4-fill" value={selOpen.entryPoint}
                                                placeholder={t("e.g. A shared investor sits on the board and may be able to make an introduction", { class: "body" })}
                                                onInput={(e) => patchQuestion(selOpen, { entryPoint: (e.currentTarget as HTMLInputElement).value })}
                                                onChange={() => persistProspect(selOpen.id)} />
                                        </div>
                                    </div>
                                    <div class={`pd4-qq ${a.q3 ? "is-done" : "is-todo"}`}>
                                        <div class="pd4-box">{a.q3 ? "✓" : ""}</div>
                                        <div>
                                            <div class="pd4-qt">{t("How will you reach out?", { class: "body" })}</div>
                                            <input class="pd4-fill" value={selOpen.approach}
                                                placeholder={t("e.g. Reference the funding event, then ask the shared investor for an introduction", { class: "body" })}
                                                onInput={(e) => patchQuestion(selOpen, { approach: (e.currentTarget as HTMLInputElement).value })}
                                                onChange={() => persistProspect(selOpen.id)} />
                                        </div>
                                    </div>
                                </div>
                                <div class="pd4-mfoot">
                                    <div class={`pd4-fm${a.left === 0 ? " is-ok" : ""}`}>
                                        {a.left === 0
                                            ? <>{t("All three qualification checks are complete.")} <b>{selOpen.accountName} {t("can be sent to Signal Console.")}</b></>
                                            : <>{t("Still required:")} <b>{[!a.q1 && t("target fit"), !a.q2 && t("reason or path in"), !a.q3 && t("outreach approach")].filter(Boolean).join(" · ")}</b></>}
                                    </div>
                                    <button type="button" class="pd4-aside" onClick={() => setAside(selOpen)}>
                                        {t("Set aside")}
                                    </button>
                                    <button type="button" class={`pd4-send${a.left === 0 ? " is-on" : ""}`} disabled={a.left !== 0} onClick={() => sendProspect(selOpen)}>
                                        {t("Send")} {selOpen.accountName} {t("to Signal Console")}
                                    </button>
                                    <div class="pd4-fh">{t("complete all three checks to send")}</div>
                                </div>
                            </>
                        ) : (
                            <div class="pd4-midempty">
                                <div class="pd4-me">{t("No account selected.")}</div>
                                <div class="pd4-mes">{t("Open an account awaiting qualification, or add a company above.", { class: "body" })}</div>
                            </div>
                        )}
                    </div>

                    <div class="pd4-rail pd4-rail--r">
                        <div class="pd4-rh">
                            <div class="pd4-rk pd4-rk--ok">{t("Confirmed accounts")} <span class="pd4-rn">{ready.length}</span></div>
                            <div class="pd4-rs">{t("Send a confirmed account to Signal Console.", { class: "body" })}</div>
                        </div>
                        {ready.length === 0 ? (
                            <div class="pd4-emptyr">{t("No confirmed accounts yet. Complete all three qualification checks on an account.", { class: "body" })}</div>
                        ) : (
                            ready.slice(0, 30).map((p) => (
                                <div class="pd4-rr" key={p.id}>
                                    <div class="pd4-ra">{p.accountName}</div>
                                    {p.contactName ? <div class="pd4-rc">{p.contactName}</div> : null}
                                    <button type="button" class="pd4-rsend" onClick={() => sendProspect(p)}>{t("Send →")}</button>
                                </div>
                            ))
                        )}
                        {sent.length > 0 ? (
                            <>
                                <div class="pd4-subhead">{t("Already sent")} · {sent.length}</div>
                                {sent.slice(0, 8).map((p) => (
                                    <div class="pd4-rr is-sent" key={p.id}>
                                        <div class="pd4-ra">{p.accountName}</div>
                                        <a class="pd4-inlink" href={hrefToSignalConsole({ account: p.accountName })}>{t("Open in Signal Console ↗")}</a>
                                    </div>
                                ))}
                            </>
                        ) : null}
                    </div>
                </div>

                {/* ── 3 · WORKFLOW ─────────────────────────────────── */}
                <div class="pd4-stage"><span class="pd4-num">3</span><span class="pd4-st">{t("Workflow")}</span><span class="pd4-line" /></div>
                <div class="pd4-fits">
                    <div class="pd4-node is-from"><span class="pd4-nk">{t("input from")}</span><span class="pd4-nn">{t("Territory Architect")}</span></div>
                    <div class="pd4-arr"><span>→</span><em>{t("target account criteria")}</em></div>
                    <div class="pd4-node is-here"><span class="pd4-nk">{t("current step")}</span><span class="pd4-nn">{t("Prospecting Desk")}</span></div>
                    <div class="pd4-arr"><span>→</span><em>{t("confirmed accounts")}</em></div>
                    <a class="pd4-node is-to" href={hrefToSignalConsole()}><span class="pd4-nk">{t("send to")}</span><span class="pd4-nn">{t("Signal Console")}</span></a>
                    <a class="pd4-branch" href={hrefToOutboundStudio({ account: ready[0]?.accountName })}>
                        <b>{t("Outbound Studio")}</b> {t("can use a confirmed account to create the first message.", { class: "body" })}
                    </a>
                </div>
            </div>

            {toastMsg.value ? <div class="pd4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
