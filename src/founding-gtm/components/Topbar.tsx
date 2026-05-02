import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";

/**
 * Founding GTM topbar — kicker + serif thesis title + maturity band.
 *
 * Per canon §4.19: "the room is the **culmination**, the high point —
 * UI/UX thesis Rule F: handoff-readiness should feel like a north
 * star, and this is where the north star is rendered."
 *
 * The maturity band is the only metric on the topbar — N/7 sections
 * ready, plus the current readiness verdict for context (not as a
 * second-class score).
 */

export interface TopbarProps {
    readonly sectionsReady: number;
    readonly sectionsPartial: number;
    readonly verdictLabel: string | null;
}

export function Topbar(props: TopbarProps): JSX.Element {
    const totalCount = `${props.sectionsReady}/7 sections ready`;
    return (
        <header class="fg-topbar">
            <BackButton fallbackLabel="Back to Dashboard" />
            <div class="fg-topbar__lead">
                <p class="fg-topbar__kicker">FOUNDING GTM</p>
                <h1 class="fg-topbar__title">
                    What your first hire opens on day one.
                </h1>
                <p class="fg-topbar__sub">
                    Authored opinion + cross-room synthesis. Not an export
                    of room data — every section earns its place with a
                    read no single room can surface alone.
                </p>
            </div>
            <div class="fg-topbar__rail">
                <div class="fg-maturity">
                    <span class="fg-maturity__count">{totalCount}</span>
                    {props.sectionsPartial > 0 && (
                        <span class="fg-maturity__partial">
                            +{props.sectionsPartial} partial
                        </span>
                    )}
                </div>
                {props.verdictLabel && (
                    <div class="fg-readiness-tag">
                        <span class="fg-readiness-tag__kicker">READINESS</span>
                        <span class="fg-readiness-tag__label">
                            {props.verdictLabel}
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
}
