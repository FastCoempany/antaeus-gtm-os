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
import "./founding-gtm-v4.css";

/**
 * FoundingGtmV4 (canon §4.19) — the open book, wired to production
 * from the settled 2026-07-07 design. A two-pane bound reader: the
 * left plate carries the serif masthead ("If a hire started Monday ·
 * The handoff"), the recessive N-of-7 segment bar, and the seven-part
 * contents with ready/thin/empty dots; the right page renders the open
 * part in full reading serif — the authored prose, a concrete evidence
 * line, and the left-ruled "one thing to notice" callout. Page-through
 * nav; a read-only share as the one move; thin/empty parts shown
 * honestly, never hidden. The seven authoring engines, cross-room
 * reads, section-readiness publisher, ceremony, and share links are
 * the shipped engine unchanged.
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
    partial: t("still thin"),
    empty: t("empty")
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
                {/* the left plate */}
                <aside class="fg4-plate">
                    <div class="fg4-k">{t("If a hire started Monday")}</div>
                    <h1 class="fg4-mast">{t("The handoff")}</h1>
                    <p class="fg4-sub">
                        {t("The motion, written down — what a sharp operator would leave for their replacement.", { class: "body" })}
                        {verdict ? <> {t("Readiness today:")} <b>{verdict}</b>.</> : null}
                    </p>

                    <div class="fg4-seg" title={`${ready} ${t("of")} 7 ${t("parts ready")}`}>
                        {sections.map((s) => (
                            <span class={`fg4-segb ${DOT[s.status]}`} key={s.id} />
                        ))}
                        <span class="fg4-segn">{ready} {t("of")} 7 {t("parts ready")}</span>
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
                        {shareOpen.value ? t("Close sharing") : t("Share with a hire — read-only", { class: "body" })}
                    </button>
                    {shareOpen.value ? <div class="fg4-sharewrap"><SharePanel /></div> : null}
                </aside>

                {/* the right page */}
                <article class="fg4-page">
                    <div class="fg4-ph">
                        <span class="fg4-pk">{t("Part")} {idx + 1} {t("of")} 7</span>
                        <h2 class="fg4-pt">{open.title}</h2>
                        {open.status !== "ready" ? (
                            <span class={`fg4-badge ${DOT[open.status]}`}>
                                {STATUS_WORD[open.status]}
                            </span>
                        ) : null}
                    </div>

                    {open.status === "empty" ? (
                        (() => {
                            // Starts smart: an empty part renders the authored
                            // pattern for teams this size, labeled honestly in
                            // the blue system role. The operator's own record
                            // takes the page over the moment the section has
                            // anything real to say (the branch below).
                            const prior = priorForSection(open.id, readAcv());
                            if (!prior) {
                                return (
                                    <p class="fg4-emptyread">
                                        {t("Nothing here yet — this part writes itself as the work lands in the rooms that feed it.", { class: "body" })}
                                    </p>
                                );
                            }
                            return (
                                <>
                                    <div class="fg4-notice fg4-notice--prior">
                                        <span class="fg4-nk">{t("Not your record yet")}</span>
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
                                    <span class="fg4-evk">{t("On the record")}</span>
                                    {open.evidence.slice(0, 4).map((ev, i) => (
                                        <span class="fg4-evl" key={`${open.id}-e${i}`}>{ev}</span>
                                    ))}
                                </div>
                            ) : null}
                            {open.surprise ? (
                                <div class={`fg4-notice is-${open.surprise.tone}`}>
                                    <span class="fg4-nk">{t("One thing to notice")}</span>
                                    <b>{open.surprise.headline}</b>
                                    <p>{open.surprise.body}</p>
                                </div>
                            ) : null}
                        </>
                    )}

                    <div class="fg4-nav">
                        <button type="button" class="fg4-pg" onClick={() => page(-1)}>‹ {t("back")}</button>
                        <button type="button" class="fg4-pg" onClick={() => page(1)}>{t("next part")} ›</button>
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
        </div>
    );
}
