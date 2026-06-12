import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { useState } from "preact/hooks";
import {
    activeDeals,
    dealFilter,
    focusedDealId,
    setDealFilter,
    setFocusedDealId
} from "../state";
import { type Deal } from "../lib/deal-shape";
import {
    rankRecovery,
    type RecoveryAssessment
} from "../lib/recovery";

/**
 * InterventionRail — Program 6 / PR 6 (lower board rebuild from
 * Intervention Rail).
 *
 * Replaces the Wave 1 / Phase 2.6 surface (LaneGrid summary + FilterBar
 * chips + DealList table) with the picked-winner Intervention Rail
 * composition from `deliverables/prototypes/wireframes/antaeus-deal-
 * workspace-board-area-triptych-v2-2026-04-08.html` (Variant 02 ·
 * Intervention Rail).
 *
 * Layout: toolbar (search + Now/Next/Reserve pills + Run intervention
 * primary) → filter strip → 3 rail rows (Now / Next / Keep honest).
 * Now + Next rows carry full deal tickets; Keep honest renders a
 * reserve of compact tags.
 *
 * Click a ticket → pins as focal case (focusedDealId signal). The
 * TargetFolio re-renders around the new focal case.
 *
 * Click a pill → scopes the rail via dealFilter (same signal the
 * old FilterBar mutated). Pills map: Now → at-risk filter, Next →
 * stalled, Reserve → this-quarter — semantic mapping into the
 * pre-existing DealFilter enum.
 */

function fmtMoney(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
}

interface LaneGroup {
    readonly now: ReadonlyArray<RecoveryAssessment>;
    readonly next: ReadonlyArray<RecoveryAssessment>;
    readonly keepHonest: ReadonlyArray<RecoveryAssessment>;
}

function groupByRail(
    ranked: ReadonlyArray<RecoveryAssessment>
): LaneGroup {
    const critical = ranked.filter((r) => r.lane === "critical");
    const atRisk = ranked.filter((r) => r.lane === "at-risk");
    const healthy = ranked.filter((r) => r.lane === "healthy");
    return {
        now: critical,
        next: atRisk.slice(0, 1),
        keepHonest: [...atRisk.slice(1), ...healthy]
    };
}

function ticketEdgeFor(
    lane: RecoveryAssessment["lane"]
): "risk" | "motion" | "healthy" {
    if (lane === "critical") return "risk";
    if (lane === "at-risk") return "motion";
    return "healthy";
}

function actionLabelFor(
    lane: RecoveryAssessment["lane"]
): string {
    if (lane === "critical") return t("Recover now");
    if (lane === "at-risk") return t("Tighten path");
    return t("Keep honest");
}

type Filter = "all" | "at-risk" | "stalled" | "this-quarter";

export function InterventionRail(): JSX.Element {
    const [query, setQuery] = useState("");
    const all = activeDeals.value;
    const filter = dealFilter.value;
    const focused = focusedDealId.value;
    const ranked = rankRecovery(all);

    const q = query.trim().toLowerCase();
    const filteredByQuery = q
        ? ranked.filter(
              (r) =>
                  r.deal.accountName.toLowerCase().includes(q) ||
                  (r.deal.champion ?? "").toLowerCase().includes(q)
          )
        : ranked;

    const groups = groupByRail(filteredByQuery);

    if (all.length === 0) {
        return (
            <section
                class="dw-rail dw-rail--empty"
                aria-label={t("Intervention rail")}
            >
                <p class="dw-rail__empty">
                    {t(
                        "No deals on the board yet. Add a deal — the workspace will rank intervention urgency here.",
                        { class: "body" }
                    )}
                </p>
            </section>
        );
    }

    return (
        <section class="dw-rail" aria-label={t("Intervention rail")}>
            <Toolbar
                query={query}
                onQuery={setQuery}
                now={groups.now.length}
                next={groups.next.length}
                reserve={groups.keepHonest.length}
                onRunIntervention={() => {
                    const target =
                        groups.now[0]?.deal ?? groups.next[0]?.deal;
                    if (target) setFocusedDealId(target.id);
                }}
                activeFilter={filter}
                onFilter={setDealFilter}
            />

            <FilterStrip filter={filter} />

            <div class="dw-rail__layout">
                <RailRow
                    state={t("Now")}
                    copy={t(
                        "Fix these today. If you leave them, they're going to drag the rest of the board down.",
                        { class: "body" }
                    )}
                    items={groups.now}
                    focused={focused}
                    onPin={setFocusedDealId}
                    mode="ticket"
                    emptyCopy={t(
                        "No deals in the critical lane right now — the board is clean.",
                        { class: "body" }
                    )}
                />
                <RailRow
                    state={t("Next")}
                    copy={t(
                        "Tighten one live opportunity, but only after the critical-lane deals are handled.",
                        { class: "body" }
                    )}
                    items={groups.next}
                    focused={focused}
                    onPin={setFocusedDealId}
                    mode="ticket"
                    emptyCopy={t(
                        "Nothing in the at-risk lane yet — keep the Now row clean first.",
                        { class: "body" }
                    )}
                />
                <RailRow
                    state={t("Keep honest")}
                    copy={t(
                        "The reserve shows up here as signals, not as full deal cards — so the room doesn't repeat itself.",
                        { class: "body" }
                    )}
                    items={groups.keepHonest}
                    focused={focused}
                    onPin={setFocusedDealId}
                    mode="reserve"
                    emptyCopy={t(
                        "No reserve deals — every live deal is in the Now or Next row.",
                        { class: "body" }
                    )}
                />
            </div>
        </section>
    );
}

