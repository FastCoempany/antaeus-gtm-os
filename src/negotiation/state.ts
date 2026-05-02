import {
    computed,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_NEGOTIATION,
    type CounterpartyRole,
    type LearningEntry,
    type LinkedDealSummary,
    type Negotiation,
    type NegotiationOutcome
} from "./lib/types";
import { seedPushbacksFor, SEED_LADDER_DEFAULT } from "./lib/seed-scripts";

/**
 * Negotiation runtime state — Phase 3 of ADR-003.
 *
 * One drafted negotiation at a time (mirrors how Advisor Deploy
 * drafts one ask at a time). Saved negotiations land in `allNegotiations`
 * as a history log. Linked deals come from the cloud-mirrored
 * `gtmos_deal_workspaces` localStorage key.
 */

/** All saved negotiations in the workspace. */
export const allNegotiations: Signal<ReadonlyArray<Negotiation>> = signal([]);

/** The current draft — one negotiation in flight. */
export const draft: Signal<Negotiation> = signal({
    ...EMPTY_NEGOTIATION,
    id: "",
    createdAt: "",
    updatedAt: "",
    pushbacks: seedPushbacksFor("cfo"),
    concessionLadder: SEED_LADDER_DEFAULT
});

/** Linked deals from Deal Workspace mirror — populates the dropdown. */
export const linkedDeals: Signal<ReadonlyArray<LinkedDealSummary>> = signal([]);

/** Lessons-learned log. */
export const learnings: Signal<ReadonlyArray<LearningEntry>> = signal([]);

/** Resolved deal for the current draft. */
export const draftDeal: ReadonlySignal<LinkedDealSummary | null> = computed(
    () => {
        const id = draft.value.dealId;
        if (!id) return null;
        return linkedDeals.value.find((d) => d.id === id) ?? null;
    }
);

// ─── Mutations ─────────────────────────────────────────────────────────

export function setDealId(id: string | null): void {
    draft.value = { ...draft.value, dealId: id, updatedAt: nowIso() };
}

export function setCounterparty(role: CounterpartyRole): void {
    // Switching role swaps the seed pushbacks (operator can still
    // edit afterward).
    draft.value = {
        ...draft.value,
        counterparty: role,
        pushbacks: seedPushbacksFor(role),
        updatedAt: nowIso()
    };
}

export function setCounterpartyName(name: string): void {
    draft.value = {
        ...draft.value,
        counterpartyName: name,
        updatedAt: nowIso()
    };
}

export function setStartingPosition(text: string): void {
    draft.value = {
        ...draft.value,
        startingPosition: text,
        updatedAt: nowIso()
    };
}

export function setWalkawayPosition(text: string): void {
    draft.value = {
        ...draft.value,
        walkawayPosition: text,
        updatedAt: nowIso()
    };
}

export function setOpeningLine(text: string): void {
    draft.value = { ...draft.value, openingLine: text, updatedAt: nowIso() };
}

export function setNotes(text: string): void {
    draft.value = { ...draft.value, notes: text, updatedAt: nowIso() };
}

export function setLinkedDeals(deals: ReadonlyArray<LinkedDealSummary>): void {
    linkedDeals.value = deals;
}

export function logOutcome(outcome: NegotiationOutcome): void {
    draft.value = {
        ...draft.value,
        outcome,
        status: "closed",
        updatedAt: nowIso()
    };
}

export function appendLearning(text: string): void {
    if (!text.trim()) return;
    const entry: LearningEntry = {
        id: `learn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        negotiationId: draft.value.id || "draft",
        text: text.trim(),
        createdAt: nowIso()
    };
    learnings.value = [entry, ...learnings.value];
}

export function freezeDraft(): Negotiation {
    const now = nowIso();
    const id =
        draft.value.id ||
        `neg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const frozen: Negotiation = {
        ...draft.value,
        id,
        createdAt: draft.value.createdAt || now,
        updatedAt: now,
        status:
            draft.value.outcome != null ? "closed" : draft.value.status
    };
    allNegotiations.value = [
        frozen,
        ...allNegotiations.value.filter((n) => n.id !== frozen.id)
    ].slice(0, 50);
    return frozen;
}

export function setAllNegotiations(
    negotiations: ReadonlyArray<Negotiation>
): void {
    allNegotiations.value = negotiations;
}

function nowIso(): string {
    return new Date().toISOString();
}

/** Test-only — reset signals between cases. */
export function __resetForTests(): void {
    allNegotiations.value = [];
    learnings.value = [];
    linkedDeals.value = [];
    draft.value = {
        ...EMPTY_NEGOTIATION,
        id: "",
        createdAt: "",
        updatedAt: "",
        pushbacks: seedPushbacksFor("cfo"),
        concessionLadder: SEED_LADDER_DEFAULT
    };
}
