import type { JSX } from "preact";
import {
    actions,
    draft,
    logCue,
    patchDraft,
    stats,
    updateOutcome
} from "../state";
import {
    ACTION_LABELS,
    ACTION_TYPES,
    OUTCOMES,
    OUTCOME_LABELS,
    type ActionType,
    type Outcome
} from "../lib/types";
import { saveAction } from "../lib/cloud-persistence";

/**
 * CueLedger — Wave 4 implementation.
 *
 * Renders the ledger form (account / contact / cue type → submit) on the
 * left + the activity board (5-stat bar + most-recent activity table)
 * on the right. The form binds to `draft` via patchDraft; submitting
 * calls `logCue()` which freezes the active motion + cue into the entry
 * and persists via the side-effect wired in main.tsx. Outcome dropdown
 * on each row drives `updateOutcome()` for live accept/reply rate
 * recompute.
 */

const STAT_PRIMARY: ReadonlyArray<{
    readonly key: keyof StatsView;
    readonly label: string;
    readonly accent?: "green" | "gold";
}> = [
    { key: "total", label: "Actions" },
    { key: "connections", label: "Requests" },
    { key: "acceptRate", label: "Accept", accent: "green" },
    { key: "dms", label: "DMs" },
    { key: "replyRate", label: "Reply", accent: "gold" }
];

interface StatsView {
    readonly total: number;
    readonly connections: number;
    readonly acceptRate: number;
    readonly dms: number;
    readonly replyRate: number;
}

function fmtDate(iso: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    }).format(d);
}

function StatPill({
    value,
    label,
    accent
}: {
    readonly value: number | string;
    readonly label: string;
    readonly accent?: "green" | "gold";
}): JSX.Element {
    const accentClass = accent ? ` lp-stat__value--${accent}` : "";
    return (
        <div class="lp-stat">
            <p class={`lp-stat__value${accentClass}`}>{value}</p>
            <p class="lp-stat__label">{label}</p>
        </div>
    );
}

export function CueLedger(): JSX.Element {
    const d = draft.value;
    const s = stats.value;
    const list = actions.value.slice().reverse();
    const view: StatsView = {
        total: s.total,
        connections: s.connections,
        acceptRate: s.acceptRate,
        dms: s.dms,
        replyRate: s.replyRate
    };
    const hasContext = (d.accountName + d.contactName).trim().length > 0;

    return (
        <section class="lp-ledger" aria-label="Cue ledger and activity">
            <div class="lp-ledger__form-wrap">
                <p class="lp-ledger__kicker">CUE LEDGER</p>
                <h2 class="lp-ledger__title">
                    Log the touch while the cue is still fresh.
                </h2>
                <p class="lp-ledger__copy">
                    Signal Console points the account, Outbound reinforces
                    the angle, and this ledger proves whether LinkedIn is
                    compounding or stalling.
                </p>
                <form
                    class="lp-ledger__form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const entry = logCue();
                        if (entry) void saveAction(entry);
                    }}
                >
                    <label class="lp-ledger__field">
                        <span class="lp-ledger__field-label">Account</span>
                        <input
                            type="text"
                            class="lp-ledger__input"
                            placeholder="Company name"
                            value={d.accountName}
                            autoComplete="off"
                            onInput={(e) =>
                                patchDraft({
                                    accountName: (
                                        e.currentTarget as HTMLInputElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <label class="lp-ledger__field">
                        <span class="lp-ledger__field-label">Human</span>
                        <input
                            type="text"
                            class="lp-ledger__input"
                            placeholder="Person name"
                            value={d.contactName}
                            autoComplete="off"
                            onInput={(e) =>
                                patchDraft({
                                    contactName: (
                                        e.currentTarget as HTMLInputElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <label class="lp-ledger__field">
                        <span class="lp-ledger__field-label">Cue taken</span>
                        <select
                            class="lp-ledger__select"
                            value={d.actionType}
                            onChange={(e) =>
                                patchDraft({
                                    actionType: (
                                        e.currentTarget as HTMLSelectElement
                                    ).value as ActionType
                                })
                            }
                        >
                            {ACTION_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {ACTION_LABELS[t]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="submit"
                        class="lp-ledger__submit"
                        disabled={!hasContext}
                    >
                        Log cue
                    </button>
                </form>
            </div>
            <div class="lp-ledger__activity">
                <p class="lp-ledger__kicker">CHANNEL MEMORY</p>
                <div class="lp-stats" aria-label="Channel stats">
                    {STAT_PRIMARY.map((stat) => {
                        const value = view[stat.key];
                        const display =
                            stat.key === "acceptRate" ||
                            stat.key === "replyRate"
                                ? `${value}%`
                                : value;
                        return (
                            <StatPill
                                key={stat.key}
                                value={display}
                                label={stat.label}
                                {...(stat.accent
                                    ? { accent: stat.accent }
                                    : {})}
                            />
                        );
                    })}
                </div>
                {list.length === 0 ? (
                    // LinkedIn Playbook audit (2026-05): empty-state
                    // copy rewritten — previous version referenced
                    // gtmos_linkedin_log (internal architecture leak).
                    <p class="lp-ledger__empty">
                        No cues logged yet. Submit the form on the left
                        to start the trail — accept rate, reply rate, and
                        account-by-account memory live here.
                    </p>
                ) : (
                    <div class="lp-log-table-wrap">
                        <table class="lp-log-table">
                            <thead>
                                <tr>
                                    <th scope="col">Date</th>
                                    <th scope="col">Account</th>
                                    <th scope="col">Human</th>
                                    <th scope="col">Cue</th>
                                    <th scope="col">Outcome</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.slice(0, 10).map((a) => (
                                    <tr key={a.id}>
                                        <td>{fmtDate(a.createdAt)}</td>
                                        <td>{a.accountName || "—"}</td>
                                        <td>{a.contactName || "—"}</td>
                                        <td>
                                            <strong>
                                                {a.cueLabel ||
                                                    ACTION_LABELS[
                                                        a.actionType
                                                    ]}
                                            </strong>
                                            {a.recommendedNext ? (
                                                <small>
                                                    {a.recommendedNext}
                                                </small>
                                            ) : null}
                                        </td>
                                        <td>
                                            <select
                                                class="lp-outcome-select"
                                                value={a.outcome ?? ""}
                                                onChange={(e) => {
                                                    const v = (
                                                        e.currentTarget as HTMLSelectElement
                                                    ).value;
                                                    const next =
                                                        v.length === 0
                                                            ? null
                                                            : (v as Outcome);
                                                    updateOutcome(a.id, next);
                                                    const updated = actions.value.find(
                                                        (row) => row.id === a.id
                                                    );
                                                    if (updated) void saveAction(updated);
                                                }}
                                            >
                                                <option value="">—</option>
                                                {OUTCOMES.map((o) => (
                                                    <option key={o} value={o}>
                                                        {OUTCOME_LABELS[o]}
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
            </div>
        </section>
    );
}
