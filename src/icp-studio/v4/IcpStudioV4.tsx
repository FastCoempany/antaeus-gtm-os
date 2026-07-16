import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    draft,
    patchDraft,
    effectiveIndustry,
    effectiveBuyer,
    saveDraftAsIcp,
    totalWorked
} from "../state";
import { buildIcpQuality } from "../lib/quality";
import { saveIcp } from "../lib/cloud-persistence";
import { buildStatement, buildFocus, buildBuyingGroup } from "../lib/builders";
import { scoreAccountAgainstIcp } from "../../signal-console/lib/icp-match";
import type { Account } from "../../signal-console/lib/types";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./icp-studio-v4.css";

/**
 * IcpStudioV4 (canon §4.4) — Combo · 1 Flow, wired to production. The
 * ICP is the central authored surface being SHARPENED, not a form
 * output: the serif statement leads, the quality tier ladder + the 8
 * checks say what would tighten it, the BITE shows how the definition
 * scores the real watched accounts (kept-out is the point), and the
 * builder fields sharpen the pieces. The quality engine, statement/
 * focus/buying-group builders, persistence, and the icp-match scorer
 * are reused unchanged.
 */

const TIER_LADDER: ReadonlyArray<{ tier: string; label: string }> = [
    { tier: "broad", label: t("Too broad") },
    { tier: "forming", label: t("Forming") },
    { tier: "workable", label: t("Workable") },
    { tier: "sharp", label: t("Sharp") }
];

function readAccounts(): ReadonlyArray<Account> {
    try {
        const raw = localStorage.getItem("gtmos_sc_v4");
        if (!raw) return [];
        const parsed = JSON.parse(raw) as { accounts?: ReadonlyArray<Account> };
        return Array.isArray(parsed.accounts) ? parsed.accounts : [];
    } catch {
        return [];
    }
}

