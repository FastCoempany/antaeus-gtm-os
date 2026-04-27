import type { JSX } from "preact";
import { currentVerdictMode, setVerdictMode } from "../state";
import type { VerdictMode } from "../lib/types";

/**
 * VerdictToggle — left-alone vs corrected docket.
 *
 * Per canon §4.14 the room shows two paths: "if left alone" (the
 * failure narrative — red docket) vs "if corrected" (the recovery
 * narrative — green docket). Toggle drives the sheet copy + the
 * countermeasure framing.
 */
const OPTIONS: ReadonlyArray<{ key: VerdictMode; label: string; sub: string }> = [
    { key: "left", label: "If left alone", sub: "what kills this in 45 days" },
    { key: "corrected", label: "If corrected", sub: "what wins this in 45 days" }
];

export function VerdictToggle(): JSX.Element {
    const active = currentVerdictMode.value;
    return (
        <nav class="fa-verdict" aria-label="Verdict mode">
            {OPTIONS.map((opt) => {
                const isActive = opt.key === active;
                return (
                    <button
                        key={opt.key}
                        type="button"
                        class={`fa-verdict__btn fa-verdict__btn--${opt.key}${
                            isActive ? " is-active" : ""
                        }`}
                        aria-pressed={isActive}
                        onClick={() => setVerdictMode(opt.key)}
                    >
                        <span class="fa-verdict__label">{opt.label}</span>
                        <span class="fa-verdict__sub">{opt.sub}</span>
                    </button>
                );
            })}
        </nav>
    );
}
