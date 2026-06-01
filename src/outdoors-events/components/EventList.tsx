import type { JSX } from "preact";
import { eventsByStatus, loaded } from "../state";
import { STATUS_LABEL } from "../lib/types";
import { EventRow } from "./EventRow";

/**
 * EventList — the operator's tracked events, grouped by status in
 * lifecycle order (Watching → Archived). Empty status buckets are
 * skipped. When nothing's tracked at all, the directional empty state
 * explains the room.
 */
export function EventList(): JSX.Element {
    if (!loaded.value) {
        return (
            <section class="oe-list oe-list--loading" aria-busy="true">
                <p class="oe-list__loading">Loading your events…</p>
            </section>
        );
    }

    const groups = eventsByStatus.value.filter((g) => g.events.length > 0);

    if (groups.length === 0) {
        return (
            <section class="oe-list oe-list--empty" aria-label="No events yet">
                <p class="oe-list__empty-kicker">NOTHING TRACKED YET</p>
                <h2 class="oe-list__empty-headline">
                    Name the first gathering worth knowing about.
                </h2>
                <p class="oe-list__empty-body">
                    This is your radar for where buyers gather offline —
                    conferences, mixers, trade shows, the local meetup
                    your ICP persona never misses. Add what you're
                    watching; set a status as plans firm up.
                </p>
            </section>
        );
    }

    return (
        <section class="oe-list" aria-label="Tracked events">
            {groups.map((g) => (
                <div class="oe-list__group" key={g.status}>
                    <p class="oe-list__group-label">
                        {STATUS_LABEL[g.status]}
                        <span class="oe-list__group-count">
                            {g.events.length}
                        </span>
                    </p>
                    <ul class="oe-list__rows">
                        {g.events.map((e) => (
                            <EventRow event={e} key={e.id} />
                        ))}
                    </ul>
                </div>
            ))}
        </section>
    );
}
