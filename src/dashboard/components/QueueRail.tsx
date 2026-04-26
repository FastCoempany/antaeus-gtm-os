import type { JSX } from "preact";
import type { CommandObject } from "../lib/types";
import { focusedCommandId, setFocusedCommand } from "../state";

interface Props {
    readonly objects: ReadonlyArray<CommandObject>;
}

/**
 * QueueRail — the recessive "next ranked items" rail next to Spotlight.
 *
 * Per canon §4.2: the rail supports the focal object without competing
 * with it. Click a row to make it the focal object (sets
 * focusedCommandId; the spotlight computed signal honors it).
 *
 * Skips the index-0 object (already shown in the focal column) unless
 * a manual focus differs from the engine's natural top.
 */
export function QueueRail({ objects }: Props): JSX.Element {
    const focused = focusedCommandId.value;
    const head = objects[0];
    const items = focused && focused !== head?.id ? objects : objects.slice(1);

    if (!items.length) {
        return (
            <aside class="db-spotlight__rail" aria-label="Next ranked items">
                <p class="db-spotlight__rail-kicker">NEXT</p>
                <p class="db-spotlight__rail-empty">—</p>
            </aside>
        );
    }

    return (
        <aside class="db-spotlight__rail" aria-label="Next ranked items">
            <p class="db-spotlight__rail-kicker">NEXT · {items.length}</p>
            <ul class="db-spotlight__rail-list">
                {items.map((o) => {
                    const isActive = o.id === focused;
                    return (
                        <li key={o.id}>
                            <button
                                type="button"
                                class={`db-spotlight__rail-row${isActive ? " is-active" : ""}`}
                                onClick={() => setFocusedCommand(o.id)}
                                aria-pressed={isActive}
                            >
                                <span class="db-spotlight__rail-family">
                                    {o.roomFamilyLabel}
                                </span>
                                <span class="db-spotlight__rail-title">{o.title}</span>
                                <span class="db-spotlight__rail-score">{o.score}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
