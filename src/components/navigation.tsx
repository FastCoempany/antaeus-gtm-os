import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { openPalette } from "@/lib/palette/Palette";
import { BrandLockup } from "./brand";

/**
 * Navigation primitives (03 Part III). The rail is dead; the
 * Wayfinder bar is the locked un-nav primitive (Approach A): the mark
 * as the home affordance, the room crumb, and the summoned Ctrl+K —
 * never a hallway of doors. SegmentedControl is in-room lenses onto
 * one object, never a door between rooms.
 */

export function WayfinderBar(props: {
    /** The current room, as the mono crumb — e.g. "DASHBOARD". */
    readonly room: string;
    /** Optional contextual tail after the room name. */
    readonly tail?: string;
    readonly homeHref?: string;
}): JSX.Element {
    return (
        <nav class="ds-wayfinder" aria-label={t("Wayfinder")}>
            <a
                class="ds-wayfinder__mark"
                href={props.homeHref ?? "/dashboard/"}
                aria-label={t("Home")}
            >
                <BrandLockup size={20} />
            </a>
            <span class="ds-wayfinder__crumb">
                {props.room}
                {props.tail ? ` · ${props.tail}` : ""}
            </span>
            <span class="ds-wayfinder__spacer" />
            <button
                type="button"
                class="ds-wayfinder__k"
                onClick={() => openPalette()}
                title={t("Go anywhere — rooms and skills", { class: "body" })}
            >
                ⌘K
            </button>
        </nav>
    );
}

export function SegmentedControl<T extends string>(props: {
    readonly options: ReadonlyArray<{ readonly key: T; readonly label: string }>;
    readonly active: T;
    readonly onChange: (next: T) => void;
    readonly label: string;
}): JSX.Element {
    return (
        <div class="ds-seg" role="group" aria-label={props.label}>
            {props.options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    class="ds-seg__btn"
                    aria-pressed={o.key === props.active}
                    onClick={() => props.onChange(o.key)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
