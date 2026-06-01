import { computed, signal, type Signal } from "@preact/signals";
import {
    EMPTY_DRAFT,
    OUTDOORS_EVENT_STATUSES,
    type OutdoorsEvent,
    type OutdoorsEventDraft,
    type OutdoorsEventStatus
} from "./lib/types";
import {
    deleteOutdoorsEvent,
    insertOutdoorsEvent,
    listOutdoorsEvents,
    updateOutdoorsEvent
} from "./lib/persistence";

/**
 * Outdoors Events room state (ADR-015).
 *
 * Module-level signals per canon Phase 4 / Room 9. The room owns one
 * list (the operator's tracked events) + a composer draft for the
 * new-event form + per-row busy markers.
 */

export const allEvents: Signal<ReadonlyArray<OutdoorsEvent>> = signal([]);
export const loaded: Signal<boolean> = signal(false);
export const draft: Signal<OutdoorsEventDraft> = signal(EMPTY_DRAFT);
export const composerOpen: Signal<boolean> = signal(false);
export const composerBusy: Signal<boolean> = signal(false);
export const composerError: Signal<string | null> = signal(null);
export const busyRowId: Signal<string | null> = signal(null);

/**
 * Events grouped by status, ordered per OUTDOORS_EVENT_STATUSES so
 * Watching shows first, Archived last.
 */
export const eventsByStatus = computed(() => {
    const buckets = new Map<OutdoorsEventStatus, OutdoorsEvent[]>();
    for (const s of OUTDOORS_EVENT_STATUSES) buckets.set(s, []);
    for (const e of allEvents.value) {
        const list = buckets.get(e.status);
        if (list) list.push(e);
    }
    return OUTDOORS_EVENT_STATUSES.map((status) => ({
        status,
        events: buckets.get(status) ?? []
    }));
});

export function setEvents(list: ReadonlyArray<OutdoorsEvent>): void {
    allEvents.value = list;
    loaded.value = true;
}

export function patchDraft(patch: Partial<OutdoorsEventDraft>): void {
    draft.value = { ...draft.value, ...patch };
}

export function openComposer(): void {
    draft.value = EMPTY_DRAFT;
    composerError.value = null;
    composerOpen.value = true;
}

export function closeComposer(): void {
    composerOpen.value = false;
    composerBusy.value = false;
    composerError.value = null;
    draft.value = EMPTY_DRAFT;
}

export async function bootEvents(): Promise<void> {
    setEvents(await listOutdoorsEvents());
}

export async function saveDraft(): Promise<boolean> {
    const d = draft.value;
    if (d.name.trim().length === 0) {
        composerError.value = "Name the event before saving.";
        return false;
    }
    composerBusy.value = true;
    composerError.value = null;
    try {
        const inserted = await insertOutdoorsEvent(d);
        if (!inserted) {
            composerError.value =
                "Couldn't save the event. Check the connection and try again.";
            return false;
        }
        allEvents.value = [...allEvents.value, inserted];
        closeComposer();
        return true;
    } finally {
        composerBusy.value = false;
    }
}

export async function changeStatus(
    id: string,
    next: OutdoorsEventStatus
): Promise<void> {
    busyRowId.value = id;
    try {
        const ok = await updateOutdoorsEvent(id, { status: next });
        if (ok) {
            allEvents.value = allEvents.value.map((e) =>
                e.id === id ? { ...e, status: next } : e
            );
        }
    } finally {
        busyRowId.value = null;
    }
}

export async function removeEvent(id: string): Promise<void> {
    busyRowId.value = id;
    try {
        const ok = await deleteOutdoorsEvent(id);
        if (ok) {
            allEvents.value = allEvents.value.filter((e) => e.id !== id);
        }
    } finally {
        busyRowId.value = null;
    }
}

/** @internal — reset module state between tests. */
export function __resetOutdoorsEventsStateForTests(): void {
    allEvents.value = [];
    loaded.value = false;
    draft.value = EMPTY_DRAFT;
    composerOpen.value = false;
    composerBusy.value = false;
    composerError.value = null;
    busyRowId.value = null;
}
