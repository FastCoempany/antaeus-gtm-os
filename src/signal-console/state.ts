import { computed, effect, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import type { Account, RelationshipType, Signal as ScSignal } from "./lib/types";
import { saveAccounts } from "./lib/persistence";
import { publishHealthSnapshot } from "./lib/health-snapshot";

/**
 * Phase 4 / Room 3 — Signal Console runtime state.
 *
 * Per canon §4.7 the Signal Console is the operator's live radar:
 * accounts ranked by heat, with motion as the bias. State signals here
 * mirror that:
 *   - allAccounts: source of truth (the workspace's account list)
 *   - selectedAccountId: drives the detail drawer / expanded card
 *   - searchQuery: free-text filter over account.name
 *
 * Heat itself is NOT stored — it's recomputed from each account's
 * signals via lib/heat.ts. That keeps the source-of-truth honest;
 * a stale heat value would be worse than no value.
 *
 * Wave 4 wires persistence (read/write gtmos_sc_v4 + publish
 * gtmos_signal_room_health). Wave 1 keeps the array in-memory.
 */

// ─── Source of truth ────────────────────────────────────────────────────

export const allAccounts: Signal<ReadonlyArray<Account>> = signal([]);

export const loaded: Signal<boolean> = signal(false);

// ─── View state ────────────────────────────────────────────────────────

export const selectedAccountId: Signal<string | null> = signal(null);

export const searchQuery: Signal<string> = signal("");

/**
 * Phase 2.3 — inbound focus from upstream Strategy-flow rooms
 * (ICP Studio / Territory Architect / Sourcing Workbench passing
 * `?focusObject=<industry>`). Surfaces in the empty-state copy when
 * no accounts exist yet, so Sarah lands knowing which ICP the
 * radar is targeting against. Empty = no inbound focus.
 */
export const inboundFocus: Signal<string> = signal("");

// ─── Derived projections ────────────────────────────────────────────────

export const visibleAccounts: ReadonlySignal<ReadonlyArray<Account>> = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return allAccounts.value;
    return allAccounts.value.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        (a.ticker ?? "").toLowerCase().includes(q) ||
        (a.industry ?? "").toLowerCase().includes(q)
    );
});

export const selectedAccount: ReadonlySignal<Account | null> = computed(() => {
    const id = selectedAccountId.value;
    if (!id) return null;
    return allAccounts.value.find((a) => a.id === id) ?? null;
});

// ─── Actions ────────────────────────────────────────────────────────────

export function setSearchQuery(q: string): void {
    searchQuery.value = q;
}

export function selectAccount(id: string | null): void {
    selectedAccountId.value = id;
}

export function setAllAccounts(accounts: ReadonlyArray<Account>): void {
    allAccounts.value = accounts;
    loaded.value = true;
}

export function upsertAccount(account: Account): void {
    const existing = allAccounts.value;
    const idx = existing.findIndex((a) => a.id === account.id);
    if (idx === -1) {
        allAccounts.value = [...existing, account];
    } else {
        const next = existing.slice();
        next[idx] = account;
        allAccounts.value = next;
    }
}

export function removeAccount(id: string): void {
    const existing = allAccounts.value;
    const idx = existing.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const next = existing.slice();
    next.splice(idx, 1);
    allAccounts.value = next;
}

/**
 * Set an account's relationship type (ADR-007). Updates the in-memory
 * account; returns the updated Account (or null if not found) so the
 * caller can route it to the cloud save. The cloud write is the
 * caller's concern — keeps this module free of the Supabase client,
 * mirroring the signal-mutation primitives above.
 */
export function setAccountRelationshipLocal(
    id: string,
    relationshipType: RelationshipType
): Account | null {
    const existing = allAccounts.value;
    const idx = existing.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const current = existing[idx];
    if (!current) return null;
    const updated: Account = { ...current, relationshipType };
    const next = existing.slice();
    next[idx] = updated;
    allAccounts.value = next;
    return updated;
}

// ─── Local signal mutations ─────────────────────────────────────────────
// These are pure local primitives that mutate the in-memory
// Account.signals[] array. The cloud-write orchestrators in
// cloud-persistence.ts call these alongside their Supabase writes.

/**
 * Add a Signal to an account's signals[] array (newest first).
 * Local-only. Use addSignal (in cloud-persistence) for the dual-write
 * orchestrator.
 *
 * No-op when the account isn't found (caller error; the UI should
 * never address a deleted account).
 */
export function addSignalToAccount(accountId: string, signal: ScSignal): void {
    const existing = allAccounts.value;
    const idx = existing.findIndex((a) => a.id === accountId);
    if (idx === -1) return;
    const account = existing[idx]!;
    const next = existing.slice();
    next[idx] = {
        ...account,
        signals: [signal, ...account.signals]
    };
    allAccounts.value = next;
}

