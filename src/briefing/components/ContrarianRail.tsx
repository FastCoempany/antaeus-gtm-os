import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { contrarianLoaded, contrarianPatterns } from "../state";
import type { BriefingPattern, TargetPositionKind } from "../lib/patterns";
import { MoveRow } from "./PatternCard";
import { ShowYourWorkButton, ShowYourWorkPanel } from "./ShowYourWork";

/**
 * Evidence-conflict surface. A row appears only when the Briefing
 * pipeline has evidence that does not support an assumption recorded in
 * the workspace. The analysis is presented as evidence and assessment,
 * not as the data or system having agency.
 */

const SIX_Q: ReadonlyArray<{ key: keyof BriefingPattern["six_questions"]; label: string }> = [
    { key: "what_changed", label: "What changed" },
    { key: "evidence", label: "Evidence" },
    { key: "confidence_rationale", label: "Why this confidence" },
    { key: "why_it_matters", label: "Why it matters" },
    { key: "who_needs_to_know", label: "Who needs to know" },
    { key: "what_next", label: "Recommended action" }
];

function kindLabel(kind: TargetPositionKind): string {
    if (kind === "watchlist") return "Watchlist";
    if (kind === "value_prop") return "Value proposition";
    if (kind === "icp") return "ICP";
    if (kind === "competitor_set") return "Competitor set";
    return kind;
}

function ContrarianCard({ pattern }: { pattern: BriefingPattern }): JSX.Element {
    const tp = pattern.target_position;
    const confidencePct = Math.round(pattern.confidence * 100);
    return (
        <article class="bf-contra">
            <div class="bf-contra__meta">
                <span class="bf-contra__chip">{t("Conflicting evidence")}</span>
                {tp && (
                    <span class="bf-contra__target">
                        {t("Recorded assumption:")} {kindLabel(tp.kind)} · "{tp.quoted_text}"
                    </span>
                )}
                <span class="bf-contra__conf">{t("Confidence")} {confidencePct}%</span>
                <span class="bf-contra__evidence">
                    {pattern.evidence_count} {t("evidence item", { class: "body" })}{pattern.evidence_count === 1 ? "" : "s"}
                </span>
            </div>

            <h3 class="bf-contra__title">{pattern.title}</h3>
            <p class="bf-contra__analysis">{pattern.analysis}</p>

            <dl class="bf-contra__questions">
                {SIX_Q.map(({ key, label }) => {
                    const value = pattern.six_questions[key];
                    if (!value) return null;
                    return (
                        <div class="bf-contra__qrow" key={key}>
                            <dt class="bf-contra__qlabel">{label}</dt>
                            <dd class="bf-contra__qval">{value}</dd>
                        </div>
                    );
                })}
            </dl>

            {pattern.recommended_moves.length > 0 && (
                <div class="bf-contra__moves">
                    <p class="bf-contra__moves-label">{t("Recommended actions")}</p>
                    <ol class="bf-moves">
                        {pattern.recommended_moves.map((m, i) => (
                            <MoveRow
                                move={m}
                                patternId={pattern.id}
                                fromSurface="contrarian"
                                key={i}
                            />
                        ))}
                    </ol>
                </div>
            )}

            <div class="bf-contra__work">
                <ShowYourWorkButton patternId={pattern.id} />
                <ShowYourWorkPanel patternId={pattern.id} />
            </div>
        </article>
    );
}

export function ContrarianRail(): JSX.Element | null {
    if (!contrarianLoaded.value) return null;
    const list = contrarianPatterns.value;
    if (list.length === 0) return null;

    return (
        <section class="bf-contra-rail" aria-label={t("Evidence that conflicts with an assumption")}>
            <div class="bf-contra-rail__head">
                <p class="bf-contra-rail__kicker">{t("Evidence that conflicts with an assumption")}</p>
                <p class="bf-contra-rail__sub">
                    {t("Current evidence does not fully support a position recorded in the workspace. Review the evidence and decide whether the assumption should change.", { class: "body" })}
                </p>
            </div>
            {list.map((p) => (
                <ContrarianCard pattern={p} key={p.id} />
            ))}
        </section>
    );
}
