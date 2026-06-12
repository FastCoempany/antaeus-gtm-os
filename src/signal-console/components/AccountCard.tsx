import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { useState } from "preact/hooks";
import type { Account, RelationshipType, Signal } from "../lib/types";
import { RELATIONSHIP_LABEL, RELATIONSHIP_TYPES } from "../lib/types";
import { heatMetrics, recency } from "../lib/heat";
import {
    hrefToDealWorkspace,
    hrefToDiscoveryAgenda,
    hrefToOutbound
} from "../lib/handoff";
import { getAccountExecutionContext } from "../lib/execution-context";
import { matchAccountToIcp } from "../lib/icp-match";
import { setAccountRelationship } from "../lib/cloud-persistence";
import { HeatBadge } from "./HeatBadge";

interface Props {
    readonly account: Account;
    readonly now?: number;
}

/**
 * AccountCard — one account in the grid. Click the header to expand
 * the signal list. Heat badge sits in the header at all times so the
 * operator can scan the grid's pressure without expanding anything.
 *
 * Per canon §4.7 (Live Instrument): the card must read motion-first.
 * The order: heat → next move (Wave 5) → signals → meta. Wave 3
 * ships heat + signals + meta; Wave 5 wires the cross-room CTAs into
 * the card footer.
 */
export function AccountCard({ account, now }: Props): JSX.Element {
    const [expanded, setExpanded] = useState(false);
    const metrics = heatMetrics(account, now);
    const exec = getAccountExecutionContext(account);
    // Signal Console audit (2026-05): ICP match chip on every card so
    // operator can tell wrong-target heat from on-target heat at a
    // glance. Returns null when no ICP is saved yet → chip is hidden.
    const icpMatch = matchAccountToIcp(account);
    const sigs = account.signals.filter((s) => s.status !== "flagged" && s.flagged !== true);
    const previewLimit = 3;
    const previewSigs = expanded ? sigs : sigs.slice(0, previewLimit);
    const overflow = Math.max(0, sigs.length - previewLimit);

    return (
        <article class="sc-card" aria-expanded={expanded}>
            <button
                type="button"
                class="sc-card__header"
                onClick={() => setExpanded((v) => !v)}
                aria-label={`Toggle ${account.name}`}
            >
                <div class="sc-card__title-block">
                    <h3 class="sc-card__name">{account.name}</h3>
                    <div class="sc-card__sub">
                        {account.ticker ? (
                            <span class="sc-card__ticker">{account.ticker}</span>
                        ) : null}
                        <span
                            class={`sc-card__temp sc-card__temp--${exec.temperature}`}
                        >
                            {exec.temperatureLabel}
                        </span>
                        {icpMatch ? (
                            <span
                                class={`sc-card__icp sc-card__icp--${icpMatch.band}`}
                                title={`Industry / geo overlap against your saved ICP (score ${icpMatch.score})`}
                            >
                                {icpMatch.label}
                            </span>
                        ) : null}
                    </div>
                </div>
                <HeatBadge account={account} now={now} />
            </button>

            <p class="sc-card__meta">
                {[
                    account.industry,
                    account.hq,
                    account.employees ? `${account.employees} employees` : null,
                    account.tier ? `Tier ${account.tier}` : null
                ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
            </p>

            {/* Relationship type (ADR-007). A 'competitor' flag here is
                what the Briefing reads to drive category-specific
                source queries. Default prospect. */}
            <div class="sc-card__relationship" role="group" aria-label={t("Relationship")}>
                {RELATIONSHIP_TYPES.map((rt) => {
                    const active = (account.relationshipType ?? "prospect") === rt;
                    return (
                        <button
                            key={rt}
                            type="button"
                            class={`sc-card__rel-chip ${
                                active ? "is-active" : ""
                            } sc-card__rel-chip--${rt}`}
                            aria-pressed={active}
                            onClick={() =>
                                void setAccountRelationship(
                                    account.id,
                                    rt as RelationshipType
                                )
                            }
                        >
                            {RELATIONSHIP_LABEL[rt]}
                        </button>
                    );
                })}
            </div>

            {sigs.length === 0 ? (
                <p class="sc-card__empty">{t("No signals captured yet.", { class: "body" })}</p>
            ) : (
                <ul class="sc-card__signals">
                    {previewSigs.map((s) => (
                        <SignalRow key={s.id} signal={s} now={now} />
                    ))}
                    {!expanded && overflow > 0 ? (
                        <li class="sc-card__more">
                            <button
                                type="button"
                                class="sc-card__more-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpanded(true);
                                }}
                            >
                                + {overflow} more
                            </button>
                        </li>
                    ) : null}
                </ul>
            )}

            <footer class="sc-card__footer">
                <div class="sc-card__metrics">
                    <span class="sc-card__metric">
                        {metrics.signalCount} signal{metrics.signalCount === 1 ? "" : "s"}
                    </span>
                    <span class="sc-card__metric">
                        {metrics.highConfidenceCount} high-conf
                    </span>
                    <span class="sc-card__metric">{metrics.aiCount} AI</span>
                    <span class="sc-card__metric">{metrics.recentCount} recent</span>
                </div>
                <div class="sc-card__ctas">
                    {/*
                      Signal Console audit (2026-05): trimmed from 3 CTAs to 2.
                      "Cold Call" was redundant with "Plan call" — they're
                      sequential (plan first, then call), and Cold Call Studio
                      is reachable from inside the call plan. One primary
                      (state-driven) + one secondary keeps the dominant move
                      visually loud.
                    */}
                    {exec.hasActiveDeal ? (
                        <a
                            class="sc-card__cta sc-card__cta--primary"
                            href={hrefToDealWorkspace(account.name)}
                        >
                            {t("Open in Deal Workspace")}
                        </a>
                    ) : (
                        <a
                            class="sc-card__cta sc-card__cta--primary"
                            href={hrefToOutbound(account.name, exec.temperature)}
                        >
                            {t("Compose outbound")}
                        </a>
                    )}
                    <a
                        class="sc-card__cta sc-card__cta--ghost"
                        href={hrefToDiscoveryAgenda(account.name)}
                    >
                        {t("Plan call")}
                    </a>
                </div>
            </footer>
        </article>
    );
}

interface SignalRowProps {
    readonly signal: Signal;
    readonly now?: number;
}

function SignalRow({ signal, now }: SignalRowProps): JSX.Element {
    const r = recency(signal, now);
    const fresh = Math.round(r * 100);
    const conf = Math.round((signal.confidence ?? 0.65) * 100);
    const headline = signal.headline ?? signal.title ?? "(untitled signal)";
    const isAi = !!(signal.is_ai || signal.ai);

    return (
        <li class="sc-card__signal">
            <span class="sc-card__signal-headline">
                {signal.url ? (
                    <a href={signal.url} target="_blank" rel="noopener noreferrer">
                        {headline}
                    </a>
                ) : (
                    headline
                )}
                {isAi ? <span class="sc-card__signal-ai"> · AI</span> : null}
            </span>
            <span class="sc-card__signal-meta">
                {fresh}% fresh · {conf}% conf
            </span>
        </li>
    );
}
