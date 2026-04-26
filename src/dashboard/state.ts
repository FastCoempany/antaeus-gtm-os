import { signal, type Signal } from "@preact/signals";
import {
    COMMAND_MODES,
    DEFAULT_COMMAND_MODE,
    type CommandMode
} from "./lib/types";

/**
 * Phase 4 / Room 2 — Dashboard runtime state.
 *
 * The Dashboard's primary state is the active mode (brief / spotlight /
 * queue) plus the focused command object id. Everything else (the
 * ranked objects themselves) is computed from health snapshots, not
 * stored — the room is a synthesis surface.
 *
 * Mode resolution order on boot:
 *   1. ?mode= URL query param (so cross-room links can jump to a
 *      specific mode)
 *   2. `gtmos_dashboard_command_mode` localStorage (sticky preference)
 *   3. DEFAULT_COMMAND_MODE ("spotlight")
 *
 * The legacy room writes the same localStorage key, so a user who
 * toggles mode in either room carries the preference forward during
 * the cutover.
 */

export const COMMAND_MODE_STORAGE_KEY = "gtmos_dashboard_command_mode";
export const ACTIVE_COMMAND_STORAGE_KEY = "gtmos_dashboard_active_command";

/** Active mode signal. */
export const commandMode: Signal<CommandMode> = signal(DEFAULT_COMMAND_MODE);

/** Focused command object id (drives Spotlight + sheet inspector). */
export const focusedCommandId: Signal<string | null> = signal(null);

function isCommandMode(v: unknown): v is CommandMode {
    return typeof v === "string" && (COMMAND_MODES as ReadonlyArray<string>).includes(v);
}

/**
 * Resolve the active mode from URL → localStorage → default. Pure;
 * accepts the search string + storage instance so tests can drive it.
 */
export function resolveInitialMode(
    search: string,
    storage: Pick<Storage, "getItem"> | null
): CommandMode {
    try {
        const params = new URLSearchParams(search);
        const fromUrl = params.get("mode");
        if (isCommandMode(fromUrl)) return fromUrl;
    } catch {
        // ignore URL parse errors
    }
    if (storage) {
        try {
            const fromStorage = storage.getItem(COMMAND_MODE_STORAGE_KEY);
            if (isCommandMode(fromStorage)) return fromStorage;
        } catch {
            // ignore storage errors
        }
    }
    return DEFAULT_COMMAND_MODE;
}

/** Boot: seed the mode signal from URL + localStorage. */
export function bootMode(): void {
    if (typeof window === "undefined") return;
    const next = resolveInitialMode(
        window.location.search,
        typeof localStorage === "undefined" ? null : localStorage
    );
    commandMode.value = next;

    try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("commandId");
        if (id) focusedCommandId.value = id;
    } catch {
        // ignore
    }
}

/**
 * Set the active mode + persist + reflect in URL. Call on mode-switch
 * button click. URL update uses replaceState so it doesn't pollute
 * history during quick toggles.
 */
export function setCommandMode(mode: CommandMode): void {
    commandMode.value = mode;
    try {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(COMMAND_MODE_STORAGE_KEY, mode);
        }
    } catch {
        // ignore storage errors
    }
    try {
        if (typeof window !== "undefined" && window.history?.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.set("mode", mode);
            window.history.replaceState({}, "", url.toString());
        }
    } catch {
        // ignore
    }
}

export function setFocusedCommand(id: string | null): void {
    focusedCommandId.value = id;
}

/** Test-only — reset signals between cases. */
export function __resetForTests(): void {
    commandMode.value = DEFAULT_COMMAND_MODE;
    focusedCommandId.value = null;
}
