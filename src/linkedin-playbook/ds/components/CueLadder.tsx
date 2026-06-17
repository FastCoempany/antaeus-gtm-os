import type { JSX } from "preact";
import { Kicker } from "@/components";
import { t } from "@/lib/voice/t";
import { setActiveCue } from "../../state";
import { CUES } from "../../lib/cues";
import { activeCueResolved } from "../lib/adapters";

/**
 * CueLadder — the five-cue ladder as the FocalRail rail (canon §4.10:
 * Watch → Comment → Connect → Give-first → Ask). The active cue (the
 * motion's pick, or the operator's pin) is the focal; the rest stay
 * jumpable. Public cue first; the ask is the last rung, never the first.
 */
export function CueLadder(): JSX.Element {
    const active = activeCueResolved().index;
    return (
        <nav class="lpd-rail" aria-label={t("The cues")}>
            <Kicker>{t("THE CUE LADDER")}</Kicker>
            <ul class="lpd-rail__list">
                {CUES.map((cue) => (
                    <li key={cue.index}>
                        <button
                            type="button"
                            class={`lpd-rail__row${active === cue.index ? " is-active" : ""}`}
                            aria-pressed={active === cue.index}
                            onClick={() => setActiveCue(cue.index)}
                        >
                            <span class="lpd-rail__num">{cue.label}</span>
                            <span class="lpd-rail__name">{cue.name}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
