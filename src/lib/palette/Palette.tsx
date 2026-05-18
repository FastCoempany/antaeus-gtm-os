import type { JSX } from "preact";
import { signal, computed, batch, effect } from "@preact/signals";
import {
    ALL_ROOMS,
    FAMILY_LABEL,
    filterRooms,
    type PaletteEntry,
    type RoomFamily
} from "./registry";
import "./palette.css";

/**
 * Palette — cmd+K room directory overlay.
 *
 * Mounts once per page via `<PaletteTrigger />` (rendered by
 * RoomChrome). Summoned by:
 *   - cmd/ctrl+K from any room
 *   - Escape closes
 *   - Enter on the focused result navigates
 *   - ArrowUp / ArrowDown moves focus through results
 *
 * Per canon Part II §5 ("the command palette is a force multiplier,
 * not a dependency") + Part III §6 ("room access as a secondary,
 * summoned action") — the palette is the positive affordance canon
 * implies but never specified. Sarah's day-to-day stays seam-driven
 * via HandoffStrips; the palette is escape velocity when no seam
 * leads where she wants to go.
 */

// ─── Open/closed state (module-scoped signal, so the trigger can
//     summon from outside React state). ────────────────────────────

export const paletteOpen = signal<boolean>(false);
export const paletteQuery = signal<string>("");
export const paletteFocusIndex = signal<number>(0);

const visibleRooms = computed(() => filterRooms(paletteQuery.value));

export function openPalette(): void {
    batch(() => {
        paletteOpen.value = true;
        paletteQuery.value = "";
        paletteFocusIndex.value = 0;
    });
}

export function closePalette(): void {
    paletteOpen.value = false;
}

// Reset focus index whenever the filter changes — pure signal effect
// instead of useEffect so the component stays hook-free (avoids a
// build-tool issue with the Preact hook-names transform plugin).
effect(() => {
    // Touch paletteQuery so we re-run on each change.
    paletteQuery.value;
    paletteFocusIndex.value = 0;
});

// Auto-focus the input when the palette opens. Uses a queued
// setTimeout instead of useEffect for the same hook-free reason +
// avoids a Preact ref + generic typing combo that the transform
// plugin chokes on.
effect(() => {
    if (!paletteOpen.value) return;
    if (typeof document === "undefined") return;
    setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>(
            ".ant-palette__input"
        );
        if (input) {
            input.focus();
            input.select();
        }
    }, 0);
});

// ─── The overlay itself ───────────────────────────────────────────

