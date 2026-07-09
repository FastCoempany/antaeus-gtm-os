import {
    computed,
    effect,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_PROSPECT_DRAFT,
    EMPTY_QUERY_CARD_DRAFT,
    type Prospect,
    type ProspectDraft,
    type ProspectStage,
    type QueryCard,
    type QueryCardDraft,
    type WorkbenchStats
} from "./lib/types";
import { saveAll } from "./lib/persistence";
import { getProspectQuality } from "./lib/quality";

export const queryCards: Signal<ReadonlyArray<QueryCard>> = signal([]);
export const prospects: Signal<ReadonlyArray<Prospect>> = signal([]);

export const queryCardDraft: Signal<QueryCardDraft> = signal(
    EMPTY_QUERY_CARD_DRAFT
);
export const prospectDraft: Signal<ProspectDraft> = signal(
    EMPTY_PROSPECT_DRAFT
);

export const loaded: Signal<boolean> = signal(false);

/**
 * Phase 2.3 — inbound focus from cross-room handoff. ICP Studio,
 * Territory Architect, or other upstream rooms pass `?focusObject=`
 * to tell Sourcing what ICP it's sourcing against. Surfaces in
 * the topbar kicker; propagates through outbound handoffs.
 */
export const inboundFocus: Signal<string> = signal("");

export const stats: ReadonlySignal<WorkbenchStats> = computed(() => {
    const list = prospects.value;
    let captured = 0;
    let researched = 0;
    let ready = 0;
    let pushed = 0;
    for (const p of list) {
        switch (p.stage) {
            case "captured":
                captured += 1;
                break;
            case "researched":
                researched += 1;
                break;
            case "ready":
                ready += 1;
                break;
            case "pushed":
                pushed += 1;
                break;
        }
    }
    return {
        captured,
        researched,
        ready,
        pushed,
        total: list.length
    };
});

/** Prospects grouped by stage. */
export const prospectsByStage: ReadonlySignal<
    Readonly<Record<ProspectStage, ReadonlyArray<Prospect>>>
> = computed(() => {
    const out: Record<ProspectStage, Prospect[]> = {
        captured: [],
        researched: [],
        ready: [],
        pushed: [],
        dropped: []
    };
    for (const p of prospects.value) {
        out[p.stage].push(p);
    }
    return out;
});

// ─── Mutations ─────────────────────────────────────────────────────────

export function patchQueryCardDraft(part: Partial<QueryCardDraft>): void {
    queryCardDraft.value = {
        ...queryCardDraft.value,
        ...part
    } as QueryCardDraft;
}

export function patchProspectDraft(part: Partial<ProspectDraft>): void {
    prospectDraft.value = { ...prospectDraft.value, ...part } as ProspectDraft;
}

function uid(prefix: string, now: number = Date.now()): string {
    return `${prefix}_${now}_${Math.random().toString(36).slice(2, 7)}`;
}

export function setQueryCards(next: ReadonlyArray<QueryCard>): void {
    queryCards.value = next;
}
export function setProspects(next: ReadonlyArray<Prospect>): void {
    prospects.value = next;
}

export function saveQueryCardFromDraft(
    now: number = Date.now()
): QueryCard | null {
    const d = queryCardDraft.value;
    const q = d.query.trim();
    if (!q) return null;
    const iso = new Date(now).toISOString();
    const card: QueryCard = {
        id: uid("qc", now),
        platform: d.platform,
        query: q,
        intent: d.intent.trim(),
        notes: d.notes.trim(),
        targetIcp: d.targetIcp.trim(),
        createdAt: iso,
        updatedAt: iso
    };
    queryCards.value = [...queryCards.value, card];
    queryCardDraft.value = { ...EMPTY_QUERY_CARD_DRAFT, platform: d.platform };
    return card;
}

export function removeQueryCard(id: string): void {
    queryCards.value = queryCards.value.filter((c) => c.id !== id);
}

export function saveProspectFromDraft(
    now: number = Date.now()
): Prospect | null {
    const d = prospectDraft.value;
    const account = d.accountName.trim();
    if (!account) return null;
    const iso = new Date(now).toISOString();
    const p: Prospect = {
        id: uid("pr", now),
        accountName: account,
        contactName: d.contactName.trim(),
        contactTitle: d.contactTitle.trim(),
        sourceQueryId: d.sourceQueryId,
        leverage: d.leverage,
        stage: "captured",
        entryPoint: d.entryPoint.trim(),
        approach: d.approach.trim(),
        notes: d.notes.trim(),
        createdAt: iso,
        updatedAt: iso
    };
    // Auto-promote based on initial quality
    const q = getProspectQuality(p);
    const promoted: Prospect =
        q.recommendedStage !== "captured"
            ? { ...p, stage: q.recommendedStage }
            : p;
    prospects.value = [...prospects.value, promoted];
    prospectDraft.value = EMPTY_PROSPECT_DRAFT;
    return promoted;
}

export function setProspectStage(id: string, stage: ProspectStage): void {
    prospects.value = prospects.value.map((p) =>
        p.id === id
            ? { ...p, stage, updatedAt: new Date().toISOString() }
            : p
    );
}

export function patchProspect(id: string, patch: Partial<Prospect>): void {
    prospects.value = prospects.value.map((p) =>
        p.id === id
            ? { ...p, ...patch, updatedAt: new Date().toISOString() }
            : p
    );
}

export function removeProspect(id: string): void {
    prospects.value = prospects.value.filter((p) => p.id !== id);
}

export function resetSession(): void {
    queryCards.value = [];
    prospects.value = [];
    queryCardDraft.value = EMPTY_QUERY_CARD_DRAFT;
    prospectDraft.value = EMPTY_PROSPECT_DRAFT;
    loaded.value = false;
}

// ─── Persistence side-effect ───────────────────────────────────────────

let persistStop: (() => void) | null = null;

export function startPersistence(): () => void {
    if (persistStop) return persistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const c = queryCards.value;
        const p = prospects.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveAll({ queryCards: c, prospects: p });
    });
    persistStop = () => {
        dispose();
        persistStop = null;
    };
    return persistStop;
}

// Test seeds
export function __setQueryCardsForTests(next: ReadonlyArray<QueryCard>): void {
    queryCards.value = next;
}
export function __setProspectsForTests(next: ReadonlyArray<Prospect>): void {
    prospects.value = next;
}
