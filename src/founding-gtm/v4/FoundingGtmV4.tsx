import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { authoredSections, readinessVerdictLabel, ceremonyOpen, ceremonyEvent } from "../state";
import { countReady } from "../lib/sections";
import { SECTION_IDS, type SectionId, type AuthoredSection } from "../lib/types";
import { SharePanel } from "../components/SharePanel";
import { CeremonyOverlay } from "../components/CeremonyOverlay";
import { priorForSection, readAcv } from "../lib/priors";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./founding-gtm-v4.css";

/**
 * Founding GTM — sales handoff documentation generated from the evidence
 * already recorded across the workspace. The reader is organized into
 * seven sections another seller would need to understand and run the
 * process. Internal section ids and persistence stay stable.
 */

const openId = signal<SectionId>(SECTION_IDS[0]!);
const shareOpen = signal(false);

const DOT: Record<AuthoredSection["status"], string> = {
    ready: "is-ready",
    partial: "is-thin",
    empty: "is-empty"
};

const STATUS_WORD: Record<AuthoredSection["status"], string> = {
    ready: t("ready"),
    partial: t("partially complete"),
    empty: t("no evidence yet")
};

export function FoundingGtmV4(): JSX.Element {
    const sections = authoredSections.value;
    const ready = countReady(sections).ready;
    const open = sections.find((s) => s.id === openId.value) ?? sections[0];
    const idx = open ? Math.max(0, SECTION_IDS.indexOf(open.id)) : 0;
    const verdict = readinessVerdictLabel.value;

    function page(delta: number): void {
        const next = SECTION_IDS[(idx + delta + SECTION_IDS.length) % SECTION_IDS.length];
        if (next) openId.value = next;
    }

    if (!open) return <div class="fg4" />;

    return (
        <div class="fg4">
            <div class="fg4-book">
                <aside class="fg4-plate">
                    <div class="fg4-k">{t("Sales handoff")}</div>
                    <h1 class="fg4-mast">{t("Documented sales process")}</h1>
                    <p class="fg4-sub">
                        {t("The information another seller needs to understand and run this sales process without having it re-explained.", { class: "body" })}
                        {verdict ? <> {t("Current readiness:")} <b>{verdict}</b>.</> : null}
                    </p>

                    <div class="fg4-seg" title={`${ready} ${t("of")} 7 ${t("sections ready")}`}>
                        {sections.map((s) => (
                            <span class={`fg4-segb ${DOT[s.status]}`} key={s.id} />
                        ))}
                        <span class="fg4-segn">{ready} {t("of")} 7 {t("sections ready")}</span>
                    </div>

                    <nav class="fg4-toc">
                        {sections.map((s, i) => (
                            <button
                                type="button"
                                class={`fg4-ti${s.id === openId.value ? " is-on" : ""}`}
                                key={s.id}
                                onClick={() => (openId.value = s.id)}
                            >
                                <span class={`fg4-dot ${DOT[s.status]}`} />
                                <span class="fg4-tn">{i + 1} · {s.title}</span>
                            </button>
                        ))}
                    </nav>

                    <button type="button" class="fg4-share" onClick={() => (shareOpen.value = !shareOpen.value)}>
                        {shareOpen.value ? t("Close sharing") : t("Share read-only with a seller", { class: "body" })}
                    </button>
                    {shareOpen.value ? <div class="fg4-sharewrap"><SharePanel /></div> : null}
                </aside>

                <article class="fg4-page">
                    <div class="fg4-ph">
                        <span class="fg4-pk">{t("Section")} {idx + 1} {t("of")} 7</span>
                        <h2 class="fg4-pt">{open.title}</h2>
                        {open.status !== "ready" ? (
                            <span class={`fg4-badge ${DOT[open.status]}`}>
                                {STATUS_WORD[open.status]}
                            </span>
                        ) : null}
                    </div>

                    {open.status === "empty" ? (
                        (() => {
                            const prior = priorForSection(open.id, readAcv());
                            if (!prior) {
                                return (
                                    <p class="fg4-emptyread">
                                        {t("No workspace evidence is available for this section yet. It will update as the relevant sales activity is recorded.", { class: "body" })}
                                    </p>
                                );
                            }
                            return (
                                <>
                                    <div class="fg4-notice fg4-notice--prior">
                                        <span class="fg4-nk">{t("General guidance · replaced when your own evidence is available", { class: "body" })}</span>
                                        <p>{prior.note}</p>
                                    </div>
                                    {prior.body.map((para, i) => (
                                        <p class="fg4-para fg4-para--prior" key={`${open.id}-prior-${i}`}>{para}</p>
                                    ))}
                                </>
                            );
                        })()
                    ) : (
                        <>
                            {open.body.map((para, i) => (
                                <p class="fg4-para" key={`${open.id}-p${i}`}>{para}</p>
                            ))}
                            {open.evidence.length > 0 ? (
                                <div class="fg4-ev">
                                    <span class="fg4-evk">{t("Recorded evidence")}</span>
                                    {open.evidence.slice(0, 4).map((ev, i) => (
                                        <span class="fg4-evl" key={`${open.id}-e${i}`}>{ev}</span>
                                    ))}
                                </div>
                            ) : null}
                            {open.surprise ? (
                                <div class={`fg4-notice is-${open.surprise.tone}`}>
                                    <span class="fg4-nk">{t("Key observation")}</span>
                                    <b>{open.surprise.headline}</b>
                                    <p>{open.surprise.body}</p>
                                </div>
                            ) : null}
                        </>
                    )}

                    <div class="fg4-nav">
                        <button type="button" class="fg4-pg" onClick={() => page(-1)}>‹ {t("back")}</button>
                        <button type="button" class="fg4-pg" onClick={() => page(1)}>{t("next section")} ›</button>
                    </div>
                </article>
            </div>
            {ceremonyOpen.value && ceremonyEvent.value ? (
                <CeremonyOverlay
                    fromLabel={ceremonyEvent.value.fromLabel}
                    toLabel={ceremonyEvent.value.toLabel}
                    sectionsBefore={ceremonyEvent.value.sectionsBefore}
                    sectionsAfter={ceremonyEvent.value.sectionsAfter}
                />
            ) : null}
            <GroundLine />
            <LiveEdge />
        </div>
    );
}
