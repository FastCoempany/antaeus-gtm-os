import { signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Card, Meter, StatusChip } from "@/components";
import type { AccentRole } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import type { Account, RelationshipType, Signal as ScSignal } from "../../lib/types";
import { RELATIONSHIP_LABEL, RELATIONSHIP_TYPES } from "../../lib/types";
import { recency } from "../../lib/heat";
import { getAccountExecutionContext } from "../../lib/execution-context";
import { matchAccountToIcp } from "../../lib/icp-match";
import { setAccountRelationship } from "../../lib/cloud-persistence";
import {
    hrefToDealWorkspace,
    hrefToDiscoveryAgenda,
    hrefToOutbound
} from "../../lib/handoff";
import { heatRead } from "../lib/adapters";

/**
 * AccountCardDS — one account as a Grounded library Card. Heat is the
 * card's gauge tone + a Meter (the library's one data-viz primitive,
 * always paired with its read sentence). The account wears the account
 * glyph; each signal row carries the signal glyph. The dominant move
 * (Compose outbound / Open the deal) is the only orange on the card.
 *
 * Per canon §4.7: the card reads motion-first — heat → next move →
 * signals → meta. The engine (heat, execution context, ICP match,
 * handoff) is the legacy lib, untouched; this is presentation.
 *
 * Expand state lives in a module-level signal keyed by account id (not
 * preact/hooks — the design-system-composed files avoid the hook-name
 * transform).
 */

const expandedIds: Signal<ReadonlySet<string>> = signal(new Set());

function toggleExpanded(id: string): void {
    const next = new Set(expandedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedIds.value = next;
}

const TEMP_TONE: Record<string, AccentRole | undefined> = {
    ice_cold: undefined,
    cool: "amber",
    warm: "blue",
    hot: "green"
};

const ICP_TONE: Record<string, AccentRole | undefined> = {
    fit: "green",
    loose: "amber",
    off: undefined
};

export function AccountCardDS(props: {
    readonly account: Account;
    readonly now?: number;
}): JSX.Element {
    const { account, now } = props;
    const read = heatRead(account, now);
    const exec = getAccountExecutionContext(account);
    const icp = matchAccountToIcp(account);
    const expanded = expandedIds.value.has(account.id);
    const sigs = account.signals.filter(
        (s) => s.status !== "flagged" && s.flagged !== true
    );
    const previewLimit = 3;
    const previewSigs = expanded ? sigs : sigs.slice(0, previewLimit);
    const overflow = Math.max(0, sigs.length - previewLimit);
    const annotate = showsAnnotations();

    const meta =
        [
            account.industry,
            account.hq,
            account.employees ? `${account.employees} employees` : null,
            account.tier ? `Tier ${account.tier}` : null
        ]
            .filter(Boolean)
            .join(" · ") || "—";

    const primaryCta = exec.hasActiveDeal ? (
        <a class="ds-btn ds-btn--accent" href={hrefToDealWorkspace(account.name)}>
            <Icon name="deal" size={16} /> {t("Open the deal")}
        </a>
    ) : (
        <a
            class="ds-btn ds-btn--accent"
            href={hrefToOutbound(account.name, exec.temperature)}
        >
            <Icon name="send" size={16} /> {t("Compose outbound")}
        </a>
    );

    const footer = (
        <>
            {primaryCta}
            <a class="ds-btn ds-btn--ghost" href={hrefToDiscoveryAgenda(account.name)}>
                <Icon name="call" size={16} /> {t("Plan call")}
            </a>
        </>
    );

    return (
        <Card
            icon="account"
            kicker={account.ticker ? account.ticker : t("ACCOUNT")}
            title={account.name}
            tone={read.tone}
            footer={footer}
        >
            <Meter
                ratio={read.ratio}
                read={read.read}
                tone={read.tone}
                label={`Heat ${read.score}`}
            />

            <div class="scd-card__chips">
                <StatusChip
                    label={exec.temperatureLabel}
                    tone={TEMP_TONE[exec.temperature]}
                />
                {icp ? (
                    <StatusChip label={icp.label} tone={ICP_TONE[icp.band]} />
                ) : null}
            </div>

            <div class="scd-card__rel" role="group" aria-label={t("Relationship")}>
                {RELATIONSHIP_TYPES.map((rt) => {
                    const active = (account.relationshipType ?? "prospect") === rt;
                    return (
                        <button
                            key={rt}
                            type="button"
                            class={`scd-card__rel-chip${active ? " is-active" : ""}`}
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
                <p class="scd-card__empty">
                    {t("No signals captured yet.", { class: "body" })}
                </p>
            ) : (
                <ul class="scd-card__signals">
                    {previewSigs.map((s) => (
                        <SignalRow key={s.id} signal={s} now={now} />
                    ))}
                    {!expanded && overflow > 0 ? (
                        <li>
                            <button
                                type="button"
                                class="scd-card__more"
                                onClick={() => toggleExpanded(account.id)}
                            >
                                + {overflow} more
                            </button>
                        </li>
                    ) : null}
                    {expanded && sigs.length > previewLimit ? (
                        <li>
                            <button
                                type="button"
                                class="scd-card__more"
                                onClick={() => toggleExpanded(account.id)}
                            >
                                {t("Show fewer")}
                            </button>
                        </li>
                    ) : null}
                </ul>
            )}

            {annotate ? (
                <p class="scd-card__meta">{meta}</p>
            ) : null}
        </Card>
    );
}

function SignalRow(props: {
    readonly signal: ScSignal;
    readonly now?: number;
}): JSX.Element {
    const { signal: s, now } = props;
    const fresh = Math.round(recency(s, now) * 100);
    const conf = Math.round((s.confidence ?? 0.65) * 100);
    const headline = s.headline ?? s.title ?? "(untitled signal)";
    const isAi = !!(s.is_ai || s.ai);

    return (
        <li class="scd-card__signal">
            <span class="scd-card__signal-mark">
                <Icon name="signal" size={16} />
            </span>
            <span class="scd-card__signal-headline">
                {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {headline}
                    </a>
                ) : (
                    headline
                )}
                {isAi ? <span class="scd-card__signal-ai"> · AI</span> : null}
            </span>
            <span class="scd-card__signal-meta">
                {fresh}% fresh · {conf}% conf
            </span>
        </li>
    );
}
