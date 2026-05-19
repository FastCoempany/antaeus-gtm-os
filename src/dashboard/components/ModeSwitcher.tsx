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
    spotlight: "One object — what to act on first",
    queue: "Ranked list — work down the list"
};

export function ModeSwitcher(): JSX.Element {
    const active = commandMode.value;
    return (
        <nav class="db-mode-switcher" aria-label="Command mode">
            {/*
             * Phase 2.2 audit — retired the "Density: Read
             * (narrative), Focus (one object), Triage (list)." hint
             * caption that lived under the mode buttons. Redundant
             * with the button labels + their tooltips; visually
             * cluttered the topbar rail. The MODE_DESCRIPTIONS map
             * still backs the tooltips below.
             */}
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
    );
}
