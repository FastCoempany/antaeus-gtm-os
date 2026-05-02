import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { stats } from "../state";

/**
 * Topbar — kicker + thesis title + workbench stats.
 *
 * Per canon §4.6 the room is a "research loom"; the topbar carries
 * one ranked numeric line (the workbench count) so the operator
 * lands knowing whether the territory is full or hollow.
 */
export function Topbar(): JSX.Element {
    const s = stats.value;
    return (
        <header class="sw-topbar" aria-label="Sourcing Workbench header">
            <BackButton />
            <p class="sw-topbar__kicker">Decision bench · Research loom</p>
            <h1 class="sw-topbar__title">
                Push only the names the territory will respect.
            </h1>
            <p class="sw-topbar__subtitle">
                Turn theses into named, pushable prospects. Polish belongs
                downstream — this room picks who Signal Console is allowed
                to spend attention on.
            </p>
            <div class="sw-topbar__stats" role="group" aria-label="Workbench stats">
                <Stat label="Captured" value={s.captured} />
                <Stat label="Researched" value={s.researched} />
                <Stat label="Ready to push" value={s.ready} accent />
                <Stat label="Pushed" value={s.pushed} />
                <Stat label="Total" value={s.total} muted />
            </div>
        </header>
    );
}

function Stat({
    label,
    value,
    accent,
    muted
}: {
    readonly label: string;
    readonly value: number;
    readonly accent?: boolean;
    readonly muted?: boolean;
}): JSX.Element {
    const cls = `sw-stat${accent ? " is-accent" : ""}${muted ? " is-muted" : ""}`;
    return (
        <div class={cls}>
            <span class="sw-stat__label">{label}</span>
            <span class="sw-stat__value">{value}</span>
        </div>
    );
}
