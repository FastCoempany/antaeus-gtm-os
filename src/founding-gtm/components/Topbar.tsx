import type { JSX } from "preact";

/**
 * Founding GTM topbar — kicker + serif thesis title + maturity band.
 *
 * Per canon §4.19: "the room is the culmination, the high point —
 * UI/UX thesis Rule F: handoff-readiness should feel like a north
 * star, and this is where the north star is rendered."
 *
 * The kicker carries the section-readiness tail. A separate rail
 * surfaces the live Readiness verdict when one is available so the
 * operator (and the first hire) can see the maturity state at a
 * glance.
 */

export interface TopbarProps {
    readonly sectionsReady: number;
    readonly sectionsPartial: number;
    readonly verdictLabel: string | null;
}

export function Topbar(props: TopbarProps): JSX.Element {
    const kicker = `FOUNDING GTM · ${props.sectionsReady}/7 sections ready${
        props.sectionsPartial > 0
            ? ` · ${props.sectionsPartial} partial`
            : ""
    }`;
    return (
        <header class="fg-topbar">
            <div class="fg-topbar__lead">
                <p class="fg-topbar__kicker">{kicker}</p>
                <h1 class="fg-topbar__title">
                    What your first hire opens on day one.
                </h1>
                <p class="fg-topbar__sub">
                    Authored opinion + cross-room synthesis. The sections
                    populate as the underlying rooms fill with evidence.
                </p>
            </div>
            {props.verdictLabel && (
                <div class="fg-topbar__rail">
                    <div class="fg-readiness-tag">
                        <span class="fg-readiness-tag__kicker">READINESS</span>
                        <span class="fg-readiness-tag__label">
                            {props.verdictLabel}
                        </span>
                    </div>
                </div>
            )}
        </header>
    );
}
