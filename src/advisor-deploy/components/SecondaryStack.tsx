import type { JSX } from "preact";
import {
    activeDeals,
    advisorDraft,
    advisors,
    deployments,
    patchAdvisorDraft,
    recentDeployments,
    removeAdvisor,
    saveAdvisorFromDraft,
    selectedDeal,
    updateDeploymentOutcome
} from "../state";
import { TIERS } from "../lib/tiers";
import { findMoment } from "../lib/moments";
import { getCooldownStatus, daysSince } from "../lib/cooldown";
import { computeImpact } from "../lib/impact";
import {
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    hrefToNegotiation,
    hrefToPocFramework
} from "../lib/handoff";
import { saveDeployment } from "../lib/cloud-persistence";
import {
    deleteAdvisorInCloud,
    saveAdvisor
} from "../lib/cloud-persistence-profile";
import {
    DEPLOYMENT_OUTCOMES,
    DEPLOYMENT_OUTCOME_LABELS,
    TIER_IDS,
    type DeploymentOutcome,
    type TierId
} from "../lib/types";

/**
 * SecondaryStack — Wave 4 implementation.
 *
 * Three sheets below the desk board:
 *   - Advisor registry — Save advisor form (binds advisorDraft) + live
 *     advisor list with cooldown pills + remove buttons.
 *   - Deployment loops — recent deployments with outcome <select>
 *     driving updateDeploymentOutcome (live impact recompute).
 *   - Desk read — 4-cell impact grid + readline list (red/orange/blue/
 *     green tones from computeImpact). Wave 5 wires the 3 cross-room
 *     handoff CTAs at the bottom of this sheet.
 */

function fmtRelativeDate(iso: string): string {
    const d = daysSince(iso);
    if (d === 0) return "today";
    if (d === 1) return "1d ago";
    return `${d}d ago`;
}

