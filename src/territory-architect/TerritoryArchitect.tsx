import type { JSX } from "preact";
import { computed } from "@preact/signals";
import { RoomChrome } from "@/lib/room-chrome";
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
import {
    deleteArtifactInCloud,
    saveAccount,
    saveApproach,
    saveThesis
} from "./lib/cloud-persistence";
import {
    hrefToIcpStudio,
    hrefToSignalConsole,
    hrefToSourcingWorkbench
} from "./lib/handoff";
import { focusedIcp } from "./state";
import { computeFieldRead } from "./lib/field-read";

/**
 * Program 6 / PR 12 — live field read for the Signal Field hero.
 *
 * The wireframe's read-dock surfaces score + main risk + replacement
 * + operator move. We compute that off the live signals so the hero
 * tells the operator what the territory is saying, not just how
 * many rows exist.
 */
const fieldRead = computed(() =>
    computeFieldRead({
        accounts: accounts.value,
        theses: theses.value,
        approaches: approaches.value,
        allocation: allocation.value
    })
);

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

const STATUS_LABELS: Readonly<Record<"headroom" | "at-cap" | "over", string>> = {
    "headroom": "Room to add",
    "at-cap": "At cap",
    "over": "Over cap"
};

function HeroBand(): JSX.Element {
    const a = allocation.value;
    const thesisCount = theses.value.length;
    const focus = focusedIcp.value;
    const read = fieldRead.value;
    // Phase 2.3 — inbound focus from ICP Studio (or any upstream room
    // passing `?focusObject=`) surfaces in the kicker tail so the
    // operator sees the ICP context the room is building against.
    const baseKicker =
        thesisCount > 0
            ? `TERRITORY ARCHITECT · ${thesisCount} ${thesisCount === 1 ? "thesis" : "theses"} · ${a.total}/${a.ceiling} accounts`
            : "TERRITORY ARCHITECT";
    const kicker = focus
        ? `${baseKicker} · building around: ${focus}`
        : baseKicker;
    return (
        <section class="ta-hero" aria-label="Territory hero">
            <RoomChrome kicker="TERRITORY ARCHITECT" />
            <p class="ta-hero__kicker">{kicker}</p>
            <div class="ta-hero__grid">
                <div class="ta-hero__lead">
                    <h1 class="ta-hero__title">
                        <span>One territory.</span> One ceiling. Real bets.
                    </h1>
                    <p class="ta-hero__note">
                        The territory is a map of strategic bets, not a list.
                        Hold the 300-account ceiling; every row should be
                        worth it.
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
                                    {TIER_LABELS[t.tier]}
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
                            <p class="ta-stat__label">
                                Accounts · {STATUS_LABELS[a.status] ?? a.status}
                            </p>
                        </div>
                    </div>
                </div>
                {/*
                  Program 6 / PR 12 — Field Read aside.
                  Per the picked-winner Variant 02 / Signal Field
                  refinement the hero should INTERPRET the territory,
                  not just count rows. Score + Main risk + Replacement
                  pressure + Operator move from the live field-read
                  engine.
                */}
                <aside
                    class={`ta-field-read ta-field-read--${read.band}`}
                    aria-label="Field read"
                >
                    <div class="ta-field-read__score-row">
                        <div>
                            <p class="ta-field-read__kicker">FIELD READ</p>
                            <p class="ta-field-read__band">{read.bandLabel}</p>
                        </div>
                        <p class="ta-field-read__score">{read.score}</p>
                    </div>
                    <div class="ta-field-read__line">
                        <p class="ta-field-read__line-label">Main risk</p>
                        <p class="ta-field-read__line-copy">{read.mainRisk}</p>
                    </div>
                    <div class="ta-field-read__line">
                        <p class="ta-field-read__line-label">
                            Replacement pressure
                        </p>
                        <p class="ta-field-read__line-copy">
                            {read.replacement}
                        </p>
                    </div>
                    <div class="ta-field-read__line ta-field-read__line--move">
                        <p class="ta-field-read__line-label">Operator move</p>
                        <p class="ta-field-read__line-copy">
                            {read.operatorMove}
                        </p>
                    </div>
                </aside>
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
                <p class="ta-block__kicker">THESES</p>
                <h2 class="ta-block__title">
                    Each thesis is one strategic bet on a segment.
                </h2>
            </header>
            <form
                class="ta-form ta-form--thesis"
                onSubmit={(e) => {
                    e.preventDefault();
                    const t = saveThesisFromDraft();
                    if (t) void saveThesis(t);
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
                    <span class="ta-field__label">Why we win</span>
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
                    No theses yet. Save one above to start building the
                    territory.
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
                                    onClick={() => {
                                        removeThesis(t.id);
                                        void deleteArtifactInCloud(t.id);
                                    }}
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
                <p class="ta-block__kicker">APPROACHES</p>
                <h2 class="ta-block__title">
                    Reusable talk-tracks, one per thesis.
                </h2>
            </header>
            <form
                class="ta-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    const a = saveApproachFromDraft();
                    if (a) void saveApproach(a);
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
                        placeholder="The trigger that makes this approach fit"
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
                    <span class="ta-field__label">Talk-track</span>
                    <textarea
                        class="ta-textarea"
                        placeholder="The send-line / opening line skeleton"
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
                    <span class="ta-field__label">Objection bridge</span>
                    <textarea
                        class="ta-textarea"
                        placeholder="How to bridge past the most common pushback"
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
                                onClick={() => {
                                    removeApproach(a.id);
                                    void deleteArtifactInCloud(a.id);
                                }}
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
                <p class="ta-block__kicker">ACCOUNTS</p>
                <h2 class="ta-block__title">
                    Each row is a strategic bet — kept under the 300 ceiling.
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
                    const a = saveAccountFromDraft();
                    if (a) void saveAccount(a);
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
                                        onChange={(e) => {
                                            retierAccount(
                                                acct.id,
                                                (
                                                    e.currentTarget as HTMLSelectElement
                                                ).value as TierId
                                            );
                                            const updated = accounts.value.find(
                                                (x) => x.id === acct.id
                                            );
                                            if (updated) void saveAccount(updated);
                                        }}
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
                                        onChange={(e) => {
                                            setAccountDisposition(
                                                acct.id,
                                                (
                                                    e.currentTarget as HTMLSelectElement
                                                ).value as DispositionState
                                            );
                                            const updated = accounts.value.find(
                                                (x) => x.id === acct.id
                                            );
                                            if (updated) void saveAccount(updated);
                                        }}
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
                                        onClick={() => {
                                            removeAccount(acct.id);
                                            void deleteArtifactInCloud(acct.id);
                                        }}
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
    const focus = focusedIcp.value;
    return (
        <section class="ta-handoff-strip" aria-label="Carry the territory forward">
            <p class="ta-handoff-strip__kicker">CARRY THE TERRITORY FORWARD</p>
            <nav class="ta-handoffs" aria-label="Cross-room handoff">
                <a
                    class="ta-handoff ta-handoff--primary"
                    href={hrefToSourcingWorkbench(focus)}
                >
                    Source named prospects
                </a>
                <a
                    class="ta-handoff"
                    href={hrefToSignalConsole(focus)}
                >
                    Rank live signals
                </a>
                <a class="ta-handoff" href={hrefToIcpStudio(focus)}>
                    Sharpen the ICP
                </a>
            </nav>
        </section>
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