export function Palette(): JSX.Element | null {
    if (!paletteOpen.value) return null;

    const rooms = visibleRooms.value;
    const focusIdx =
        rooms.length === 0
            ? 0
            : Math.min(Math.max(0, paletteFocusIndex.value), rooms.length - 1);

    function onKeyDown(e: KeyboardEvent): void {
        if (e.key === "Escape") {
            e.preventDefault();
            closePalette();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (rooms.length === 0) return;
            paletteFocusIndex.value = (focusIdx + 1) % rooms.length;
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (rooms.length === 0) return;
            paletteFocusIndex.value =
                focusIdx === 0 ? rooms.length - 1 : focusIdx - 1;
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            const focus = rooms[focusIdx];
            if (focus) {
                closePalette();
                window.location.href = focus.href;
            }
            return;
        }
    }

    // Group filtered results by family for the empty-query view.
    // When a query is active, render flat (single relevance order).
    const showGrouped = paletteQuery.value.trim().length === 0;

    return (
        <div
            class="ant-palette__backdrop"
            onClick={closePalette}
            role="dialog"
            aria-modal="true"
            aria-label="Room directory"
        >
            <div
                class="ant-palette"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={onKeyDown}
            >
                <div class="ant-palette__head">
                    <span class="ant-palette__kbd" aria-hidden="true">
                        ⌘K
                    </span>
                    <input
                        class="ant-palette__input"
                        type="text"
                        placeholder="Jump to a room… (Esc to close)"
                        value={paletteQuery.value}
                        onInput={(e) =>
                            (paletteQuery.value = (
                                e.currentTarget as HTMLInputElement
                            ).value)
                        }
                        aria-label="Filter rooms"
                    />
                    <span class="ant-palette__count">
                        {rooms.length} / {ALL_ROOMS.length}
                    </span>
                </div>
                <div class="ant-palette__body" role="listbox">
                    {rooms.length === 0 ? (
                        <p class="ant-palette__empty">
                            No room matches "{paletteQuery.value}". Try part of
                            the room name, family, or what you're trying to do.
                        </p>
                    ) : showGrouped ? (
                        <GroupedResults rooms={rooms} focusIdx={focusIdx} />
                    ) : (
                        <FlatResults rooms={rooms} focusIdx={focusIdx} />
                    )}
                </div>
                <div class="ant-palette__foot">
                    <span>
                        <kbd>↑↓</kbd> navigate · <kbd>↵</kbd> open ·{" "}
                        <kbd>Esc</kbd> close
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Result renderers ─────────────────────────────────────────────

function GroupedResults({
    rooms,
    focusIdx
}: {
    readonly rooms: ReadonlyArray<PaletteEntry>;
    readonly focusIdx: number;
}): JSX.Element {
    const groups = groupByFamily(rooms);
    let runningIdx = 0;
    return (
        <ul class="ant-palette__groups">
            {groups.map(([family, entries]) => (
                <li key={family} class="ant-palette__group">
                    <p class="ant-palette__group-kicker">
                        {FAMILY_LABEL[family]}
                    </p>
                    <ul class="ant-palette__results">
                        {entries.map((entry) => {
                            const idx = runningIdx++;
                            const focused = idx === focusIdx;
                            return (
                                <ResultRow
                                    key={entry.id}
                                    entry={entry}
                                    focused={focused}
                                />
                            );
                        })}
                    </ul>
                </li>
            ))}
        </ul>
    );
}

function FlatResults({
    rooms,
    focusIdx
}: {
    readonly rooms: ReadonlyArray<PaletteEntry>;
    readonly focusIdx: number;
}): JSX.Element {
    return (
        <ul class="ant-palette__results">
            {rooms.map((entry, idx) => (
                <ResultRow
                    key={entry.id}
                    entry={entry}
                    focused={idx === focusIdx}
                />
            ))}
        </ul>
    );
}

function ResultRow({
    entry,
    focused
}: {
    readonly entry: PaletteEntry;
    readonly focused: boolean;
}): JSX.Element {
    return (
        <li role="option" aria-selected={focused}>
            <a
                class={`ant-palette__result${focused ? " is-focused" : ""}`}
                href={entry.href}
                onClick={() => closePalette()}
                data-palette-id={entry.id}
            >
                <span class="ant-palette__result-kicker">{entry.kicker}</span>
                <span class="ant-palette__result-label">{entry.label}</span>
                <span class="ant-palette__result-desc">{entry.description}</span>
            </a>
        </li>
    );
}

function groupByFamily(
    rooms: ReadonlyArray<PaletteEntry>
): Array<[RoomFamily, ReadonlyArray<PaletteEntry>]> {
    const map = new Map<RoomFamily, PaletteEntry[]>();
    for (const room of rooms) {
        const list = map.get(room.family) ?? [];
        list.push(room);
        map.set(room.family, list);
    }
    // Stable family order matching canon §4 + family enum order.
    const order: ReadonlyArray<RoomFamily> = [
        "threshold",
        "command-chamber",
        "live-instrument",
        "decision-bench",
        "diagnosis-table",
        "system-ledger",
        "trust-annex"
    ];
    return order
        .filter((f) => map.has(f))
        .map((f): [RoomFamily, ReadonlyArray<PaletteEntry>] => [
            f,
            map.get(f) ?? []
        ]);
}
