import type { JSX } from "preact";
import { contrarianLoaded, contrarianPatterns } from "../state";
import type { BriefingPattern, TargetPositionKind } from "../lib/patterns";
import { MoveRow } from "./PatternCard";
import { ShowYourWorkButton, ShowYourWorkPanel } from "./ShowYourWork";

/**
 * ContrarianRail (B.5b) — the "pushback" surface.
 *
 * Renders the contrarian Patterns the pipeline produced this run.
 * Most weeks this is invisible (the LLM is instructed to refuse rather
 * than fabricate challenges); only when the gate accepts a real
 * evidence-backed contradiction does a card show up here.
 *
 * Visually distinct from the standard Patterns — cooler register, no
 * orange accent, navy-on-cream cards with an "amber" left rule
 * signaling "the system is challenging you, not serving you." The
 * target_position appears as the kicker so the operator immediately
 * sees what's being pushed back on.
 *
 * Voice header: "Where the data disagrees" — not "Contrarian patterns".
 * Plain. A peer would say it that way.
 */

const SIX_Q: ReadonlyArray<{ key: keyof BriefingPattern["six_questions"]; label: string }> = [
    { key: "what_changed", label: "What changed" },
    { key: "evidence", label: "Evidence" },
    { key: "confidence_rationale", label: "Why this confidence" },
    { key: "why_it_matters", label: "Why it matters" },
    { key: "who_needs_to_know", label: "Who needs to know" },
    { key: "what_next", label: "What next" }
];

function kindLabel(kind: TargetPositionKind): string {
    if (kind === "watchlist") return "Watchlist";
    if (kind === "value_prop") return "Value prop";
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
                <span class="bf-contra__chip">Challenge</span>
                {tp && (
                    <span class="bf-contra__target">
                        targets {kindLabel(tp.kind)} · "{tp.quoted_text}"
                    </span>
                )}
                <span class="bf-contra__conf">Confidence {confidencePct}%</span>
                <span class="bf-contra__evidence">
                    {pattern.evidence_count} item{pattern.evidence_count === 1 ? "" : "s"}
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
                    <p class="bf-contra__moves-label">If you act on this</p>
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
        <section class="bf-contra-rail" aria-label="Where the data disagrees">
            <div class="bf-contra-rail__head">
                <p class="bf-contra-rail__kicker">Where the data disagrees</p>
                <p class="bf-contra-rail__sub">
                    The system found evidence that contradicts a position you've stated.
                    Read it the way you'd read pushback from a sharp peer — not a verdict,
                    but a check.
                </p>
            </div>
            {list.map((p) => (
                <ContrarianCard pattern={p} key={p.id} />
            ))}
        </section>
    );
}
