import type { JSX } from "preact";
import { signal, computed } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    frameworkRegistry,
    focusedAccount,
    activeFramework,
    activeNode,
    activeTrack,
    essentialNodeSet,
    skipAheadHandlers,
    responseSet,
    expandedResponse,
    learnedFacts,
    signalLedger,
    tiebackLedger,
    supportDossier,
    objectionLibrary,
    inboundQuestionHandlers,
    compressionMode,
    nextStepLock,
    callDisposition,
    workedNodeIds,
    selectFramework,
    setActiveNode,
    expandResponse,
    recordBranchInteraction,
    jumpToInterruptTarget,
    holdFact,
    deployFact,
    factStatusFor,
    setNextStepField,
    setCompressionMode,
    recordLearnedFact,
    type Framework,
    type Segment,
    type SegmentNode,
    type Branch,
    type CompressionMode,
    type CallDisposition,
    type FrameworkId
} from "../state";
import { hrefToDealWorkspace, hrefToFutureAutopsy } from "../lib/handoff";
import { QUESTION_BANK, unquoteQuestion } from "@/call-planner/lib/personas";
import { PERSONA_KEYS, PERSONA_LABELS, type PersonaKey } from "@/call-planner/lib/types";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./discovery-studio-v4.css";

/**
 * Discovery Studio is the live-call surface for framework questions,
 * response branches, notes, objections, evidence, captured facts, and a
 * dated next step. The underlying framework content and routing behavior are
 * unchanged; this wrapper uses literal call language rather than private
 * product metaphors.
 */

type DrawerTab = "pushback" | "ask" | "evidence" | "recover" | "know" | "next";
const drawerTab = signal<DrawerTab>("pushback");
const drawerFlag = signal<DrawerTab | null>(null);
const personaLens = signal<PersonaKey | null>(null);
const lensIdx = signal(0);
const champion = signal("");
const signer = signal("");
const stateEdit = signal<"champion" | "signer" | null>(null);
const stateEditVal = signal("");

const SEG_SHORT: ReadonlyArray<string> = [
    t("Opening"),
    t("Current state"),
    t("Pain & consequence"),
    t("Trigger"),
    t("Stakeholders"),
    t("Evidence"),
    t("Vendor"),
    t("Decision"),
    t("Next step"),
    t("Post-call")
];

const TRACK_LABEL: Record<CallDisposition, string> = {
    "in-progress": t("in progress"),
    advanced: t("advanced"),
    stalled: t("stalled"),
    lost: t("lost"),
    won: t("won"),
    "no-show": t("no-show")
};

const DISPOSITIONS: ReadonlyArray<{ id: CallDisposition; label: string }> = [
    { id: "advanced", label: t("Advanced — dated next step set", { class: "body" }) },
    { id: "stalled", label: t("Stalled — no dated next step", { class: "body" }) },
    { id: "won", label: t("Won") },
    { id: "lost", label: t("Not a fit — close it out", { class: "body" }) },
    { id: "no-show", label: t("No-show") }
];

const currentFw = computed<Framework | null>(() => {
    const fid = activeFramework.value;
    return fid ? frameworkRegistry.value.find((f) => f.id === fid) ?? null : null;
});

function segOf(fw: Framework, key: string): Segment | null {
    return fw.segments.find((s) => s.key === key) ?? null;
}

function pickBranch(node: SegmentNode, i: number, branch: Branch): void {
    expandResponse(i);
    recordBranchInteraction(node.id, i, branch);
    holdFact(node.id, i);
    if (branch.cls === "red") {
        drawerTab.value = "pushback";
        drawerFlag.value = "pushback";
    }
}

function saveStateName(): void {
    const which = stateEdit.value;
    const name = stateEditVal.value.trim();
    if (!which || !name) {
        stateEdit.value = null;
        return;
    }
    if (which === "champion") champion.value = name;
    else signer.value = name;
    const node = activeNode.value;
    if (node) {
        recordLearnedFact(
            node.nodeId,
            which === "champion" ? -1 : -2,
            which === "champion" ? `${t("Champion:")} ${name}` : `${t("Approver:")} ${name}`
        );
    }
    stateEdit.value = null;
    stateEditVal.value = "";
}

