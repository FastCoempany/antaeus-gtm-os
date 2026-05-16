import type { JSX } from "preact";
import { commandMode, setCommandMode } from "../state";
import {
    COMMAND_MODES,
    COMMAND_MODE_LABELS,
    type CommandMode
} from "../lib/types";

/**
 * ModeSwitcher — three-button density toggle (Read / Focus / Triage).
 *
 * Per CLAUDE.md §4.2: all three modes preserve ranking; they differ in
 * presentation density. Labels per the Dashboard audit (2026-05):
 *   - Read   = narrative summary (the first-time default)
 *   - Focus  = one focal object + dominant move
 *   - Triage = ranked list
 *
 * Internal keys stay as brief / spotlight / queue so saved
 * preferences survive the rename.
 *
 * Active mode persists to localStorage + URL via setCommandMode.
 */
const MODE_DESCRIPTIONS: Record<CommandMode, string> = {
    brief: "Narrative — what's happening today",
    spotlight: "One object — the dominant move",
    queue: "Ranked list — work the pile"
};

export function ModeSwitcher(): JSX.Element {
    const active = commandMode.value;
    return (
        <div class="db-mode">
            <nav class="db-mode-switcher" aria-label="Command mode">
                {COMMAND_MODES.map((mode) => {
                    const isActive = mode === active;
                    return (
                        <button
                            key={mode}
                            type="button"
                            class={`db-mode-switcher__btn${
                                isActive ? " is-active" : ""
                            }`}
                            aria-pressed={isActive}
                            onClick={() => setCommandMode(mode)}
                            title={MODE_DESCRIPTIONS[mode]}
                        >
                            {COMMAND_MODE_LABELS[mode]}
                        </button>
                    );
                })}
            </nav>
            <p class="db-mode__hint">
                Density: {COMMAND_MODE_LABELS.brief} (narrative),{" "}
                {COMMAND_MODE_LABELS.spotlight} (one object),{" "}
                {COMMAND_MODE_LABELS.queue} (list).
            </p>
        </div>
    );
}
