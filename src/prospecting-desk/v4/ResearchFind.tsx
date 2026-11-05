import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { queryCardDraft, patchQueryCardDraft, queryCards, saveQueryCardFromDraft } from "../state";
import { saveQueryCard } from "../lib/cloud-persistence";
import type { ResearchSignal } from "../lib/types";
import { MAX_RESEARCH_NAMES, splitCompanyNames, useSampleResearch } from "../lib/research";
import { detectDemoBook, sampleResearchNames } from "../lib/research-demo";
import {
    addAllFound,
    addFoundCompany,
    addResearchedCompany,
    findBusy,
    findRun,
    isAdded,
    researchBusy,
    researchRun,
    researchText,
    runFind,
    runResearch
} from "./research-state";
import { CONFIDENCE_LABEL, formatDate, linkLabel } from "./research-format";

/**
 * Find stage of Prospecting Desk: Antaeus's own cited web search.
 * Results land in "Just added" (stage: captured) only when the seller
 * adds them; nothing reaches Signal Console without the three checks.
 */

export interface ResearchFindProps {
    readonly focus: string;
    readonly onToast: (msg: string) => void;
    readonly onOpen: (prospectId: string) => void;
}

export function SignalLine({ s }: { readonly s: ResearchSignal }): JSX.Element {
    const when = s.date ? formatDate(s.date) : t("date not given");
    return (
        <div class="pd4-sig">
            <span class="pd4-sigw">{s.what}</span>
            <span class="pd4-sigm">
                {when}
                {" · "}
                {s.sourceUrl ? (
                    <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{linkLabel(s.sourceUrl)} ↗</a>
                ) : (
                    <span>{s.sourceName ?? t("source not linked")} {t("(sample, no link)")}</span>
                )}
            </span>
        </div>
    );
}

export function SourceLinks({ urls }: { readonly urls: ReadonlyArray<string> }): JSX.Element | null {
    if (urls.length === 0) return null;
    return (
        <div class="pd4-srcs">
            <span class="pd4-srck">{t("Sources")}</span>
            {urls.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer">{linkLabel(u)} ↗</a>
            ))}
        </div>
    );
}

function SampleNote(): JSX.Element {
    return (
        <div class="pd4-sample" role="note">
            {t("Sample results — the demo doesn't run a live web search. These companies and facts come from the demo data.", { class: "body" })}
        </div>
    );
}

