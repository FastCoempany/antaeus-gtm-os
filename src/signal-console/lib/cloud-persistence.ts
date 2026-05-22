import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { reportError, trackEvent } from "@/lib/observability";
import { isRoomParityWriteEnabled } from "@/lib/data-parity-flags";
import {
    accountToInsert,
    accountToUpdate,
    looksLikePersistedId,
    rowToAccount,
    rowsToAccounts
} from "./sc-bridge";
import {
    looksLikePersistedSignalId,
    rowToSignal,
    signalToInsert,
    signalToUpdate
} from "./signals-bridge";
import type { Account, Signal } from "./types";
import {
    addSignalToAccount,
    allAccounts,
    removeAccount,
    removeSignalFromAccount,
    setAccountSignals,
    setAllAccounts,
    updateSignalInAccount,
    upsertAccount
} from "../state";

/**
 * Signal Console cloud persistence (Supabase + realtime + first-sync
 * migration of any localStorage-only accounts).
 *
 * Mirrors the Deal Workspace template (Room 1) but adapts for the
 * Signal Console's shape: `signal_console_accounts` table, with the
 * Account's editorial fields packed into a `data` jsonb blob and the
 * heat / domain / ticker / industry / etc as top-level columns.
 *
 * Boot flow (called from main.tsx after first paint):
 *   1. Load all rows for the current workspace
 *   2. If rows exist → cloud is canonical → setAllAccounts(rows)
 *   3. If rows are empty AND localStorage already had accounts seeded
 *      via the Wave 4 path → migrate them by inserting each one
 *      (resolves the "browser-bound" gap for users who built up
 *      accounts before cloud sync existed)
 *   4. Subscribe to realtime so cross-tab + cross-device mutations
 *      flow into this room without a refresh
 *
 * Every public function catches + reports via Sentry; nothing throws.
 * A persistence outage leaves the room with the last good in-memory
 * state.
 */

let clientRef: DataClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

/** Test-only — inject a stub client. */
export function __setDataClientForTests(client: DataClient | null): void {
    clientRef = client;
}

/** Test-only — read the current client reference. */
export function __getDataClientForTests(): DataClient | null {
    return clientRef;
}

export interface BootResult {
    /** "cloud" if rows were loaded; "migrated" on first cloud sync;
     *  "local-only" if Supabase failed; "empty" if cloud + local both empty. */
    readonly mode: "cloud" | "migrated" | "local-only" | "empty";
    /** Number of accounts the room is now showing. */
    readonly accountCount: number;
}

/**
 * Boot-time persistence wiring. Called once after first paint —
 * does not block render. Decides between cloud-canonical, first-sync
 * migration, and offline-fallback paths and resolves with a tag for
 * observability.
 */
export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.signalConsoleAccounts.list({ limit: 1000 });
        if (rows.length > 0) {
            // Cloud has data → cloud is canonical. Replace local state.
            const accounts = rowsToAccounts(rows);
            setAllAccounts(accounts);
            subscribeRealtime(client);
            trackEvent("signal_console_boot", {
                mode: "cloud",
                count: accounts.length
            });
            return { mode: "cloud", accountCount: accounts.length };
        }
        // Cloud is empty. If localStorage was already seeded, push
        // those rows up — first-time cloud sync for this user.
        const local = allAccounts.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            trackEvent("signal_console_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", accountCount: local.length };
        }
        subscribeRealtime(client);
        trackEvent("signal_console_boot", { mode: "empty", count: 0 });
        return { mode: "empty", accountCount: 0 };
    } catch (err) {
        reportError(err, { op: "signal-console.bootCloudPersistence" });
        // Leave allAccounts in whatever state localStorage seeded.
        // The room is still usable; mutations will be local-only until
        // the next session retries the cloud load.
        return { mode: "local-only", accountCount: allAccounts.value.length };
    }
}

/**
 * One-time migration: take every Account currently in `allAccounts`
 * (seeded from localStorage) and insert it into Supabase. Updates
 * each Account's id to the server-generated uuid as the inserts
 * resolve, so subsequent saves go through the .update path.
 *
 * Errors per-row are reported but don't abort the batch — partial
 * migration is acceptable, and the next save will retry.
 */
async function migrateLocalToCloud(
    client: DataClient,
    localAccounts: ReadonlyArray<Account>
): Promise<void> {
    const next: Account[] = [];
    for (const acc of localAccounts) {
        try {
            const insert = accountToInsert(acc);
            const row = await client.signalConsoleAccounts.insert(insert);
            const hydrated = rowToAccount(row);
            if (hydrated) {
                next.push(hydrated);
            } else {
                next.push(acc);
            }
        } catch (err) {
            reportError(err, {
                op: "signal-console.migrateLocalToCloud",
                accountName: acc.name
            });
            next.push(acc);
        }
    }
    setAllAccounts(next);
}

/**
 * Persist an Account edit. Optimistic — `upsertAccount` updates the
 * signal first so the UI is instant. Round-trip resolves with the
 * canonical server row (or returns the input on failure so the
 * caller can keep going).
 *
 * Decides update vs insert based on the id shape: uuid → update,
 * non-uuid (legacy) → insert.
 */
