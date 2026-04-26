import type { JSX } from "preact";
import { selectedVitals } from "../state";

/**
 * PinnedCase — Wave 1 placeholder for the active pinned-case panel.
 *
 * Per canon §4.14 this is the forensic light-table: causal pattern
 * narrative + intervention options + command row + route rack.
 * Wave 3 wires the autopsy generator; Wave 4 fills out the sheet
 * tabs + verdict toggle; Wave 5 wires the route rack.
 *
 * Wave 1 surfaces the selected case's basics so layout + smoke land
 * cleanly.
 */
export function PinnedCase(): JSX.Element {
    const v = selectedVitals.value;

    if (!v) {
        return (
            <section class="fa-pinned fa-pinned--empty" aria-label="Pinned case">
                <p class="fa-pinned__empty">
                    No case pinned. Pick a row from the ledger to load the
                    autopsy. Wave 3 generates the diagnosis, Wave 4 fills the
                    sheet tabs + verdict toggle, Wave 5 wires the route rack.
                </p>
            </section>
        );
    }

    return (
        <section class="fa-pinned" aria-label={`Pinned case: ${v.name}`}>
            <header class="fa-pinned__header">
                <p class="fa-pinned__kicker">PINNED CASE</p>
                <h2 class="fa-pinned__name">{v.name}</h2>
                <p class="fa-pinned__sub">
                    Stage {v.stage} · {v.staleDays}d since last activity ·
                    risk {v.riskScore} · qual {v.qualScore}/14
                </p>
            </header>
            <p class="fa-pinned__placeholder">
                Wave 3 generates the causal-pattern narrative + intervention
                options for this case. Wave 4 wires the docket toggle and
                forensic sheets.
            </p>
        </section>
    );
}
