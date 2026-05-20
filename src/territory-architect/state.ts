import {
    computed,
    effect,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    ACCOUNT_CEILING,
    EMPTY_ACCOUNT_DRAFT,
    EMPTY_APPROACH_DRAFT,
    EMPTY_FOCUS_DRAFT,
    EMPTY_TERRITORY_STATE,
    TIER_DEFAULTS,
    TIER_IDS,
    type AccountDraft,
    type AllocationReadout,
    type Approach,
    type ApproachDraft,
    type DispositionState,
    type TerritoryAccount,
    type TerritoryState,
    type Focus,
    type FocusDraft,
    type TierAllocation,
    type TierId
} from "./lib/types";
import { saveAll } from "./lib/persistence";

/**
 * Phase 4 / Room 12 — Territory Architect runtime state.
 *
 * Source signals: focuses, approaches, accounts, territory health, +
 * 3 form drafts. Computed: allocation by tier (vs ceiling), focus
 * accountCount, approach-by-focus index. Persistence side-effect
 * mirrors all 4 lists to localStorage with first-run skip.
 */

// ─── Source of truth ────────────────────────────────────────────────────

export const focuses: Signal<ReadonlyArray<Focus>> = signal([]);
export const approaches: Signal<ReadonlyArray<Approach>> = signal([]);
export const accounts: Signal<ReadonlyArray<TerritoryAccount>> = signal([]);
export const territory: Signal<TerritoryState> = signal(EMPTY_TERRITORY_STATE);

export const focusDraft: Signal<FocusDraft> = signal(EMPTY_FOCUS_DRAFT);
export const approachDraft: Signal<ApproachDraft> =
    signal(EMPTY_APPROACH_DRAFT);
export const accountDraft: Signal<AccountDraft> = signal(EMPTY_ACCOUNT_DRAFT);

export const loaded: Signal<boolean> = signal(false);

/**
 * Phase 2.3 — inbound focus from cross-room handoff. ICP Studio,
 * Dashboard, and other upstream rooms can pass `?focusObject=…` to
 * tell Territory Architect what ICP it's building against. Surfaces
 * in the hero kicker + flows through into outbound handoffs so
 * Sourcing / Signal Console land focused too. Empty = no inbound.
 */
export const focusedIcp: Signal<string> = signal("");

// ─── Derived projections ───────────────────────────────────────────────

export const allocation: ReadonlySignal<AllocationReadout> = computed(() => {
    const list = accounts.value.filter(
        (a) => a.disposition !== "closed-won" && a.disposition !== "closed-lost"
    );
    const perTier: TierAllocation[] = TIER_IDS.map((tier) => {
        const count = list.filter((a) => a.tier === tier).length;
        const target = TIER_DEFAULTS[tier];
        return { tier, count, target, delta: count - target };
    });
    const total = perTier.reduce((acc, t) => acc + t.count, 0);
    const remaining = ACCOUNT_CEILING - total;
    const status: AllocationReadout["status"] =
        total > ACCOUNT_CEILING
            ? "over"
            : total === ACCOUNT_CEILING
              ? "at-cap"
              : "headroom";
    return {
        perTier,
        total,
        ceiling: ACCOUNT_CEILING,
        remaining,
        status
    };
});

/** Approaches indexed by focusId. */
export const approachesByThesis: ReadonlySignal<
    Readonly<Record<string, ReadonlyArray<Approach>>>
> = computed(() => {
    const out: Record<string, Approach[]> = {};
    for (const a of approaches.value) {
        if (!a.focusId) continue;
        if (!out[a.focusId]) out[a.focusId] = [];
        out[a.focusId]!.push(a);
    }
    return out;
});

/** Account counts per focus. */
export const accountsByThesis: ReadonlySignal<
    Readonly<Record<string, number>>
> = computed(() => {
    const out: Record<string, number> = {};
    for (const a of accounts.value) {
        if (a.disposition === "closed-won" || a.disposition === "closed-lost")
            continue;
        if (!out[a.focusId]) out[a.focusId] = 0;
        out[a.focusId] = out[a.focusId]! + 1;
    }
    return out;
});

// ─── Mutations ─────────────────────────────────────────────────────────

export function setFocuses(next: ReadonlyArray<Focus>): void {
    focuses.value = next;
}
export function setApproaches(next: ReadonlyArray<Approach>): void {
    approaches.value = next;
}
export function setAccounts(next: ReadonlyArray<TerritoryAccount>): void {
    accounts.value = next;
}
export function setTerritoryState(next: TerritoryState): void {
    territory.value = next;
}

