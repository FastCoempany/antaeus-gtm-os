import { signal, computed, type Signal, type ReadonlySignal } from "@preact/signals";
import {
    isClosed,
    type Deal,
    type StageId
} from "./lib/deal-shape";

/**
 * Deal Workspace — runtime state.
 *
 * Per canon §4.13, the room's primitives are:
 *   - intervention board (dealGrid)
 *   - 9-field deal-health modal
 *   - recovery queue panel
 *   - deal-health panel
 *   - loss-reason modal
 *
 * State maps onto signals: `allDeals` is the source-of-truth array;
 * derived signals project active / recovery / closed views; the modal
 * primitives carry their own form state.
 *
 * Persistence (Wave 4) wires `allDeals` to data.deals via the typed
 * client. Wave 1 keeps the array in-memory for the scaffold.
 */

// ─── Source of truth ────────────────────────────────────────────────────

/** All deals in the active workspace. */
export const allDeals: Signal<ReadonlyArray<Deal>> = signal([]);

/** Whether the initial Supabase load has completed (Wave 4). */
export const loaded: Signal<boolean> = signal(false);

// ─── Derived projections ────────────────────────────────────────────────

/** Active deals — anything not closed. */
export const activeDeals: ReadonlySignal<ReadonlyArray<Deal>> = computed(() =>
    allDeals.value.filter((d) => !isClosed(d.stage))
);

/** Won deals. */
export const wonDeals: ReadonlySignal<ReadonlyArray<Deal>> = computed(() =>
    allDeals.value.filter((d) => d.stage === "closed-won")
);

/** Lost deals. */
export const lostDeals: ReadonlySignal<ReadonlyArray<Deal>> = computed(() =>
    allDeals.value.filter((d) => d.stage === "closed-lost")
);

/** Total pipeline value of active deals. */
export const pipelineValue: ReadonlySignal<number> = computed(() =>
    activeDeals.value.reduce((sum, d) => sum + (d.value || 0), 0)
);

/** Highest-value active deal, or null. */
export const topActiveDeal: ReadonlySignal<Deal | null> = computed(() => {
    const active = activeDeals.value;
    if (active.length === 0) return null;
    let top = active[0]!;
    for (const d of active) {
        if ((d.value || 0) > (top.value || 0)) top = d;
    }
    return top;
});

// ─── Modal state ───────────────────────────────────────────────────────

/**
 * The deal currently being edited in the deal-health modal, or null
 * when the modal is closed. Wave 3 wires the form fields to mutate this.
 */
export const editingDeal: Signal<Deal | null> = signal(null);

/**
 * Snapshot of the deal's stage at the moment the modal opened. Used in
 * Wave 3 to detect closed-lost transitions and trigger the loss-reason
 * modal.
 */
export const editingPrevStage: Signal<StageId | null> = signal(null);

/**
 * The deal queued for the loss-reason modal (set when a save transitions
 * the deal into closed-lost). Null when the modal is dismissed.
 */
export const lossReasonTarget: Signal<{
    dealId: string;
    accountName: string;
} | null> = signal(null);

// ─── Filter / view state ───────────────────────────────────────────────

export type DealFilter = "all" | "at-risk" | "stalled" | "this-quarter";

/** Active filter for the intervention board. */
export const dealFilter: Signal<DealFilter> = signal("all");

// ─── Actions ────────────────────────────────────────────────────────────

export function openDealEditor(deal: Deal): void {
    editingDeal.value = deal;
    editingPrevStage.value = deal.stage;
}

export function closeDealEditor(): void {
    editingDeal.value = null;
    editingPrevStage.value = null;
}

/**
 * Detect a transition into closed-lost — used by Wave 3's save flow
 * to gate the loss-reason modal so it only opens when a deal newly
 * lands in closed-lost (not on subsequent edits to an already-lost
 * deal).
 */
export function transitionedToLost(
    prevStage: StageId | null,
    nextStage: StageId
): boolean {
    if (nextStage !== "closed-lost") return false;
    if (prevStage === "closed-lost") return false;
    return true;
}

export function setDealFilter(filter: DealFilter): void {
    dealFilter.value = filter;
}

export function openLossReasonFor(dealId: string, accountName: string): void {
    lossReasonTarget.value = { dealId, accountName };
}

export function closeLossReason(): void {
    lossReasonTarget.value = null;
}

/**
 * Replace the deals array. Wave 4 calls this after fetching from Supabase.
 */
export function setAllDeals(deals: ReadonlyArray<Deal>): void {
    allDeals.value = deals;
    loaded.value = true;
}

/**
 * Insert or update a deal in the local array. Wave 3 calls this after
 * a successful save, Wave 4's realtime subscription calls it on push
 * updates from other rooms.
 */
export function upsertDeal(deal: Deal): void {
    const existing = allDeals.value;
    const idx = existing.findIndex((d) => d.id === deal.id);
    if (idx === -1) {
        allDeals.value = [...existing, deal];
    } else {
        const next = existing.slice();
        next[idx] = deal;
        allDeals.value = next;
    }
}

/**
 * Reset session state — used at logout / workspace switch boundaries.
 * Does not delete from Supabase; just clears the in-memory cache.
 */
export function resetSession(): void {
    allDeals.value = [];
    loaded.value = false;
    editingDeal.value = null;
    editingPrevStage.value = null;
    lossReasonTarget.value = null;
    dealFilter.value = "all";
}

/** Test-only — seed the deals list. */
export function __setAllDealsForTests(deals: ReadonlyArray<Deal>): void {
    allDeals.value = deals;
    loaded.value = true;
}
