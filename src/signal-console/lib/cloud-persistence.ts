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
import {
    looksLikePersistedSignalId,
    rowToSignal,
    signalToInsert,
    signalToUpdate
} from "./signals-bridge";
import type { Account, RelationshipType, Signal } from "./types";
import {
    addSignalToAccount,
    allAccounts,
    removeAccount,
    removeSignalFromAccount,
    setAccountRelationshipLocal,
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
let signalsRealtimeChannel: RealtimeChannel | null = null;

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
    // Step 5 (drop legacy): cloud is now unconditionally canonical.
    // signals[] always comes from the `signals` Postgres table; the
    // accounts list always comes from `signal_console_accounts`.
    // The Step 4 `signal_console_data_parity_read` flag has retired —
    // the flag check that used to gate this code path is gone.
    try {
        const rows = await client.signalConsoleAccounts.list({ limit: 1000 });
        if (rows.length > 0) {
            // Cloud has data → cloud is canonical. Replace local state.
            const accounts = await loadSignalsForAccounts(
                client,
                rowsToAccounts(rows)
            );
            setAllAccounts(accounts);
            subscribeRealtime(client);
            subscribeSignalsRealtime(client);
            trackEvent("signal_console_boot", {
                mode: "cloud",
                count: accounts.length
            });
            return { mode: "cloud", accountCount: accounts.length };
        }
        // Cloud is empty. If localStorage was already seeded (legacy
        // offline-recovery path), push those rows up — first-time cloud
        // sync for this user.
        const local = allAccounts.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            subscribeSignalsRealtime(client);
            trackEvent("signal_console_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", accountCount: local.length };
        }
        subscribeRealtime(client);
        subscribeSignalsRealtime(client);
        trackEvent("signal_console_boot", {
            mode: "empty",
            count: 0
        });
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

// ─── Cloud-canonical signals reads (Step 4 flip-read) ──────────────────
//
// When the `signal_console_data_parity_read` flag is ON, signals come
// from the `signals` Postgres table (Step 2 / PR #140) rather than from
// the `data.signals[]` jsonb blob embedded inside signal_console_accounts.
// The legacy blob path stays as offline fallback; Step 5 retires it.
//
// Strategy: after loading accounts, query signals filtered by the loaded
// account ids and merge into each Account's signals[]. Linear in
// signal count + one round-trip regardless of account count (uses an
// `in` filter under the hood).

/**
 * Hydrate Account.signals[] from the `signals` Postgres table for the
 * given account ids. Returns a new Account[] with merged signals.
 * Accounts not in the cloud (legacy ids) keep their existing local
 * signals.
 *
 * Errors are caught + reported via Sentry; the function falls back to
 * the input accounts unchanged so the room stays usable.
 */
async function loadSignalsForAccounts(
    client: DataClient,
    accounts: ReadonlyArray<Account>
): Promise<ReadonlyArray<Account>> {
    const persistedIds = accounts
        .map((a) => a.id)
        .filter((id) => looksLikePersistedId(id));
    if (persistedIds.length === 0) return accounts;

    try {
        // Pull all signals for the loaded accounts in one query. The
        // data-client's list({where}) supports equality but not `in`,
        // so we use the raw client filter via the Supabase query
        // builder. Falls back to per-account queries if the bulk path
        // ever needs that.
        const rows = await client.signals.list({
            limit: 5000,
            orderBy: { column: "published_date", ascending: false }
        });
        // Group by account_id.
        const byAccount = new Map<string, Signal[]>();
        for (const row of rows) {
            if (!row.account_id) continue;
            const sig = rowToSignal(row);
            if (!sig) continue;
            const list = byAccount.get(row.account_id);
            if (list) {
                list.push(sig);
            } else {
                byAccount.set(row.account_id, [sig]);
            }
        }
        // Merge into accounts — cloud signals[] replaces blob signals[]
        // when the parity-read flag is on. For accounts with no rows in
        // the signals table, keep whatever signals[] was hydrated from
        // the blob (the rowToAccount path).
        return accounts.map((acc) => {
            const cloudSignals = byAccount.get(acc.id);
            if (!cloudSignals) return acc;
            return { ...acc, signals: cloudSignals };
        });
    } catch (err) {
        reportError(err, {
            op: "signal-console.loadSignalsForAccounts",
            accountCount: persistedIds.length
        });
        return accounts;
    }
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
            // Signals live in the `signals` table (Step 5), not the
            // account row's data blob — so rowToAccount(row) always
            // returns signals: []. Carry the input account's signals
            // forward so a metadata-only save (relationship_type, tier,
            // persona, …) doesn't wipe the card's intel + zero its heat.
            const merged =
                saved.signals.length === 0 && account.signals.length > 0
                    ? { ...saved, signals: account.signals }
                    : saved;
            // If we just inserted a previously-legacy account, the
            // id changed (uuid replaces "acc_…"). Drop the old id
            // before upserting the new one so we don't keep both.
            if (!isUpdate && saved.id !== account.id) {
                removeAccount(account.id);
            }
            upsertAccount(merged);
            trackEvent("signal_console_save", {
                mode: isUpdate ? "update" : "insert",
                signalCount: merged.signals.length
            });
            return merged;
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
 * Set an account's relationship type (ADR-007) + persist. Optimistic:
 * the local mutation lands immediately; the cloud write follows. A
 * competitor flag here is what the Briefing reads to drive
 * category-specific source queries. No-op (returns null) when the
 * account isn't found.
 */
export async function setAccountRelationship(
    id: string,
    relationshipType: RelationshipType
): Promise<Account | null> {
    const updated = setAccountRelationshipLocal(id, relationshipType);
    if (!updated) return null;
    return saveAccount(updated);
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
    // Step 5 (drop legacy): the parity-write flag check has retired.
    // Cloud writes happen unconditionally now.
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
    // Step 5: parity-write flag retired; always unconditional.
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
    // Step 5: parity-write flag retired; always unconditional.
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
            const incoming = rowToAccount(payload.new);
            if (incoming) {
                // The account row carries no signals (Step 5 — they
                // live in the signals table). A row echo with empty
                // signals must not wipe an existing card's intel:
                // preserve the in-memory account's signals when the
                // incoming row has none. (Signal changes arrive on the
                // separate signals-table subscription, not here.)
                const existing = allAccounts.value.find(
                    (a) => a.id === incoming.id
                );
                const merged =
                    incoming.signals.length === 0 &&
                    existing &&
                    existing.signals.length > 0
                        ? { ...incoming, signals: existing.signals }
                        : incoming;
                upsertAccount(merged);
            }
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

/** Test-only — read the signals realtime channel reference. */
export function __getSignalsRealtimeChannelForTests(): RealtimeChannel | null {
    return signalsRealtimeChannel;
}

// ─── Signals-table realtime (Step 4 flip-read) ─────────────────────────
//
// When the parity-read flag is on, the room subscribes to the `signals`
// Postgres table directly so cross-tab + cross-device mutations land
// without a refresh. INSERT / UPDATE / DELETE events are translated into
// in-memory mutations against the parent Account's signals[] array.
//
// RLS gates per-workspace delivery — every received payload is already
// scoped to the operator's workspaces by the signals table's RLS
// policies (migration 20260522120000).

/**
 * Apply a realtime payload from the `signals` table to local state.
 * Pure function, exported so tests can drive it directly.
 */
export function applySignalsRealtimePayload(payload: {
    eventType: string;
    new: unknown;
    old: unknown;
}): void {
    if (payload.eventType === "DELETE") {
        if (
            payload.old &&
            typeof payload.old === "object" &&
            "id" in payload.old &&
            "account_id" in payload.old
        ) {
            const old = payload.old as { id: string; account_id: string };
            if (typeof old.id === "string" && typeof old.account_id === "string") {
                removeSignalFromAccount(old.account_id, old.id);
            }
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        const row = payload.new;
        if (!row || typeof row !== "object") return;
        const r = row as { id?: unknown; account_id?: unknown };
        if (typeof r.id !== "string" || typeof r.account_id !== "string") return;
        const sig = rowToSignal(row as never);
        if (!sig) return;
        if (payload.eventType === "INSERT") {
            // Dedupe: if the parent Account already has a signal with
            // this uuid (because the local client emitted it via
            // addSignalToCloud + addSignalToAccount), just no-op. The
            // updateSignalInAccount path handles same-id patches.
            const account = allAccounts.value.find((a) => a.id === r.account_id);
            const existing = account?.signals.find((s) => s.id === sig.id);
            if (existing) {
                updateSignalInAccount(r.account_id, sig);
            } else {
                addSignalToAccount(r.account_id, sig);
            }
        } else {
            updateSignalInAccount(r.account_id, sig);
        }
    }
}

/**
 * Subscribe to realtime changes on the `signals` table. Idempotent —
 * if a previous subscription is active, this is a no-op. RLS gates
 * per-workspace delivery so no manual filter is needed.
 */
export function subscribeSignalsRealtime(client: DataClient): RealtimeChannel {
    if (signalsRealtimeChannel) return signalsRealtimeChannel;
    const channel = client.signals.subscribe((payload) => {
        applySignalsRealtimePayload(
            payload as unknown as {
                eventType: string;
                new: unknown;
                old: unknown;
            }
        );
    });
    signalsRealtimeChannel = channel;
    return channel;
}

/**
 * Tear down the realtime subscription(s). Safe if no channel is active.
 * Tears down BOTH the accounts and signals channels so callers don't
 * have to track them separately.
 */
export async function teardownRealtime(): Promise<void> {
    if (realtimeChannel) {
        try {
            await realtimeChannel.unsubscribe();
        } catch (err) {
            reportError(err, { op: "signal-console.teardownRealtime" });
        }
        realtimeChannel = null;
    }
    if (signalsRealtimeChannel) {
        try {
            await signalsRealtimeChannel.unsubscribe();
        } catch (err) {
            reportError(err, {
                op: "signal-console.teardownSignalsRealtime"
            });
        }
        signalsRealtimeChannel = null;
    }
}
