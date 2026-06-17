import type { Milestone as DsMilestone } from "@/components";
import { actions, activation, model } from "../../state";
import { hrefForActionDestination } from "../../lib/handoff";

/**
 * Pure adapters — map the Welcome activation engine onto the design-
 * system the DS surface composes. The milestone ladder, the activation
 * model, and the ranked-action builder are untouched. Welcome is a
 * Threshold (canon §4.1): one commanding statement, one dominant next
 * move, progress visible but never gamified, never "all done."
 */

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: Welcome's whole job is the one dominant
 * next move. The top-ranked action IS the pull. Even at 4/4 anchors the
 * dominant action is "Open the Dashboard" — the threshold never reads
 * "all done." Absent only if the action list is somehow empty.
 */
export function toPulling(): PullingData | undefined {
    const list = actions.value;
    const top = list[0];
    if (!top) return undefined;
    const company = activation.value.companyName?.trim();
    return {
        verb: top.cta,
        object: company && company.length > 0 ? company : "your workspace",
        href: hrefForActionDestination(top.href),
        reasons: [top.why, top.unlocks].filter((s) => s && s.length > 0).slice(0, 4)
    };
}

/** The milestone ladder mapped to the library Progress shape. */
export function dsMilestones(): ReadonlyArray<DsMilestone> {
    return model.value.milestones.map((m) => ({ label: m.label, done: m.done }));
}

/** The count sentence for the Progress component — never a percent. */
export function anchorCount(): string {
    const m = model.value;
    return `${m.completed} of ${m.total} anchors live`;
}
