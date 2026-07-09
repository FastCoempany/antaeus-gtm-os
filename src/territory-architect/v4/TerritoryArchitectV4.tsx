import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    focuses,
    accounts,
    approaches,
    allocation,
    accountsByThesis,
    approachesByThesis,
    focusDraft,
    patchThesisDraft,
    saveThesisFromDraft,
    setAccountDisposition,
    retierAccount
} from "../state";
import {
    TIER_IDS,
    TIER_LABELS,
    TIER_DEFAULTS,
    type CarveAxis,
    type Focus,
    type TierId,
    type DispositionState
} from "../lib/types";
import { computeFieldRead } from "../lib/field-read";
import { GroundLine } from "@/lib/ground/GroundLine";
import "./territory-architect-v4.css";

/**
 * TerritoryArchitectV4 (canon §4.5) — the axis-morphing floor, wired to
 * production. The carve axis is a VARIABLE: divisions cut on geo /
 * vertical / segment / named / trigger (blendable), the room morphing
 * its register to the axis. Every division carries its charter — WHY-YOU
 * required on every axis; WHY-NOW required for trigger carves, optional
 * for structural ones (the form adapts so the operator never reads the
 * rule). The 300-cap allocation + tiers + field read + account
 * disposition/retier reuse the shipped engines unchanged; the axis is
 * an additive field.
 */

const AXES: ReadonlyArray<{
    id: CarveAxis;
    glyph: string;
    name: string;
    desc: string;
    register: string;
    carveField: string;
    placeholder: string;
    whyNowRequired: boolean;
}> = [
    { id: "geo", glyph: "◎", name: t("Geography"), desc: t("Regions & metros"), register: t("Cut by place — where you can win, city by city", { class: "body" }), carveField: t("Region / metro"), placeholder: "e.g. West Coast tech hub", whyNowRequired: false },
    { id: "vertical", glyph: "▣", name: t("Vertical"), desc: t("Industries"), register: t("Cut by industry — the pitch differs per vertical", { class: "body" }), carveField: t("Industry"), placeholder: "e.g. FinTech", whyNowRequired: false },
    { id: "segment", glyph: "☰", name: t("Segment"), desc: t("Size / stage bands"), register: t("Cut by size — the band you actually win in", { class: "body" }), carveField: t("Size / stage band"), placeholder: "e.g. Mid-market · 200–999", whyNowRequired: false },
    { id: "named", glyph: "◈", name: t("Named accounts"), desc: t("Hand-picked lists"), register: t("Cut by name — the accounts you already know you want", { class: "body" }), carveField: t("List name"), placeholder: "e.g. Strategic 25", whyNowRequired: false },
    { id: "trigger", glyph: "⚡", name: t("Trigger"), desc: t("Signal-driven"), register: t("Cut by pressure — who is moving right now, and why", { class: "body" }), carveField: t("Trigger — something you can actually detect", { class: "body" }), placeholder: "e.g. New-CRO transitions", whyNowRequired: true },
    { id: "blend", glyph: "⧉", name: t("Blend"), desc: t("Stack cuts across axes"), register: t("Cut on more than one axis at once — legible, not chaos", { class: "body" }), carveField: t("Primary axis + cuts"), placeholder: "e.g. West Coast × FinTech × Series B+", whyNowRequired: false }
];

const TIER_HEX: Record<TierId, string> = {
    t1: "#b83232",
    t2: "#e6701e",
    t3: "#2563eb",
    t4: "#8a97b0"
};

const DISPOSITIONS: ReadonlyArray<DispositionState> = [
    "active",
    "paused",
    "closed-won",
    "closed-lost",
    "reroute"
] as ReadonlyArray<DispositionState>;

const DISPOSITION_LABELS: Record<DispositionState, string> = {
    active: t("Working it"),
    paused: t("Paused"),
    "closed-won": t("Won"),
    "closed-lost": t("Lost"),
    reroute: t("Reroute")
};

const currentAxis = signal<CarveAxis>("segment");
const carveOpen = signal(false);
const drawerFocusId = signal<string | null>(null);

function axisOf(f: Focus): CarveAxis {
    return f.axis ?? "segment";
}

