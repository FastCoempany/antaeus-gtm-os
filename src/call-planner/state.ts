import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import {
    EMPTY_DRAFT,
    type Draft,
    type LinkedDeal,
    type MatchedAccount,
    type PersonaKey
} from "./lib/types";

/**
 * Phase 4 / Room 9 — Call Planner runtime state.
 *
 * Per canon §4.11 the room shapes the next call from a single witness
 * + four agenda strips + advancement landing. Wave 1 sets up the
 * signals + computed projections; subsequent waves wire persona banks,
 * the live UI, persistence, and cross-room handoff.
 */

// ─── Source of truth ────────────────────────────────────────────────────

/** Form draft — every editable field flows through here. */
export const draft: Signal<Draft> = signal(EMPTY_DRAFT);

/** Signal Console accounts loaded at boot — drives matchedAccount + dropdown. */
export const accountOptions: Signal<ReadonlyArray<MatchedAccount>> = signal(
    []
);

/** Deal Workspace deals loaded at boot — drives linked-deal dropdown. */
export const dealOptions: Signal<ReadonlyArray<LinkedDeal>> = signal([]);

export const loaded: Signal<boolean> = signal(false);

// ─── Derived projections ────────────────────────────────────────────────

/**
 * The Signal Console account matched against `draft.contactName` —
 * port of legacy line 987-993. Substring match in either direction so
 * "Acme" matches "Acme Robotics" and vice-versa.
 */
export const matchedAccount: ReadonlySignal<MatchedAccount | null> = computed(
    () => {
        const name = draft.value.contactName.trim().toLowerCase();
        if (name.length < 2) return null;
        for (const a of accountOptions.value) {
            const lower = a.name.toLowerCase();
            if (lower.indexOf(name) !== -1 || name.indexOf(lower) !== -1) {
                return a;
            }
        }
        return null;
    }
);

/** The currently-linked Deal (if `draft.linkedDealId` resolves to one). */
export const linkedDeal: ReadonlySignal<LinkedDeal | null> = computed(() => {
    const id = draft.value.linkedDealId;
    if (!id) return null;
    return dealOptions.value.find((d) => d.id === id) ?? null;
});

/** The "what company is this call about?" copy — matched account or linked deal. */
export const currentCompany: ReadonlySignal<string> = computed(() => {
    const m = matchedAccount.value;
    if (m) return m.name;
    const d = linkedDeal.value;
    if (d) return d.accountName;
    return "";
});

/** Top signal headline (drives opener + reason-now copy). */
export const topSignalHeadline: ReadonlySignal<string> = computed(() => {
    const m = matchedAccount.value;
    if (!m || !m.topSignal) return "";
    return m.topSignal.headline;
});

// ─── Actions ────────────────────────────────────────────────────────────

export function patchDraft(part: Partial<Draft>): void {
    draft.value = { ...draft.value, ...part } as Draft;
}

export function setContactName(name: string): void {
    patchDraft({ contactName: name });
}

export function setPersona(persona: PersonaKey): void {
    patchDraft({ persona });
}

export function setCustomNotes(notes: string): void {
    patchDraft({ customNotes: notes });
}

export function setLinkedinUrl(url: string): void {
    patchDraft({ linkedinUrl: url });
}

export function setLinkedDealId(id: string): void {
    patchDraft({ linkedDealId: id });
}

export function setAccountOptions(
    options: ReadonlyArray<MatchedAccount>
): void {
    accountOptions.value = options;
}

export function setDealOptions(options: ReadonlyArray<LinkedDeal>): void {
    dealOptions.value = options;
}

export function resetDraft(): void {
    draft.value = EMPTY_DRAFT;
}

export function resetSession(): void {
    draft.value = EMPTY_DRAFT;
    accountOptions.value = [];
    dealOptions.value = [];
    loaded.value = false;
}

/** Test-only seed helpers. */
export function __setAccountOptionsForTests(
    options: ReadonlyArray<MatchedAccount>
): void {
    accountOptions.value = options;
}

export function __setDealOptionsForTests(
    options: ReadonlyArray<LinkedDeal>
): void {
    dealOptions.value = options;
}
