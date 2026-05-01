import { computed, effect, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import type { Account } from "./lib/types";
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
