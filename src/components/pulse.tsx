import type { ComponentChildren, JSX } from "preact";
import type { AccentRole } from "./contract";

/**
 * Pulse + Ribbon — two of the four composition systems (03 Part II).
 *
 * Pulse: the page is time. The most-pressured work sits at the top
 * under a NOW zone; older zones (YESTERDAY, THIS WEEK) compress
 * progressively beneath; a GONE QUIET zone surfaces the work that
 * HASN'T moved, because absence is itself a signal. A horizon strip of
 * counts closes the page. Pulses are authored, not logged — the system
 * decides what rises and what compresses (the Dashboard's Queue read,
 * spec 04 §3.2). It is not a feed; a feed is what canon §4.21 forbids.
 *
 * Ribbon: the section thread. A mono uppercase label, a rule fading to
 * the right, and a suffix carrying the zone's count or state. Ribbons
 * mark the seams of the page — time-zones and groups — never a single
 * card (a ribbon on one item is decoration).
 */

/**
 * Ribbon — the section thread (03 §2.2). Marks a zone or group seam.
 * `suffix` carries the count or state ("4 deals", "compounding").
 */
export function Ribbon(props: {
    readonly label: string;
    readonly suffix?: string;
    readonly tone?: AccentRole;
}): JSX.Element {
    return (
        <div class={`ds-ribbon${props.tone ? ` ds-ribbon--${props.tone}` : ""}`}>
            <span class="ds-ribbon__label">{props.label}</span>
            <span class="ds-ribbon__rule" aria-hidden="true" />
            {props.suffix ? (
                <span class="ds-ribbon__suffix">{props.suffix}</span>
            ) : null}
        </div>
    );
}

/**
 * PulseZone — one time-zone of the timeline: a Ribbon header over its
 * stacked items. `compressed` reduces the zone's vertical weight, the
 * way older zones recede beneath NOW (the room assigns which zones
 * compress; this is the mechanism). An empty zone renders nothing —
 * the past compresses, it never piles up as empty padding.
 */
export function PulseZone(props: {
    readonly label: string;
    readonly suffix?: string;
    readonly tone?: AccentRole;
    readonly compressed?: boolean;
    readonly children?: ComponentChildren;
}): JSX.Element | null {
    const items = (
        Array.isArray(props.children) ? props.children : [props.children]
    ).filter((c) => c !== null && c !== undefined && c !== false);
    if (items.length === 0) return null;
    return (
        <section
            class={`ds-pulse-zone${props.compressed ? " ds-pulse-zone--compressed" : ""}`}
        >
            <Ribbon label={props.label} suffix={props.suffix} tone={props.tone} />
            <div class="ds-pulse-zone__items">{items}</div>
        </section>
    );
}

/**
 * PulseTimeline — the vertical time-axis container (03 §2.1). Compose
 * PulseZones inside it (NOW first, then the compressing older zones,
 * then GONE QUIET), closed by a PulseHorizon.
 */
export function PulseTimeline(props: {
    readonly children: ComponentChildren;
    readonly label: string;
}): JSX.Element {
    return (
        <div class="ds-pulse" role="list" aria-label={props.label}>
            {props.children}
        </div>
    );
}

/**
 * PulseHorizon — the strip of counts that closes the page (03 §2.1).
 * The far edge of the timeline: what the whole pipeline adds up to.
 */
export function PulseHorizon(props: {
    readonly counts: ReadonlyArray<{ readonly label: string; readonly value: string | number }>;
}): JSX.Element {
    return (
        <div class="ds-pulse-horizon">
            {props.counts.map((c) => (
                <div key={c.label} class="ds-pulse-horizon__cell">
                    <span class="ds-pulse-horizon__value">{c.value}</span>
                    <span class="ds-pulse-horizon__label">{c.label}</span>
                </div>
            ))}
        </div>
    );
}