export function TerritoryArchitectV4(): JSX.Element {
    const axis = currentAxis.value;
    const A = AXES.find((x) => x.id === axis)!;
    const alloc = allocation.value;
    const allFocuses = focuses.value;
    const axisFocuses = allFocuses.filter((f) => axisOf(f) === axis);
    const read = computeFieldRead({
        accounts: accounts.value,
        focuses: allFocuses,
        approaches: approaches.value,
        allocation: alloc
    });
    const countByThesis = accountsByThesis.value;
    const apprByThesis = approachesByThesis.value;
    const allAccounts = accounts.value;
    const d = focusDraft.value;
    const drawerFocus = drawerFocusId.value
        ? allFocuses.find((f) => f.id === drawerFocusId.value) ?? null
        : null;
    const drawerAccounts = drawerFocus
        ? allAccounts.filter((a) => a.focusId === drawerFocus.id)
        : [];

    function carve(): void {
        patchThesisDraft({ axis });
        const saved = saveThesisFromDraft();
        if (saved) carveOpen.value = false;
    }

    return (
        <div class="ta4">
            <div class="ta4-wrap">
                <div class="ta4-bar">
                    <span class="ta4-bname">{t("Territory Architect")}</span>
                    <span class="ta4-gauge"><b>{alloc.total}</b> / {alloc.ceiling} {t("covered")}</span>
                </div>

                {/* axis rail — the carve axis is a variable */}
                <div class="ta4-axisrail">
                    {AXES.map((x) => (
                        <button
                            type="button"
                            class={`ta4-ax${x.id === axis ? " is-on" : ""}`}
                            key={x.id}
                            onClick={() => (currentAxis.value = x.id)}
                        >
                            <div class="ta4-axg">{x.glyph}</div>
                            <div class="ta4-axn">{x.name}</div>
                            <div class="ta4-axd">{x.desc}</div>
                        </button>
                    ))}
                </div>
                <p class="ta4-register">{A.register}.</p>

                {/* the 300-cap spine */}
                <div class="ta4-spine">
                    <div class="ta4-allocbar">
                        {alloc.perTier.filter((p) => p.count > 0).map((p) => (
                            <div class="ta4-aseg" key={p.tier} style={`flex:${p.count};background:${TIER_HEX[p.tier]}`}>{p.count}</div>
                        ))}
                        {alloc.remaining > 0 ? (
                            <div class="ta4-aseg is-free" style={`flex:${Math.max(alloc.remaining, 8)}`}>{alloc.remaining} {t("open")}</div>
                        ) : null}
                    </div>
                    <div class="ta4-ascale">
                        {alloc.perTier.map((p) => (
                            <span key={p.tier}>
                                <span class="ta4-dot" style={`background:${TIER_HEX[p.tier]}`} />
                                {TIER_LABELS[p.tier]} <i>{p.count}/{TIER_DEFAULTS[p.tier]}</i>
                                {p.delta > 0 ? <i class="ta4-over"> +{p.delta} {t("over")}</i> : null}
                            </span>
                        ))}
                    </div>
                </div>

                {/* the field read */}
                <div class="ta4-fieldread">
                    <span class={`ta4-band is-${read.band}`}>{read.bandLabel}</span>
                    <span class="ta4-rk">{read.mainRisk}</span>
                    <span class="ta4-mv"><b>{t("Next")}</b> {read.operatorMove}</span>
                </div>

                {/* carve a division */}
                <div class={`ta4-carve${carveOpen.value ? " is-open" : ""}`}>
                    <button type="button" class="ta4-carvehead" onClick={() => (carveOpen.value = !carveOpen.value)}>
                        <span class="ta4-carvetitle">
                            {t("Carve a")} {A.id === "blend" ? t("blended") : A.name.toLowerCase()} {t("division")}
                        </span>
                        <span class="ta4-carvesub">
                            {t("Name it, set a tier, say why you", { class: "body" })}
                            {A.whyNowRequired ? <> {t("and")} <b>{t("why now")}</b></> : null}.
                        </span>
                        <span class="ta4-carvebtn">{carveOpen.value ? t("Close") : t("+ Carve division")}</span>
                    </button>
                    {carveOpen.value ? (
                        <div class="ta4-fgrid">
                            <label class="ta4-fld">
                                <span>{A.carveField}</span>
                                <input value={d.title} placeholder={A.placeholder}
                                    onInput={(e) => patchThesisDraft({ title: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="ta4-fld">
                                <span>{t("Coverage tier")}</span>
                                <select value={d.tier} onChange={(e) => patchThesisDraft({ tier: (e.currentTarget as HTMLSelectElement).value as TierId })}>
                                    {TIER_IDS.map((tid) => (
                                        <option value={tid} key={tid}>{TIER_LABELS[tid]}</option>
                                    ))}
                                </select>
                            </label>
                            <label class="ta4-fld ta4-fld--wide">
                                <span>{t("Why you — why you're the right team", { class: "body" })} <i class="ta4-req">{t("required")}</i></span>
                                <input value={d.whyUs} placeholder={t("What makes you the team that wins this group?", { class: "body" })}
                                    onInput={(e) => patchThesisDraft({ whyUs: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="ta4-fld ta4-fld--wide">
                                <span>
                                    {t("Why now — what pressure is live?", { class: "body" })}{" "}
                                    {A.whyNowRequired ? <i class="ta4-req">{t("required")}</i> : <i class="ta4-opt">{t("optional")}</i>}
                                </span>
                                <input value={d.pressure} placeholder={A.whyNowRequired ? t("What is forcing this group to move right now?", { class: "body" }) : t("If there's a live reason they're moving, name it.", { class: "body" })}
                                    onInput={(e) => patchThesisDraft({ pressure: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <label class="ta4-fld">
                                <span>{t("The cut (detail)")}</span>
                                <input value={d.segment} placeholder={A.placeholder}
                                    onInput={(e) => patchThesisDraft({ segment: (e.currentTarget as HTMLInputElement).value })} />
                            </label>
                            <div class="ta4-fld ta4-fld--btn">
                                <button
                                    type="button"
                                    class="ta4-save"
                                    disabled={!d.title.trim() || !d.whyUs.trim() || (A.whyNowRequired && !d.pressure.trim())}
                                    onClick={carve}
                                >
                                    {t("Carve it")}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* the divisions on this axis */}
                {axisFocuses.length === 0 ? (
                    <div class="ta4-empty">
                        <h3>{t("Carve your first division.")}</h3>
                        <p>{t("Nothing on this axis yet — most teams start rough. Name one group of buyers worth covering; the 300-cap and the tiers do the rest.", { class: "body" })}</p>
                    </div>
                ) : (
                    <div class="ta4-divs">
                        {axisFocuses.map((f) => {
                            const acctCount = countByThesis[f.id] ?? 0;
                            const appr = apprByThesis[f.id] ?? [];
                            return (
                                <div class="ta4-div" key={f.id} style={`--tc:${TIER_HEX[f.tier]}`}>
                                    <div class="ta4-dtop">
                                        <div class="ta4-dname">{axis === "trigger" ? "⚡ " : ""}{f.title}</div>
                                        <span class="ta4-tierchip" style={`background:${TIER_HEX[f.tier]}`}>{TIER_LABELS[f.tier]}</span>
                                    </div>
                                    {f.segment ? <div class="ta4-dsub">{f.segment}</div> : null}
                                    <div class="ta4-cnt"><b>{acctCount}</b> {t("accounts")}{appr[0] ? <span class="ta4-appr"> · ▸ {appr[0].name}</span> : null}</div>
                                    {f.whyUs ? (
                                        <dl class="ta4-charter"><dt>{t("Why you")}</dt><dd>{f.whyUs}</dd></dl>
                                    ) : (
                                        <dl class="ta4-charter is-miss"><dt>{t("Why you")}</dt><dd>{t("not written yet — every division needs it", { class: "body" })}</dd></dl>
                                    )}
                                    {f.pressure ? (
                                        <div class={`ta4-whynow${axis === "trigger" ? "" : " is-opt"}`}><b>{t("Why now")}</b>{f.pressure}</div>
                                    ) : axis === "trigger" ? (
                                        <div class="ta4-whynow is-miss"><b>{t("Why now")}</b>{t("missing — a trigger division lives on this", { class: "body" })}</div>
                                    ) : null}
                                    <div class="ta4-acts">
                                        <button type="button" class="ta4-mini" onClick={() => (drawerFocusId.value = f.id)}>{t("Open accounts")}</button>
                                        <a class="ta4-mini" href="/sourcing-workbench/?returnTo=%2Fterritory-architect%2F&returnLabel=Territory&fromMode=room&fromSurface=territory-architect">{t("Fill from Prospecting")}</a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* approaches ledger */}
                {approaches.value.length > 0 ? (
                    <div class="ta4-appro">
                        <p class="ta4-secl">{t("Approaches — how each division gets opened", { class: "body" })}</p>
                        {approaches.value.slice(0, 6).map((a) => (
                            <div class="ta4-lrow" key={a.id}><span class="ta4-a">{a.name}</span><span class="ta4-u">{a.trigger}</span></div>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* account drawer — disposition / retier */}
            {drawerFocus ? (
                <>
                    <div class="ta4-scrim" onClick={() => (drawerFocusId.value = null)} />
                    <div class="ta4-drawer">
                        <div class="ta4-adh">
                            <div>
                                <div class="ta4-adt">{drawerFocus.title}</div>
                                <div class="ta4-adm">{t("set disposition or retier — accounts stay tagged to this division", { class: "body" })}</div>
                            </div>
                            <button type="button" class="ta4-x" onClick={() => (drawerFocusId.value = null)}>×</button>
                        </div>
                        <div class="ta4-adbody">
                            {drawerAccounts.length === 0 ? (
                                <p class="ta4-adempty">{t("No accounts tagged to this division yet — fill from Prospecting.", { class: "body" })}</p>
                            ) : (
                                drawerAccounts.map((a) => (
                                    <div class="ta4-arow" key={a.id}>
                                        <div class="ta4-anm">{a.name}</div>
                                        <select value={a.disposition} onChange={(e) => setAccountDisposition(a.id, (e.currentTarget as HTMLSelectElement).value as DispositionState)}>
                                            {DISPOSITIONS.map((dd) => <option value={dd} key={dd}>{DISPOSITION_LABELS[dd]}</option>)}
                                        </select>
                                        <select value={a.tier} onChange={(e) => retierAccount(a.id, (e.currentTarget as HTMLSelectElement).value as TierId)}>
                                            {TIER_IDS.map((tid) => <option value={tid} key={tid}>{TIER_LABELS[tid]}</option>)}
                                        </select>
                                    </div>
                                ))
                            )}
                            <p class="ta4-adnote">{t("Retier here and the 300-cap above re-reads. The division tag is how the account flows to Prospecting and Signal Console.", { class: "body" })}</p>
                        </div>
                    </div>
                </>
            ) : null}
            <GroundLine />
        </div>
    );
}
