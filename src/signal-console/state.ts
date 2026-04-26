import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import type { Account } from "./lib/types";

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

export function resetSession(): void {
    allAccounts.value = [];
    loaded.value = false;
    selectedAccountId.value = null;
    searchQuery.value = "";
}

/** Test-only — seed the accounts list. */
export function __setAllAccountsForTests(accounts: ReadonlyArray<Account>): void {
    allAccounts.value = accounts;
    loaded.value = true;
}