export async function saveAccount(account: Account): Promise<Account> {
    upsertAccount(account);
    if (!clientRef) {
        return account;
    }
    try {
        const isUpdate = looksLikePersistedId(account.id);
        const row = isUpdate
            ? await clientRef.signalConsoleAccounts.update(
                  account.id,
                  accountToUpdate(account)
              )
            : await clientRef.signalConsoleAccounts.insert(
                  accountToInsert(account)
              );
        const saved = rowToAccount(row);
        if (saved) {
            // If we just inserted a previously-legacy account, the
            // id changed (uuid replaces "acc_…"). Drop the old id
            // before upserting the new one so we don't keep both.
            if (!isUpdate && saved.id !== account.id) {
                removeAccount(account.id);
            }
            upsertAccount(saved);
            trackEvent("signal_console_save", {
                mode: isUpdate ? "update" : "insert",
                signalCount: saved.signals.length
            });
            return saved;
        }
        return account;
    } catch (err) {
        reportError(err, {
            op: "signal-console.saveAccount",
            accountId: account.id
        });
        return account;
    }
}

/**
 * Delete an Account from the cloud. Local removal already happened
 * before this is called; this just propagates to Supabase.
 */
export async function deleteAccountInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) {
        // Legacy account that was never synced — nothing to delete
        // in the cloud.
        return;
    }
    try {
        await clientRef.signalConsoleAccounts.remove(id);
    } catch (err) {
        reportError(err, {
            op: "signal-console.deleteAccountInCloud",
            accountId: id
        });
    }
}

// ─── Account delete dual-write ─────────────────────────────────────────

/**
 * Delete an Account end-to-end: drops the local state copy AND
 * propagates to Supabase. The user-facing "Remove from radar" action
 * routes here. Safe on legacy ids (the cloud call is a no-op when the
 * row was never synced).
 */
export async function deleteAccount(id: string): Promise<void> {
    removeAccount(id);
    await deleteAccountInCloud(id);
    trackEvent("signal_console_account_delete", { accountId: id });
}

// ─── Signal CRUD (Step 3 dual-write) ───────────────────────────────────
//
// Operator-facing signal mutations (add / flag / unflag / remove) dual-
// write to the `signals` Postgres table when the parity flag is on.
// When off, callers stay on the legacy `account.data.signals[]` blob
// path. The in-memory `Account.signals[]` is still the read source
// until Step 4 flips reads.
//
// Each function:
//   - Checks the feature flag — no-op if off
//   - Checks the account id is a uuid — no-op for legacy-only accounts
//     that never reached the cloud (they only have data.signals[]
//     entries until the parent account is upserted)
//   - Catches + reports via Sentry; never throws

/**
 * Insert a Signal into the cloud `signals` table, FK-linked to its
 * parent account. Returns the persisted Signal (with server-minted
 * uuid for inputs that had a legacy id), or null when the write was
 * skipped or failed.
 *
 * Called from state actions that add a signal to an account (manual
 * add, enrich-all). Local upsert into Account.signals[] happens
 * first; this propagates to Supabase.
 */
export async function addSignalToCloud(
    accountId: string,
    signal: Signal
): Promise<Signal | null> {
    if (!clientRef) return null;
    if (!isRoomParityWriteEnabled("signalConsole")) return null;
    if (!looksLikePersistedId(accountId)) {
        // Parent account hasn't synced to cloud yet — the signals row
        // would fail the FK constraint. Skip cleanly; the signal still
        // lives in account.data.signals[] locally.
        return null;
    }
    try {
        const row = await clientRef.signals.insert(
            signalToInsert(signal, accountId)
        );
        const persisted = rowToSignal(row);
        if (persisted) {
            trackEvent("signal_console_signal_insert", {
                accountId,
                type: persisted.type ?? null,
                is_ai: persisted.is_ai === true
            });
            return persisted;
        }
        return null;
    } catch (err) {
        reportError(err, {
            op: "signal-console.addSignalToCloud",
            accountId,
            signalId: signal.id
        });
        return null;
    }
}

/**
 * Patch an existing Signal in the cloud. Used by operator-facing
 * flag / note edits. Returns the updated Signal or null on failure.
 *
 * No-op for legacy-id Signals (never synced) — those edits stay
 * local until the next bulk migrate.
 */
export async function updateSignalInCloud(
    signal: Signal
): Promise<Signal | null> {
    if (!clientRef) return null;
    if (!isRoomParityWriteEnabled("signalConsole")) return null;
    if (!looksLikePersistedSignalId(signal.id)) return null;
    try {
        const row = await clientRef.signals.update(
            signal.id,
            signalToUpdate(signal)
        );
        const persisted = rowToSignal(row);
        if (persisted) {
            trackEvent("signal_console_signal_update", {
                signalId: signal.id,
                flagged: persisted.flagged === true
            });
            return persisted;
        }
        return null;
    } catch (err) {
        reportError(err, {
            op: "signal-console.updateSignalInCloud",
            signalId: signal.id
        });
        return null;
    }
}

