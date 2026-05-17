import type { JSX } from "preact";
import { callLog, selectedAccountName } from "../state";
import { OUTCOME_LABELS } from "../lib/types";
import { hrefToCallPlanner, hrefToDealWorkspace } from "../lib/handoff";

/**
 * CallMemory — Wave 4 implementation.
 *
 * Renders the most-recent 8 calls (newest first) from `callLog`.
 * Each row carries: created date, account + contact, thread title +
 * buyer response, outcome. Wave 5 wires the cross-room handoff strip
 * (Open Call Planner / Open Deal Workspace) below the grid.
 */

function fmtDate(iso: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    }).format(d);
}

export function CallMemory(): JSX.Element {
    const calls = callLog.value.slice().reverse().slice(0, 8);
    const account = selectedAccountName.value ?? "";

    return (
        <section class="cc-memory" aria-label="Call memory">
            <header class="cc-memory__head">
                <div>
                    <p class="cc-memory__kicker">CALL MEMORY</p>
                    <h2 class="cc-memory__title">
                        Log the outcome before the thread goes cold.
                    </h2>
                </div>
                <nav class="cc-memory__handoff" aria-label="Cross-room handoff">
                    <a
                        class="cc-handoff cc-handoff--ghost"
                        href={hrefToCallPlanner(account)}
                        data-cc-handoff="call-planner"
                    >
                        Plan the next call
                    </a>
                    <a
                        class="cc-handoff cc-handoff--primary"
                        href={hrefToDealWorkspace(account)}
                        data-cc-handoff="deal-workspace"
                    >
                        Open the deal
                    </a>
                </nav>
            </header>

            {calls.length === 0 ? (
                // Cold Call Studio audit (2026-05): rewrote the empty
                // state — the previous copy mentioned "Phase 4 / Room 1"
                // and `gtmos_cold_call_log`, both internal architecture.
                <p class="cc-memory__empty">
                    No outcomes logged yet. After each call, hit the
                    outcome button below the thread sheet — every entry
                    here flows into the dashboard's ranking and, on
                    "meeting booked," creates a new deal automatically.
                </p>
            ) : (
                <div class="cc-memory__table-wrap">
                    <table class="cc-memory__table">
                        <thead>
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Account</th>
                                <th scope="col">Thread</th>
                                <th scope="col">Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calls.map((c) => (
                                <tr key={c.id}>
                                    <td>{fmtDate(c.createdAt)}</td>
                                    <td>
                                        <strong>{c.accountName || "—"}</strong>
                                        {c.contactName ? (
                                            <small>{c.contactName}</small>
                                        ) : null}
                                    </td>
                                    <td>
                                        <strong>{c.threadTitle}</strong>
                                        {c.buyerResponse ? (
                                            <small>{c.buyerResponse}</small>
                                        ) : null}
                                    </td>
                                    <td>
                                        <span
                                            class={`cc-memory__outcome cc-memory__outcome--${c.outcome}`}
                                        >
                                            {OUTCOME_LABELS[c.outcome]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