export function DiscoveryStudioV4(): JSX.Element {
    const fw = currentFw.value;
    const registry = frameworkRegistry.value;
    const node = activeNode.value;
    const comp = compressionMode.value;
    const worked = workedNodeIds.value;
    const facts = learnedFacts.value;
    const lock = nextStepLock.value;
    const lockSet = Boolean(lock.date && lock.owner && lock.purpose);
    const account = focusedAccount.value;

    if (!fw) {
        return (
            <div class="dv4">
                <div class="dv4-wrap">
                    <div class="dv4-top"><span class="dv4-bn">{t("Discovery Studio")}</span></div>
                    <div class="dv4-empty">
                        <h3>{t("Choose a framework for this call.")}</h3>
                        <div class="dv4-fwgrid">
                            {registry.map((f) => (
                                <button type="button" class="dv4-fwbtn" key={f.id} onClick={() => selectFramework(f.id)}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <p>{t("If no framework exactly matches, choose the closest fit. The question flow and recovery prompts remain available.", { class: "body" })}</p>
                    </div>
                </div>
                <GroundLine />
                <LiveEdge />
            </div>
        );
    }

    const seg = node ? segOf(fw, node.segmentKey) : fw.segments[0] ?? null;
    const segIdx = seg ? fw.segments.findIndex((s) => s.key === seg.key) : 0;
    const currentNode: SegmentNode | null =
        node && seg ? seg.nodes.find((n) => n.id === node.nodeId) ?? null : seg?.nodes[0] ?? null;
    const branches = node ? responseSet.value : currentNode?.branches ?? [];
    const picked = expandedResponse.value;
    const pickedBranch = picked !== null ? branches[picked] ?? null : null;
    const essentials = new Set(essentialNodeSet.value);
    const isPostCall = segIdx === fw.segments.length - 1;

    const spineSegs =
        comp === "emergency" && seg
            ? [seg]
            : comp === "essentials"
              ? fw.segments.filter((s) => s.essential || s.nodes.some((n) => essentials.has(n.id)))
              : fw.segments;
    const tab: DrawerTab = comp === "emergency" ? "recover" : drawerTab.value;

    const preflight = [
        Boolean(account.trim()),
        personaLens.value !== null,
        facts.length > 0 || segIdx > 0,
        Boolean(lock.purpose || segIdx < 8)
    ].filter(Boolean).length;

    const lensQuestions = personaLens.value ? QUESTION_BANK[personaLens.value] : null;

    function openSegment(target: Segment): void {
        const first = target.nodes[0];
        if (first) setActiveNode(target.key, first.id);
    }

    return (
        <div class="dv4">
            <div class="dv4-wrap">
                <div class="dv4-top">
                    <span class="dv4-bn">{t("Discovery Studio")}</span>
                    <select class="dv4-fwsel" value={fw.id} onChange={(e) => selectFramework((e.currentTarget as HTMLSelectElement).value as FrameworkId)}>
                        {registry.map((f) => <option value={f.id} key={f.id}>{f.short ?? f.label}</option>)}
                    </select>
                    <span class={`dv4-pre${preflight >= 3 ? " is-ok" : ""}`}>
                        <span class="dv4-pd" />
                        {preflight >= 3
                            ? t("Call setup ready")
                            : `${t("Call setup:")} ${preflight}/4 ${t("items set")}`}
                    </span>
                    <span class="dv4-comp">
                        {(["off", "essentials", "emergency"] as CompressionMode[]).map((m) => (
                            <button type="button" key={m}
                                class={`${comp === m ? "is-on" : ""}${m === "emergency" ? " is-em" : ""}`}
                                onClick={() => setCompressionMode(m)}>
                                {m === "off" ? t("All") : m === "essentials" ? t("Essentials") : t("Recovery")}
                            </button>
                        ))}
                    </span>
                </div>

                <div class="dv4-state">
                    <span class="dv4-who">{account || t("(no account selected)")}</span>
                    <span class="dv4-vit">
                        <span class="dv4-v">{t("status:")} <b class={`is-${activeTrack.value}`}>{TRACK_LABEL[activeTrack.value]}</b></span>
                        <span class="dv4-v"><b>{facts.length}</b> {t("captured facts")}</span>
                        {stateEdit.value === "champion" ? (
                            <input class="dv4-sin" autofocus value={stateEditVal.value}
                                onInput={(e) => (stateEditVal.value = (e.currentTarget as HTMLInputElement).value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveStateName(); if (e.key === "Escape") (stateEdit.value = null); }}
                                onBlur={saveStateName} placeholder={t("Champion name")} />
                        ) : (
                            <button type="button" class={`dv4-v is-chip${champion.value ? " is-ok" : ""}`} onClick={() => { stateEdit.value = "champion"; stateEditVal.value = champion.value; }}>
                                {t("champion")} {champion.value ? "✓" : "—"}
                            </button>
                        )}
                        {stateEdit.value === "signer" ? (
                            <input class="dv4-sin" autofocus value={stateEditVal.value}
                                onInput={(e) => (stateEditVal.value = (e.currentTarget as HTMLInputElement).value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveStateName(); if (e.key === "Escape") (stateEdit.value = null); }}
                                onBlur={saveStateName} placeholder={t("Who approves?")} />
                        ) : (
                            <button type="button" class={`dv4-v is-chip${signer.value ? " is-ok" : ""}`} onClick={() => { stateEdit.value = "signer"; stateEditVal.value = signer.value; }}>
                                {t("approver")} {signer.value ? "✓" : "—"}
                            </button>
                        )}
                        <span class="dv4-v"><b>{t("next step:")}</b> <span class={lockSet ? "is-set" : "is-no"}>{lockSet ? t("Step complete") : t("incomplete")}</span></span>
                    </span>
                </div>

                <div class="dv4-spine">
                    {spineSegs.map((s) => {
                        const i = fw.segments.findIndex((x) => x.key === s.key);
                        const done = s.nodes.some((n) => worked.includes(n.id));
                        const on = seg?.key === s.key;
                        return (
                            <button type="button" key={s.key}
                                class={`dv4-sp${on ? " is-on" : ""}${done && !on ? " is-done" : ""}${s.essential ? " is-ess" : ""}`}
                                onClick={() => openSegment(s)}>
                                <span class="dv4-spn">{i + 1}</span>
                                {SEG_SHORT[i] ?? s.title}
                            </button>
                        );
                    })}
                </div>

                {seg && currentNode && !isPostCall ? (
                    <div class="dv4-moment">
                        <div class="dv4-seglbl">§{segIdx + 1} · {seg.title} · {seg.cue}</div>
                        <div class="dv4-q">{currentNode.text}</div>
                        <div class="dv4-lens">
                            {personaLens.value && lensQuestions ? (
                                <>
                                    {t("Question for")} <b>{PERSONA_LABELS[personaLens.value]}</b> — “{unquoteQuestion(lensQuestions[lensIdx.value % lensQuestions.length] ?? "")}”
                                    <button type="button" class="dv4-lensbtn" onClick={() => (lensIdx.value = lensIdx.value + 1)}>{t("another ↻")}</button>
                                </>
                            ) : (
                                <>{t("Select a buyer role to see alternative questions:", { class: "body" })}</>
                            )}
                            <select class="dv4-lenssel" value={personaLens.value ?? ""}
                                onChange={(e) => { const v = (e.currentTarget as HTMLSelectElement).value; personaLens.value = (v || null) as PersonaKey | null; lensIdx.value = 0; }}>
                                <option value="">{t("no role selected")}</option>
                                {PERSONA_KEYS.map((p) => <option value={p} key={p}>{PERSONA_LABELS[p]}</option>)}
                            </select>
                        </div>
                        {currentNode.note ? (
                            <div class="dv4-listen"><span class="dv4-ll">{t("Listen for")}</span> {currentNode.note}</div>
                        ) : null}
                        <div class="dv4-hear">{t("Select the buyer response that best matches what you heard.", { class: "body" })}</div>
                        <div class="dv4-says">
                            {branches.map((b, i) => (
                                <button type="button" key={`${currentNode.id}-${i}`}
                                    class={`dv4-say${picked === i ? " is-picked" : ""} tone-${b.cls}`}
                                    onClick={() => pickBranch(currentNode, i, b)}>
                                    {b.quote || b.tag}
                                </button>
                            ))}
                        </div>
                        {pickedBranch ? (
                            <div class="dv4-answer">
                                <div class="dv4-al">{t("Suggested response")}</div>
                                <div class="dv4-at">{pickedBranch.move}</div>
                                {pickedBranch.actions && pickedBranch.actions.length > 0 ? (
                                    <span class="dv4-aj">
                                        {pickedBranch.actions.map((a) => (
                                            <button type="button" key={a.target} onClick={() => jumpToInterruptTarget(a.target)}>
                                                → {a.label}
                                            </button>
                                        ))}
                                    </span>
                                ) : null}
                            </div>
                        ) : (
                            <div class="dv4-hint">{t("Select a response above to see the next suggested line.", { class: "body" })}</div>
                        )}
                        {seg.nodes.length > 1 ? (
                            <div class="dv4-nodes">
                                {seg.nodes
                                    .filter((n) => comp === "off" || essentials.has(n.id) || n.id === currentNode.id)
                                    .map((n) => (
                                        <button type="button" key={n.id}
                                            class={`dv4-nd${n.id === currentNode.id ? " is-on" : ""}${worked.includes(n.id) ? " is-done" : ""}`}
                                            onClick={() => setActiveNode(seg.key, n.id)}>
                                            {n.badge || n.text.slice(0, 34)}
                                        </button>
                                    ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {isPostCall ? (
                    <div class="dv4-moment dv4-post">
                        <div class="dv4-seglbl">§10 · {t("Post-call routing")}</div>
                        <div class="dv4-q">{t("How did the call end?")}</div>
                        <div class="dv4-says">
                            {DISPOSITIONS.map((d) => (
                                <button type="button" key={d.id}
                                    class={`dv4-say${callDisposition.value === d.id ? " is-picked" : ""}`}
                                    onClick={() => { callDisposition.value = d.id; activeTrack.value = d.id; }}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        {callDisposition.value !== "in-progress" ? (
                            <div class="dv4-routes">
                                {callDisposition.value === "advanced" || callDisposition.value === "won" ? (
                                    <a class="dv4-route is-pri" href={hrefToDealWorkspace(account || undefined)}>{t("Open in Deal Workspace →")}</a>
                                ) : callDisposition.value === "stalled" || callDisposition.value === "lost" ? (
                                    <a class="dv4-route is-pri" href={hrefToFutureAutopsy(account || undefined)}>{t("Review loss risk →")}</a>
                                ) : null}
                                <a class="dv4-route" href={hrefToDealWorkspace(account || undefined)}>{t("Deal Workspace")}</a>
                                <span class="dv4-routenote">{facts.length} {t("facts captured during this call", { class: "body" })}</span>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div class="dv4-drawer">
                    <div class="dv4-dtabs">
                        {([
                            ["pushback", t("Objections")],
                            ["ask", t("Buyer questions")],
                            ["evidence", t("Evidence")],
                            ["recover", t("Recovery prompts")],
                            ["know", t("Facts & signals")],
                            ["next", t("Next step")]
                        ] as ReadonlyArray<[DrawerTab, string]>).map(([id, label]) => (
                            <button type="button" key={id}
                                class={`dv4-dt${tab === id ? " is-on" : ""}${id === "recover" ? " is-rec" : ""}`}
                                onClick={() => { drawerTab.value = id; if (drawerFlag.value === id) drawerFlag.value = null; }}>
                                {label}
                                {drawerFlag.value === id ? <span class="dv4-flag" /> : null}
                            </button>
                        ))}
                    </div>
                    <div class="dv4-dbody">
                        {tab === "pushback" ? (
                            <div class="dv4-two">
                                {objectionLibrary.value.length === 0 ? <p class="dv4-none">{t("No objection responses are authored for this framework yet.", { class: "body" })}</p> :
                                    objectionLibrary.value.map((o) => (
                                        <div class="dv4-oi" key={o.trigger}><b>“{o.trigger}”</b> → {o.reply}</div>
                                    ))}
                            </div>
                        ) : null}
                        {tab === "ask" ? (
                            <div class="dv4-two">
                                {inboundQuestionHandlers.value.length === 0 ? <p class="dv4-none">{t("No buyer-question responses are authored for this framework yet.", { class: "body" })}</p> :
                                    inboundQuestionHandlers.value.map((h) => (
                                        <div class="dv4-oi" key={h.question}><b>“{h.question}”</b> → {h.bridge}</div>
                                    ))}
                            </div>
                        ) : null}
                        {tab === "evidence" ? (
                            <div>
                                {supportDossier.value.length === 0 ? <p class="dv4-none">{t("No evidence examples are authored for this framework yet.", { class: "body" })}</p> :
                                    supportDossier.value.map((topic) => (
                                        <div key={topic.title}>
                                            <div class="dv4-grp3">{topic.title}</div>
                                            <div class="dv4-two">
                                                {topic.items.map((item, i) => (
                                                    <div class="dv4-oi" key={i}>
                                                        {typeof item === "string" ? item : <><b>{item.heading}</b> — {item.body}</>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : null}
                        {tab === "recover" ? (
                            <div>
                                {(fw.interrupts ?? []).map((it) => (
                                    <div class="dv4-rec" key={it.id}>
                                        <div class="dv4-rt">{it.label}</div>
                                        <div class="dv4-rd">{it.recover}</div>
                                        {it.actions.map((a) => (
                                            <button type="button" class="dv4-rj" key={a.target} onClick={() => jumpToInterruptTarget(a.target)}>
                                                → {a.label}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                                <div class="dv4-grp3">{t("Skip-ahead responses")}</div>
                                <div class="dv4-two">
                                    {skipAheadHandlers.value.map((h) => (
                                        <div class="dv4-oi" key={h.trigger}><b>“{h.trigger}”</b> → {h.reply}</div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        {tab === "know" ? (
                            <div>
                                <div class="dv4-grp3">{t("Captured facts")} · <b>{facts.length}</b></div>
                                <div class="dv4-facts">
                                    {facts.length === 0 ? <p class="dv4-none">{t("No facts are captured yet. Select a buyer response when it records information you want to keep.", { class: "body" })}</p> :
                                        facts.map((f) => {
                                            const status = factStatusFor(f.nodeId, f.branchIndex);
                                            return (
                                                <div class="dv4-fact" key={`${f.nodeId}-${f.branchIndex}`}>
                                                    <span class="dv4-fv">{f.fact}</span>
                                                    {status === "deployed" ? (
                                                        <span class="dv4-fs is-dep">{t("used")}</span>
                                                    ) : (
                                                        <button type="button" class="dv4-fs" onClick={() => deployFact(f.nodeId, f.branchIndex)}>
                                                            {t("use in this call")}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                                <div class="dv4-grp3">{t("Recorded response signals")}</div>
                                <div class="dv4-facts">
                                    {signalLedger.value.length === 0 ? <p class="dv4-none">{t("No response signals recorded yet.")}</p> :
                                        signalLedger.value.slice(-6).map((sig) => (
                                            <div class="dv4-fact" key={`${sig.nodeId}-${sig.branchIndex}`}>
                                                <span class={`dv4-fl tone-${sig.tone}`}>{sig.tone}</span>
                                                <span class="dv4-fv">{t("at")} {sig.nodeId.split("--").pop()?.replace(/-/g, " ")}</span>
                                            </div>
                                        ))}
                                </div>
                                <div class="dv4-grp3">{t("Captured facts available for reuse", { class: "body" })}</div>
                                <div class="dv4-facts">
                                    {tiebackLedger.value.length === 0 ? <p class="dv4-none">{t("No reusable facts are held yet.")}</p> :
                                        tiebackLedger.value.map((tb) => (
                                            <div class="dv4-fact" key={`${tb.nodeId}-${tb.branchIndex}`}>
                                                <span class={`dv4-fl${tb.status === "deployed" ? " is-dep" : ""}`}>{tb.status === "deployed" ? t("used") : t("available")}</span>
                                                <span class="dv4-fv">{tb.fact}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ) : null}
                        {tab === "next" ? (
                            <div class="dv4-docket">
                                <label class="dv4-dc"><span>{t("Date")}</span>
                                    <input type="date" value={lock.date} onInput={(e) => setNextStepField("date", (e.currentTarget as HTMLInputElement).value)} /></label>
                                <label class="dv4-dc"><span>{t("Owner")}</span>
                                    <input value={lock.owner} placeholder={t("responsible person")} onInput={(e) => setNextStepField("owner", (e.currentTarget as HTMLInputElement).value)} /></label>
                                <label class="dv4-dc"><span>{t("Purpose")}</span>
                                    <input value={lock.purpose} placeholder={t("e.g. technical scoping")} onInput={(e) => setNextStepField("purpose", (e.currentTarget as HTMLInputElement).value)} /></label>
                                <label class="dv4-dc"><span>{t("Attendees")}</span>
                                    <input value={lock.attendees} onInput={(e) => setNextStepField("attendees", (e.currentTarget as HTMLInputElement).value)} /></label>
                                <span class={`dv4-lockread${lockSet ? " is-ok" : ""}`}>
                                    {lockSet ? t("Next step complete.") : t("Add a date, owner, and purpose to complete the next step.", { class: "body" })}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <GroundLine />
        </div>
    );
}