/**
 * Delete a Signal from the cloud. Local removal from
 * account.signals[] already happened; this propagates to Supabase.
 *
 * No-op for legacy-id Signals.
 */
export async function deleteSignalFromCloud(signalId: string): Promise<void> {
    if (!clientRef) return;
    if (!isRoomParityWriteEnabled("signalConsole")) return;
    if (!looksLikePersistedSignalId(signalId)) return;
    try {
        await clientRef.signals.remove(signalId);
        trackEvent("signal_console_signal_delete", { signalId });
    } catch (err) {
        reportError(err, {
            op: "signal-console.deleteSignalFromCloud",
            signalId
        });
    }
}

// ─── Operator-facing signal orchestrators (local + cloud) ──────────────
//
// Compose the local state primitive with the cloud write. UI calls
// these; legacy data.signals[] readers stay consistent because the
// in-memory Account.signals[] is updated synchronously before the
// cloud round-trip resolves.
//
// On cloud success, if the server minted a new uuid for the signal
// (because the input had a legacy id), the local entry is swapped to
// the persisted Signal so subsequent updates can target the uuid.

/**
 * Add a Signal to an account — local + cloud.
 *
 * Returns the persisted Signal (with uuid) on cloud success, or the
 * original input when cloud is skipped/fails. Local state is updated
 * either way.
 */
export async function addSignal(
    accountId: string,
    signal: Signal
): Promise<Signal> {
    addSignalToAccount(accountId, signal);
    const persisted = await addSignalToCloud(accountId, signal);
    if (persisted && persisted.id !== signal.id) {
        // Swap the local id for the server-minted uuid.
        removeSignalFromAccount(accountId, signal.id);
        addSignalToAccount(accountId, persisted);
        return persisted;
    }
    return signal;
}

/**
 * Patch a Signal in-place (typically operator-flagged or note edits).
 * Updates local first, then propagates to the cloud.
 */
export async function patchSignal(
    accountId: string,
    signal: Signal
): Promise<Signal> {
    updateSignalInAccount(accountId, signal);
    const persisted = await updateSignalInCloud(signal);
    if (persisted) {
        updateSignalInAccount(accountId, persisted);
        return persisted;
    }
    return signal;
}

/**
 * Remove a Signal from an account — local + cloud.
 */
export async function deleteSignal(
    accountId: string,
    signalId: string
): Promise<void> {
    removeSignalFromAccount(accountId, signalId);
    await deleteSignalFromCloud(signalId);
}

/**
 * Replace an account's signals[] wholesale and dual-write each new
 * signal. Used by the enrich-all flow (Wave 4): a fresh enrichment
 * call returns a complete signals list, we swap them in locally and
 * fire bulk inserts to the cloud.
 *
 * Returns the resolved Signal[] with any server-minted uuids in
 * place. Skipped/failed cloud writes leave the local entry as-is.
 */
export async function replaceAccountSignals(
    accountId: string,
    signals: ReadonlyArray<Signal>
): Promise<ReadonlyArray<Signal>> {
    setAccountSignals(accountId, signals);
    const resolved: Signal[] = [];
    for (const sig of signals) {
        const persisted = await addSignalToCloud(accountId, sig);
        resolved.push(persisted ?? sig);
    }
    setAccountSignals(accountId, resolved);
    return resolved;
}

/**
 * Type guard for realtime payload rows.
 */
function payloadHasRow(value: unknown): value is { id: string } {
    return (
        !!value &&
        typeof value === "object" &&
        "id" in value &&
        typeof (value as { id?: unknown }).id === "string"
    );
}

/**
 * Translate a postgres_changes payload into a state mutation.
 * Pure function, exported so tests can drive it directly.
 */
export function applyRealtimePayload(payload: {
    eventType: string;
    new: unknown;
    old: unknown;
}): void {
    if (payload.eventType === "DELETE") {
        if (payloadHasRow(payload.old)) {
            removeAccount(payload.old.id);
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payloadHasRow(payload.new)) {
            const account = rowToAccount(payload.new);
            if (account) upsertAccount(account);
        }
    }
}

/**
 * Wire a realtime subscription. RLS gates per-workspace delivery, so
 * we don't filter manually.
 */
export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.signalConsoleAccounts.subscribe((payload) => {
        applyRealtimePayload(
            payload as unknown as {
                eventType: string;
                new: unknown;
                old: unknown;
            }
        );
    });
    realtimeChannel = channel;
    return channel;
}

/** Test-only — read the realtime channel reference. */
export function __getRealtimeChannelForTests(): RealtimeChannel | null {
    return realtimeChannel;
}

/**
 * Tear down the realtime subscription. Safe if no channel is active.
 */
export async function teardownRealtime(): Promise<void> {
    if (!realtimeChannel) return;
    try {
        await realtimeChannel.unsubscribe();
    } catch (err) {
        reportError(err, { op: "signal-console.teardownRealtime" });
    }
    realtimeChannel = null;
}
