import {
    computed,
    effect,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_DRAFT,
    EMPTY_STATS,
    type AccountSummary,
    type CallLogEntry,
    type CallStats,
    type Draft,
    type Outcome,
    type ThreadId
} from "./lib/types";
import { findReply, findThread } from "./lib/threads";
import { personalize } from "./lib/personalize";
import {
    incrementDiscoveryStats,
    saveCallLog
} from "./lib/persistence";
import { createDealFromCall } from "./lib/handoff";

/**
 * Phase 4 / Room 7 — Cold Call Studio runtime state.
 *
 * Per canon §4.9 the room lives in one thread at a time; everything
 * else is recessive. The signals below are the runtime equivalent of
 * the legacy IIFE module-locals (`activeThread`, `activeReply`,
 * `selectedAccount`, `accountData`, `signalConsoleAccounts`,
 * `draft{}`).
 *
 * Wave 1 establishes the shape. Wave 2 wires the thread-spine data.
 * Wave 3 wires the live thread navigation + branch picker. Wave 4
 * wires outcome logging + persistence. Wave 5 wires cross-room
 * handoff + URL inbound. Wave 6 wires legacy flag-redirect.
 */

// ─── Source of truth ────────────────────────────────────────────────────

/** Active thread id — defaults to `prep` until an account is selected. */
export const activeThread: Signal<ThreadId> = signal("prep");

/** Active reply id within the current thread (or null if none chosen). */
export const activeReply: Signal<string | null> = signal(null);

/** Selected account name (or null when no account is in focus). */
export const selectedAccountName: Signal<string | null> = signal(null);

/** Accounts loaded from Signal Console (ranked by heat). */
export const accountOptions: Signal<ReadonlyArray<AccountSummary>> = signal(
    []
);

/** Draft fields (contact name, title, notes) the operator types into. */
export const draft: Signal<Draft> = signal(EMPTY_DRAFT);

/** Persistent call log (mirrored to `gtmos_cold_call_log`). */
export const callLog: Signal<ReadonlyArray<CallLogEntry>> = signal([]);

/**
 * Operator's company name (drives [company] substitution in
 * personalize). Sourced from `gtmos_playbook.company` at boot;
 * empty string when missing — personalize() then falls back to
 * its default "[your company]" placeholder.
 */
export const companyName: Signal<string> = signal("");

/** Indicates whether the boot sequence has finished seeding state. */
export const loaded: Signal<boolean> = signal(false);

// ─── Derived projections ────────────────────────────────────────────────

/** The currently selected account record, or null. */
export const selectedAccount: ReadonlySignal<AccountSummary | null> = computed(
    () => {
        const name = selectedAccountName.value;
        if (!name) return null;
        const lower = name.toLowerCase();
        return (
            accountOptions.value.find((a) => a.name.toLowerCase() === lower) ??
            null
        );
    }
);

/** Stats derived from the call log (drives the read panel + memory grid). */
export const callStats: ReadonlySignal<CallStats> = computed(() => {
    const calls = callLog.value;
    if (calls.length === 0) return EMPTY_STATS;
    let meetings = 0;
    let callbacks = 0;
    let referrals = 0;
    for (const c of calls) {
        if (c.outcome === "meeting_booked") meetings += 1;
        else if (c.outcome === "callback_scheduled") callbacks += 1;
        else if (c.outcome === "referral") referrals += 1;
    }
    return { total: calls.length, meetings, callbacks, referrals };
});

// ─── Actions ────────────────────────────────────────────────────────────

export function setActiveThread(id: ThreadId): void {
    activeThread.value = id;
    activeReply.value = null;
}

export function setActiveReply(replyId: string | null): void {
    activeReply.value = replyId;
}

export function setSelectedAccount(name: string | null): void {
    selectedAccountName.value = name;
    // When an account becomes selected, default the active thread to
    // `opener` (per legacy: `activeThread=selectedAccount?'opener':'prep'`).
    activeThread.value = name ? "opener" : "prep";
    activeReply.value = null;
}

export function setAccountOptions(
    options: ReadonlyArray<AccountSummary>
): void {
    accountOptions.value = options;
}

export function patchDraft(part: Partial<Draft>): void {
    draft.value = { ...draft.value, ...part } as Draft;
}

export function setCallLog(entries: ReadonlyArray<CallLogEntry>): void {
    callLog.value = entries;
}

export function appendCallEntry(entry: CallLogEntry): void {
    callLog.value = [...callLog.value, entry];
}

export function setCompanyName(name: string): void {
    companyName.value = name;
}

/**
 * Log a call from the current rack — freezes thread + reply +
 * draft into a CallLogEntry, appends it to the call log, and bumps
 * `gtmos_discovery_stats`. Returns the new entry (or null when no
 * thread is active, which shouldn't be possible since prep is the
 * default). The Wave 5 follow-up wires the meeting_booked → Deal
 * write at the call site.
 */
export function logCall(
    outcome: Outcome,
    now: number = Date.now()
): CallLogEntry | null {
    const t = findThread(activeThread.value);
    const r = findReply(t, activeReply.value);
    const account = selectedAccount.value;
    const ctx = {
        accountName: account?.name ?? "",
        topSignal: account?.topSignal ?? "",
        companyName: companyName.value
    };
    const d = draft.value;
    const entry: CallLogEntry = {
        id: `call_${now}_${Math.random().toString(36).slice(2, 8)}`,
        accountName: account?.name ?? "",
        contactName: d.contactName.trim(),
        contactTitle: d.contactTitle.trim(),
        threadId: t.id,
        threadTitle: t.title,
        buyerResponse: r ? r.buyer : "",
        recommendedResponse: r ? personalize(r.reply, ctx) : "",
        outcome,
        notes: d.notes,
        source: "cold-call-studio-talk-loom",
        createdAt: new Date(now).toISOString()
    };
    appendCallEntry(entry);
    incrementDiscoveryStats(outcome);
    if (outcome === "meeting_booked" && account) {
        // Side-effect mirror into Phase 4 / Room 1's Deal Workspace —
        // legacy parity with `createDealFromCall` (lines 212-220 of
        // app/cold-call-studio/index.html). Failure does not block
        // the call log write; createDealFromCall handles errors.
        createDealFromCall(account.name, now);
    }
    return entry;
}

export function resetSession(): void {
    activeThread.value = "prep";
    activeReply.value = null;
    selectedAccountName.value = null;
    accountOptions.value = [];
    draft.value = EMPTY_DRAFT;
    callLog.value = [];
    companyName.value = "";
    loaded.value = false;
}

/** Test-only — seed the account options list. */
export function __setAccountOptionsForTests(
    options: ReadonlyArray<AccountSummary>
): void {
    accountOptions.value = options;
}

export function __setCallLogForTests(
    entries: ReadonlyArray<CallLogEntry>
): void {
    callLog.value = entries;
}

let callLogPersistStop: (() => void) | null = null;

/**
 * Wire the side-effect that mirrors call log writes to localStorage.
 * Skip the first run to avoid a redundant boot-time write — same
 * pattern as Phase 4 / Rooms 3-6.
 */
export function startCallLogPersistence(): () => void {
    if (callLogPersistStop) return callLogPersistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const next = callLog.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveCallLog(next);
    });
    callLogPersistStop = () => {
        dispose();
        callLogPersistStop = null;
    };
    return callLogPersistStop;
}