export function SecondaryStack(): JSX.Element {
    const draft = advisorDraft.value;
    const advisorList = advisors.value;
    const recent = recentDeployments.value;
    const impact = computeImpact({
        advisors: advisorList,
        deployments: deployments.value,
        activeDeals: activeDeals.value
    });

    function onSubmit(e: Event): void {
        e.preventDefault();
        const advisor = saveAdvisorFromDraft();
        if (advisor) void saveAdvisor(advisor);
    }

    return (
        <section class="ad-secondary" aria-label="Advisor secondary sheets">
            <article class="ad-sheet">
                <header class="ad-sheet__head">
                    <div>
                        <p class="ad-sheet__kicker">ADVISORS</p>
                        <h2 class="ad-sheet__title">
                            Register the people whose trust you can deploy.
                        </h2>
                    </div>
                </header>
                <form class="ad-form" onSubmit={onSubmit}>
                    <label class="ad-form__field">
                        <span class="ad-form__label">Name</span>
                        <input
                            class="ad-input"
                            type="text"
                            placeholder="Sarah Chen"
                            value={draft.name}
                            onInput={(e) =>
                                patchAdvisorDraft({
                                    name: (
                                        e.currentTarget as HTMLInputElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <label class="ad-form__field">
                        <span class="ad-form__label">Role</span>
                        <input
                            class="ad-input"
                            type="text"
                            placeholder="Board member, operator, customer"
                            value={draft.title}
                            onInput={(e) =>
                                patchAdvisorDraft({
                                    title: (
                                        e.currentTarget as HTMLInputElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <label class="ad-form__field">
                        <span class="ad-form__label">Tier</span>
                        <select
                            class="ad-select"
                            value={draft.tier}
                            onChange={(e) =>
                                patchAdvisorDraft({
                                    tier: (
                                        e.currentTarget as HTMLSelectElement
                                    ).value as TierId
                                })
                            }
                        >
                            {TIER_IDS.map((id) => (
                                <option key={id} value={id}>
                                    {TIERS[id].label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label class="ad-form__field">
                        <span class="ad-form__label">Expertise</span>
                        <input
                            class="ad-input"
                            type="text"
                            placeholder="Enterprise SaaS, CX, procurement"
                            value={draft.expertise}
                            onInput={(e) =>
                                patchAdvisorDraft({
                                    expertise: (
                                        e.currentTarget as HTMLInputElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <label class="ad-form__field ad-form__field--full">
                        <span class="ad-form__label">
                            Companies (comma-separated)
                        </span>
                        <input
                            class="ad-input"
                            type="text"
                            placeholder="Meridian Logistics, Northstar Financial"
                            value={draft.companies}
                            onInput={(e) =>
                                patchAdvisorDraft({
                                    companies: (
                                        e.currentTarget as HTMLInputElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <label class="ad-form__field ad-form__field--full">
                        <span class="ad-form__label">Notes</span>
                        <textarea
                            class="ad-textarea"
                            placeholder="What kind of ask should this person carry?"
                            value={draft.notes}
                            onInput={(e) =>
                                patchAdvisorDraft({
                                    notes: (
                                        e.currentTarget as HTMLTextAreaElement
                                    ).value
                                })
                            }
                        />
                    </label>
                    <div class="ad-form__field ad-form__field--full">
                        <button
                            type="submit"
                            class="ad-btn ad-btn--primary"
                            disabled={draft.name.trim().length === 0}
                        >
                            Save advisor
                        </button>
                    </div>
                </form>
                <div class="ad-list">
                    {advisorList.length === 0 ? (
                        <p class="ad-empty">
                            No advisors yet. Save one above to start the
                            registry.
                        </p>
                    ) : (
                        advisorList.map((a) => {
                            const status = getCooldownStatus(
                                a,
                                deployments.value
                            );
                            return (
                                <div class="ad-row" key={a.id}>
                                    <div>
                                        <strong>{a.name}</strong>
                                        <small>
                                            {a.title || TIERS[a.tier].label}
                                        </small>
                                    </div>
                                    <div>
                                        <span
                                            class={`ad-pill ad-pill--${status.ok ? "green" : "orange"}`}
                                        >
                                            {status.label}
                                        </span>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            class="ad-btn ad-btn--red"
                                            onClick={() => {
                                                removeAdvisor(a.id);
                                                void deleteAdvisorInCloud(a.id);
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </article>

            <article class="ad-sheet">
                <header class="ad-sheet__head">
                    <div>
                        <p class="ad-sheet__kicker">ASK LOG</p>
                        <h2 class="ad-sheet__title">
                            Every ask should return as a deal update.
                        </h2>
                    </div>
                </header>
                <div class="ad-list">
                    {recent.length === 0 ? (
                        <p class="ad-empty">
                            No asks logged yet. Send, Hold, or Reroute on
                            the desk above and the loop appears here.
                        </p>
                    ) : (
                        recent.map((d) => {
                            const moment = findMoment(d.momentId);
                            return (
                                <div class="ad-row" key={d.id}>
                                    <div>
                                        <strong>
                                            {d.dealName || "Unknown deal"}
                                        </strong>
                                        <small>
                                            {d.advisorName ||
                                                "Unknown advisor"}{" "}
                                            · {moment.name} ·{" "}
                                            {fmtRelativeDate(d.createdAt)}
                                        </small>
                                    </div>
                                    <div>
                                        <select
                                            class="ad-outcome"
                                            value={d.outcome}
                                            onChange={(e) => {
                                                const updated = updateDeploymentOutcome(
                                                    d.id,
                                                    (
                                                        e.currentTarget as HTMLSelectElement
                                                    ).value as DeploymentOutcome
                                                );
                                                if (updated)
                                                    void saveDeployment(updated);
                                            }}
                                        >
                                            {DEPLOYMENT_OUTCOMES.map((o) => (
                                                <option key={o} value={o}>
                                                    {DEPLOYMENT_OUTCOME_LABELS[o]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </article>

            <article class="ad-sheet ad-sheet--wide">
                <header class="ad-sheet__head">
                    <div>
                        <p class="ad-sheet__kicker">DESK READ</p>
                        <h2 class="ad-sheet__title">
                            How outside leverage is paying off.
                        </h2>
                    </div>
                </header>
                <div class="ad-impact-grid">
                    {impact.cells.map((c, i) => (
                        <div key={i} class="ad-impact-cell">
                            <strong>{c.value}</strong>
                            <span>{c.label}</span>
                        </div>
                    ))}
                </div>
                <div class="ad-list">
                    {impact.rows.map((r, i) => (
                        <div key={i} class="ad-row">
                            <div>
                                <strong>{r.title}</strong>
                                <small>{r.copy}</small>
                            </div>
                            <div>
                                <span class={`ad-pill ad-pill--${r.tone}`}>
                                    {r.title}
                                </span>
                            </div>
                            <div />
                        </div>
                    ))}
                </div>
                <p class="ad-handoff__kicker">CARRY THE ASK FORWARD</p>
                <nav class="ad-handoff" aria-label="Cross-room handoff">
                    <a
                        class="ad-btn ad-btn--blue"
                        href={hrefToDealWorkspace(
                            selectedDeal.value?.id ?? "",
                            selectedDeal.value?.accountName ?? ""
                        )}
                        data-ad-handoff="deal-workspace"
                    >
                        Update the deal
                    </a>
                    <a
                        class="ad-btn"
                        href={hrefToFutureAutopsy(
                            selectedDeal.value?.id ?? "",
                            selectedDeal.value?.accountName ?? ""
                        )}
                        data-ad-handoff="future-autopsy"
                    >
                        Pre-mortem the deal
                    </a>
                    <a
                        class="ad-btn ad-btn--green"
                        href={hrefToPocFramework(
                            selectedDeal.value?.id ?? "",
                            selectedDeal.value?.accountName ?? ""
                        )}
                        data-ad-handoff="poc-framework"
                    >
                        Forge a proof
                    </a>
                    <a
                        class="ad-btn"
                        href={hrefToNegotiation(
                            selectedDeal.value?.id ?? "",
                            selectedDeal.value?.accountName ?? ""
                        )}
                        data-ad-handoff="negotiation"
                    >
                        Rehearse the negotiation
                    </a>
                </nav>
            </article>
        </section>
    );
}
