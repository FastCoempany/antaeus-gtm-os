import type { JSX } from "preact";
import { useState } from "preact/hooks";
import {
    activeDeals,
    dealFilter,
    focusedDealId,
    setFocusedDealId
} from "../state";
import { STAGE_LABELS, type Deal } from "../lib/deal-shape";
import { assessDeal, rankRecovery } from "../lib/recovery";

/**
 * DealList — searchable table of every active deal.
 *
 * Deal Workspace audit (2026-05) found a major gap: the room had no
 * deal-list affordance anywhere on the main surface. The TargetFolio
 * shows one focal case; the LaneGrid + MicroGrid show aggregates;
 * the FolioDock has a queue tab but it's nested and hard to find.
 *
 * A CRO with 30 active deals needs:
 *   - search by account name
 *   - one-click to pin a specific deal as the focal case
 *   - at-a-glance read of stage, value, lane, next-step gap
 *
 * Per canon §4.13 (Diagnosis Table): the room is still ranked-pressure
 * first. Default sort is rank order (recovery ranking). Operator can
 * search but cannot manually reorder — the system's heat ranking is
 * authoritative.
 */
function fmtMoney(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
}

function laneOf(deal: Deal): string {
    const a = assessDeal(deal);
    if (!a) return "—";
    return a.lane;
}

export function DealList(): JSX.Element | null {
    const [query, setQuery] = useState("");
    const all = activeDeals.value;
    if (all.length === 0) return null;

    const ranked = rankRecovery(all).map((r) => r.deal);
    const focused = focusedDealId.value;
    const filter = dealFilter.value;

    const q = query.trim().toLowerCase();
    const filteredByQuery = q
        ? ranked.filter(
              (d) =>
                  d.accountName.toLowerCase().includes(q) ||
                  (d.champion ?? "").toLowerCase().includes(q)
          )
        : ranked;

    // Respect the active filter chip too.
    const finalList = filteredByQuery.filter((d) => {
        if (filter === "all") return true;
        if (filter === "at-risk") {
            const lane = laneOf(d);
            return lane === "critical" || lane === "at-risk";
        }
        if (filter === "stalled") {
            return !d.nextStep || !d.nextStep.trim();
        }
        if (filter === "this-quarter") {
            if (!d.closeDate) return false;
            const close = new Date(d.closeDate);
            const now = new Date();
            const q1 = Math.floor(now.getMonth() / 3);
            const closeQ = Math.floor(close.getMonth() / 3);
            return (
                close.getFullYear() === now.getFullYear() && closeQ === q1
            );
        }
        return true;
    });

    return (
        <section class="dw-deal-list" aria-label="Deal list">
            <header class="dw-deal-list__head">
                <h2 class="dw-deal-list__title">
                    All active deals
                    <span class="dw-deal-list__count">
                        {finalList.length} of {all.length}
                    </span>
                </h2>
                <label class="dw-deal-list__search">
                    <span class="dw-deal-list__search-label">SEARCH</span>
                    <input
                        type="search"
                        placeholder="Find by account or champion…"
                        value={query}
                        onInput={(e) =>
                            setQuery(
                                (e.currentTarget as HTMLInputElement).value
                            )
                        }
                    />
                </label>
            </header>

            {finalList.length === 0 ? (
                <p class="dw-deal-list__empty">
                    No deals match.{" "}
                    {q ? (
                        <button
                            type="button"
                            class="dw-deal-list__clear"
                            onClick={() => setQuery("")}
                        >
                            Clear search
                        </button>
                    ) : null}
                </p>
            ) : (
                <ul class="dw-deal-list__rows">
                    {finalList.map((d) => {
                        const lane = laneOf(d);
                        const isFocused = focused === d.id;
                        return (
                            <li key={d.id}>
                                <button
                                    type="button"
                                    class={`dw-deal-row${
                                        isFocused ? " is-focused" : ""
                                    }`}
                                    onClick={() => setFocusedDealId(d.id)}
                                    aria-pressed={isFocused}
                                    title={
                                        isFocused
                                            ? "Currently in the folio"
                                            : "Pin as the focal case"
                                    }
                                >
                                    <span class="dw-deal-row__name">
                                        {d.accountName || "(untitled)"}
                                    </span>
                                    <span class="dw-deal-row__stage">
                                        {STAGE_LABELS[d.stage] ?? d.stage}
                                    </span>
                                    <span class="dw-deal-row__value">
                                        {fmtMoney(d.value || 0)}
                                    </span>
                                    <span class="dw-deal-row__nextstep">
                                        {d.nextStep && d.nextStep.trim()
                                            ? d.nextStep
                                            : "no next step"}
                                    </span>
                                    {lane !== "—" ? (
                                        <span
                                            class={`dw-deal-row__lane dw-deal-row__lane--${lane}`}
                                        >
                                            {lane}
                                        </span>
                                    ) : null}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
