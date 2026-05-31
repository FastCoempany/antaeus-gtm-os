import type { JSX } from "preact";
import { signal, computed, batch, effect } from "@preact/signals";
import {
    ALL_ROOMS,
    FAMILY_LABEL,
    filterRooms,
    type PaletteEntry,
    type RoomFamily
} from "./registry";
import { ALL_SKILLS, filterSkills } from "@/skills/lib/registry";
import { dispatchSkill } from "@/skills/lib/dispatcher";
import { openScheduleModal } from "@/skills/ScheduleModal";
import type { Skill } from "@/skills/lib/types";
import "./palette.css";

/**
 * Palette items can be either a room (the original v1 surface) or
 * a skill (Phase C / ADR-010). The union is what arrow navigation +
 * Enter dispatch walk over; the renderer branches on kind.
 */
export type PaletteItem =
    | { readonly kind: "room"; readonly room: PaletteEntry }
    | { readonly kind: "skill"; readonly skill: Skill };

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

const visibleItems = computed<ReadonlyArray<PaletteItem>>(() => {
    const q = paletteQuery.value;
    const rooms: ReadonlyArray<PaletteItem> = filterRooms(q).map(
        (room) => ({ kind: "room", room })
    );
    const skills: ReadonlyArray<PaletteItem> = filterSkills(q).map(
        (skill) => ({ kind: "skill", skill })
    );
    // Rooms first (preserves the v1 surface order), skills after.
    return [...rooms, ...skills];
});

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

    const items = visibleItems.value;
    const focusIdx =
        items.length === 0
            ? 0
            : Math.min(Math.max(0, paletteFocusIndex.value), items.length - 1);

    function onKeyDown(e: KeyboardEvent): void {
        if (e.key === "Escape") {
            e.preventDefault();
            closePalette();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (items.length === 0) return;
            paletteFocusIndex.value = (focusIdx + 1) % items.length;
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (items.length === 0) return;
            paletteFocusIndex.value =
                focusIdx === 0 ? items.length - 1 : focusIdx - 1;
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            const focus = items[focusIdx];
            if (!focus) return;
            closePalette();
            if (focus.kind === "room") {
                window.location.href = focus.room.href;
            } else {
                void dispatchSkill(focus.skill);
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
                        {items.length} / {ALL_ROOMS.length + ALL_SKILLS.length}
                    </span>
                </div>
                <div class="ant-palette__body" role="listbox">
                    {items.length === 0 ? (
                        <p class="ant-palette__empty">
                            Nothing matches "{paletteQuery.value}". Try part of
                            a room or skill name, or what you're trying to do.
                        </p>
                    ) : showGrouped ? (
                        <GroupedResults items={items} focusIdx={focusIdx} />
                    ) : (
                        <FlatResults items={items} focusIdx={focusIdx} />
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
    items,
    focusIdx
}: {
    readonly items: ReadonlyArray<PaletteItem>;
    readonly focusIdx: number;
}): JSX.Element {
    const rooms = items.filter(
        (i): i is { kind: "room"; room: PaletteEntry } => i.kind === "room"
    );
    const skills = items.filter(
        (i): i is { kind: "skill"; skill: Skill } => i.kind === "skill"
    );
    const groups = groupByFamily(rooms.map((r) => r.room));
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
                            return (
                                <ResultRow
                                    key={entry.id}
                                    item={{ kind: "room", room: entry }}
                                    focused={idx === focusIdx}
                                />
                            );
                        })}
                    </ul>
                </li>
            ))}
            {skills.length > 0 && (
                <li class="ant-palette__group">
                    <p class="ant-palette__group-kicker">Skills</p>
                    <ul class="ant-palette__results">
                        {skills.map((item) => {
                            const idx = runningIdx++;
                            return (
                                <ResultRow
                                    key={item.skill.id}
                                    item={item}
                                    focused={idx === focusIdx}
                                />
                            );
                        })}
                    </ul>
                </li>
            )}
        </ul>
    );
}

function FlatResults({
    items,
    focusIdx
}: {
    readonly items: ReadonlyArray<PaletteItem>;
    readonly focusIdx: number;
}): JSX.Element {
    return (
        <ul class="ant-palette__results">
            {items.map((item, idx) => (
                <ResultRow
                    key={itemKey(item)}
                    item={item}
                    focused={idx === focusIdx}
                />
            ))}
        </ul>
    );
}

function itemKey(item: PaletteItem): string {
    return item.kind === "room" ? `room:${item.room.id}` : `skill:${item.skill.id}`;
}

function ResultRow({
    item,
    focused
}: {
    readonly item: PaletteItem;
    readonly focused: boolean;
}): JSX.Element {
    if (item.kind === "room") {
        const entry = item.room;
        return (
            <li role="option" aria-selected={focused}>
                <a
                    class={`ant-palette__result${focused ? " is-focused" : ""}`}
                    href={entry.href}
                    onClick={() => closePalette()}
                    data-palette-id={entry.id}
                    data-palette-kind="room"
                >
                    <span class="ant-palette__result-kicker">{entry.kicker}</span>
                    <span class="ant-palette__result-label">{entry.label}</span>
                    <span class="ant-palette__result-desc">{entry.description}</span>
                </a>
            </li>
        );
    }
    const skill = item.skill;
    return (
        <li role="option" aria-selected={focused} class="ant-palette__skill-row">
            <button
                type="button"
                class={`ant-palette__result${focused ? " is-focused" : ""}`}
                onClick={() => {
                    closePalette();
                    void dispatchSkill(skill);
                }}
                data-palette-id={skill.id}
                data-palette-kind="skill"
            >
                <span class="ant-palette__result-kicker">SKILL</span>
                <span class="ant-palette__result-label">{skill.label}</span>
                <span class="ant-palette__result-desc">{skill.description}</span>
            </button>
            <button
                type="button"
                class="ant-palette__schedule"
                onClick={(e) => {
                    e.stopPropagation();
                    closePalette();
                    openScheduleModal(skill.id, skill.label);
                }}
                aria-label={`Schedule ${skill.label}`}
                data-schedule-skill-id={skill.id}
            >
                ⏰
            </button>
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
