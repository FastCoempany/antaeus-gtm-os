import type { JSX } from "preact";
import { Button, Card, Ribbon, Select, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import { busyRowId, changeStatus, eventsByTier, loaded, removeEvent } from "../../state";
import {
    OUTDOORS_EVENT_STATUSES,
    STATUS_LABEL,
    TIER_HINT,
    TIER_LABEL,
    type OutdoorsEvent,
    type OutdoorsEventStatus
} from "../../lib/types";
import { tierTone } from "../lib/adapters";

/**
 * EventListDS — discovered events grouped by relevance tier (Direct /
 * Adjacent / Indirect per ADR-016) — the organizing axis — with a
 * trailing "Added by hand" bucket. Each tier is a Ribbon section; each
 * event is a Grounded card carrying its tier chip, the relevance reason,
 * the source link, the status control, and a delete. Empty tiers
 * collapse. When discovery hasn't run, the directional empty state
 * points at the console above.
 */

function shortRange(start: string | null, end: string | null): string | null {
    if (!start && !end) return null;
    const fmt = (iso: string): string => {
        try {
            return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return iso;
        }
    };
    if (start && end && start === end) return fmt(start);
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    return fmt((start ?? end)!);
}

function EventCardDS({ event }: { readonly event: OutdoorsEvent }): JSX.Element {
    const busy = busyRowId.value === event.id;
    const range = shortRange(event.startDate, event.endDate);
    return (
        <Card
            kicker={event.relevanceTier ? TIER_LABEL[event.relevanceTier] : undefined}
            tone={event.relevanceTier ? tierTone(event.relevanceTier) : undefined}
        >
            <p class="oed-event__name">{event.name}</p>
            <p class="oed-event__meta">
                {event.kind ? <span>{event.kind}</span> : null}
                {event.whereAt ? <span>{event.whereAt}</span> : null}
                {range ? <span>{range}</span> : null}
            </p>
            {event.relevanceReason ? (
                <p class="oed-event__reason">{event.relevanceReason}</p>
            ) : null}
            {event.notes ? <p class="oed-event__notes">{event.notes}</p> : null}
            {event.tags.length > 0 ? (
                <div class="oed-event__tags">
                    {event.tags.map((tag) => (
                        <StatusChip key={tag} label={tag} />
                    ))}
                </div>
            ) : null}
            <div class="oed-event__foot">
                <Select
                    value={event.status}
                    onChange={(v) =>
                        void changeStatus(event.id, v as OutdoorsEventStatus)
                    }
                    disabled={busy}
                    options={OUTDOORS_EVENT_STATUSES.map((s) => ({
                        value: s,
                        label: STATUS_LABEL[s]
                    }))}
                />
                {event.sourceUrl ? (
                    <a
                        class="ds-link oed-event__src"
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {t("Source ↗")}
                    </a>
                ) : null}
                <Button
                    variant="ghost"
                    onClick={() => void removeEvent(event.id)}
                    disabled={busy}
                >
                    {t("Delete")}
                </Button>
            </div>
        </Card>
    );
}

export function EventListDS(): JSX.Element {
    if (!loaded.value) {
        return (
            <section class="oed-list" aria-busy="true">
                <p class="oed-list__loading">{t("Loading your events…")}</p>
            </section>
        );
    }

    const { tiers, untiered } = eventsByTier.value;
    const tierGroups = tiers.filter((g) => g.events.length > 0);
    const hasAny = tierGroups.length > 0 || untiered.length > 0;

    if (!hasAny) {
        return (
            <Card
                state="empty"
                kicker={t("DISCOVERY HASN'T RUN YET")}
                emptyWhy={t(
                    "The system reads your product category and surfaces conferences, mixers, and meetups — direct, adjacent, or indirect to your space, each with a real link and a one-line reason it matters.",
                    { class: "body" }
                )}
            />
        );
    }

    return (
        <section class="oed-list" aria-label={t("Discovered events")}>
            {tierGroups.map((g) => (
                <div class="oed-list__group" key={g.tier}>
                    <Ribbon
                        label={TIER_LABEL[g.tier]}
                        suffix={String(g.events.length)}
                        tone={tierTone(g.tier)}
                    />
                    <p class="oed-list__hint">{TIER_HINT[g.tier]}</p>
                    <div class="oed-list__rows">
                        {g.events.map((e) => (
                            <EventCardDS event={e} key={e.id} />
                        ))}
                    </div>
                </div>
            ))}
            {untiered.length > 0 ? (
                <div class="oed-list__group" key="untiered">
                    <Ribbon label={t("Added by hand")} suffix={String(untiered.length)} />
                    <p class="oed-list__hint">
                        {t("Events you added before discovery, or that the system hasn't classified.", { class: "body" })}
                    </p>
                    <div class="oed-list__rows">
                        {untiered.map((e) => (
                            <EventCardDS event={e} key={e.id} />
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
