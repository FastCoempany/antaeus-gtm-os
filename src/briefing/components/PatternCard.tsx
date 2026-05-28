import type { JSX } from "preact";
import type { BriefingPattern, Trajectory } from "../lib/patterns";
import { ShowYourWorkButton, ShowYourWorkPanel } from "./ShowYourWork";

/**
 * PatternCard — one synthesized read.
 *
 * Layout follows the product preview: serif title carrying the read,
 * the analysis paragraph, the six-question block (what_changed,
 * evidence, why this confidence, why it matters, who needs to know,
 * what next), and the recommended moves with their routed destinations.
 * Bright canon palette; orange reserved for the trajectory chip when a
 * pattern is intensifying.
 */

const SIX_Q: ReadonlyArray<{ key: keyof BriefingPattern["six_questions"]; label: string }> = [
    { key: "what_changed", label: "What changed" },
    { key: "evidence", label: "Evidence" },
    { key: "confidence_rationale", label: "Why this confidence" },
    { key: "why_it_matters", label: "Why it matters" },
    { key: "who_needs_to_know", label: "Who needs to know" },
    { key: "what_next", label: "What next" }
];

function trajectoryClass(t: Trajectory): string {
    if (t === "rising") return "bf-traj bf-traj--rising";
    if (t === "declining") return "bf-traj bf-traj--declining";
    if (t === "stable") return "bf-traj bf-traj--stable";
    return "bf-traj bf-traj--none";
}

function trajectoryLabel(t: Trajectory): string {
    if (t === "rising") return "Rising";
    if (t === "declining") return "Declining";
    if (t === "stable") return "Stable";
    return "New";
}

export function PatternCard({ pattern }: { pattern: BriefingPattern }): JSX.Element {
    const confidencePct = Math.round(pattern.confidence * 100);
    return (
        <article class="bf-pattern">
            <div class="bf-pattern__meta">
                <span class={trajectoryClass(pattern.trajectory)}>
                    {trajectoryLabel(pattern.trajectory)}
                </span>
                <span class="bf-pattern__conf">Confidence {confidencePct}%</span>
                <span class="bf-pattern__evidence">
                    {pattern.evidence_count} item{pattern.evidence_count === 1 ? "" : "s"} ·{" "}
                    {pattern.source_count} source{pattern.source_count === 1 ? "" : "s"}
                </span>
            </div>

            <h2 class="bf-pattern__title">{pattern.title}</h2>
            <p class="bf-pattern__analysis">{pattern.analysis}</p>

            <dl class="bf-pattern__questions">
                {SIX_Q.map(({ key, label }) => {
                    const value = pattern.six_questions[key];
                    if (!value) return null;
                    return (
                        <div class="bf-pattern__qrow" key={key}>
                            <dt class="bf-pattern__qlabel">{label}</dt>
                            <dd class="bf-pattern__qval">{value}</dd>
                        </div>
                    );
                })}
            </dl>

            {pattern.recommended_moves.length > 0 && (
                <div class="bf-pattern__moves">
                    <p class="bf-pattern__moves-label">Recommended moves</p>
                    <ol class="bf-moves">
                        {pattern.recommended_moves.map((m, i) => (
                            <li class="bf-move" key={i}>
                                <p class="bf-move__label">{m.label}</p>
                                {m.rationale && <p class="bf-move__why">{m.rationale}</p>}
                                {m.destination && (
                                    <p class="bf-move__dest">{m.destination}</p>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            <div class="bf-pattern__work">
                <ShowYourWorkButton patternId={pattern.id} />
                <ShowYourWorkPanel patternId={pattern.id} />
            </div>
        </article>
    );
}
