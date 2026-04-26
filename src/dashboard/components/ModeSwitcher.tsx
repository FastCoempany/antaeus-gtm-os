import type { JSX } from "preact";
import { commandMode, setCommandMode } from "../state";
import { COMMAND_MODES, type CommandMode } from "../lib/types";

/**
 * ModeSwitcher — three-button density toggle (Brief / Spotlight / Queue).
 *
 * Per CLAUDE.md §4.2: all three modes preserve ranking; they differ in
 * presentation density. Brief = narrative summary; Spotlight = single
 * focal object + dominant move; Queue = ranked triage list.
 *
 * The active mode persists to localStorage + URL via setCommandMode.
 */
const MODE_LABELS: Record<CommandMode, string> = {
    brief: "Brief",
    spotlight: "Spotlight",
    queue: "Queue"
};

const MODE_DESCRIPTIONS: Record<CommandMode, string> = {
    brief: "Narrative summary",
    spotlight: "One focal object",
    queue: "Ranked triage"
};

export function ModeSwitcher(): JSX.Element {
    const active = commandMode.value;
    return (
        <nav class="db-mode-switcher" aria-label="Command mode">
            {COMMAND_MODES.map((mode) => {
                const isActive = mode === active;
                return (
                    <button
                        key={mode}
                        type="button"
                        class={`db-mode-switcher__btn${isActive ? " is-active" : ""}`}
                        aria-pressed={isActive}
                        onClick={() => setCommandMode(mode)}
                        title={MODE_DESCRIPTIONS[mode]}
                    >
                        {MODE_LABELS[mode]}
                    </button>
                );
            })}
        </nav>
    );
}
