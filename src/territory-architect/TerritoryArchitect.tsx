import type { JSX } from "preact";
import {
    accountDraft,
    accounts,
    accountsByThesis,
    allocation,
    approachDraft,
    approaches,
    approachesByThesis,
    patchAccountDraft,
    patchApproachDraft,
    patchThesisDraft,
    removeAccount,
    removeApproach,
    removeThesis,
    retierAccount,
    saveAccountFromDraft,
    saveApproachFromDraft,
    saveThesisFromDraft,
    setAccountDisposition,
    theses,
    thesisDraft
} from "./state";
import {
    ACCOUNT_CEILING,
    TIER_IDS,
    TIER_LABELS,
    type DispositionState,
    type TierId
} from "./lib/types";

/**
 * TerritoryArchitect — Wave 1+2 root.
 *
 * Per canon §4.5 (Decision Bench, bright per founder directive):
 *   ┌─ HeroBand: thesis count, allocation summary, ceiling read
 *   ├─ ThesisStudio: form + thesis cards (each carries approaches +
 *   │  account count)
 *   ├─ ApproachLedger: form + approach list (per thesis)
 *   ├─ AccountTable: form + ranked list with retier + disposition
 *   └─ HandoffStrip
 */

const DISPOSITION_LABELS: Readonly<Record<DispositionState, string>> = {
    active: "Active",
    paused: "Paused",
    "closed-won": "Won",
    "closed-lost": "Lost",
    reroute: "Reroute"
};

function HeroBand(): JSX.Element {
    const a = allocation.value;
    const thesisCount = theses.value.length;
    return (
        <section class="ta-hero" aria-label="Territory hero">
            <p class="ta-hero__kicker">DECISION BENCH · TERRITORY ARCHITECT</p>
            <h1 class="ta-hero__title">
                <span>One territory.</span> One ceiling. Real bets.
            </h1>
            <p class="ta-hero__note">
                The territory is a map of strategic bets, not a list. Hold
                the 300-account ceiling and each row earns its place.
            </p>
            <div class="ta-hero__stats" aria-label="Territory stats">
                <div class="ta-stat">
                    <p class="ta-stat__value">{thesisCount}</p>
                    <p class="ta-stat__label">Theses</p>
                </div>
                {a.perTier.map((t) => (
                    <div class="ta-stat" key={t.tier}>
                        <p class="ta-stat__value">
                            {t.count}
                            <small>/{t.target}</small>
                        </p>
                        <p class="ta-stat__label">
                            {TIER_LABELS[t.tier].split(" ")[0]}
                        </p>
                    </div>
                ))}
                <div
                    class={`ta-stat ta-stat--${a.status}`}
                    aria-label="Territory ceiling"
                >
                    <p class="ta-stat__value">
                        {a.total}
                        <small>/{a.ceiling}</small>
                    </p>
                    <p class="ta-stat__label">Total · {a.status}</p>
                </div>
            </div>
        </section>
    );
}