export function ResearchFind({ focus, onToast, onOpen }: ResearchFindProps): JSX.Element {
    const qd = queryCardDraft.value;
    const run = findRun.value;
    const brief = researchRun.value;
    const busy = findBusy.value;
    const rBusy = researchBusy.value;
    const sampleMode = useSampleResearch();
    const names = splitCompanyNames(researchText.value);

    const search = (): void => {
        void runFind(focus);
    };
    const saveSearch = (): void => {
        const saved = saveQueryCardFromDraft();
        if (saved) {
            void saveQueryCard(saved);
            // Keep the description in the box so the seller can still search it.
            patchQueryCardDraft({ query: saved.query });
            onToast(t("Search saved. Use Check for new matches to run it again later.", { class: "body" }));
        }
    };
    const addOne = (id: string | null, name: string): void => {
        if (id) {
            onToast(`${name} ${t("was added to Just added. Answer the three questions before sending it.", { class: "body" })}`);
            onOpen(id);
        }
    };
    const runCount = run?.result.companies.length ?? 0;
    const unadded = run ? run.result.companies.filter((c) => !isAdded(c.name)).length : 0;
    const fromCard = run?.fromCardId ? queryCards.value.find((c) => c.id === run.fromCardId) ?? null : null;

    return (
        <>
            <div class="pd4-describe">
                <label class="pd4-dl" for="pd4-desc">{t("Describe who you're after")}</label>
                <div class="pd4-drow">
                    <input
                        id="pd4-desc"
                        value={qd.query}
                        placeholder={t("e.g. Series B fintech companies that raised in the last six months and are hiring sales leaders", { class: "body" })}
                        onInput={(e) => patchQueryCardDraft({ query: (e.currentTarget as HTMLInputElement).value })}
                        onKeyDown={(e) => { if (e.key === "Enter" && qd.query.trim()) search(); }}
                    />
                    <button type="button" class="pd4-go" disabled={!qd.query.trim() || busy} onClick={search}>
                        {busy ? t("Searching…") : t("Search the web")}
                    </button>
                    <button type="button" class="pd4-save2" disabled={!qd.query.trim()} onClick={saveSearch}>
                        {t("Save this search")}
                    </button>
                </div>
                <div class="pd4-hint">
                    {sampleMode
                        ? t("In the demo, search returns sample companies from the demo data instead of searching the web.", { class: "body" })
                        : t("Antaeus searches public news, funding announcements, job posts and company pages, and links every company to where it was found. Companies already in your workspace are left out.", { class: "body" })}
                </div>
            </div>

            {busy ? (
                <div class="pd4-busy" role="status">{t("Searching public news, funding announcements, job posts and company pages. This can take up to a minute.", { class: "body" })}</div>
            ) : null}

            {run && !busy ? (
                <div class="pd4-results" aria-live="polite">
                    {!run.result.ok ? (
                        <div class="pd4-err" role="alert">{run.result.error}</div>
                    ) : (
                        <>
                            {run.result.sample ? <SampleNote /> : null}
                            {run.result.budgetNote ? <div class="pd4-note">{run.result.budgetNote}</div> : null}
                            <div class="pd4-rhead">
                                <span class="pd4-rtitle">
                                    {fromCard
                                        ? <>{runCount} {t("new companies")}{run.since ? <> {t("since")} {formatDate(run.since)}</> : null} · <em>{fromCard.query}</em></>
                                        : <>{runCount} {runCount === 1 ? t("company found") : t("companies found")}</>}
                                </span>
                                {unadded > 1 ? (
                                    <button type="button" class="pd4-addall" onClick={() => {
                                        const n = addAllFound();
                                        onToast(`${n} ${t("companies were added to Just added.")}`);
                                    }}>
                                        {t("Add all")} {unadded} {t("to Just added")}
                                    </button>
                                ) : null}
                            </div>
                            {runCount === 0 ? (
                                <div class="pd4-emptyr">
                                    {fromCard
                                        ? t("No new companies matched this search. Everything it found is already in your workspace or Signal Console.", { class: "body" })
                                        : t("No companies with public sources matched this description. Try naming an industry, a company size, or a recent event such as a funding round or a new executive.", { class: "body" })}
                                </div>
                            ) : (
                                run.result.companies.map((c) => {
                                    const added = isAdded(c.name);
                                    return (
                                        <div class="pd4-hit" key={c.name}>
                                            <div class="pd4-hith">
                                                <span class="pd4-hitn">{c.name}</span>
                                                {c.domain ? <span class="pd4-hitd">{c.domain}</span> : null}
                                                <span class={`pd4-conf is-${c.confidence}`}>{CONFIDENCE_LABEL[c.confidence]}</span>
                                                <button type="button" class="pd4-hitadd" disabled={added}
                                                    onClick={() => addOne(addFoundCompany(c)?.id ?? null, c.name)}>
                                                    {added ? t("Added") : t("Add to Just added")}
                                                </button>
                                            </div>
                                            {c.whyFit ? <div class="pd4-hitw">{c.whyFit}</div> : null}
                                            {c.signal ? <SignalLine s={c.signal} /> : <div class="pd4-hitx">{t("No dated buying signal was found with a source.", { class: "body" })}</div>}
                                            {c.whoToTarget ? (
                                                <div class="pd4-hitr"><b>{t("Who to contact first:")}</b> {c.whoToTarget.role}{c.whoToTarget.why ? ` — ${c.whoToTarget.why}` : ""}</div>
                                            ) : null}
                                            {c.openingAngle ? <div class="pd4-hitr"><b>{t("Possible opening:")}</b> {c.openingAngle}</div> : null}
                                            <SourceLinks urls={c.sources} />
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>
            ) : null}

            <div class="pd4-describe pd4-describe--names">
                <label class="pd4-dl" for="pd4-names">{t("Research companies you name")}</label>
                <div class="pd4-drow">
                    <input
                        id="pd4-names"
                        value={researchText.value}
                        placeholder={sampleMode ? `e.g. ${sampleResearchNames(detectDemoBook()).join(", ")}` : t("e.g. Vanta, Drata, Ramp", { class: "body" })}
                        onInput={(e) => (researchText.value = (e.currentTarget as HTMLInputElement).value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && names.length > 0) void runResearch(focus); }}
                    />
                    <button type="button" class="pd4-go" disabled={names.length === 0 || rBusy} onClick={() => void runResearch(focus)}>
                        {rBusy ? t("Researching…") : t("Research")}
                    </button>
                </div>
                <div class="pd4-hint">
                    {names.length > MAX_RESEARCH_NAMES
                        ? t("Research up to five companies at a time.", { class: "body" })
                        : t("Separate names with commas. Each brief comes with sources and suggested answers to the three qualification questions, which you check before using.", { class: "body" })}
                </div>
            </div>

            {rBusy ? <div class="pd4-busy" role="status">{t("Researching each company. This can take up to a minute.", { class: "body" })}</div> : null}

            {brief && !rBusy ? (
                <div class="pd4-results" aria-live="polite">
                    {!brief.ok ? (
                        <div class="pd4-err" role="alert">{brief.error}</div>
                    ) : (
                        <>
                            {brief.sample ? <SampleNote /> : null}
                            {brief.budgetNote ? <div class="pd4-note">{brief.budgetNote}</div> : null}
                            {brief.notFound.length > 0 ? (
                                <div class="pd4-note">
                                    {brief.sample
                                        ? t("The demo only has sample research for companies in the demo data. No sample for:", { class: "body" })
                                        : t("No public sources were found for:", { class: "body" })}{" "}
                                    <b>{brief.notFound.join(", ")}</b>
                                </div>
                            ) : null}
                            {brief.companies.map((c) => {
                                const added = isAdded(c.name);
                                return (
                                    <div class="pd4-hit" key={c.name}>
                                        <div class="pd4-hith">
                                            <span class="pd4-hitn">{c.name}</span>
                                            {c.domain ? <span class="pd4-hitd">{c.domain}</span> : null}
                                            <button type="button" class="pd4-hitadd" disabled={added}
                                                onClick={() => addOne(addResearchedCompany(c)?.id ?? null, c.name)}>
                                                {added ? t("Added") : t("Add to Just added")}
                                            </button>
                                        </div>
                                        {c.whatTheyDo ? <div class="pd4-hitw">{c.whatTheyDo}</div> : null}
                                        {c.signals.length > 0
                                            ? c.signals.map((s, i) => <SignalLine s={s} key={i} />)
                                            : <div class="pd4-hitx">{t("No dated public events were found with a source.", { class: "body" })}</div>}
                                        {c.fitMatches.length > 0 ? <div class="pd4-hitr"><b>{t("What matches:")}</b> {c.fitMatches.join(" ")}</div> : null}
                                        {c.fitUnknowns.length > 0 ? <div class="pd4-hitr"><b>{t("Not confirmed:")}</b> {c.fitUnknowns.join(" ")}</div> : null}
                                        {c.whoToTarget ? <div class="pd4-hitr"><b>{t("Who to contact first:")}</b> {c.whoToTarget.role}{c.whoToTarget.why ? ` — ${c.whoToTarget.why}` : ""}</div> : null}
                                        {c.openingAngle ? <div class="pd4-hitr"><b>{t("Possible opening:")}</b> {c.openingAngle}</div> : null}
                                        <SourceLinks urls={c.sources} />
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            ) : null}

        </>
    );
}
