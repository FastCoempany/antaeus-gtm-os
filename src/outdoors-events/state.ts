import { computed, signal, type Signal } from "@preact/signals";
import {
    EMPTY_DRAFT,
    OUTDOORS_EVENT_STATUSES,
    OUTDOORS_EVENT_TIERS,
    type OutdoorsEvent,
    type OutdoorsEventDraft,
    type OutdoorsEventStatus,
    type OutdoorsEventTier
} from "./lib/types";
import {
    deleteOutdoorsEvent,
    insertOutdoorsEvent,
    listOutdoorsEvents,
    updateOutdoorsEvent
} from "./lib/persistence";
import {
    loadLatestRun,
    triggerDiscovery,
    type DiscoveryRun
} from "./lib/discovery";

/**
 * Outdoors Events room state (ADR-015 + ADR-016).
 *
 * Module-level signals per canon Phase 4 / Room 9. The room is a
 * discovery surface: the system populates events; the operator marks,
 * prioritizes, dismisses. State holds the event list, the latest
 * discovery-run summary, and the manual-composer fallback (deprecated
 * per ADR-016 but kept usable during the transition).
 */

export const allEvents: Signal<ReadonlyArray<OutdoorsEvent>> = signal([]);
export const loaded: Signal<boolean> = signal(false);
export const draft: Signal<OutdoorsEventDraft> = signal(EMPTY_DRAFT);
export const composerOpen: Signal<boolean> = signal(false);
export const composerBusy: Signal<boolean> = signal(false);
export const composerError: Signal<string | null> = signal(null);
export const busyRowId: Signal<string | null> = signal(null);

// ── Discovery (ADR-016 PR 2) ──────────────────────────────────────
export const latestRun: Signal<DiscoveryRun | null> = signal(null);
export const discoveryBusy: Signal<boolean> = signal(false);
export const discoveryError: Signal<string | null> = signal(null);

/**
 * Events grouped by relevance tier (Direct / Adjacent / Indirect),
 * then by status within each tier. This is the primary organizing axis
 * per ADR-016. Events without a tier (legacy + manual) collect in a
 * trailing "untiered" bucket the UI renders last.
 */
export const eventsByTier = computed(() => {
    const buckets = new Map<OutdoorsEventTier, OutdoorsEvent[]>();
    for (const t of OUTDOORS_EVENT_TIERS) buckets.set(t, []);
    const untiered: OutdoorsEvent[] = [];
    for (const e of allEvents.value) {
        if (e.relevanceTier && buckets.has(e.relevanceTier)) {
            buckets.get(e.relevanceTier)!.push(e);
        } else {
            untiered.push(e);
        }
    }
    const tiers = OUTDOORS_EVENT_TIERS.map((tier) => ({
        tier,
        events: buckets.get(tier) ?? []
    }));
    return { tiers, untiered };
});

/**
 * Events grouped by status, ordered per OUTDOORS_EVENT_STATUSES so
 * Watching shows first, Archived last. Retained for the manual /
 * legacy fallback view.
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

export async function bootLatestRun(): Promise<void> {
    latestRun.value = await loadLatestRun();
}

/**
 * Run discovery now. Invokes the Edge Function, then re-loads the
 * event list + the run summary so the freshly-discovered events
 * appear without a manual reload.
 */
export async function runDiscoveryNow(): Promise<void> {
    if (discoveryBusy.value) return;
    discoveryBusy.value = true;
    discoveryError.value = null;
    try {
        const result = await triggerDiscovery();
        if (!result.ok) {
            discoveryError.value =
                result.error ?? "Discovery didn't complete. Try again.";
            return;
        }
        setEvents(await listOutdoorsEvents());
        latestRun.value = await loadLatestRun();
    } finally {
        discoveryBusy.value = false;
    }
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
    latestRun.value = null;
    discoveryBusy.value = false;
    discoveryError.value = null;
}
