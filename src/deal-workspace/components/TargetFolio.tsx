import type { JSX } from "preact";
import {
    activeDeals,
    folioTab,
    focusedDeal,
    openDealEditor,
    setFolioTab,
    type FolioTab
} from "../state";
import { assessDeal, rankRecovery } from "../lib/recovery";
import { FolioDock } from "./FolioDock";

/**
 * TargetFolio — right column of the stage-grid per variant-B.
 *
 * The "commissioned case" — a single live deal pulled out as the
 * focal object the room sharpens first. Carries:
 *   - target-kicker + target-head (account name + value)
 *   - target-copy (the room's read of why this deal matters now)
 *   - signal-grid (3 rows: Risk / Proof / Motion)
 *   - folio-dock (4 tabs that rotate the lower content)
 *
 * Deal detail lives HERE, not in a full-screen modal. The
 * DealHealthModal is still accessible via "Open detail" for the
 * 9-field health form, but the operator works the deal inline first.
 */

const TAB_LABEL: Record<FolioTab, string> = {
    drags: "Active drags",
    win: "One-session win",
    weighted: "Weighted truth",
    queue: "Recovery queue"
};

function fmtMoney(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
}

export function TargetFolio(): JSX.Element {
    const deal = focusedDeal.value;

    if (!deal) {
        return (
            <section class="dw-target-folio dw-target-folio--empty">
                <p class="dw-target-folio__empty">
                    No active deal to focus. Add a deal — the workspace
                    will surface the highest-pressure case here.
                </p>
            </section>
        );
    }

    const assessment = assessDeal(deal);
    const tab = folioTab.value;

    return (
        <section
            class="dw-target-folio"
            aria-label={`Commissioned case: ${deal.accountName}`}
        >
            <div class="dw-target-folio__head">
                <p class="dw-target-folio__kicker">Commissioned case</p>
                <div class="dw-target-folio__heading">
                    <h2 class="dw-target-folio__title">{deal.accountName}</h2>
                    <span class="dw-target-folio__value">
                        {fmtMoney(deal.value || 0)}
                    </span>
                </div>
                <p class="dw-target-folio__copy">
                    The live case the room should sharpen first. If it
                    can't survive pressure, the rest of the board becomes
                    decorative.
                </p>
            </div>

            <ul class="dw-signal-grid">
                <li class="dw-signal-row">
                    <span class="dw-signal__mark dw-signal__mark--risk">!</span>
                    <span class="dw-signal__label">Risk</span>
                    <span class="dw-signal__copy">
                        {assessment
                            ? assessment.causes[0] ?? "No active risk"
                            : "Closed deal"}
                    </span>
                </li>
                <li class="dw-signal-row">
                    <span class="dw-signal__mark dw-signal__mark--proof">≡</span>
                    <span class="dw-signal__label">Proof</span>
                    <span class="dw-signal__copy">
                        {(deal.useCase ?? "").trim() === ""
                            ? "Thin · use-case not locked"
                            : `Locked · ${deal.useCase}`}
                    </span>
                </li>
                <li class="dw-signal-row">
                    <span class="dw-signal__mark dw-signal__mark--motion">→</span>
                    <span class="dw-signal__label">Motion</span>
                    <span class="dw-signal__copy">
                        {(deal.nextStep ?? "").trim() === ""
                            ? "Stalled · no next step set"
                            : `Next: ${deal.nextStep}`}
                    </span>
                </li>
            </ul>

            <div class="dw-target-folio__detail-actions">
                <button
                    type="button"
                    class="dw-target-folio__open-detail"
                    onClick={() => openDealEditor(deal)}
                >
                    Open 9-field detail →
                </button>
            </div>

            <FolioDock active={tab} onChange={setFolioTab} label={TAB_LABEL} />
            <FolioPanel tab={tab} />
        </section>
    );
}

function FolioPanel(props: { readonly tab: FolioTab }): JSX.Element {
    const all = activeDeals.value;
    const ranked = rankRecovery(all);
    const drags = ranked.filter(
        (r) => r.lane === "critical" || r.lane === "at-risk"
    );

    if (props.tab === "drags") {
        return (
            <div class="dw-folio-panel">
                <p class="dw-folio-panel__count">
                    {drags.length} active{" "}
                    {drags.length === 1 ? "drag" : "drags"} on the board
                </p>
                <ul class="dw-folio-panel__list">
                    {drags.slice(0, 5).map((r) => (
                        <li key={r.deal.id} class="dw-folio-panel__row">
                            <span
                                class={`dw-folio-panel__badge dw-folio-panel__badge--${r.lane}`}
                            >
                                {r.lane}
                            </span>
                            <span class="dw-folio-panel__name">
                                {r.deal.accountName}
                            </span>
                            <span class="dw-folio-panel__cause">
                                {r.causes[0] ?? "—"}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    if (props.tab === "win") {
        const top = ranked[0];
        if (!top) {
            return (
                <div class="dw-folio-panel">
                    <p class="dw-folio-panel__empty">
                        No recoverable deals — board is healthy.
                    </p>
                </div>
            );
        }
        return (
            <div class="dw-folio-panel">
                <p class="dw-folio-panel__lead">
                    Recover <strong>{top.deal.accountName}</strong> first.
                </p>
                <p class="dw-folio-panel__copy">{top.nextMove}</p>
            </div>
        );
    }

    if (props.tab === "weighted") {
        const total = all.reduce((s, d) => s + (d.value || 0), 0);
        return (
            <div class="dw-folio-panel">
                <p class="dw-folio-panel__lead">
                    {fmtMoney(total)} unweighted across {all.length} active
                    deals.
                </p>
                <p class="dw-folio-panel__copy">
                    Weighted truth = stage probability × value. Stage isn't
                    truth unless next-step truth backs it up.
                </p>
            </div>
        );
    }

    // tab === "queue"
    return (
        <div class="dw-folio-panel">
            <ul class="dw-folio-panel__list">
                {ranked.slice(0, 8).map((r) => (
                    <li key={r.deal.id} class="dw-folio-panel__row">
                        <span
                            class={`dw-folio-panel__badge dw-folio-panel__badge--${r.lane}`}
                        >
                            {r.lane}
                        </span>
                        <span class="dw-folio-panel__name">
                            {r.deal.accountName}
                        </span>
                        <span class="dw-folio-panel__cause">{r.nextMove}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
