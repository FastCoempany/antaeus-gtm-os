import type { JSX } from "preact";
import { signal, effect } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { draft, draftDeal, linkedDeals, setDealId, appendLearning } from "../state";
import { hrefToAdvisorDeploy, hrefToDealWorkspace } from "../lib/handoff";
import {
    loadSignedState,
    saveSignedState,
    memberId,
    engagementRead,
    pickBlocking,
    EMPTY_SIGNED_STATE,
    FRONT_IDS,
    type SignedState,
    type FrontId,
    type FrontStatus,
    type MemberKind
} from "./lib/fronts";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./getting-to-signed-v4.css";

/**
 * Getting to Signed — manage the work between verbal agreement and
 * countersignature across Legal, Security, Finance, and Business approval.
 * Stable internal `front` ids and storage fields remain for compatibility;
 * the user-facing model is a set of negotiation/approval workstreams.
 */

const gts = signal<SignedState>(EMPTY_SIGNED_STATE);
const gtsDealId = signal<string>("");
const openFront = signal<FrontId | null>(null);
const learnDraft = signal("");
const addMemberName = signal("");
const addMemberRole = signal("");
const addMemberKind = signal<MemberKind>("other");
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let booted = false;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2400);
}

/** Boot per-deal state + persistence. Called from main. */
export function bootSignedState(): void {
    gtsDealId.value = draft.value.dealId ?? "";
    gts.value = loadSignedState(gtsDealId.value);
    if (booted) return;
    booted = true;
    let first = true;
    effect(() => {
        const state = gts.value;
        const id = gtsDealId.value;
        if (first) {
            first = false;
            return;
        }
        saveSignedState(id, state);
    });
    effect(() => {
        const id = draft.value.dealId ?? "";
        if (id !== gtsDealId.value) {
            gtsDealId.value = id;
            gts.value = loadSignedState(id);
        }
    });
}

function patchGts(part: Partial<SignedState>): void {
    gts.value = { ...gts.value, ...part } as SignedState;
}

function patchFront(id: FrontId, part: Partial<SignedState["fronts"][FrontId]>): void {
    patchGts({
        fronts: { ...gts.value.fronts, [id]: { ...gts.value.fronts[id], ...part } }
    });
}

const FRONT_META: Record<FrontId, { label: string; dot: string; hint: string }> = {
    legal: {
        label: t("Legal"),
        dot: "#b83232",
        hint: t("liability, indemnification, and requested contract changes", { class: "body" })
    },
    security: {
        label: t("Security"),
        dot: "#7c5cff",
        hint: t("security questionnaire and supporting documents", { class: "body" })
    },
    finance: {
        label: t("Finance"),
        dot: "#1f9d6b",
        hint: t("payment terms and commercial concessions", { class: "body" })
    },
    business: {
        label: t("Business approval"),
        dot: "#b5790f",
        hint: t("stakeholder engagement and the signature plan", { class: "body" })
    }
};

const STATUS_LABEL: Record<FrontStatus, string> = {
    blocking: t("blocking"),
    clearing: t("clearing"),
    todo: t("to do"),
    at_risk: t("at risk"),
    settled: t("settled")
};

/** Practical guidance for each workstream. */
const PLAYBOOK: Record<FrontId, JSX.Element> = {
    legal: (
        <>
            <b>{t("Evaluate the liability cap together with the indemnification request.", { class: "body" })}</b>{" "}
            {t("A broad indemnification obligation can materially change the value of a liability cap, so review linked contract terms together rather than approving each one independently.", { class: "body" })}
        </>
    ),
    security: (
        <>
            <b>{t("Use existing security documents before answering questions manually.", { class: "body" })}</b>{" "}
            {t("SOC 2, the subprocessor list, penetration-test material, and the DPA may already answer part of the questionnaire. Route only the remaining technical questions to the appropriate owner.", { class: "body" })}
        </>
    ),
    finance: (
        <>
            <b>{t("Treat a commercial concession as an explicit exchange.", { class: "body" })}</b>{" "}
            {t("If the customer asks for longer payment terms or a discount, record what you are prepared to offer and what commercial commitment you expect in return.", { class: "body" })}
        </>
    ),
    business: (
        <>
            <b>{t("Keep the approval process active with dated steps and named owners.", { class: "body" })}</b>{" "}
            {t("Use a shared signature plan with the champion so legal, security, finance, and final approval do not lose ownership or timing after verbal agreement.", { class: "body" })}
        </>
    )
};

