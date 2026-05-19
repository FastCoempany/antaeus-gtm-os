import type { JSX } from "preact";
import { computed } from "@preact/signals";
import { prospects, stats } from "../state";
import { computeLoomRead } from "../lib/loom-read";

/**
 * LoomRead — Program 6 / PR 13 (Ticket Loom V02 refacing).
 *
 * Per the picked-winner Variant 02 / Ticket Loom wireframe
 * (deliverables/prototypes/wireframes/antaeus-sourcing-workbench-
 * triptych-2026-04-17.html line 348+), the workbench's loom-dock
 * aside surfaces a Week read + Operator move so the operator sees
 * what the workbench is saying, not just what it contains.
 *
 * This component mounts beneath the Topbar (which carries numeric
 * stats) and above the bench grid. It reads the live prospect list
 * + stats via a computed signal so it re-renders on every push,
 * drop, or stage change.
 */

const loomRead = computed(() =>
    computeLoomRead({
        prospects: prospects.value,
        stats: stats.value
    })
);

export function LoomRead(): JSX.Element {
    const read = loomRead.value;
    return (
        <aside
            class={`sw-loom-read sw-loom-read--${read.band}`}
            aria-label="Loom read"
        >
            <div class="sw-loom-read__score-row">
                <div>
                    <p class="sw-loom-read__kicker">LOOM READ</p>
                    <p class="sw-loom-read__band">{read.bandLabel}</p>
                </div>
                <p class="sw-loom-read__score">{read.score}</p>
            </div>
            <div class="sw-loom-read__line">
                <p class="sw-loom-read__line-label">Week read</p>
                <p class="sw-loom-read__line-copy">{read.weekRead}</p>
            </div>
            <div class="sw-loom-read__line sw-loom-read__line--move">
                <p class="sw-loom-read__line-label">Operator move</p>
                <p class="sw-loom-read__line-copy">{read.operatorMove}</p>
            </div>
        </aside>
    );
}
