import type { JSX } from "preact";
import { signal, effect } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    draft,
    patchDraft,
    setDurationDays,
    saveDraft,
    activeProof,
    linkedDeal,
    linkedDeals
} from "../state";
import { hrefToDealWorkspace } from "../lib/handoff";
import { saveProof } from "../lib/cloud-persistence";
import {
    loadExtras,
    saveExtras,
    extrasEmpty,
    personId,
    circleTarget,
    readAdoption,
    EMPTY_EXTRAS,
    type PilotExtras,
    type CirclePerson,
    type PersonKind
} from "./lib/pilot";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./pilot-desk-v4.css";

/**
 * Pilot Desk — plan and evaluate a real customer pilot.
 *
 * The workflow covers success criteria, participants, engagement,
 * adoption, results, and the buyer's next decision. Existing data and
 * persistence behavior are unchanged; only the user-facing language and
 * internal comments have been translated into standard pilot terms.
 */

const extras = signal<PilotExtras>(EMPTY_EXTRAS);
const extrasAccount = signal<string>("");
const kitOpen = signal(false);
const openGap = signal<string | null>(null);
const gapName = signal("");
const addName = signal("");
const addRole = signal("");
const addKind = signal<PersonKind>("hands_on");
const actionsDraft = signal("");
const toastMsg = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let persistStarted = false;

function toast(msg: string): void {
    toastMsg.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = null), 2400);
}

/** The pilot's storage key — linked deal id when available, otherwise account name. */
function extrasKey(): string {
    const d = draft.value;
    return d.linkedDealId.trim() || d.account;
}

/** Boot the per-pilot extras + persistence loop. Called from main. */
export function bootPilotExtras(): void {
    extrasAccount.value = extrasKey();
    extras.value = loadExtras(extrasAccount.value);
    if (!persistStarted) {
        persistStarted = true;
        let first = true;
        effect(() => {
            const e = extras.value;
            const key = extrasAccount.value;
            if (first) {
                first = false;
                return;
            }
            // Never persist an untouched pilot. Typing an account name
            // character by character must not create partial keys.
            if (key.trim() && !extrasEmpty(e)) saveExtras(key, e);
        });
        effect(() => {
            const key = extrasKey();
            if (key !== extrasAccount.value) {
                extrasAccount.value = key;
                extras.value = loadExtras(key);
            }
        });
    }
}

function patchExtras(part: Partial<PilotExtras>): void {
    extras.value = { ...extras.value, ...part } as PilotExtras;
}

const KIND_LABEL: Record<PersonKind, string> = {
    hands_on: t("hands-on"),
    champion: t("champion"),
    signoff: t("approves the result")
};

interface KitItem {
    readonly key: string;
    readonly icon: string;
    readonly name: string;
    readonly sub: string;
    readonly verb: string;
    readonly template: (ctx: { account: string; champion: string }) => string;
}

