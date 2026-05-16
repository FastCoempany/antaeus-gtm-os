import type { JSX } from "preact";
import { currentAutopsy, selectedVitals, taskLog, toggleTaskDone } from "../state";
import { buildActionPlan } from "../lib/action-plan";
import { isTaskDone } from "../lib/task-log";
import { saveTaskLogToCloud } from "../lib/cloud-persistence";
import { VerdictToggle } from "./VerdictToggle";
import { ForensicSheets } from "./ForensicSheets";
import { RouteRack } from "./RouteRack";

function fmtMoney(n: number): string {
    if (!n) return "$0";
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${Math.round(n)}`;
}

/**
 * PinnedCase — Wave 4 implementation.
 *
 * Per canon §4.14 the room is a forensic light-table. The pinned-case
 * panel shows: who's pinned, the verdict toggle, the forensic sheet
 * stack, and a compact countermeasure docket. Wave 5 wires the route
 * rack across the bottom.
 */
export function PinnedCase(): JSX.Element {
    const v = selectedVitals.value;
    const doc = currentAutopsy.value;

    if (!v) {
        return (
            <section class="fa-pinned fa-pinned--empty" aria-label="Pinned case">
                <p class="fa-pinned__empty">
                    No case pinned. Pick a deal from the ledger below to
                    start the autopsy.
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
                    {v.stage} · {fmtMoney(v.value)} · {v.staleDays}d since last
                    activity · Risk {v.riskScore}/100 · Qualification{" "}
                    {v.qualScore}/18
                </p>
            </header>

            <VerdictToggle />
            <ForensicSheets />

            {doc && doc.countermeasures.length > 0 ? (
                <section class="fa-docket" aria-label="Countermeasure docket">
                    <header class="fa-docket__header">
                        <span class="fa-docket__kicker">COUNTERMEASURES</span>
                        <span class="fa-docket__count">
                            {doc.countermeasures.length} task
                            {doc.countermeasures.length === 1 ? "" : "s"}
                        </span>
                    </header>
                    <ul class="fa-docket__list">
                        {doc.countermeasures.map((t) => {
                            const done = isTaskDone(taskLog.value, v.id, t.taskId);
                            return (
                                <li
                                    key={t.taskId}
                                    class={`fa-docket__row${done ? " is-done" : ""}`}
                                >
                                    <label class="fa-docket__check">
                                        <input
                                            type="checkbox"
                                            checked={done}
                                            onChange={() => {
                                                toggleTaskDone(v.id, t.taskId);
                                                void saveTaskLogToCloud(
                                                    taskLog.value
                                                );
                                            }}
                                        />
                                        <span class="fa-docket__label">{t.label}</span>
                                    </label>
                                    <span class="fa-docket__why">{t.why}</span>
                                    {t.script ? (
                                        <span class="fa-docket__script">
                                            “{t.script(v)}”
                                        </span>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ) : null}

            {doc?.killSwitch ? (
                <p class="fa-kill" aria-label="Kill switch verdict">
                    <span class="fa-kill__label">KILL SWITCH</span>
                    {doc.killSwitch}
                </p>
            ) : null}

            {doc ? <RouteRack plan={buildActionPlan(doc)} /> : null}
        </section>
    );
}
