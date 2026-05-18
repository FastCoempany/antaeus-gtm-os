import type { JSX } from "preact";
import type { CommandObject, CommandFamily } from "../lib/types";

/**
 * SignalLine — the chip row from the Soft Cut canonical wireframe.
 *
 * Lives in the main column above the rail. Shows ranked counts per
 * tone-grouped family so Sarah can read the workspace's current
 * pressure shape at a glance:
 *
 *   3 HOT · 2 WARM · 1 LIVE · 4 COLD
 *
 * The chip tones map to the same vocabulary the Slice cards use:
 *   - hot   (orange) = risk-family items
 *   - warm  (blue)   = move / opportunity / icp
 *   - live  (green)  = advisor
 *   - cold  (neutral)= system
 *
 * Zero-count tones render dimmed but still visible — gives Sarah a
 * complete read on what isn't surfacing, not just what is.
 */

interface Props {
    readonly objects: ReadonlyArray<CommandObject>;
}

const TONES: ReadonlyArray<{
    readonly key: "hot" | "warm" | "live" | "cold";
    readonly label: string;
    readonly families: ReadonlyArray<CommandFamily>;
}> = [
    { key: "hot", label: "Hot", families: ["risk"] },
    {
        key: "warm",
        label: "Warm",
        families: ["move", "opportunity", "icp"]
    },
    { key: "live", label: "Live", families: ["advisor"] },
    { key: "cold", label: "Cold", families: ["system"] }
];

export function SignalLine({ objects }: Props): JSX.Element {
    const counts = new Map<"hot" | "warm" | "live" | "cold", number>();
    for (const tone of TONES) counts.set(tone.key, 0);
    for (const obj of objects) {
        for (const tone of TONES) {
            if (tone.families.includes(obj.commandFamily)) {
                counts.set(tone.key, (counts.get(tone.key) ?? 0) + 1);
                break;
            }
        }
    }

    return (
        <ul class="db-signal-line" aria-label="Ranked pressure by tone">
            {TONES.map((tone) => {
                const n = counts.get(tone.key) ?? 0;
                const dim = n === 0;
                return (
                    <li
                        key={tone.key}
                        class={`db-signal-chip db-signal-chip--${tone.key}${
                            dim ? " is-dim" : ""
                        }`}
                    >
                        <strong class="db-signal-chip__count">{n}</strong>
                        <span class="db-signal-chip__label">{tone.label}</span>
                    </li>
                );
            })}
        </ul>
    );
}