const KIT: ReadonlyArray<KitItem> = [
    {
        key: "video",
        icon: "🎬",
        name: t("Getting-started video"),
        sub: t("5 minutes · send before first use", { class: "body" }),
        verb: t("Send →"),
        template: (c) => `Quick one — here's the 5-minute getting-started video for the ${c.account} pilot. Please watch it before the first working session so the time is spent evaluating the product rather than setting it up.`
    },
    {
        key: "quickstart",
        icon: "📄",
        name: t("Quick-start by role"),
        sub: t("one page for each participant", { class: "body" }),
        verb: t("Send →"),
        template: (c) => `Attached is a one-page quick-start for your role in the ${c.account} pilot. It covers the three things to do this week.`
    },
    {
        key: "case",
        icon: "🏆",
        name: t("Relevant case study"),
        sub: t("a comparable customer pilot", { class: "body" }),
        verb: t("Send →"),
        template: (c) => `A comparable team ran a similar pilot. Here's what they evaluated and what they reported during the first two weeks.`
    },
    {
        key: "whyyou",
        icon: "💬",
        name: t("Participant context note"),
        sub: t("why this person is included", { class: "body" }),
        verb: t("Send →"),
        template: (c) => `You're included in the ${c.account} pilot because you're close to the work the pilot is meant to evaluate. Your feedback during the first week is part of the evaluation.`
    },
    {
        key: "champion",
        icon: "🤝",
        name: t("Champion summary"),
        sub: t("success criteria, responses, and results-meeting context", { class: "body" }),
        verb: t("Send →"),
        template: (c) => `${c.champion} — here's the short internal summary for the ${c.account} pilot: what it needs to demonstrate, responses to the common questions, and what we agreed to review in the results meeting.`
    },
    {
        key: "kickoff",
        icon: "📣",
        name: t("Kickoff announcement"),
        sub: t("message for the participant group", { class: "body" }),
        verb: t("Copy →"),
        template: (c) => `Team — we're piloting a new tool for the next two weeks at ${c.account}. Please use it in your normal work and record what works and what does not. That feedback will be part of the final evaluation.`
    },
    {
        key: "faq",
        icon: "❓",
        name: t("FAQ"),
        sub: t("answers to common participant questions", { class: "body" }),
        verb: t("Send →"),
        template: () => `Short FAQ: What happens to our data? Nothing leaves your environment. Does this replace our stack? No — it sits on top. What if it doesn't work? We stop at the agreed date.`
    },
    {
        key: "reference",
        icon: "🔗",
        name: t("Reference-customer introduction"),
        sub: t("optional conversation with an existing customer", { class: "body" }),
        verb: t("Ask →"),
        template: () => `Would it help to speak with a customer that uses this in a similar environment? I can make a 15-minute introduction.`
    },
    {
        key: "mutual",
        icon: "📋",
        name: t("Pilot plan"),
        sub: t("goal, participants, check-ins, results meeting, and owners", { class: "body" }),
        verb: t("Build together →"),
        template: (c) => `PILOT PLAN — ${c.account}\nSuccess criteria: (agreed together)\nParticipants: (customer + our team)\nCheck-ins: (agreed dates)\nResults meeting: (date + attendees)\nOwners: ${c.champion} + me`
    }
];

function copyText(text: string, done: string): void {
    if (!navigator.clipboard?.writeText) {
        toast(t("Copying isn't available here — select the text manually.", { class: "body" }));
        return;
    }
    navigator.clipboard
        .writeText(text)
        .then(() => toast(done))
        .catch(() => toast(t("Couldn't copy — select the text manually.", { class: "body" })));
}

function addPerson(name: string, role: string, kind: PersonKind): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const person: CirclePerson = {
        id: personId(),
        name: trimmed,
        role: role.trim(),
        kind,
        active: false
    };
    patchExtras({ circle: [...extras.value.circle, person] });
}

function toggleActive(id: string): void {
    patchExtras({
        circle: extras.value.circle.map((p) =>
            p.id === id && p.kind === "hands_on" ? { ...p, active: !p.active } : p
        )
    });
}

function removePerson(id: string): void {
    patchExtras({ circle: extras.value.circle.filter((p) => p.id !== id) });
}

