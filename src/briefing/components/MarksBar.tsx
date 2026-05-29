import type { JSX } from "preact";
import { patternMarks, clearMarkForPattern, setMarkForPattern } from "../state";
import type { PatternMark } from "../lib/marks-client";

/**
 * MarksBar — three-button row at the bottom of each PatternCard.
 *
 * The operator marks each Pattern as Used / Met / Noise. Their marks
 * feed back into the cluster scorer on the next pipeline run so the
 * anchors they consistently mark Noise get downweighted, and the
 * anchors they mark Used get a boost.
 *
 * State is per-user-per-pattern. Clicking the same button again
 * clears the mark. Optimistic — the visual updates immediately and
 * reverts on RPC failure.
 *
 * Accessibility: each button is a real <button> with aria-pressed +
 * aria-label. Three-button radio-like group, but radio semantics
 * don't fit because "no mark" is the default and is also reachable
 * by clicking the active button again.
 */

const BUTTON_LABELS: Record<PatternMark, string> = {
    used: "Used",
    met: "Met",
    noise: "Noise"
};

const BUTTON_HINTS: Record<PatternMark, string> = {
    used: "I acted on this — the system was right.",
    met: "I already knew this — accurate but no new value.",
    noise: "This was wrong, useless, or off-target."
};

interface MarksBarProps {
    readonly patternId: string;
}

async function handleClick(patternId: string, mark: PatternMark, currentMark: PatternMark | null): Promise<void> {
    if (currentMark === mark) {
        await clearMarkForPattern(patternId);
    } else {
        await setMarkForPattern(patternId, mark);
    }
}

function buttonClass(mark: PatternMark, isActive: boolean): string {
    const base = `bf-mark bf-mark--${mark}`;
    return isActive ? `${base} bf-mark--active` : base;
}

export function MarksBar({ patternId }: MarksBarProps): JSX.Element {
    const currentMark = patternMarks.value.get(patternId) ?? null;
    return (
        <div class="bf-marks" role="group" aria-label="Rate this read">
            <span class="bf-marks__label">Did this help?</span>
            {(["used", "met", "noise"] as ReadonlyArray<PatternMark>).map((mark) => {
                const isActive = currentMark === mark;
                return (
                    <button
                        key={mark}
                        type="button"
                        class={buttonClass(mark, isActive)}
                        aria-pressed={isActive}
                        aria-label={`${BUTTON_LABELS[mark]}: ${BUTTON_HINTS[mark]}`}
                        title={BUTTON_HINTS[mark]}
                        onClick={() => void handleClick(patternId, mark, currentMark)}
                    >
                        {BUTTON_LABELS[mark]}
                    </button>
                );
            })}
        </div>
    );
}