export function IcpStudioV4(): JSX.Element {
    const d = draft.value;
    const industry = effectiveIndustry.value;
    const buyer = effectiveBuyer.value;
    const quality = buildIcpQuality({
        role: d.role,
        industry,
        size: d.size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow,
        activeAccounts: totalWorked.value
    });
    const statement = buildStatement({
        industry,
        size: d.size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow
    });
    const focus = buildFocus(d.role, totalWorked.value);
    // buildStatement returns a placeholder text when pieces are missing —
    // completeness is all 7 pieces present, not text truthiness.
    const complete = [industry, d.size, d.geo, buyer, d.pain, d.trigger, d.proofWindow]
        .every((v) => typeof v === "string" && v.trim().length > 0);
    const group = buildBuyingGroup(buyer);

    // The bite — score the real watched accounts against this definition.
    const accounts = readAccounts();
    const icpLike = { industry, geo: d.geo, size: d.size };
    const fit: Account[] = [];
    const loose: Account[] = [];
    const off: Account[] = [];
    for (const a of accounts) {
        const m = scoreAccountAgainstIcp(a, icpLike);
        if (!m) continue;
        if (m.band === "fit") fit.push(a);
        else if (m.band === "loose") loose.push(a);
        else off.push(a);
    }
    const scoredTotal = fit.length + loose.length + off.length;

    const tierIdx = TIER_LADDER.findIndex((x) => x.tier === quality.tier);
    const passed = quality.checks.filter((c) => c.tone === "good").length;

    function save(): void {
        // Cloud write too — a local-only save is clobbered when cloud
        // replaces local on boot.
        const icp = saveDraftAsIcp();
        if (icp) void saveIcp(icp);
    }

    return (
        <div class="icp4">
            <div class="icp4-wrap">
                <div class="icp4-bar">
                    <span class="icp4-bname">{t("ICP Studio")}</span>
                    <span class={`icp4-qpill is-${quality.tier}`}>{quality.label}</span>
                </div>
                <p class="icp4-eyebrow">
                    {t("Who you sell to — the one definition every room filters against", { class: "body" })}
                </p>

                {complete ? (
                    <h1 class="icp4-stmt">{statement.text}</h1>
                ) : (
                    <h1 class="icp4-stmt icp4-stmt--thin">
                        {t("Fill the pieces below and the definition assembles here — one sentence every room can hunt against.", { class: "body" })}
                    </h1>
                )}
                <p class="icp4-sharpen">{quality.summary}</p>

                <div class="icp4-ladder">
                    {TIER_LADDER.map((x, i) => (
                        <span
                            class={`icp4-tier${i === tierIdx ? " is-on" : ""}${i === TIER_LADDER.length - 1 && i !== tierIdx ? " is-goal" : ""}`}
                            key={x.tier}
                        >
                            {x.label}
                        </span>
                    ))}
                </div>

                <p class="icp4-secl">{t("What makes it sharp")} — {passed} {t("of")} {quality.checks.length}</p>
                <div class="icp4-checks">
                    {quality.checks.map((c) => (
                        <div class={`icp4-chk is-${c.tone === "good" ? "ok" : c.tone === "warn" ? "warn" : "no"}`} key={c.text}>
                            <span class="icp4-m">{c.tone === "good" ? "✓" : c.tone === "warn" ? "!" : "✕"}</span>
                            <span>{c.text}</span>
                        </div>
                    ))}
                </div>

                {scoredTotal > 0 ? (
                    <>
                        <p class="icp4-secl icp4-secl--sp">
                            {t("Its bite — how your")} {scoredTotal} {t("watched accounts fit")}
                        </p>
                        <div class="icp4-seg">
                            {fit.length > 0 ? <span class="icp4-s" style={`flex:${fit.length}`}>{fit.length}</span> : null}
                            {loose.length > 0 ? <span class="icp4-l" style={`flex:${loose.length}`}>{loose.length}</span> : null}
                            {off.length > 0 ? <span class="icp4-r" style={`flex:${off.length}`}>{off.length} {t("kept out")}</span> : null}
                        </div>
                        <div class="icp4-seglab">
                            <span><b>{fit.length}</b> {t("sharp — act here now")}</span>
                            <span><b>{loose.length}</b> {t("loose — watch")}</span>
                            <span><b>{off.length}</b> {t("not your buyer")}</span>
                        </div>
                        <div class="icp4-egrid">
                            <div class="icp4-ecol is-sharp">
                                <p class="icp4-ecoll">{t("Sharp matches — where it bites")}</p>
                                {fit.slice(0, 3).map((a) => (
                                    <div class="icp4-erow" key={a.id}><span class="icp4-dot" /><span><b>{a.name}</b>{a.industry ? ` — ${a.industry}` : ""}</span></div>
                                ))}
                                {fit.length > 3 ? <div class="icp4-erow"><span class="icp4-dot" /><span>+ {fit.length - 3} {t("more scored sharp across the workspace")}</span></div> : null}
                                {fit.length === 0 ? <div class="icp4-erow"><span class="icp4-dot" /><span>{t("None yet — tighten the pieces or add accounts.", { class: "body" })}</span></div> : null}
                            </div>
                            <div class="icp4-ecol is-rej">
                                <p class="icp4-ecoll">{t("Kept out — and why (good)")}</p>
                                {off.slice(0, 2).map((a) => (
                                    <div class="icp4-erow" key={a.id}><span class="icp4-dot" /><span><b>{a.name}</b>{a.industry ? ` — ${a.industry}` : ""}</span></div>
                                ))}
                                {off.length > 2 ? <div class="icp4-erow"><span class="icp4-dot" /><span>+ {off.length - 2} {t("more the definition keeps you out of — that's the point.", { class: "body" })}</span></div> : null}
                                {off.length === 0 ? <div class="icp4-erow"><span class="icp4-dot" /><span>{t("Nothing rejected yet — a definition that keeps nothing out isn't sharp.", { class: "body" })}</span></div> : null}
                            </div>
                        </div>
                    </>
                ) : null}

                <div class="icp4-builder">
                    <p class="icp4-secl">{t("Sharpen the pieces")}</p>
                    <div class="icp4-role">
                        <span class="icp4-rolel">{t("Who's running the motion?")}</span>
                        <button
                            type="button"
                            class={`icp4-roleb${d.role === "founder" ? " is-on" : ""}`}
                            onClick={() => patchDraft({ role: "founder" })}
                        >
                            {t("The founder")}
                        </button>
                        <button
                            type="button"
                            class={`icp4-roleb${d.role === "firstae" ? " is-on" : ""}`}
                            onClick={() => patchDraft({ role: "firstae" })}
                        >
                            {t("The first seller hired", { class: "body" })}
                        </button>
                    </div>
                    <div class="icp4-bgrid">
                        <label class={`icp4-fld${buyer ? "" : " is-miss"}`}>
                            <span>{t("Who owns the problem (role)")}</span>
                            <input value={d.buyerCustom || d.buyer} placeholder={t("Head of RevOps", { class: "body" })}
                                onInput={(e) => patchDraft({ buyer: "custom", buyerCustom: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                        <label class={`icp4-fld icp4-fld--wide${industry ? "" : " is-miss"}`}>
                            <span>{t("Their world (industry)")}</span>
                            <input value={d.industryCustom || d.industry} placeholder={t("B2B SaaS", { class: "body" })}
                                onInput={(e) => patchDraft({ industry: "custom", industryCustom: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                        <label class={`icp4-fld${d.size ? "" : " is-miss"}`}>
                            <span>{t("Company size")}</span>
                            <input value={d.size} placeholder="200–800"
                                onInput={(e) => patchDraft({ size: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                        <label class={`icp4-fld${d.geo ? "" : " is-miss"}`}>
                            <span>{t("Where (geography)")}</span>
                            <input value={d.geo} placeholder={t("North America", { class: "body" })}
                                onInput={(e) => patchDraft({ geo: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                        <label class={`icp4-fld icp4-fld--wide${d.pain ? "" : " is-miss"}`}>
                            <span>{t("The pain — one specific thing")}</span>
                            <input value={d.pain} placeholder={t("Can't trust their forecast", { class: "body" })}
                                onInput={(e) => patchDraft({ pain: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                        <label class={`icp4-fld${d.trigger ? "" : " is-miss"}`}>
                            <span>{t("The trigger — what makes it now", { class: "body" })}</span>
                            <input value={d.trigger} placeholder={t("A missed quarter, a new CRO", { class: "body" })}
                                onInput={(e) => patchDraft({ trigger: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                        <label class={`icp4-fld${d.proofWindow ? "" : " is-miss"}`}>
                            <span>{t("Time to show the value")}</span>
                            <input value={d.proofWindow} placeholder={t("One quarter", { class: "body" })}
                                onInput={(e) => patchDraft({ proofWindow: (e.currentTarget as HTMLInputElement).value })} />
                        </label>
                    </div>
                    {group.length > 0 ? (
                        <p class="icp4-bg">
                            {t("Buying group minimum:")} <b>{group.join(" + ")}</b> — {t("anything thinner isn't a real deal.", { class: "body" })}
                        </p>
                    ) : null}
                </div>

                {focus ? (
                    <div class="icp4-focus">
                        <span class="icp4-fl">{t("Focus recommendation")}</span>
                        {focus}
                    </div>
                ) : null}

                <div class="icp4-foot">
                    <p class="icp4-flows">
                        {t("This definition scores every account in", { class: "body" })} <b>{t("Territory · Prospecting · Signal Console · Outbound · Discovery", { class: "body" })}</b>, {t("and feeds Readiness + the Handoff Kit.", { class: "body" })}
                    </p>
                    <button type="button" class="icp4-save" onClick={save} disabled={!complete}>
                        {t("Save this ICP")}
                    </button>
                </div>
            </div>
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
