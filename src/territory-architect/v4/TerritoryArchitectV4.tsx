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
    approachDraft,
    accountDraft,
    patchThesisDraft,
    patchApproachDraft,
    patchAccountDraft,
    saveThesisFromDraft,
    saveApproachFromDraft,
    saveAccountFromDraft,
    setAccountDisposition,
    retierAccount,
    retagAccount
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
import { saveThesis, saveApproach, saveAccount } from "../lib/cloud-persistence";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./territory-architect-v4.css";

/**
 * Territory Architect — define and prioritize territory segments by
 * geography, industry, company size/stage, named accounts, buying signals,
 * or combined criteria. Stable internal CarveAxis/type names remain for
 * compatibility; user-facing language uses standard territory terminology.
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
    {
        id: "geo",
        glyph: "◎",
        name: t("Geography"),
        desc: t("Regions & metros"),
        register: t("Define segments by region or metro where your team can sell effectively", { class: "body" }),
        carveField: t("Region / metro"),
        placeholder: "e.g. West Coast tech hub",
        whyNowRequired: false
    },
    {
        id: "vertical",
        glyph: "▣",
        name: t("Industry"),
        desc: t("Verticals"),
        register: t("Define segments by industry when the buyer, problem, or sales approach differs by vertical", { class: "body" }),
        carveField: t("Industry"),
        placeholder: "e.g. FinTech",
        whyNowRequired: false
    },
    {
        id: "segment",
        glyph: "☰",
        name: t("Company size / stage"),
        desc: t("Size and stage bands"),
        register: t("Define a company-size or stage segment based on where your sales process works best", { class: "body" }),
        carveField: t("Company size / stage band"),
        placeholder: "e.g. Mid-market · 200–999",
        whyNowRequired: false
    },
    {
        id: "named",
        glyph: "◈",
        name: t("Named accounts"),
        desc: t("Selected account lists"),
        register: t("Create a segment for specific accounts your team has already chosen to pursue", { class: "body" }),
        carveField: t("List name"),
        placeholder: "e.g. Strategic 25",
        whyNowRequired: false
    },
    {
        id: "trigger",
        glyph: "⚡",
        name: t("Buying signals"),
        desc: t("Current events and triggers"),
        register: t("Segment by current buying signals and timing", { class: "body" }),
        carveField: t("Buying signal — something you can detect", { class: "body" }),
        placeholder: "e.g. New-CRO transitions",
        whyNowRequired: true
    },
    {
        id: "blend",
        glyph: "⧉",
        name: t("Combined criteria"),
        desc: t("Use more than one criterion"),
        register: t("Combine criteria when one dimension is not specific enough to define the accounts you want", { class: "body" }),
        carveField: t("Primary criteria"),
        placeholder: "e.g. West Coast × FinTech × Series B+",
        whyNowRequired: false
    }
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
    active: t("Active"),
    paused: t("Paused"),
    "closed-won": t("Won"),
    "closed-lost": t("Lost"),
    reroute: t("Reassign")
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

    function persistAccount(id: string): void {
        const updated = accounts.value.find((a) => a.id === id);
        if (updated) void saveAccount(updated);
    }

    function carve(): void {
        patchThesisDraft({ axis });
        const saved = saveThesisFromDraft();
        if (saved) {
            void saveThesis(saved);
            carveOpen.value = false;
        }
    }

    return (
        <div class="ta4">
            <div class="ta4-wrap">
                <div class="ta4-bar">
                    <span class="ta4-bname">{t("Territory Architect")}</span>
                    <span class="ta4-gauge">
                        <b>{alloc.total}</b> / {alloc.ceiling} {t("accounts assigned to a segment")}
                    </span>
                </div>

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

                <div class="ta4-spine">
                    <div class="ta4-allocbar">
                        {alloc.perTier.filter((p) => p.count > 0).map((p) => (
                            <div class="ta4-aseg" key={p.tier} style={`flex:${p.count};background:${TIER_HEX[p.tier]}`}>{p.count}</div>
                        ))}
                        {alloc.remaining > 0 ? (
                            <div class="ta4-aseg is-free" style={`flex:${Math.max(alloc.remaining, 8)}`}>
                                {alloc.remaining} {t("not yet assigned")}
                            </div>
                        ) : null}
                    </div>
                    <div class="ta4-ascale">
                        {alloc.perTier.map((p) => (
                            <span key={p.tier}>
                                <span class="ta4-dot" style={`background:${TIER_HEX[p.tier]}`} />
                                {TIER_LABELS[p.tier]} <i>{p.count}/{TIER_DEFAULTS[p.tier]}</i>
                                {p.delta > 0 ? <i class="ta4-over"> +{p.delta} {t("over target")}</i> : null}
                            </span>
                        ))}
                    </div>
                </div>

                <div class="ta4-fieldread">
                    <span class={`ta4-band is-${read.band}`}>{read.bandLabel}</span>
                    <span class="ta4-rk">{read.mainRisk}</span>
                    <span class="ta4-mv"><b>{t("Next")}</b> {read.operatorMove}</span>
                </div>

                <div class={`ta4-carve${carveOpen.value ? " is-open" : ""}`}>
                    <button type="button" class="ta4-carvehead" onClick={() => (carveOpen.value = !carveOpen.value)}>
                        <span class="ta4-carvetitle">
                            {t("Create")} {A.id === "blend" ? t("combined") : A.name.toLowerCase()} {t("segment")}
                        </span>
                        <span class="ta4-carvesub">
                            {t("Name the segment, assign a priority tier, and record why it fits", { class: "body" })}
                            {A.whyNowRequired ? <> {t("and")} <b>{t("why it matters now")}</b></> : null}.
                        </span>
                        <span class="ta4-carvebtn">{carveOpen.value ? t("Close") : t("+ Create segment")}</span>
                    </button>
                    {carveOpen.value ? (
                        <div class="ta4-fgrid">
                            <label class="ta4-fld">
                                <span>{A.carveField}</span>
                                <input
                                    value={d.title}
                                    placeholder={A.placeholder}
                                    onInput={(e) => patchThesisDraft({ title: (e.currentTarget as HTMLInputElement).value })}
                                />
                            </label>
                            <label class="ta4-fld">
                                <span>{t("Priority tier")}</span>
                                <select value={d.tier} onChange={(e) => patchThesisDraft({ tier: (e.currentTarget as HTMLSelectElement).value as TierId })}>
                                    {TIER_IDS.map((tid) => (
                                        <option value={tid} key={tid}>{TIER_LABELS[tid]}</option>
                                    ))}
                                </select>
                            </label>
                            <label class="ta4-fld ta4-fld--wide">
                                <span>{t("Why this segment fits your team", { class: "body" })} <i class="ta4-req">{t("required")}</i></span>
                                <input
                                    value={d.whyUs}
                                    placeholder={t("What evidence makes this group a good fit for your team?", { class: "body" })}
                                    onInput={(e) => patchThesisDraft({ whyUs: (e.currentTarget as HTMLInputElement).value })}
                                />
                            </label>
                            <label class="ta4-fld ta4-fld--wide">
                                <span>
                                    {t("Why now — what current event or need makes this timely?", { class: "body" })}{" "}
                                    {A.whyNowRequired ? <i class="ta4-req">{t("required")}</i> : <i class="ta4-opt">{t("optional")}</i>}
                                </span>
                                <input
                                    value={d.pressure}
                                    placeholder={A.whyNowRequired
                                        ? t("Name the current event, change, or need that makes this segment timely.", { class: "body" })
                                        : t("If there is a current reason to prioritize this segment, record it.", { class: "body" })}
                                    onInput={(e) => patchThesisDraft({ pressure: (e.currentTarget as HTMLInputElement).value })}
                                />
                            </label>
                            <label class="ta4-fld">
                                <span>{t("Segment detail")}</span>
                                <input
                                    value={d.segment}
                                    placeholder={A.placeholder}
                                    onInput={(e) => patchThesisDraft({ segment: (e.currentTarget as HTMLInputElement).value })}
                                />
                            </label>
                            <div class="ta4-fld ta4-fld--btn">
                                <button
                                    type="button"
                                    class="ta4-save"
                                    disabled={!d.title.trim() || !d.whyUs.trim() || (A.whyNowRequired && !d.pressure.trim())}
                                    onClick={carve}
                                >
                                    {t("Create segment")}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {axisFocuses.length === 0 ? (
                    <div class="ta4-empty">
                        <h3>{t("No segments yet.")}</h3>
                        <p>{t("Create one group of accounts you want to cover and assign it a priority tier.", { class: "body" })}</p>
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
                                    <div class="ta4-cnt">
                                        <b>{acctCount}</b> {t("accounts")}
                                        {appr[0] ? <span class="ta4-appr"> · ▸ {appr[0].name}</span> : null}
                                    </div>
                                    {f.whyUs ? (
                                        <dl class="ta4-charter"><dt>{t("Why this segment fits")}</dt><dd>{f.whyUs}</dd></dl>
                                    ) : (
                                        <dl class="ta4-charter is-miss"><dt>{t("Why this segment fits")}</dt><dd>{t("not recorded yet", { class: "body" })}</dd></dl>
                                    )}
                                    {f.pressure ? (
                                        <div class={`ta4-whynow${axis === "trigger" ? "" : " is-opt"}`}><b>{t("Why now")}</b>{f.pressure}</div>
                                    ) : axis === "trigger" ? (
                                        <div class="ta4-whynow is-miss"><b>{t("Why now")}</b>{t("required for a signal-based segment", { class: "body" })}</div>
                                    ) : null}
                                    <div class="ta4-acts">
                                        <button type="button" class="ta4-mini" onClick={() => (drawerFocusId.value = f.id)}>{t("Open accounts")}</button>
                                        <a class="ta4-mini" href="/prospecting-desk/?returnTo=%2Fterritory-architect%2F&returnLabel=Territory&fromMode=room&fromSurface=territory-architect">{t("Add from Prospecting")}</a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {allFocuses.length > 0 ? (
                    <div class="ta4-appro">
                        <p class="ta4-secl">{t("Sales approaches by segment", { class: "body" })}</p>
                        {approaches.value.slice(0, 6).map((ap) => (
                            <div class="ta4-lrow" key={ap.id}><span class="ta4-a">{ap.name}</span><span class="ta4-u">{ap.trigger}</span></div>
                        ))}
                        <div class="ta4-aprow">
                            <input
                                class="ta4-apin"
                                value={approachDraft.value.name}
                                placeholder={t("e.g. Reference the funding announcement and ask about the hiring plan", { class: "body" })}
                                onInput={(e) => patchApproachDraft({ name: (e.currentTarget as HTMLInputElement).value })}
                            />
                            <select
                                class="ta4-apsel"
                                value={approachDraft.value.focusId}
                                onChange={(e) => patchApproachDraft({ focusId: (e.currentTarget as HTMLSelectElement).value })}
                            >
                                <option value="">{t("For which segment?")}</option>
                                {allFocuses.map((f) => (
                                    <option value={f.id} key={f.id}>{f.title}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                class="ta4-mini"
                                disabled={!approachDraft.value.name.trim() || !approachDraft.value.focusId}
                                onClick={() => { const a = saveApproachFromDraft(); if (a) void saveApproach(a); }}
                            >
                                {t("Add approach")}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {drawerFocus ? (
                <>
                    <div class="ta4-scrim" onClick={() => (drawerFocusId.value = null)} />
                    <div class="ta4-drawer">
                        <div class="ta4-adh">
                            <div>
                                <div class="ta4-adt">{drawerFocus.title}</div>
                                <div class="ta4-adm">{t("Update account status, priority tier, or segment assignment", { class: "body" })}</div>
                            </div>
                            <button type="button" class="ta4-x" onClick={() => (drawerFocusId.value = null)}>×</button>
                        </div>
                        <div class="ta4-adbody">
                            {drawerAccounts.length === 0 ? (
                                <p class="ta4-adempty">{t("No accounts are assigned to this segment yet. Add one below or send accounts from Prospecting Desk.", { class: "body" })}</p>
                            ) : (
                                drawerAccounts.map((a) => (
                                    <div class="ta4-arow" key={a.id}>
                                        <div class="ta4-anm">{a.name}</div>
                                        <select value={a.disposition} onChange={(e) => { setAccountDisposition(a.id, (e.currentTarget as HTMLSelectElement).value as DispositionState); persistAccount(a.id); }}>
                                            {DISPOSITIONS.map((dd) => <option value={dd} key={dd}>{DISPOSITION_LABELS[dd]}</option>)}
                                        </select>
                                        <select value={a.tier} onChange={(e) => { retierAccount(a.id, (e.currentTarget as HTMLSelectElement).value as TierId); persistAccount(a.id); }}>
                                            {TIER_IDS.map((tid) => <option value={tid} key={tid}>{TIER_LABELS[tid]}</option>)}
                                        </select>
                                        <select value={a.focusId} title={t("Move to another segment")} onChange={(e) => { retagAccount(a.id, (e.currentTarget as HTMLSelectElement).value); persistAccount(a.id); }}>
                                            {allFocuses.map((f) => <option value={f.id} key={f.id}>{f.title}</option>)}
                                        </select>
                                    </div>
                                ))
                            )}
                            <div class="ta4-adadd">
                                <input
                                    value={accountDraft.value.name}
                                    placeholder={t("Add an account to this segment", { class: "body" })}
                                    onInput={(e) =>
                                        patchAccountDraft({
                                            name: (e.currentTarget as HTMLInputElement).value,
                                            focusId: drawerFocus.id,
                                            tier: drawerFocus.tier
                                        })
                                    }
                                    onKeyDown={(e) => { if (e.key === "Enter") { const a = saveAccountFromDraft(); if (a) void saveAccount(a); } }}
                                />
                                <button
                                    type="button"
                                    class="ta4-mini"
                                    disabled={!accountDraft.value.name.trim() || alloc.total >= alloc.ceiling}
                                    onClick={() => { const a = saveAccountFromDraft(); if (a) void saveAccount(a); }}
                                >
                                    {alloc.total >= alloc.ceiling ? t("At account limit") : t("Add")}
                                </button>
                            </div>
                            <p class="ta4-adnote">{t("Changes to the account's priority tier update the allocation above. Segment assignments are also used by Prospecting Desk and Signal Console.", { class: "body" })}</p>
                        </div>
                    </div>
                </>
            ) : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
