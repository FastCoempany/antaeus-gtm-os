import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { busyRowId, changeStatus, removeEvent } from "../state";
import {
    OUTDOORS_EVENT_STATUSES,
    STATUS_LABEL,
    TIER_LABEL,
    type OutdoorsEvent,
    type OutdoorsEventStatus
} from "../lib/types";

function shortRange(
    start: string | null,
    end: string | null
): string | null {
    if (!start && !end) return null;
    function fmt(iso: string): string {
        try {
            const d = new Date(iso + "T00:00:00");
            return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return iso;
        }
    }
    if (start && end && start === end) return fmt(start);
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return fmt(start);
    return fmt(end!);
}

export function EventRow({
    event
}: {
    readonly event: OutdoorsEvent;
}): JSX.Element {
    const busy = busyRowId.value === event.id;
    const range = shortRange(event.startDate, event.endDate);
    return (
        <li
            class={`oe-row${busy ? " oe-row--busy" : ""}`}
            aria-busy={busy}
        >
            <div class="oe-row__main">
                <div class="oe-row__title-row">
                    {event.relevanceTier ? (
                        <span
                            class={`oe-row__tier oe-row__tier--${event.relevanceTier}`}
                        >
                            {TIER_LABEL[event.relevanceTier]}
                        </span>
                    ) : null}
                    <p class="oe-row__name">{event.name}</p>
                </div>
                <p class="oe-row__meta">
                    {event.kind ? (
                        <span class="oe-row__kind">{event.kind}</span>
                    ) : null}
                    {event.whereAt ? (
                        <span class="oe-row__where">{event.whereAt}</span>
                    ) : null}
                    {range ? (
                        <span class="oe-row__when">{range}</span>
                    ) : null}
                </p>
                {event.relevanceReason ? (
                    <p class="oe-row__reason">{event.relevanceReason}</p>
                ) : null}
                {event.notes ? (
                    <p class="oe-row__notes">{event.notes}</p>
                ) : null}
                {event.tags.length > 0 ? (
                    <p class="oe-row__tags">
                        {event.tags.map((t) => (
                            <span class="oe-row__tag" key={t}>
                                {t}
                            </span>
                        ))}
                    </p>
                ) : null}
                {event.sourceUrl ? (
                    <a
                        class="oe-row__link"
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Source ↗
                    </a>
                ) : null}
            </div>
            <div class="oe-row__actions">
                <label class="oe-row__status-label">
                    <span class="oe-row__status-tag">{t("STATUS")}</span>
                    <select
                        class="oe-row__status-select"
                        value={event.status}
                        disabled={busy}
                        onChange={(e) =>
                            void changeStatus(
                                event.id,
                                (e.target as HTMLSelectElement)
                                    .value as OutdoorsEventStatus
                            )
                        }
                    >
                        {OUTDOORS_EVENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    class="oe-row__delete"
                    onClick={() => void removeEvent(event.id)}
                    disabled={busy}
                    aria-label={`Delete ${event.name}`}
                >
                    Delete
                </button>
            </div>
        </li>
    );
}
