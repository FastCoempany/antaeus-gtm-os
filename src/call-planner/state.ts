import {
    computed,
    effect,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_DRAFT,
    OUTCOME_LABELS,
    type AgendaSnapshot,
    type CallHandoffPayload,
    type Draft,
    type LinkedDeal,
    type MatchedAccount,
    type Outcome,
    type PersonaKey
} from "./lib/types";
import { evaluateQuality } from "./lib/quality";
import {
    incrementDiscoveryStats,
    saveAgendaSnapshot,
    saveCallHandoff
} from "./lib/persistence";

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

// ─── Agenda snapshot + handoff payload builders ────────────────────────

/**
 * Build the AgendaSnapshot from the current state. Mirrors legacy
 * `getAgendaSnapshot()` shape so Discovery Studio + downstream rooms
 * see the same payload they always have.
 */
export function buildAgendaSnapshot(
    now: number = Date.now()
): AgendaSnapshot {
    const d = draft.value;
    const m = matchedAccount.value;
    const linked = linkedDeal.value;
    const quality = evaluateQuality({
        draft: d,
        matchedAccount: m,
        linkedDeal: linked
    });
    const company = m?.name ?? linked?.accountName ?? "";
    const signalHeadline =
        quality.hasSignal && m?.topSignal ? m.topSignal.headline : "";
    return {
        contact: d.contactName,
        company,
        persona: d.persona,
        linkedDeal: linked?.id ?? "",
        gates: quality.gates.map((g) => g.met),
        gateDetails: quality.gates.map((g) => ({
            label: g.label,
            met: g.met,
            copy: g.copy
        })),
        score: quality.score,
        band: quality.bandLabel,
        nextMove: quality.nextMove,
        signalHeadline,
        customNotes: d.customNotes,
        linkedinUrl: d.linkedinUrl,
        preparedAt: new Date(now).toISOString()
    };
}

/**
 * Build the CallHandoffPayload that Discovery Studio reads on boot.
 * Pass an Outcome to mark the call as logged ("call_outcome"),
 * otherwise it's a "call_plan" snapshot for the next live call.
 */
export function buildHandoffPayload(
    outcome: Outcome | null,
    snapshot: AgendaSnapshot,
    now: number = Date.now()
): CallHandoffPayload {
    const summary = outcome
        ? `Discovery call - ${OUTCOME_LABELS[outcome]}`
        : "Discovery plan ready";
    return {
        contact: snapshot.contact,
        outcome: outcome ?? "planned",
        timestamp: new Date(now).toISOString(),
        linkedDeal:
            snapshot.linkedDeal && snapshot.linkedDeal.length > 0
                ? snapshot.linkedDeal
                : null,
        company: snapshot.company,
        persona: snapshot.persona,
        logType: outcome ? "call_outcome" : "call_plan",
        summary,
        agendaScore: snapshot.score,
        agendaBand: snapshot.band,
        nextMove: snapshot.nextMove
    };
}

/**
 * Persist the current agenda + handoff (and bump discovery stats when
 * an outcome is supplied). Mirrors legacy `persistAgendaState(outcome)`.
 * Returns the snapshot + handoff for downstream consumers (Wave 5's
 * cross-room CTAs use the linkedDeal id from snapshot).
 */
export interface PersistResult {
    readonly snapshot: AgendaSnapshot;
    readonly handoff: CallHandoffPayload;
}

export function persistAgendaState(
    outcome: Outcome | null,
    now: number = Date.now()
): PersistResult {
    const snapshot = buildAgendaSnapshot(now);
    const handoff = buildHandoffPayload(outcome, snapshot, now);
    saveAgendaSnapshot(snapshot);
    saveCallHandoff(handoff);
    if (outcome) incrementDiscoveryStats(outcome);
    return { snapshot, handoff };
}

/** Convenience: log an outcome end-to-end (snapshot + handoff + stats). */
export function logOutcome(
    outcome: Outcome,
    now: number = Date.now()
): PersistResult {
    return persistAgendaState(outcome, now);
}

// ─── Autosave effect ───────────────────────────────────────────────────

let autosaveStop: (() => void) | null = null;

/**
 * Wire the autosave side-effect that mirrors the agenda snapshot to
 * `gtmos_discovery_agenda` whenever the draft / matched account /
 * linked deal change. Skip first run to avoid a redundant boot-time
 * write — same pattern as Phase 4 / Rooms 3-8.
 *
 * Note: this writes the snapshot only. The handoff payload + stats
 * bump only fire on explicit user action (open Discovery Studio, log
 * outcome) via persistAgendaState / logOutcome.
 */
export function startAgendaAutosave(): () => void {
    if (autosaveStop) return autosaveStop;
    let firstRun = true;
    const dispose = effect(() => {
        // Subscribe to the inputs that drive the snapshot so the effect
        // re-runs on every meaningful change.
        // (draft.value reads → subscription, etc.)
        const _d = draft.value;
        const _a = accountOptions.value;
        const _de = dealOptions.value;
        void _d;
        void _a;
        void _de;
        if (firstRun) {
            firstRun = false;
            return;
        }
        const snapshot = buildAgendaSnapshot();
        saveAgendaSnapshot(snapshot);
    });
    autosaveStop = () => {
        dispose();
        autosaveStop = null;
    };
    return autosaveStop;
}

/** Test-only — restore draft from a stored snapshot (Wave 4 boot path). */
export function hydrateDraftFromSnapshot(snapshot: AgendaSnapshot): void {
    draft.value = {
        contactName: snapshot.contact,
        persona: snapshot.persona,
        customNotes: snapshot.customNotes,
        linkedinUrl: snapshot.linkedinUrl,
        linkedDealId: snapshot.linkedDeal
    };
}
