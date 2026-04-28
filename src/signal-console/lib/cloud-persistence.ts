import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { reportError, trackEvent } from "@/lib/observability";
import {
    accountToInsert,
    accountToUpdate,
    looksLikePersistedId,
    rowToAccount,
    rowsToAccounts
} from "./sc-bridge";
import type { Account } from "./types";
import { allAccounts, removeAccount, setAllAccounts, upsertAccount } from "../state";

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