// ─── Toolbar ──────────────────────────────────────────────────────

function Toolbar(props: {
    readonly query: string;
    readonly onQuery: (q: string) => void;
    readonly now: number;
    readonly next: number;
    readonly reserve: number;
    readonly onRunIntervention: () => void;
    readonly activeFilter: Filter;
    readonly onFilter: (f: Filter) => void;
}): JSX.Element {
    return (
        <div class="dw-rail__toolbar">
            <label class="dw-rail__search">
                <span class="dw-rail__search-icon" aria-hidden="true">
                    ⌕
                </span>
                <input
                    type="search"
                    class="dw-rail__search-input"
                    placeholder={t("Search intervention docket")}
                    value={props.query}
                    onInput={(e) =>
                        props.onQuery(
                            (e.currentTarget as HTMLInputElement).value
                        )
                    }
                    aria-label={t("Search deals")}
                />
            </label>
            <ul class="dw-rail__pills" aria-label={t("Lane scope")}>
                <PillButton
                    label={t("Now")}
                    count={props.now}
                    active={props.activeFilter === "at-risk"}
                    onClick={() =>
                        props.onFilter(
                            props.activeFilter === "at-risk" ? "all" : "at-risk"
                        )
                    }
                />
                <PillButton
                    label={t("Next")}
                    count={props.next}
                    active={props.activeFilter === "stalled"}
                    onClick={() =>
                        props.onFilter(
                            props.activeFilter === "stalled" ? "all" : "stalled"
                        )
                    }
                />
                <PillButton
                    label={t("Reserve")}
                    count={props.reserve}
                    active={props.activeFilter === "this-quarter"}
                    onClick={() =>
                        props.onFilter(
                            props.activeFilter === "this-quarter"
                                ? "all"
                                : "this-quarter"
                        )
                    }
                />
            </ul>
            <button
                type="button"
                class="dw-rail__primary"
                onClick={props.onRunIntervention}
            >
                {t("Run intervention")} →
            </button>
        </div>
    );
}

function PillButton(props: {
    readonly label: string;
    readonly count: number;
    readonly active: boolean;
    readonly onClick: () => void;
}): JSX.Element {
    return (
        <li>
            <button
                type="button"
                class={`dw-rail__pill${props.active ? " is-active" : ""}`}
                onClick={props.onClick}
                aria-pressed={props.active}
            >
                <span class="dw-rail__pill-label">{props.label}</span>
                <span class="dw-rail__pill-count">{props.count}</span>
            </button>
        </li>
    );
}

// ─── Filter strip ────────────────────────────────────────────────

function FilterStrip(props: { readonly filter: Filter }): JSX.Element {
    let mode: string;
    let copy: string;
    if (props.filter === "at-risk") {
        mode = t("Now scope");
        copy = t("Showing only deals in the critical lane.", { class: "body" });
    } else if (props.filter === "stalled") {
        mode = t("Next scope");
        copy = t("Showing the deals worth tightening next.", { class: "body" });
    } else if (props.filter === "this-quarter") {
        mode = t("Reserve scope");
        copy = t("Showing only the deals in the keep-honest reserve.", { class: "body" });
    } else {
        mode = t("Intervention rail");
        copy = t(
            "Sorted by what needs your attention next, not by pipeline stage.",
            { class: "body" }
        );
    }
    return (
        <div class="dw-rail__filter-strip">
            <span class="dw-rail__filter-shell">
                <span class="dw-rail__filter-label">{t("Board mode")}</span>
                <span class="dw-rail__filter-value">{mode}</span>
            </span>
            <span class="dw-rail__filter-copy">{copy}</span>
        </div>
    );
}