/**
 * Patch a Signal in an account's signals[] array by id. Common patch:
 * `{ flagged: true }`, `{ note: "operator note" }`. Caller passes the
 * full updated Signal; this replaces in place.
 *
 * No-op when account or signal isn't found.
 */
export function updateSignalInAccount(
    accountId: string,
    signal: ScSignal
): void {
    const existing = allAccounts.value;
    const aIdx = existing.findIndex((a) => a.id === accountId);
    if (aIdx === -1) return;
    const account = existing[aIdx]!;
    const sIdx = account.signals.findIndex((s) => s.id === signal.id);
    if (sIdx === -1) return;
    const nextSignals = account.signals.slice();
    nextSignals[sIdx] = signal;
    const next = existing.slice();
    next[aIdx] = { ...account, signals: nextSignals };
    allAccounts.value = next;
}

/**
 * Remove a Signal from an account's signals[] array. No-op when not
 * found.
 */
export function removeSignalFromAccount(
    accountId: string,
    signalId: string
): void {
    const existing = allAccounts.value;
    const aIdx = existing.findIndex((a) => a.id === accountId);
    if (aIdx === -1) return;
    const account = existing[aIdx]!;
    const sIdx = account.signals.findIndex((s) => s.id === signalId);
    if (sIdx === -1) return;
    const nextSignals = account.signals.slice();
    nextSignals.splice(sIdx, 1);
    const next = existing.slice();
    next[aIdx] = { ...account, signals: nextSignals };
    allAccounts.value = next;
}

/**
 * Replace an account's `signals[]` wholesale. Used by the enrich-all
 * flow to swap in a fresh enrichment result without per-signal
 * splicing.
 *
 * No-op when account isn't found.
 */
export function setAccountSignals(
    accountId: string,
    signals: ReadonlyArray<ScSignal>
): void {
    const existing = allAccounts.value;
    const idx = existing.findIndex((a) => a.id === accountId);
    if (idx === -1) return;
    const account = existing[idx]!;
    const next = existing.slice();
    next[idx] = { ...account, signals };
    allAccounts.value = next;
}

export function resetSession(): void {
    allAccounts.value = [];
    loaded.value = false;
    selectedAccountId.value = null;
    searchQuery.value = "";
}

/**
 * Build a fresh Account from a manual-add form. The id starts as a
 * legacy-style string; cloud-persistence's saveAccount will swap it
 * for a server-generated uuid on insert.
 */
export function buildManualAccount(input: {
    readonly name: string;
    readonly domain?: string;
    readonly ticker?: string;
    readonly industry?: string;
    readonly hq?: string;
    readonly notes?: string;
    readonly now?: number;
}): Account {
    const now = input.now ?? Date.now();
    const id = `acc_${now}_${Math.random().toString(36).slice(2, 8)}`;
    return {
        id,
        name: input.name.trim(),
        ...(input.domain && input.domain.trim()
            ? { domain: input.domain.trim().toLowerCase() }
            : {}),
        ...(input.ticker && input.ticker.trim()
            ? { ticker: input.ticker.trim().toUpperCase() }
            : {}),
        ...(input.industry && input.industry.trim()
            ? { industry: input.industry.trim() }
            : {}),
        ...(input.hq && input.hq.trim() ? { hq: input.hq.trim() } : {}),
        ...(input.notes && input.notes.trim()
            ? { notes: input.notes.trim() }
            : {}),
        signals: [],
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString()
    };
}

/** Test-only — seed the accounts list. */
export function __setAllAccountsForTests(accounts: ReadonlyArray<Account>): void {
    allAccounts.value = accounts;
    loaded.value = true;
}

let externalPublishStop: (() => void) | null = null;

/**
 * Wire the side-effect that mirrors every allAccounts change to
 * localStorage (gtmos_sc_v4) and publishes a fresh health snapshot
 * (gtmos_signal_room_health). Call once after persistence has booted
 * so the initial load doesn't trigger a redundant write.
 *
 * Returns a stop() handle for tests / teardown.
 */
export function startExternalPublishing(): () => void {
    if (externalPublishStop) return externalPublishStop;
    let firstRun = true;
    const dispose = effect(() => {
        const accounts = allAccounts.value;
        // Skip the first run — that's the boot-time seed and we don't
        // want to write over fresh data with our own copy of it.
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveAccounts(accounts);
        publishHealthSnapshot(accounts);
    });
    externalPublishStop = () => {
        dispose();
        externalPublishStop = null;
    };
    return externalPublishStop;
}