function copyText(text: string, done: string): void {
    if (!navigator.clipboard?.writeText) {
        toast(t("Copying isn't available here — select the text manually.", { class: "body" }));
        return;
    }
    navigator.clipboard.writeText(text).then(() => toast(done)).catch(() => toast(t("Couldn't copy — select the text manually.", { class: "body" })));
}

export function GettingToSignedV4(): JSX.Element {
    const state = gts.value;
    const deal = draftDeal.value;
    const deals = linkedDeals.value;
    const blocking = pickBlocking(state);
    const face = blocking ? state.fronts[blocking] : null;
    const papers = state.papers;
    const paperList = [
        papers.soc2 && "SOC 2",
        papers.subprocessors && t("subprocessor list"),
        papers.pentest && t("pen-test"),
        papers.dpa && "DPA"
    ].filter(Boolean) as string[];
    const cov = state.coverage;
    const covOpen = Math.max(0, cov.total - cov.covered);
    const ledgerFronts = FRONT_IDS;

    return (
        <div class="gs4">
            <div class="gs4-wrap">
                <div class="gs4-top">
                    <span class="gs4-bname">{t("Getting to Signed")}</span>
                    <span class="gs4-r">{t("a verbal yes still requires legal, security, finance, and final approval", { class: "body" })}</span>
                </div>

                <div class="gs4-read">
                    <span class="gs4-who">{deal?.accountName ?? t("Pick the deal")}</span>
                    {deal ? <a class="gs4-m" href={hrefToDealWorkspace(deal.id)}>◆ ${Math.round(deal.value / 1000)}k</a> : null}
                    {deals.length > 0 ? (
                        <select class="gs4-dealsel" value={draft.value.dealId ?? ""}
                            onChange={(e) => setDealId((e.currentTarget as HTMLSelectElement).value || null)}>
                            <option value="">{t("Which deal?")}</option>
                            {deals.map((x) => <option value={x.id} key={x.id}>{x.accountName}</option>)}
                        </select>
                    ) : null}
                    <span class="gs4-to">
                        {t("target signature date")}{" "}
                        <input class="gs4-date" value={state.targetDate} placeholder={t("month-end")}
                            onInput={(e) => patchGts({ targetDate: (e.currentTarget as HTMLInputElement).value })} />
                    </span>
                </div>

                <div class="gs4-strip">
                    {state.committee.map((m) => {
                        const read = engagementRead(m);
                        return (
                            <span class={`gs4-chip${read.band === "quiet" ? " is-quiet" : ""}`} key={m.id}
                                title={t("Record a new touch with this stakeholder", { class: "body" })}
                                onClick={() => patchGts({ committee: state.committee.map((x) => x.id === m.id ? { ...x, lastTouch: new Date().toISOString() } : x) })}>
                                <span class={`gs4-d is-${read.band}`} />
                                {m.name}
                                <span class="gs4-rl">
                                    {m.kind === "champion" ? t("champion") : m.kind === "signer" ? t("signs off") : m.role || t("committee")}
                                    {read.band === "quiet" ? ` · ${t("no recent touch for")} ${read.days}d` : read.band === "new" ? ` · ${t("new")}` : ""}
                                </span>
                                <button type="button" class="gs4-mx" title={t("Remove")}
                                    onClick={(ev) => { ev.stopPropagation(); patchGts({ committee: state.committee.filter((x) => x.id !== m.id) }); }}>×</button>
                            </span>
                        );
                    })}
                    <span class="gs4-addm">
                        <input value={addMemberName.value} placeholder={t("Name")} onInput={(e) => (addMemberName.value = (e.currentTarget as HTMLInputElement).value)} />
                        <input value={addMemberRole.value} placeholder={t("role")} class="gs4-rolein" onInput={(e) => (addMemberRole.value = (e.currentTarget as HTMLInputElement).value)} />
                        <select value={addMemberKind.value} onChange={(e) => (addMemberKind.value = (e.currentTarget as HTMLSelectElement).value as MemberKind)}>
                            <option value="champion">{t("champion")}</option>
                            <option value="signer">{t("signs off")}</option>
                            <option value="other">{t("committee")}</option>
                        </select>
                        <button type="button" disabled={!addMemberName.value.trim()}
                            onClick={() => {
                                patchGts({ committee: [...state.committee, { id: memberId(), name: addMemberName.value.trim(), role: addMemberRole.value.trim(), kind: addMemberKind.value, lastTouch: null }] });
                                addMemberName.value = "";
                                addMemberRole.value = "";
                            }}>{t("Add")}</button>
                    </span>
                    <span class="gs4-sp">
                        {t("Security documents available:")} <b>{paperList.length > 0 ? paperList.join(" · ") : t("none marked yet")}</b>
                        {(["soc2", "subprocessors", "pentest", "dpa"] as const).map((k) => (
                            <button type="button" key={k} class={`gs4-pp${papers[k] ? " is-on" : ""}`}
                                onClick={() => patchGts({ papers: { ...papers, [k]: !papers[k] } })}>
                                {k === "soc2" ? "SOC 2" : k === "subprocessors" ? t("subs") : k === "pentest" ? t("pen-test") : "DPA"}
                            </button>
                        ))}
                    </span>
                </div>

                {blocking && face ? (
                    <>
                        <div class="gs4-blockhd">{t("Current blocking issue", { class: "body" })}</div>
                        <div class="gs4-faceoff">
                            <div class="gs4-side is-them">
                                <div class="gs4-sl">{t("Customer request")} · {FRONT_META[blocking].label}</div>
                                <input class="gs4-sv" value={face.theirAsk} placeholder={t("What is the customer asking for?", { class: "body" })}
                                    onInput={(e) => patchFront(blocking, { theirAsk: (e.currentTarget as HTMLInputElement).value })} />
                            </div>
                            <div class="gs4-gap"><span class="gs4-gl">{t("gap")}</span><span class="gs4-vs">{t("vs")}</span></div>
                            <div class="gs4-side is-you">
                                <div class="gs4-sl">{t("Your proposed position")}</div>
                                <input class="gs4-sv" value={face.yourLine} placeholder={t("Your proposed response and any non-negotiable limit", { class: "body" })}
                                    onInput={(e) => patchFront(blocking, { yourLine: (e.currentTarget as HTMLInputElement).value })} />
                            </div>
                        </div>
                        <div class="gs4-why">{PLAYBOOK[blocking]}</div>
                        <div class="gs4-arow">
                            <button type="button" class="gs4-btn"
                                disabled={!face.theirAsk.trim() || !face.yourLine.trim()}
                                onClick={() => copyText(
                                    `${t("On")} ${FRONT_META[blocking].label.toLowerCase()}: ${t("you've asked for")} ${face.theirAsk}. ${t("Our proposed position:")} ${face.yourLine}. ${t("Happy to walk through it — our current target signature date is", { class: "body" })} ${state.targetDate || t("month-end")}.`,
                                    t("Proposed response copied.", { class: "body" })
                                )}>
                                {t("Send proposed response →")}
                            </button>
                            <a class="gs4-link" href={hrefToAdvisorDeploy(deal?.id)}>{t("Ask someone with relevant experience", { class: "body" })}</a>
                            <button type="button" class="gs4-link" onClick={() => (openFront.value = openFront.value === blocking ? null : blocking)}>{t("Open this workstream ▾")}</button>
                            <button type="button" class="gs4-link" onClick={() => patchFront(blocking, { status: "settled" })}>{t("Mark it settled")}</button>
                        </div>
                    </>
                ) : (
                    <div class="gs4-clear">
                        <h3>{t("No workstream is currently marked as blocking.")}</h3>
                        <p>{t("If Legal, Security, Finance, and Business approval are settled, focus on completing the remaining signature steps.", { class: "body" })}</p>
                    </div>
                )}

                <div class="gs4-lh"><span>{t("Workstream")}</span><span>{t("All four workstreams · customer request → your proposed position", { class: "body" })}</span><span>{t("Status")}</span><span /></div>
                {ledgerFronts.map((id) => {
                    const f = state.fronts[id];
                    const open = openFront.value === id;
                    return (
                        <div class={`gs4-row${open ? " is-on" : ""}`} key={id}>
                            <button type="button" class="gs4-rowhit" onClick={() => (openFront.value = open ? null : id)}>
                                <span class="gs4-tag"><span class="gs4-dt" style={`background:${FRONT_META[id].dot}`} />{FRONT_META[id].label}</span>
                                <span class="gs4-thread">
                                    <span class="gs4-th">{f.theirAsk || FRONT_META[id].hint}</span>
                                    {f.theirAsk || f.yourLine ? (
                                        <span class="gs4-pos">
                                            <span class="gs4-them">{f.theirAsk || t("customer request")}</span>
                                            <span class="gs4-arr">→</span>
                                            <span class="gs4-you">{f.yourLine || t("your proposed position")}</span>
                                        </span>
                                    ) : null}
                                </span>
                                <span class={`gs4-stat is-${f.status}`}>{STATUS_LABEL[f.status]}</span>
                                <span class="gs4-drill">{open ? t("close ▴") : t("open ▾")}</span>
                            </button>
                            {open ? (
                                <div class="gs4-dd">
                                    <div class="gs4-pl">{PLAYBOOK[id]}</div>
                                    <div class="gs4-ddgrid">
                                        <label><span>{t("Customer request")}</span>
                                            <input value={f.theirAsk} onInput={(e) => patchFront(id, { theirAsk: (e.currentTarget as HTMLInputElement).value })} /></label>
                                        <label><span>{t("Your proposed position")}</span>
                                            <input value={f.yourLine} onInput={(e) => patchFront(id, { yourLine: (e.currentTarget as HTMLInputElement).value })} /></label>
                                        <label><span>{t("Status")}</span>
                                            <select value={f.status} onChange={(e) => patchFront(id, { status: (e.currentTarget as HTMLSelectElement).value as FrontStatus })}>
                                                {(["blocking", "clearing", "todo", "at_risk", "settled"] as const).map((sVal) => (
                                                    <option value={sVal} key={sVal}>{STATUS_LABEL[sVal]}</option>
                                                ))}
                                            </select></label>
                                    </div>
                                    {id === "security" ? (
                                        <div class="gs4-cov">
                                            <div class="gs4-ct">{t("Security coverage · what existing documents already answer", { class: "body" })}</div>
                                            <div class="gs4-covin">
                                                <label>{t("questions total")} <input type="number" value={cov.total || ""} onInput={(e) => patchGts({ coverage: { ...cov, total: Number((e.currentTarget as HTMLInputElement).value) || 0 } })} /></label>
                                                <label>{t("answered by existing documents")} <input type="number" value={cov.covered || ""} onInput={(e) => patchGts({ coverage: { ...cov, covered: Number((e.currentTarget as HTMLInputElement).value) || 0 } })} /></label>
                                                <label>{t("open questions with saved answers")} <input type="number" value={cov.saved || ""} onInput={(e) => patchGts({ coverage: { ...cov, saved: Number((e.currentTarget as HTMLInputElement).value) || 0 } })} /></label>
                                            </div>
                                            {cov.total > 0 ? (
                                                <>
                                                    <div class="gs4-covbar">
                                                        {cov.covered > 0 ? <span class="gs4-cg" style={`flex:${cov.covered}`}>{cov.covered} {t("covered")}</span> : null}
                                                        {covOpen > 0 ? <span class="gs4-ca" style={`flex:${covOpen}`}>{covOpen} {t("open")}</span> : null}
                                                    </div>
                                                    <div class="gs4-covby">
                                                        {t("Of the")} {covOpen} {t("open questions,")} <b>{Math.min(cov.saved, covOpen)}</b> {t("have saved answers;")} <b>{Math.max(0, covOpen - cov.saved)}</b> {t("still need input from the appropriate technical owner.")}
                                                    </div>
                                                </>
                                            ) : (
                                                <div class="gs4-covby">{t("Enter the questionnaire counts to see how many questions existing documents already cover.", { class: "body" })}</div>
                                            )}
                                        </div>
                                    ) : null}
                                    {id === "business" ? (
                                        <div class="gs4-plan">
                                            <div class="gs4-ct">{t("Signature plan · dated steps and named owners", { class: "body" })}</div>
                                            <textarea value={state.planToSigned}
                                                placeholder={t("e.g. Security documents sent (you, today) · legal call (customer counsel + you, Thu) · signature (CFO, the 28th)", { class: "body" })}
                                                onInput={(e) => patchGts({ planToSigned: (e.currentTarget as HTMLTextAreaElement).value })} />
                                            <button type="button" class="gs4-btn" disabled={!state.planToSigned.trim()}
                                                onClick={() => copyText(state.planToSigned, t("Signature plan copied.", { class: "body" }))}>
                                                {t("Copy signature plan →")}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    );
                })}

                <div class="gs4-learn">
                    <span class="gs4-ll">{t("Lessons for future deals")}</span>
                    <input value={learnDraft.value} placeholder={t("What did this signature process teach you?", { class: "body" })}
                        onInput={(e) => (learnDraft.value = (e.currentTarget as HTMLInputElement).value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && learnDraft.value.trim()) { appendLearning(learnDraft.value); learnDraft.value = ""; toast(t("Saved to the deal-learning record.", { class: "body" })); } }} />
                </div>
            </div>
            {toastMsg.value ? <div class="gs4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