export function patchThesisDraft(part: Partial<FocusDraft>): void {
    focusDraft.value = { ...focusDraft.value, ...part } as FocusDraft;
}
export function patchApproachDraft(part: Partial<ApproachDraft>): void {
    approachDraft.value = { ...approachDraft.value, ...part } as ApproachDraft;
}
export function patchAccountDraft(part: Partial<AccountDraft>): void {
    accountDraft.value = { ...accountDraft.value, ...part } as AccountDraft;
}

function uid(prefix: string, now: number = Date.now()): string {
    return `${prefix}_${now}_${Math.random().toString(36).slice(2, 7)}`;
}

export function saveThesisFromDraft(now: number = Date.now()): Focus | null {
    const d = focusDraft.value;
    const title = d.title.trim();
    if (!title) return null;
    const iso = new Date(now).toISOString();
    const t: Focus = {
        id: uid("th", now),
        title,
        pressure: d.pressure.trim(),
        segment: d.segment.trim(),
        whyUs: d.whyUs.trim(),
        tier: d.tier,
        accountIds: [],
        createdAt: iso,
        updatedAt: iso
    };
    focuses.value = [...focuses.value, t];
    focusDraft.value = EMPTY_FOCUS_DRAFT;
    return t;
}

export function saveApproachFromDraft(
    now: number = Date.now()
): Approach | null {
    const d = approachDraft.value;
    const name = d.name.trim();
    if (!name || !d.focusId) return null;
    const iso = new Date(now).toISOString();
    const a: Approach = {
        id: uid("ap", now),
        name,
        trigger: d.trigger.trim(),
        script: d.script.trim(),
        bridge: d.bridge.trim(),
        focusId: d.focusId,
        createdAt: iso,
        updatedAt: iso
    };
    approaches.value = [...approaches.value, a];
    approachDraft.value = EMPTY_APPROACH_DRAFT;
    return a;
}

export function saveAccountFromDraft(
    now: number = Date.now()
): TerritoryAccount | null {
    const d = accountDraft.value;
    const name = d.name.trim();
    if (!name || !d.focusId) return null;
    // Block if at or over ceiling.
    const current = allocation.value.total;
    if (current >= ACCOUNT_CEILING) return null;
    const iso = new Date(now).toISOString();
    const acct: TerritoryAccount = {
        id: uid("acct", now),
        name,
        tier: d.tier,
        focusId: d.focusId,
        approachId: d.approachId,
        disposition: "active",
        notes: d.notes.trim(),
        createdAt: iso,
        updatedAt: iso
    };
    accounts.value = [...accounts.value, acct];
    accountDraft.value = { ...EMPTY_ACCOUNT_DRAFT, focusId: d.focusId };
    return acct;
}

export function setAccountDisposition(
    id: string,
    disposition: DispositionState,
    now: number = Date.now()
): void {
    accounts.value = accounts.value.map((a) =>
        a.id === id
            ? { ...a, disposition, updatedAt: new Date(now).toISOString() }
            : a
    );
}

export function retierAccount(id: string, tier: TierId): void {
    accounts.value = accounts.value.map((a) =>
        a.id === id ? { ...a, tier, updatedAt: new Date().toISOString() } : a
    );
}

export function removeThesis(id: string): void {
    focuses.value = focuses.value.filter((t) => t.id !== id);
    approaches.value = approaches.value.filter((a) => a.focusId !== id);
    accounts.value = accounts.value.filter((a) => a.focusId !== id);
}

export function removeApproach(id: string): void {
    approaches.value = approaches.value.filter((a) => a.id !== id);
}

export function removeAccount(id: string): void {
    accounts.value = accounts.value.filter((a) => a.id !== id);
}

export function resetSession(): void {
    focuses.value = [];
    approaches.value = [];
    accounts.value = [];
    territory.value = EMPTY_TERRITORY_STATE;
    focusDraft.value = EMPTY_FOCUS_DRAFT;
    approachDraft.value = EMPTY_APPROACH_DRAFT;
    accountDraft.value = EMPTY_ACCOUNT_DRAFT;
    loaded.value = false;
}

// ─── Persistence side-effect ───────────────────────────────────────────

let persistStop: (() => void) | null = null;

export function startPersistence(): () => void {
    if (persistStop) return persistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const t = focuses.value;
        const a = approaches.value;
        const ac = accounts.value;
        const territoryState = territory.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveAll({
            focuses: t,
            approaches: a,
            accounts: ac,
            territory: territoryState
        });
    });
    persistStop = () => {
        dispose();
        persistStop = null;
    };
    return persistStop;
}

// Test seeds
export function __setFocusesForTests(next: ReadonlyArray<Focus>): void {
    focuses.value = next;
}
export function __setAccountsForTests(
    next: ReadonlyArray<TerritoryAccount>
): void {
    accounts.value = next;
}