export function PilotDeskV4(): JSX.Element {
    const d = draft.value;
    const proof = activeProof.value;
    const deal = linkedDeal.value;
    const deals = linkedDeals.value;
    const e = extras.value;
    const champion = e.circle.find((p) => p.kind === "champion") ?? null;
    const handsOn = e.circle.filter((p) => p.kind === "hands_on");
    const adoption = readAdoption(e);
    const target = circleTarget(deal?.value ?? 0);

    const m1Done = proof !== null && proof.successCriteria.trim().length > 0;
    const m2Done = handsOn.length >= 2 && champion !== null;
    const current: 1 | 2 | 3 | 4 | 5 = !m1Done ? 1 : !m2Done ? 2 : e.stage;

    const startTs = e.startedAt ? Date.parse(e.startedAt) : proof ? Date.parse(proof.updatedAt) : NaN;
    const dayOf = Number.isFinite(startTs)
        ? Math.max(1, Math.ceil((Date.now() - startTs) / 86_400_000))
        : 0;

    const firstInactive = handsOn.find((p) => !p.active) ?? null;
    const activeNames = handsOn.filter((p) => p.active).map((p) => p.name);
    const steps: ReadonlyArray<string> = [
        activeNames.length > 0
            ? `${t("Message")} ${activeNames.slice(0, 2).join(" + ")} ${t("to acknowledge their use and ask whether anything is blocking evaluation.", { class: "body" })}`
            : `${t("Check in with")} ${champion?.name ?? t("your champion")} ${t("and confirm which participants have started using the product.", { class: "body" })}`,
        firstInactive
            ? `${t("Help")} ${firstInactive.name} ${t("complete a first meaningful action using the getting-started material.", { class: "body" })}`
            : t("All enrolled participants are active. Decide whether the evaluation needs another participant.", { class: "body" }),
        `${t("Schedule the next check-in with")} ${champion?.name ?? t("your champion")}`
    ];

    const gaps = [
        {
            id: "it",
            q: t("IT or data owner"),
            why: t("Add the person who can resolve data access or permissions if the pilot depends on systems they control.", { class: "body" })
        },
        {
            id: "driver",
            q: t("Day-to-day pilot owner", { class: "body" }),
            why: t("Add the customer-side person responsible for keeping participants engaged between formal check-ins.", { class: "body" })
        }
    ].filter((g) => !e.closedGaps.includes(g.id));

    function logCheckIn(): void {
        const actions = Number(actionsDraft.value) || 0;
        patchExtras({
            checkins: [{ at: new Date().toISOString(), actions }, ...e.checkins],
            stepsDone: 0
        });
        actionsDraft.value = "";
        toast(t("Check-in logged. The next pilot actions are ready to review.", { class: "body" }));
    }

    return (
        <div class="pk4">
            <div class="pk4-wrap">
                <div class="pk4-top">
                    <span class="pk4-bname">{t("Pilot Desk")}</span>
                    <span class="pk4-r">{t("pilot plan and execution", { class: "body" })}</span>
                </div>

                <div class="pk4-where">
                    <span class="pk4-who">{d.account ? `${d.account} ${t("pilot")}` : t("Your pilot")}</span>
                    {deal ? (
                        <a class="pk4-deal" href={hrefToDealWorkspace(deal.id)}>◆ ${Math.round(deal.value / 1000)}k {t("deal")}</a>
                    ) : deals.length > 0 ? (
                        <select
                            class="pk4-dealsel"
                            value={d.linkedDealId}
                            onChange={(ev) => {
                                const id = (ev.currentTarget as HTMLSelectElement).value;
                                const picked = deals.find((x) => x.id === id);
                                patchDraft({ linkedDealId: id, account: picked?.accountName ?? d.account });
                            }}>
                            <option value="">{t("Link to a deal…")}</option>
                            {deals.map((x) => <option value={x.id} key={x.id}>{x.accountName}</option>)}
                        </select>
                    ) : null}
                    {proof && dayOf > 0 ? (
                        <span class="pk4-wk">{t("Day")} {Math.min(dayOf, d.durationDays)} {t("of")} {d.durationDays}</span>
                    ) : null}
                </div>

                {current >= 2 ? (
                    <div class="pk4-band">
                        <div class="pk4-bh">
                            <span class="pk4-bt">{t("Pilot participants", { class: "body" })}</span>
                            <span class="pk4-br">
                                {e.circle.length} {t("included")} · {t("recommended range")} {target.min}–{target.max}{e.circle.length >= target.min ? " ✓" : ""}
                            </span>
                        </div>
                        <div class="pk4-sizenote">{t("Keep the participant group large enough to evaluate the use case, but small enough to manage directly during the pilot.", { class: "body" })}</div>
                        <div class="pk4-faces">
                            {e.circle.map((p) => (
                                <span class="pk4-face" key={p.id} onClick={() => toggleActive(p.id)} title={p.kind === "hands_on" ? t("Mark when this participant starts using the product", { class: "body" }) : ""}>
                                    <span class={`pk4-d ${p.kind !== "hands_on" ? "is-na" : p.active ? "is-on" : "is-off"}`} />
                                    {p.name}
                                    <span class="pk4-rl">{p.role ? `${p.role} · ` : ""}{p.kind === "hands_on" ? (p.active ? t("using it") : t("not started")) : KIND_LABEL[p.kind]}</span>
                                    <button type="button" class="pk4-fx" onClick={(ev) => { ev.stopPropagation(); removePerson(p.id); }}>×</button>
                                </span>
                            ))}
                            <span class="pk4-addface">
                                <input value={addName.value} placeholder={t("Name")} onInput={(ev) => (addName.value = (ev.currentTarget as HTMLInputElement).value)} />
                                <input value={addRole.value} placeholder={t("role")} class="pk4-rolein" onInput={(ev) => (addRole.value = (ev.currentTarget as HTMLInputElement).value)} />
                                <select value={addKind.value} onChange={(ev) => (addKind.value = (ev.currentTarget as HTMLSelectElement).value as PersonKind)}>
                                    <option value="hands_on">{t("hands-on")}</option>
                                    <option value="champion">{t("champion")}</option>
                                    <option value="signoff">{t("approves the result")}</option>
                                </select>
                                <button type="button" disabled={!addName.value.trim()} onClick={() => { addPerson(addName.value, addRole.value, addKind.value); addName.value = ""; addRole.value = ""; }}>{t("Add")}</button>
                            </span>
                        </div>
                    </div>
                ) : null}

                {current >= 2 && gaps.length > 0 ? (
                    <div class="pk4-gaps">
                        <div class="pk4-gt">
                            {t("Potential participant gaps", { class: "body" })}
                        </div>
                        {gaps.map((g) => (
                            <div class={`pk4-grow${openGap.value === g.id ? " is-open" : ""}`} key={g.id}>
                                <div class="pk4-gtop">
                                    <span class="pk4-gq">{g.q}</span>
                                    <span class="pk4-gwhy">{g.why}</span>
                                    <button type="button" class="pk4-gfind" onClick={() => (openGap.value = openGap.value === g.id ? null : g.id)}>{t("Add person →")}</button>
                                </div>
                                {openGap.value === g.id ? (
                                    <div class="pk4-findbox">
                                        <div class="pk4-fl">{t("Add the person if you know who owns this role.", { class: "body" })}</div>
                                        <input value={gapName.value} placeholder={t("Name + role")} onInput={(ev) => (gapName.value = (ev.currentTarget as HTMLInputElement).value)} />
                                        <button type="button" disabled={!gapName.value.trim()}
                                            onClick={() => {
                                                addPerson(gapName.value, g.id === "it" ? "IT" : t("pilot owner"), "hands_on");
                                                patchExtras({ closedGaps: [...extras.value.closedGaps, g.id] });
                                                gapName.value = "";
                                                openGap.value = null;
                                            }}>{t("Add")}</button>
                                        <button type="button" class="pk4-intro"
                                            onClick={() => copyText(
                                                `${champion?.name ?? t("Hi")} — ${t("for the pilot we still need", { class: "body" })} ${g.q.toLowerCase()} ${t("involved. Who owns this on your side, and would you introduce us?", { class: "body" })}`,
                                                t("Introduction request copied.", { class: "body" })
                                            )}>
                                            {t("Ask the champion for an introduction", { class: "body" })}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                ) : null}

                {current >= 2 ? (
                    <div class="pk4-band pk4-kit">
                        <button type="button" class="pk4-bh pk4-kithead" onClick={() => (kitOpen.value = !kitOpen.value)}>
                            <span class="pk4-bt">{t("Participant materials", { class: "body" })}</span>
                            <span class="pk4-br is-blue">{KIT.length} {t("items")} {kitOpen.value ? "▴" : "▾"}</span>
                        </button>
                        {firstInactive ? (
                            <div class="pk4-knud">{t("Current follow-up:")} <b>{firstInactive.name} {t("has not started using the product.")}</b> {t("Send the getting-started material before the next check-in.", { class: "body" })}</div>
                        ) : null}
                        {kitOpen.value ? (
                            <div class="pk4-assets">
                                {KIT.map((item) => (
                                    <div class={`pk4-asset${item.key === "mutual" ? " is-mutual" : ""}${item.key === "video" && firstInactive ? " is-hot" : ""}`} key={item.key}>
                                        <span class="pk4-ic">{item.icon}</span>
                                        <span class="pk4-an">
                                            {item.name}
                                            <span class="pk4-asub">{item.sub}</span>
                                        </span>
                                        <button type="button" class="pk4-send"
                                            onClick={() => {
                                                copyText(item.template({ account: d.account || t("the account"), champion: champion?.name ?? t("your champion") }), t("Copied.", { class: "body" }));
                                                if (!e.shared.includes(item.key)) patchExtras({ shared: [...e.shared, item.key] });
                                            }}>
                                            {e.shared.includes(item.key) ? t("Sent ✓") : item.verb}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div class="pk4-path">
                    <div class={`pk4-mv${m1Done ? " is-done" : " is-now"}`}>
                        <span class="pk4-node">{m1Done ? "✓" : "1"}</span>
                        <div class="pk4-ttl">{t("Define the pilot")} <span class="pk4-tag">{m1Done ? t("complete") : t("current step")}</span></div>
                        {m1Done && proof ? (
                            <div class="pk4-summ">{d.durationDays}-{t("day pilot")} · {proof.successCriteria.slice(0, 60)}{proof.readoutOwner ? ` · ${proof.readoutOwner} ${t("approves the result")}` : ""}</div>
                        ) : (
                            <div class="pk4-panel">
                                <div class="pk4-ph">{t("Define the pilot's success criteria before the pilot begins.", { class: "body" })}</div>
                                <div class="pk4-pwhy">{t("Agree on success criteria, the person who approves the result, and the pilot end date with your champion. These become the pilot plan.", { class: "body" })}</div>
                                <div class="pk4-form">
                                    <label><span>{t("Success criteria")}</span>
                                        <input value={d.successCriteria} placeholder={t("e.g. Cut forecast error in half on one team", { class: "body" })}
                                            onInput={(ev) => patchDraft({ successCriteria: (ev.currentTarget as HTMLInputElement).value })} /></label>
                                    <label><span>{t("Who approves the result")}</span>
                                        <input value={d.readoutOwner} placeholder={t("e.g. Dana Wu, VP Ops")}
                                            onInput={(ev) => patchDraft({ readoutOwner: (ev.currentTarget as HTMLInputElement).value })} /></label>
                                    <label><span>{t("Pilot end condition or date")}</span>
                                        <input value={d.boundaries} placeholder={t("e.g. Day 14, or earlier if adoption is too low to evaluate", { class: "body" })}
                                            onInput={(ev) => patchDraft({ boundaries: (ev.currentTarget as HTMLInputElement).value })} /></label>
                                    <label><span>{t("Account")}</span>
                                        <input value={d.account} placeholder="e.g. Ramp"
                                            onInput={(ev) => patchDraft({ account: (ev.currentTarget as HTMLInputElement).value })} /></label>
                                    <div class="pk4-window">
                                        <span>{t("Pilot length")}</span>
                                        <button type="button" class={d.durationDays === 7 ? "is-on" : ""} onClick={() => setDurationDays(7)}>7 {t("days")}</button>
                                        <button type="button" class={d.durationDays === 14 ? "is-on" : ""} onClick={() => setDurationDays(14)}>14 {t("days")}</button>
                                    </div>
                                </div>
                                <button type="button" class="pk4-btn"
                                    disabled={!d.account.trim() || !d.successCriteria.trim()}
                                    onClick={() => {
                                        void saveProof(saveDraft());
                                        if (!extras.value.startedAt) patchExtras({ startedAt: new Date().toISOString() });
                                        toast(t("Pilot setup saved. Add the participant group next.", { class: "body" }));
                                    }}>
                                    {t("Save pilot setup →")}
                                </button>
                            </div>
                        )}
                    </div>

                    <div class={`pk4-mv${m2Done ? " is-done" : m1Done ? " is-now" : ""}`}>
                        <span class="pk4-node">{m2Done ? "✓" : "2"}</span>
                        <div class="pk4-ttl">{t("Identify pilot participants")} <span class="pk4-tag">{m2Done ? t("complete") : m1Done ? t("current step") : t("next")}</span></div>
                        <div class="pk4-summ">{t("Add the hands-on users and the champion who will evaluate the pilot.", { class: "body" })}</div>
                        {m1Done && !m2Done ? (
                            <div class="pk4-panel">
                                <div class="pk4-ph">{t("Add the people who will actually use and evaluate the product.", { class: "body" })}</div>
                                <div class="pk4-pwhy">{t("The current pilot model requires at least two hands-on users and a champion before the next stage can begin.", { class: "body" })}</div>
                            </div>
                        ) : null}
                    </div>

                    <div class={`pk4-mv${current > 3 ? " is-done" : current === 3 && m2Done ? " is-now" : ""}`}>
                        <span class="pk4-node">{current > 3 ? "✓" : "3"}</span>
                        <div class="pk4-ttl">{t("Monitor pilot engagement")} <span class="pk4-tag">{current > 3 ? t("complete") : current === 3 && m2Done ? t("current step") : t("next")}</span></div>
                        <div class="pk4-summ">{t("Track usage between check-ins and add participants when broader evaluation is needed.", { class: "body" })}</div>
                        {current === 3 && m2Done ? (
                            <div class="pk4-panel">
                                <div class="pk4-ph">
                                    {firstInactive
                                        ? `${t("Help")} ${firstInactive.name} ${t("complete a meaningful product action before the next check-in.", { class: "body" })}`
                                        : t("All enrolled participants are active. Decide whether another participant is needed for a fair evaluation.", { class: "body" })}
                                </div>
                                <div class="pk4-adopt">
                                    <div><div class="pk4-cl">{t("Participants using it")}</div><div class={`pk4-cv${adoption.using < adoption.enrolled ? " is-warn" : " is-good"}`}>{adoption.using} {t("of")} {adoption.enrolled}</div></div>
                                    <div><div class="pk4-cl">{t("Actions recorded")}</div><div class={`pk4-cv${adoption.actionsLast > 0 ? " is-good" : ""}`}>{adoption.actionsLast} {t("last check-in")}</div></div>
                                </div>
                                <div class="pk4-src">{t("Usage can come from product telemetry or be marked manually above.", { class: "body" })}</div>
                                <ul class="pk4-steps">
                                    {steps.map((s, i) => {
                                        const done = i < e.stepsDone;
                                        const locked = i > e.stepsDone;
                                        return (
                                            <li class={`${done ? "is-done" : ""}${locked ? " is-lock" : ""}`} key={s}>
                                                <button type="button" class="pk4-ck" disabled={locked}
                                                    onClick={() => patchExtras({ stepsDone: done ? i : i + 1 })}>{done ? "✓" : ""}</button>
                                                <span class="pk4-tt">{s}{locked ? <span class="pk4-lockhint"> — {t("complete the step above first")}</span> : null}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div class="pk4-logrow">
                                    <input value={actionsDraft.value} type="number" placeholder={t("actions this check-in")}
                                        onInput={(ev) => (actionsDraft.value = (ev.currentTarget as HTMLInputElement).value)} />
                                    <button type="button" class="pk4-btn" onClick={logCheckIn}>{t("Log check-in →")}</button>
                                    {e.checkins.length > 0 ? <span class="pk4-ccount">{e.checkins.length} {t("logged")}</span> : null}
                                    {e.checkins.length > 0 ? (
                                        <button type="button" class="pk4-adv" onClick={() => patchExtras({ stage: 4 })}>{t("Review adoption →")}</button>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div class={`pk4-mv${current > 4 ? " is-done" : current === 4 ? " is-now" : ""}`}>
                        <span class="pk4-node">{current > 4 ? "✓" : "4"}</span>
                        <div class="pk4-ttl">{t("Review adoption")} <span class="pk4-tag">{current > 4 ? t("complete") : current === 4 ? t("current step") : t("next")}</span></div>
                        <div class="pk4-summ">{t("Confirm that the intended users are using the product often enough to evaluate the pilot fairly.", { class: "body" })}</div>
                        {current === 4 ? (
                            <div class="pk4-panel">
                                <div class="pk4-ph">
                                    {adoption.band === "ready"
                                        ? t("Adoption is sufficient for the current evaluation.", { class: "body" })
                                        : adoption.band === "almost"
                                          ? t("Adoption is close to the current threshold. One additional active participant would improve the evaluation.", { class: "body" })
                                          : t("Adoption is currently too limited to evaluate the pilot fairly.", { class: "body" })}
                                </div>
                                <div class="pk4-adopt">
                                    <div><div class="pk4-cl">{t("Participants using it")}</div><div class={`pk4-cv${adoption.band === "ready" ? " is-good" : " is-warn"}`}>{adoption.using} {t("of")} {adoption.enrolled}</div></div>
                                    <div><div class="pk4-cl">{t("Check-ins held")}</div><div class="pk4-cv">{e.checkins.length}</div></div>
                                </div>
                                <div class="pk4-pwhy">{t("Use adoption to determine whether enough of the intended participants actually evaluated the product. Pilot business outcomes may require more time than the pilot window itself.", { class: "body" })}</div>
                                <div class="pk4-logrow">
                                    <button type="button" class="pk4-adv" onClick={() => patchExtras({ stage: 3 })}>{t("← Monitor engagement")}</button>
                                    <button type="button" class="pk4-btn" onClick={() => patchExtras({ stage: 5 })}>{t("Summarize results →")}</button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div class={`pk4-mv${current === 5 ? " is-now" : ""}`}>
                        <span class="pk4-node">5</span>
                        <div class="pk4-ttl">{t("Summarize pilot results for the buyer", { class: "body" })} <span class="pk4-tag">{current === 5 ? t("current step") : t("next")}</span></div>
                        <div class="pk4-summ">{t("Create a concise results summary that your champion can share internally without you present.", { class: "body" })}</div>
                        {current === 5 ? (
                            <div class="pk4-panel">
                                <div class="pk4-ph">{t("Write the summary so")} {champion?.name ?? t("your champion")} {t("can explain the pilot result internally without additional context from you.", { class: "body" })}</div>
                                <textarea
                                    class="pk4-writeup"
                                    value={e.writeup}
                                    placeholder={t("Success criteria · who participated · adoption · what the pilot demonstrated · recommended next decision.", { class: "body" })}
                                    onInput={(ev) => patchExtras({ writeup: (ev.currentTarget as HTMLTextAreaElement).value })}
                                />
                                <div class="pk4-logrow">
                                    <button type="button" class="pk4-btn" disabled={!e.writeup.trim()}
                                        onClick={() => copyText(e.writeup, t("Copied. Send it to the champion before the results meeting.", { class: "body" }))}>
                                        {t("Copy results summary", { class: "body" })}
                                    </button>
                                    <button type="button" class="pk4-adv" onClick={() => patchExtras({ stage: 4 })}>{t("← Review adoption")}</button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {toastMsg.value ? <div class="pk4-toast">{toastMsg.value}</div> : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
