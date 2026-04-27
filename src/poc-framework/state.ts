import { computed, effect, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import {
    EMPTY_DRAFT,
    MAX_PROOF_HISTORY,
    type DurationDays,
    type LinkedDealSummary,
    type Outcome,
    type Proof,
    type ProofDraft
} from "./lib/types";
import { freezeDraftIntoProof, saveProofs } from "./lib/persistence";
import { syncProofIntoDeal } from "./lib/deal-sync";

/**
 * Phase 4 / Room 5 — PoC Framework runtime state.
 *
 * Per canon §4.15 the room shapes one decision-grade proof object at
 * a time. Working draft lives on the forge panel; saved proofs live
 * in the room ledger. Signals here mirror that:
 *
 *   - allProofs   — saved proof history (max 20)
 *   - draft       — in-flight working proof (forge panel form state)
 *   - linkedDeals — Deal Workspace summary, populates the deal dropdown
 *
 * Wave 4 will wire persistence (read/write `gtmos_poc_data` + sync
 * back into `gtmos_deal_workspaces[].poc`). Wave 1 keeps state
 * in-memory.
 */

// ─── Source of truth ────────────────────────────────────────────────────

export const allProofs: Signal<ReadonlyArray<Proof>> = signal([]);

export const draft: Signal<ProofDraft> = signal(EMPTY_DRAFT);

export const linkedDeals: Signal<ReadonlyArray<LinkedDealSummary>> = signal([]);

export const loaded: Signal<boolean> = signal(false);

// ─── Derived projections ────────────────────────────────────────────────

/** Linked-deal lookup for the current draft (null if unlinked). */
export const linkedDeal: ReadonlySignal<LinkedDealSummary | null> = computed(() => {
    const id = draft.value.linkedDealId;
    if (!id) return null;
    return linkedDeals.value.find((d) => d.id === id) ?? null;
});

/** Most recent saved proof for the active account+vendor pair. */
export const activeProof: ReadonlySignal<Proof | null> = computed(() => {
    const { account, vendor } = draft.value;
    if (!account) return null;
    const matches = allProofs.value.filter(
        (p) =>
            p.account.toLowerCase() === account.toLowerCase() &&
            p.vendor.toLowerCase() === (vendor ?? "").toLowerCase()
    );
    if (matches.length === 0) return null;
    return matches.reduce((latest, p) =>
        p.updatedAt > latest.updatedAt ? p : latest
    );
});

// ─── Actions ────────────────────────────────────────────────────────────

export function patchDraft(part: Partial<ProofDraft>): void {
    draft.value = { ...draft.value, ...part } as ProofDraft;
}

export function setOutcome(outcome: Outcome): void {
    patchDraft({ outcome });
}

export function setDurationDays(days: DurationDays): void {
    patchDraft({ durationDays: days });
}

export function setAllProofs(proofs: ReadonlyArray<Proof>): void {
    allProofs.value = proofs;
    loaded.value = true;
}

export function setLinkedDeals(deals: ReadonlyArray<LinkedDealSummary>): void {
    linkedDeals.value = deals;
}

export function upsertProof(proof: Proof): void {
    const existing = allProofs.value;
    const idx = existing.findIndex((p) => p.id === proof.id);
    if (idx === -1) {
        allProofs.value = [proof, ...existing].slice(0, MAX_PROOF_HISTORY);
    } else {
        const next = existing.slice();
        next[idx] = proof;
        allProofs.value = next;
    }
}

/**
 * Save the current draft as a Proof. Dedupes on account+vendor by
 * reusing the existing id when one matches (matches legacy
 * "single proof per account+vendor pair" behavior).
 */
export function saveDraft(now: number = Date.now()): Proof {
    const drft = draft.value;
    const linked = linkedDeal.value;
    const existing = allProofs.value.find(
        (p) =>
            p.account.toLowerCase() === drft.account.toLowerCase() &&
            p.vendor.toLowerCase() === (drft.vendor ?? "").toLowerCase()
    );
    const proof = freezeDraftIntoProof(drft, linked, {
        now,
        ...(existing ? { id: existing.id } : {})
    });
    upsertProof(proof);
    // Wave 5 — write proof snapshot back into the linked deal so
    // Deal Workspace + downstream readers see the proof state.
    syncProofIntoDeal(proof);
    return proof;
}

export function resetDraft(): void {
    draft.value = EMPTY_DRAFT;
}

export function resetSession(): void {
    allProofs.value = [];
    linkedDeals.value = [];
    loaded.value = false;
    draft.value = EMPTY_DRAFT;
}

/** Test-only — seed the proof + deal lists. */
export function __setAllProofsForTests(proofs: ReadonlyArray<Proof>): void {
    allProofs.value = proofs;
    loaded.value = true;
}

export function __setLinkedDealsForTests(
    deals: ReadonlyArray<LinkedDealSummary>
): void {
    linkedDeals.value = deals;
}

let proofPersistStop: (() => void) | null = null;

/**
 * Wire the side-effect that mirrors every allProofs change to
 * localStorage (`gtmos_poc_data`). Skips the first run so the
 * boot-time seed doesn't trigger a redundant write — same pattern as
 * Phase 4 / Rooms 3 + 4.
 */
export function startProofPersistence(): () => void {
    if (proofPersistStop) return proofPersistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const proofs = allProofs.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveProofs(proofs);
    });
    proofPersistStop = () => {
        dispose();
        proofPersistStop = null;
    };
    return proofPersistStop;
}
