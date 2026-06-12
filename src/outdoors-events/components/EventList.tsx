import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { eventsByTier, loaded } from "../state";
import { TIER_LABEL, TIER_HINT } from "../lib/types";
import { EventRow } from "./EventRow";

/**
 * EventList — discovered events grouped by relevance tier (Direct /
 * Adjacent / Indirect) per ADR-016, with a trailing bucket for
 * untiered events (legacy + manual additions). Empty tiers are
 * skipped. When nothing's been discovered or added, the directional
 * empty state explains the room.
 */
export function EventList(): JSX.Element {
    if (!loaded.value) {
        return (
            <section class="oe-list oe-list--loading" aria-busy="true">
                <p class="oe-list__loading">{t("Loading your events…")}</p>
            </section>
        );
    }

    const { tiers, untiered } = eventsByTier.value;
    const tierGroups = tiers.filter((g) => g.events.length > 0);
    const hasAny = tierGroups.length > 0 || untiered.length > 0;

    if (!hasAny) {
        return (
            <section class="oe-list oe-list--empty" aria-label={t("No events yet")}>
                <p class="oe-list__empty-kicker">{t("DISCOVERY HASN'T RUN YET")}</p>
                <h2 class="oe-list__empty-headline">
                    The system will find events worth knowing about.
                </h2>
                <p class="oe-list__empty-body">
                    Press "Run discovery now" above. The system reads your
                    product category and surfaces conferences, mixers, and
                    meetups that are direct, adjacent, or indirect to your
                    space — each with a real link and a one-line reason it
                    matters.
                </p>
            </section>
        );
    }

    return (
        <section class="oe-list" aria-label={t("Discovered events")}>
            {tierGroups.map((g) => (
                <div class="oe-list__group" key={g.tier}>
                    <div class="oe-list__group-head">
                        <p class="oe-list__group-label">
                            {TIER_LABEL[g.tier]}
                            <span class="oe-list__group-count">
                                {g.events.length}
                            </span>
                        </p>
                        <p class="oe-list__group-hint">{TIER_HINT[g.tier]}</p>
                    </div>
                    <ul class="oe-list__rows">
                        {g.events.map((e) => (
                            <EventRow event={e} key={e.id} />
                        ))}
                    </ul>
                </div>
            ))}
            {untiered.length > 0 ? (
                <div class="oe-list__group" key="untiered">
                    <div class="oe-list__group-head">
                        <p class="oe-list__group-label">
                            Added by hand
                            <span class="oe-list__group-count">
                                {untiered.length}
                            </span>
                        </p>
                        <p class="oe-list__group-hint">
                            Events you added before discovery, or that the
                            system hasn't classified.
                        </p>
                    </div>
                    <ul class="oe-list__rows">
                        {untiered.map((e) => (
                            <EventRow event={e} key={e.id} />
                        ))}
                    </ul>
                </div>
            ) : null}
        </section>
    );
}
