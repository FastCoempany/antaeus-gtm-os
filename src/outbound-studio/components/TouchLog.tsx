import type { JSX } from "preact";
import {
    allTouches,
    rack,
    setTouchOutcome,
    touchesForRack
} from "../state";
import {
    PERSONA_LABELS,
    TEMPERATURE_LABELS,
    TOUCH_OUTCOMES,
    TOUCH_OUTCOME_LABELS,
    type TouchOutcome
} from "../lib/types";
import { saveTouch } from "../lib/cloud-persistence";

/**
 * TouchLog — Wave 5 implementation.
 *
 * Per canon §4.8: "every route keeps a recovery cable on the same
 * board." Touches log to `gtmos_outbound_touches` (consumed by Phase
 * 4 / Rooms 3 + 4); operator can update outcomes inline so
 * Signal Console's execution-context temperature stays accurate.
 *
 * When the rack has an account set, the log strictly filters to that
 * account — empty state shows if the account has no touches yet, so
 * outcome edits never mutate a touch belonging to a different account.
 * Only when no account is scoped do we show the most recent touches
 * across the workspace.
 */
const PREVIEW_LIMIT = 12;

function fmtDate(s: string): string {
    if (!s) return "—";
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric"
        }).format(d);
    } catch {
        return "—";
    }
}

export function TouchLog(): JSX.Element {
    const scoped = touchesForRack.value;
    const all = allTouches.value;
    const hasRackScope = rack.value.accountName.trim().length > 0;
    const list = (hasRackScope ? scoped : all).slice(0, PREVIEW_LIMIT);
    // Outbound Studio audit (2026-05): empty-state copy rewritten —
    // the previous wording leaked internal architecture language
    // ("Phase 4 / Rooms 3 + 4 read this same table for execution-
    // context temperature").
    const emptyMsg = hasRackScope
        ? "No touches yet for this account. Click \"Log touch\" on the send line to start the trail."
        : "No touches logged yet. Every touch you log here flows into the account's heat score and the dashboard's ranking.";

    return (
        <section class="ob-log" aria-label="Touch log">
            <header class="ob-log__header">
                <p class="ob-log__kicker">TOUCH LOG</p>
                <span class="ob-log__count">
                    {hasRackScope
                        ? `${scoped.length} for active account`
                        : `${all.length} total`}
                </span>
            </header>
            {list.length === 0 ? (
                <p class="ob-log__empty">{emptyMsg}</p>
            ) : (
                <div class="ob-log__table-wrap">
                    <table class="ob-log__table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Account</th>
                                <th>Contact</th>
                                <th>Persona · Temp</th>
                                <th>Channel</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((t) => (
                                <tr key={t.id}>
                                    <td>{fmtDate(t.createdAt)}</td>
                                    <td>{t.accountName}</td>
                                    <td>{t.contactName || "—"}</td>
                                    <td>
                                        {PERSONA_LABELS[t.persona]} ·{" "}
                                        {TEMPERATURE_LABELS[t.temperature]}
                                    </td>
                                    <td>{t.channel}</td>
                                    <td>
                                        <select
                                            class="ob-log__outcome"
                                            value={t.outcome ?? ""}
                                            onChange={(e) => {
                                                const v = (
                                                    e.currentTarget as HTMLSelectElement
                                                ).value;
                                                const next =
                                                    v.length === 0
                                                        ? null
                                                        : (v as TouchOutcome);
                                                setTouchOutcome(t.id, next);
                                                const updated = allTouches.value.find(
                                                    (row) => row.id === t.id
                                                );
                                                if (updated) void saveTouch(updated);
                                            }}
                                        >
                                            <option value="">— Pending —</option>
                                            {TOUCH_OUTCOMES.map((o) => (
                                                <option key={o} value={o}>
                                                    {TOUCH_OUTCOME_LABELS[o]}
                                                </option>
                                            ))}
                                        </select>
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