function ThesisStudio(): JSX.Element {
    const d = thesisDraft.value;
    const list = theses.value;
    const counts = accountsByThesis.value;
    const byThesis = approachesByThesis.value;
    return (
        <section class="ta-block" aria-label="Thesis studio">
            <header class="ta-block__head">
                <p class="ta-block__kicker">THESIS STUDIO</p>
                <h2 class="ta-block__title">
                    Each thesis is one strategic bet — pressure, segment,
                    why-us, tier.
                </h2>
            </header>
            <form
                class="ta-form ta-form--thesis"
                onSubmit={(e) => {
                    e.preventDefault();
                    saveThesisFromDraft();
                }}
            >
                <label class="ta-field">
                    <span class="ta-field__label">Title</span>
                    <input
                        class="ta-input"
                        type="text"
                        placeholder="e.g. Procurement consolidation Q2"
                        value={d.title}
                        onInput={(e) =>
                            patchThesisDraft({
                                title: (e.currentTarget as HTMLInputElement).value
                            })
                        }
                    />
                </label>
                <label class="ta-field">
                    <span class="ta-field__label">Tier</span>
                    <select
                        class="ta-select"
                        value={d.tier}
                        onChange={(e) =>
                            patchThesisDraft({
                                tier: (
                                    e.currentTarget as HTMLSelectElement
                                ).value as TierId
                            })
                        }
                    >
                        {TIER_IDS.map((t) => (
                            <option key={t} value={t}>
                                {TIER_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </label>
                <label class="ta-field ta-field--full">
                    <span class="ta-field__label">Pressure (why now)</span>
                    <textarea
                        class="ta-textarea"
                        placeholder="What's making this segment have to act now?"
                        value={d.pressure}
                        onInput={(e) =>
                            patchThesisDraft({
                                pressure: (
                                    e.currentTarget as HTMLTextAreaElement
                                ).value
                            })
                        }
                    />
                </label>
                <label class="ta-field ta-field--full">
                    <span class="ta-field__label">Segment</span>
                    <input
                        class="ta-input"
                        type="text"
                        placeholder="Industry · size · geo summary"
                        value={d.segment}
                        onInput={(e) =>
                            patchThesisDraft({
                                segment: (
                                    e.currentTarget as HTMLInputElement
                                ).value
                            })
                        }
                    />
                </label>
                <label class="ta-field ta-field--full">
                    <span class="ta-field__label">Why us (the angle)</span>
                    <textarea
                        class="ta-textarea"
                        placeholder="Why this team is the right seller for this thesis"
                        value={d.whyUs}
                        onInput={(e) =>
                            patchThesisDraft({
                                whyUs: (
                                    e.currentTarget as HTMLTextAreaElement
                                ).value
                            })
                        }
                    />
                </label>
                <button
                    type="submit"
                    class="ta-save-btn"
                    disabled={d.title.trim().length === 0}
                >
                    Save thesis
                </button>
            </form>

            {list.length === 0 ? (
                <p class="ta-empty">
                    No theses yet. Each saved thesis carries a tier + a list
                    of approaches + the accounts tagged with it.
                </p>
            ) : (
                <ul class="ta-thesis-list">
                    {list.map((t) => (
                        <li
                            key={t.id}
                            class={`ta-thesis ta-thesis--${t.tier}`}
                        >
                            <header class="ta-thesis__head">
                                <strong>{t.title}</strong>
                                <span class={`ta-tier ta-tier--${t.tier}`}>
                                    {TIER_LABELS[t.tier]}
                                </span>
                            </header>
                            {t.pressure ? <p>{t.pressure}</p> : null}
                            {t.segment ? (
                                <p class="ta-thesis__segment">{t.segment}</p>
                            ) : null}
                            <footer class="ta-thesis__foot">
                                <span>
                                    {(byThesis[t.id] ?? []).length}{" "}
                                    approaches
                                </span>
                                <span>{counts[t.id] ?? 0} accounts</span>
                                <button
                                    type="button"
                                    class="ta-remove"
                                    onClick={() => removeThesis(t.id)}
                                >
                                    Remove
                                </button>
                            </footer>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function ApproachLedger(): JSX.Element {
    const d = approachDraft.value;
    const list = approaches.value;
    const ts = theses.value;
    const titleById: Record<string, string> = {};
    for (const t of ts) titleById[t.id] = t.title;
    return (
        <section class="ta-block" aria-label="Approach ledger">
            <header class="ta-block__head">
                <p class="ta-block__kicker">APPROACH LEDGER</p>
                <h2 class="ta-block__title">
                    Each approach is a reusable script for one thesis.
                </h2>
            </header>
            <form
                class="ta-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    saveApproachFromDraft();
                }}
            >
                <label class="ta-field">
                    <span class="ta-field__label">Approach name</span>
                    <input
                        class="ta-input"
                        type="text"
                        placeholder="e.g. Procurement-led intro"
                        value={d.name}
                        onInput={(e) =>
                            patchApproachDraft({
                                name: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>
                <label class="ta-field">
                    <span class="ta-field__label">Thesis</span>
                    <select
                        class="ta-select"
                        value={d.thesisId}
                        onChange={(e) =>
                            patchApproachDraft({
                                thesisId: (
                                    e.currentTarget as HTMLSelectElement
                                ).value
                            })
                        }
                    >
                        <option value="">Choose thesis…</option>
                        {ts.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                </label>
                <label class="ta-field ta-field--full">
                    <span class="ta-field__label">When to use</span>
                    <input
                        class="ta-input"
                        type="text"
                        placeholder="Trigger or scenario this approach fits"
                        value={d.trigger}
                        onInput={(e) =>
                            patchApproachDraft({
                                trigger: (
                                    e.currentTarget as HTMLInputElement
                                ).value
                            })
                        }
                    />
                </label>
                <label class="ta-field ta-field--full">
                    <span class="ta-field__label">Script</span>
                    <textarea
                        class="ta-textarea"
                        placeholder="The send-line / talk-track skeleton"
                        value={d.script}
                        onInput={(e) =>
                            patchApproachDraft({
                                script: (
                                    e.currentTarget as HTMLTextAreaElement
                                ).value
                            })
                        }
                    />
                </label>
                <label class="ta-field ta-field--full">
                    <span class="ta-field__label">Bridge phrasing</span>
                    <textarea
                        class="ta-textarea"
                        placeholder="Objection-handling bridge"
                        value={d.bridge}
                        onInput={(e) =>
                            patchApproachDraft({
                                bridge: (
                                    e.currentTarget as HTMLTextAreaElement
                                ).value
                            })
                        }
                    />
                </label>
                <button
                    type="submit"
                    class="ta-save-btn"
                    disabled={
                        d.name.trim().length === 0 || !d.thesisId
                    }
                >
                    Save approach
                </button>
            </form>

            {list.length === 0 ? (
                <p class="ta-empty">
                    No approaches yet. Save a thesis first, then attach an
                    approach to it.
                </p>
            ) : (
                <ul class="ta-approach-list">
                    {list.map((a) => (
                        <li key={a.id} class="ta-approach">
                            <header>
                                <strong>{a.name}</strong>
                                <small>
                                    {titleById[a.thesisId] ?? "Unattached"}
                                </small>
                            </header>
                            {a.trigger ? (
                                <p class="ta-approach__trigger">
                                    <em>When:</em> {a.trigger}
                                </p>
                            ) : null}
                            {a.script ? (
                                <p class="ta-approach__script">{a.script}</p>
                            ) : null}
                            <button
                                type="button"
                                class="ta-remove"
                                onClick={() => removeApproach(a.id)}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function AccountTable(): JSX.Element {
    const d = accountDraft.value;
    const list = accounts.value;
    const ts = theses.value;
    const ap = approaches.value;
    const a = allocation.value;
    const titleById: Record<string, string> = {};
    for (const t of ts) titleById[t.id] = t.title;
    const approachOptions = d.thesisId
        ? ap.filter((x) => x.thesisId === d.thesisId)
        : ap;
    return (
        <section class="ta-block" aria-label="Account table">
            <header class="ta-block__head">
                <p class="ta-block__kicker">ACCOUNT TABLE</p>
                <h2 class="ta-block__title">
                    300-account ceiling. Each row is a strategic bet, not an
                    intent score.
                </h2>
                <p class="ta-block__note">
                    {a.remaining > 0
                        ? `${a.remaining} of ${ACCOUNT_CEILING} slots remaining.`
                        : a.remaining === 0
                          ? `At cap (${ACCOUNT_CEILING}). To add a new account, swap one out first.`
                          : `Over cap by ${Math.abs(a.remaining)}. Retier or close to come back inside the ceiling.`}
                </p>
            </header>
            <form
                class="ta-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    saveAccountFromDraft();
                }}
            >
                <label class="ta-field">
                    <span class="ta-field__label">Account name</span>
                    <input
                        class="ta-input"
                        type="text"
                        placeholder="Account / company"
                        value={d.name}
                        onInput={(e) =>
                            patchAccountDraft({
                                name: (e.currentTarget as HTMLInputElement)
                                    .value
                            })
                        }
                    />
                </label>
                <label class="ta-field">
                    <span class="ta-field__label">Tier</span>
                    <select
                        class="ta-select"
                        value={d.tier}
                        onChange={(e) =>
                            patchAccountDraft({
                                tier: (
                                    e.currentTarget as HTMLSelectElement
                                ).value as TierId
                            })
                        }
                    >
                        {TIER_IDS.map((t) => (
                            <option key={t} value={t}>
                                {TIER_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </label>
                <label class="ta-field">
                    <span class="ta-field__label">Thesis</span>
                    <select
                        class="ta-select"
                        value={d.thesisId}
                        onChange={(e) =>
                            patchAccountDraft({
                                thesisId: (
                                    e.currentTarget as HTMLSelectElement
                                ).value,
                                approachId: ""
                            })
                        }
                    >
                        <option value="">Choose thesis…</option>
                        {ts.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                </label>
                <label class="ta-field">
                    <span class="ta-field__label">Approach</span>
                    <select
                        class="ta-select"
                        value={d.approachId}
                        onChange={(e) =>
                            patchAccountDraft({
                                approachId: (
                                    e.currentTarget as HTMLSelectElement
                                ).value
                            })
                        }
                    >
                        <option value="">No approach yet</option>
                        {approachOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label class="ta-field ta-field--full">
                    <span class="ta-field__label">Notes</span>
                    <input
                        class="ta-input"
                        type="text"
                        placeholder="Optional: research note, contact, signal..."
                        value={d.notes}
                        onInput={(e) =>
                            patchAccountDraft({
                                notes: (
                                    e.currentTarget as HTMLInputElement
                                ).value
                            })
                        }
                    />
                </label>
                <button
                    type="submit"
                    class="ta-save-btn"
                    disabled={
                        d.name.trim().length === 0 ||
                        !d.thesisId ||
                        a.status === "at-cap" ||
                        a.status === "over"
                    }
                >
                    Add account
                </button>
            </form>
            {list.length === 0 ? (
                <p class="ta-empty">
                    No accounts yet. Save a thesis, then add accounts that
                    belong to it.
                </p>
            ) : (
                <table class="ta-table">
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th>Tier</th>
                            <th>Thesis</th>
                            <th>Disposition</th>
                            <th aria-label="actions" />
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((acct) => (
                            <tr
                                key={acct.id}
                                class={`ta-row ta-row--${acct.disposition}`}
                            >
                                <td>
                                    <strong>{acct.name}</strong>
                                    {acct.notes ? (
                                        <small>{acct.notes}</small>
                                    ) : null}
                                </td>
                                <td>
                                    <select
                                        class="ta-tier-pick"
                                        value={acct.tier}
                                        onChange={(e) =>
                                            retierAccount(
                                                acct.id,
                                                (
                                                    e.currentTarget as HTMLSelectElement
                                                ).value as TierId
                                            )
                                        }
                                    >
                                        {TIER_IDS.map((t) => (
                                            <option key={t} value={t}>
                                                {t.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>{titleById[acct.thesisId] ?? "—"}</td>
                                <td>
                                    <select
                                        class="ta-disp-pick"
                                        value={acct.disposition}
                                        onChange={(e) =>
                                            setAccountDisposition(
                                                acct.id,
                                                (
                                                    e.currentTarget as HTMLSelectElement
                                                ).value as DispositionState
                                            )
                                        }
                                    >
                                        {Object.entries(
                                            DISPOSITION_LABELS
                                        ).map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        class="ta-remove"
                                        onClick={() => removeAccount(acct.id)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

function HandoffStrip(): JSX.Element {
    return (
        <nav class="ta-handoffs" aria-label="Cross-room handoff">
            <a class="ta-handoff" href="/app/icp-studio/">
                Open ICP Studio
            </a>
            <a class="ta-handoff" href="/app/sourcing-workbench/">
                Open Sourcing Workbench
            </a>
            <a class="ta-handoff" href="/app/signal-console/">
                Open Signal Console
            </a>
        </nav>
    );
}

export function TerritoryArchitect(): JSX.Element {
    return (
        <div class="ta-shell">
            <HeroBand />
            <ThesisStudio />
            <ApproachLedger />
            <AccountTable />
            <HandoffStrip />
        </div>
    );
}
