import type { JSX } from "preact";
import { Card, HandoffStrip, Kicker, Meter, Select, Stat, StatusChip } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import {
    accounts,
    accountsByThesis,
    allocation,
    focusedIcp,
    focuses,
    setAccountDisposition
} from "../../state";
import {
    TIER_DEFAULTS,
    TIER_LABELS,
    type DispositionState
} from "../../lib/types";
import { hrefToSignalConsole, hrefToSourcingWorkbench } from "../../lib/handoff";
import { allocTone, bandTone, fieldRead, tierTone } from "../lib/adapters";

const DISPOSITIONS: ReadonlyArray<{ value: DispositionState; label: string }> = [
    { value: "active", label: t("Active") },
    { value: "paused", label: t("Paused") },
    { value: "closed-won", label: t("Won") },
    { value: "closed-lost", label: t("Lost") },
    { value: "reroute", label: t("Reroute") }
];

/**
 * TerritoryObject — the shaped territory, the dominant half of the
 * Decision Bench (canon §4.5). The field read is the bench top (what
 * truth is being improved — is the territory runnable); the 300-cap
 * allocation is the resource commitment; the focuses are the strategic
 * bets (named groups of buyers, never flattened to a contact list); the
 * handoff pushes the territory into sourcing. Composed on the library
 * over the unchanged field-read + allocation engine.
 */
export function TerritoryObject(): JSX.Element {
    const read = fieldRead();
    const alloc = allocation.value;
    const focusList = focuses.value;
    const counts = accountsByThesis.value;
    const all = accounts.value;
    const focusObject = focusedIcp.value;

    return (
        <div class="tad-object">
            {/* The field read — the bench top. */}
            <div class="tad-read">
                <div class="tad-read__head">
                    <Kicker>{t("WHERE THE TERRITORY STANDS")}</Kicker>
                    <StatusChip label={read.bandLabel} tone={bandTone(read.band)} />
                    <span class="tad-read__score">
                        {read.score}
                        <span class="tad-read__cap">/100</span>
                    </span>
                </div>
                <p class="tad-read__line">{read.mainRisk}</p>
                {showsAnnotations() ? (
                    <p class="tad-read__line tad-read__line--soft">{read.replacement}</p>
                ) : null}
                <p class="tad-read__move">
                    <span class="tad-read__move-mark">{t("NEXT")}</span> {read.operatorMove}
                </p>
            </div>

            {/* The 300-cap allocation — the resource commitment. */}
            <Card icon="account" kicker={t("THE 300-CAP")} tone={allocTone(alloc.status)}>
                <div class="tad-alloc__head">
                    <Stat value={`${alloc.total}/${alloc.ceiling}`} label={t("ACCOUNTS")} />
                    <StatusChip
                        label={
                            alloc.status === "over"
                                ? t("Over the ceiling")
                                : alloc.status === "at-cap"
                                  ? t("At the ceiling")
                                  : `${alloc.remaining} ${t("left")}`
                        }
                        tone={allocTone(alloc.status)}
                    />
                </div>
                <div class="tad-alloc__tiers">
                    {alloc.perTier.map((tier) => (
                        <div key={tier.tier} class="tad-alloc__tier">
                            <Meter
                                ratio={TIER_DEFAULTS[tier.tier] > 0 ? tier.count / TIER_DEFAULTS[tier.tier] : 0}
                                tone={tierTone(tier.tier)}
                                label={TIER_LABELS[tier.tier]}
                                read={`${TIER_LABELS[tier.tier]} — ${tier.count} of ${tier.target}`}
                            />
                        </div>
                    ))}
                </div>
            </Card>

            {/* The focuses — the strategic bets. */}
            {focusList.length === 0 ? (
                <section class="tad-empty">
                    <div class="tad-empty__head">
                        <Icon name="focus" size={24} />
                        <Kicker>{t("NO FOCUSES YET")}</Kicker>
                    </div>
                    <h2 class="tad-empty__title">
                        {t("Name the first strategic bet — a group of buyers under pressure now.", {
                            class: "body"
                        })}
                    </h2>
                    <p class="tad-empty__body">
                        {t(
                            "A focus is who you're going after and why you're the right team to win them. The territory organizes around focuses, not a flat account list.",
                            { class: "body" }
                        )}
                    </p>
                </section>
            ) : (
                <div class="tad-focuses">
                    <Kicker>{t("FOCUSES")}</Kicker>
                    {focusList.map((focus) => {
                        const focusAccounts = all.filter((a) => a.focusId === focus.id);
                        return (
                            <Card
                                key={focus.id}
                                icon="focus"
                                kicker={TIER_LABELS[focus.tier]}
                                title={focus.title}
                                tone={tierTone(focus.tier)}
                            >
                                {focus.pressure ? (
                                    <p class="ds-card__copy">{focus.pressure}</p>
                                ) : null}
                                {showsAnnotations() && focus.whyUs ? (
                                    <p class="tad-focus__why">
                                        <span class="tad-focus__why-mark">{t("WHY US")}</span>{" "}
                                        {focus.whyUs}
                                    </p>
                                ) : null}
                                <div class="tad-focus__meta">
                                    <StatusChip
                                        label={`${counts[focus.id] ?? 0} ${
                                            (counts[focus.id] ?? 0) === 1 ? t("account") : t("accounts")
                                        }`}
                                    />
                                    {focus.segment ? (
                                        <span class="tad-focus__segment">{focus.segment}</span>
                                    ) : null}
                                </div>
                                {focusAccounts.length > 0 ? (
                                    <ul class="tad-focus__accounts">
                                        {focusAccounts.map((a) => (
                                            <li key={a.id} class="tad-focus__account">
                                                <span class="tad-focus__account-name">{a.name}</span>
                                                <Select
                                                    value={a.disposition}
                                                    onChange={(d) =>
                                                        setAccountDisposition(a.id, d as DispositionState)
                                                    }
                                                    options={DISPOSITIONS}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </Card>
                        );
                    })}
                </div>
            )}

            {focusList.length > 0 ? (
                <HandoffStrip
                    label={t("Carry the territory into the motion")}
                    kicker={t("RUN THE TERRITORY")}
                    title={t("Push these focuses into prospects")}
                    routes={[
                        {
                            label: t("Source prospects"),
                            href: hrefToSourcingWorkbench(focusObject || undefined),
                            primary: true
                        },
                        {
                            label: t("Watch the radar"),
                            href: hrefToSignalConsole(focusObject || undefined)
                        }
                    ]}
                />
            ) : null}
        </div>
    );
}
