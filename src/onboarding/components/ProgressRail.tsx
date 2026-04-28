import type { JSX } from "preact";
import { progress, stepIndex } from "../state";
import { STEP_ORDER, type StepId } from "../lib/types";

const STEP_LABELS: Readonly<Record<StepId, string>> = {
    thesis: "Thesis",
    company: "Company",
    role: "Role",
    category: "Category",
    icp: "ICP",
    account: "First account",
    quota: "Quota",
    complete: "Done"
};

/**
 * ProgressRail — kicker + bar + step tags. Per Part III §5
 * (Endowed Progress Effect) the bar starts at 1/7 = ~14% to
 * make the room feel underway from arrival.
 */
export function ProgressRail(): JSX.Element {
    const p = progress.value;
    const idx = stepIndex.value;
    return (
        <header class="ob-progress" aria-label="Onboarding progress">
            <div class="ob-progress__head">
                <span class="ob-progress__kicker">
                    Step {p.current} of {p.total}
                </span>
                <span class="ob-progress__pct">{p.pct}%</span>
            </div>
            <div class="ob-progress__bar">
                <span
                    class="ob-progress__fill"
                    style={`width:${p.pct}%`}
                />
            </div>
            <ol class="ob-progress__steps">
                {STEP_ORDER.slice(0, -1).map((id, i) => (
                    <li
                        key={id}
                        class={`ob-step-tag${
                            i === idx ? " is-current" : i < idx ? " is-done" : ""
                        }`}
                    >
                        {STEP_LABELS[id]}
                    </li>
                ))}
            </ol>
        </header>
    );
}