// ─── Rail row ─────────────────────────────────────────────────────

function RailRow(props: {
    readonly state: string;
    readonly copy: string;
    readonly items: ReadonlyArray<RecoveryAssessment>;
    readonly focused: string | null;
    readonly onPin: (id: string) => void;
    readonly mode: "ticket" | "reserve";
    readonly emptyCopy: string;
}): JSX.Element {
    return (
        <div class="dw-rail__row">
            <div class="dw-rail__label">
                <p class="dw-rail__state">{props.state}</p>
                <p class="dw-rail__row-copy">{props.copy}</p>
            </div>
            {props.items.length === 0 ? (
                <p class="dw-rail__row-empty">{props.emptyCopy}</p>
            ) : props.mode === "ticket" ? (
                <ul class="dw-rail__tickets">
                    {props.items.map((r) => (
                        <Ticket
                            key={r.deal.id}
                            assessment={r}
                            focused={props.focused === r.deal.id}
                            onPin={() => props.onPin(r.deal.id)}
                        />
                    ))}
                </ul>
            ) : (
                <ul class="dw-rail__reserve">
                    {props.items.slice(0, 12).map((r) => (
                        <ReserveTag
                            key={r.deal.id}
                            assessment={r}
                            onPin={() => props.onPin(r.deal.id)}
                        />
                    ))}
                    {props.items.length > 12 ? (
                        <li class="dw-rail__reserve-more">
                            + {props.items.length - 12} more
                        </li>
                    ) : null}
                </ul>
            )}
        </div>
    );
}

// ─── Ticket (Now / Next) ─────────────────────────────────────────

function Ticket(props: {
    readonly assessment: RecoveryAssessment;
    readonly focused: boolean;
    readonly onPin: () => void;
}): JSX.Element {
    const { deal, lane } = props.assessment;
    const edge = ticketEdgeFor(lane);
    const action = actionLabelFor(lane);
    const detailPieces: string[] = [];
    const cause = props.assessment.causes[0];
    if (cause) detailPieces.push(cause);
    if (!deal.nextStep || !deal.nextStep.trim()) {
        detailPieces.push(t("No dated next step"));
    }
    if (!deal.useCase || !deal.useCase.trim()) {
        detailPieces.push(t("Use case thin"));
    }
    return (
        <li class="dw-rail__ticket-item">
            <button
                type="button"
                class={`dw-rail__ticket dw-rail__ticket--${edge}${
                    props.focused ? " is-focused" : ""
                }`}
                onClick={props.onPin}
                aria-pressed={props.focused}
            >
                <span
                    class={`dw-rail__ticket-edge dw-rail__ticket-edge--${edge}`}
                    aria-hidden="true"
                />
                <div class="dw-rail__ticket-body">
                    <p class="dw-rail__ticket-name">{deal.accountName}</p>
                    {detailPieces.length > 0 ? (
                        <ul class="dw-rail__ticket-detail">
                            {detailPieces.slice(0, 3).map((d, i) => (
                                <li key={i}>{d}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <span class="dw-rail__ticket-value">
                    {fmtMoney(deal.value || 0)}
                </span>
                <span class="dw-rail__ticket-action">{action} →</span>
            </button>
        </li>
    );
}

// ─── Reserve tag (Keep honest) ───────────────────────────────────

function ReserveTag(props: {
    readonly assessment: RecoveryAssessment;
    readonly onPin: () => void;
}): JSX.Element {
    const { deal } = props.assessment;
    const label = reserveLabelFor(deal, props.assessment);
    return (
        <li>
            <button
                type="button"
                class="dw-rail__reserve-tag"
                onClick={props.onPin}
            >
                <span class="dw-rail__reserve-tag-label">{label}</span>
                <span class="dw-rail__reserve-tag-name">
                    {deal.accountName}
                </span>
            </button>
        </li>
    );
}

function reserveLabelFor(
    deal: Deal,
    assessment: RecoveryAssessment
): string {
    if (!deal.nextStep || !deal.nextStep.trim()) return t("Stale");
    if (!deal.useCase || !deal.useCase.trim()) return t("Thin proof");
    if (assessment.lane === "at-risk") return t("At risk");
    return t("Healthy");
}
