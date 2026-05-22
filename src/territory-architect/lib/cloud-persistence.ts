import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Row } from "@/lib/database-helpers";
import { reportError, trackEvent } from "@/lib/observability";
import {
    accountToInsert,
    accountToUpdate,
    approachToInsert,
    approachToUpdate,
    KIND_ACCOUNT,
    KIND_APPROACH,
    KIND_FOCUS,
    looksLikePersistedId,
    partitionTerritoryRows,
    rowKind,
    rowToAccount,
    rowToApproach,
    rowToThesis,
    focusToInsert,
    focusToUpdate
} from "./territory-bridge";
import type { Approach, TerritoryAccount, Focus } from "./types";
import {
    accounts,
    approaches,
    setAccounts,
    setApproaches,
    setFocuses,
    focuses
} from "../state";

/**
 * Territory Architect cloud persistence.
 *
 * Three entity kinds (focuses, approaches, accounts) live in
 * studio_artifacts discriminated by data.kind. studio_artifacts has
 * no top-level filterable column for this discriminator, so boot
 * fetches every row owned by the workspace and partitions client-side.
 *
 * Boot flow:
 *   1. Fetch all studio_artifacts rows for the workspace
 *   2. Partition into focuses / approaches / accounts (drops other kinds)
 *   3. If any partition has cloud rows → cloud is canonical → replace
 *      local state for that partition
 *   4. If cloud is fully empty + localStorage has data → migrate
 *      everything up
 *   5. Subscribe to realtime; INSERT/UPDATE/DELETE route by kind
 */

let clientRef: DataClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

export function __setDataClientForTests(client: DataClient | null): void {
    clientRef = client;
}

export function __getDataClientForTests(): DataClient | null {
    return clientRef;
}

export interface BootResult {
    readonly mode: "cloud" | "migrated" | "local-only" | "empty";
    readonly thesesCount: number;
    readonly approachesCount: number;
    readonly accountsCount: number;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.studioArtifacts.list({ limit: 1000 });
        const partitioned = partitionTerritoryRows(rows);
        const cloudHasData =
            partitioned.focuses.length +
                partitioned.approaches.length +
                partitioned.accounts.length >
            0;
        if (cloudHasData) {
            setFocuses(partitioned.focuses);
            setApproaches(partitioned.approaches);
            setAccounts(partitioned.accounts);
            subscribeRealtime(client);
            trackEvent("territory_architect_boot", {
                mode: "cloud",
                focuses: partitioned.focuses.length,
                approaches: partitioned.approaches.length,
                accounts: partitioned.accounts.length
            });
            return {
                mode: "cloud",
                thesesCount: partitioned.focuses.length,
                approachesCount: partitioned.approaches.length,
                accountsCount: partitioned.accounts.length
            };
        }
        const localTheses = focuses.value;
        const localApproaches = approaches.value;
        const localAccounts = accounts.value;
        const localHasData =
            localTheses.length + localApproaches.length + localAccounts.length >
            0;
        if (localHasData) {
            await migrateLocalToCloud(
                client,
                localTheses,
                localApproaches,
                localAccounts
            );
            subscribeRealtime(client);
            trackEvent("territory_architect_boot", {
                mode: "migrated",
                focuses: localTheses.length,
                approaches: localApproaches.length,
                accounts: localAccounts.length
            });
            return {
                mode: "migrated",
                thesesCount: localTheses.length,
                approachesCount: localApproaches.length,
                accountsCount: localAccounts.length
            };
        }
        subscribeRealtime(client);
        trackEvent("territory_architect_boot", { mode: "empty" });
        return {
            mode: "empty",
            thesesCount: 0,
            approachesCount: 0,
            accountsCount: 0
        };
    } catch (err) {
        reportError(err, { op: "territory-architect.bootCloudPersistence" });
        return {
            mode: "local-only",
            thesesCount: focuses.value.length,
            approachesCount: approaches.value.length,
            accountsCount: accounts.value.length
        };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    localTheses: ReadonlyArray<Focus>,
    localApproaches: ReadonlyArray<Approach>,
    localAccounts: ReadonlyArray<TerritoryAccount>
): Promise<void> {
    const newFocuses: Focus[] = [];
    for (const t of localTheses) {
        try {
            const row = await client.studioArtifacts.insert(focusToInsert(t));
            const hydrated = rowToThesis(row);
            newFocuses.push(hydrated ?? t);
        } catch (err) {
            reportError(err, {
                op: "territory-architect.migrateLocalToCloud.focus",
                id: t.id
            });
            newFocuses.push(t);
        }
    }
    const newApproaches: Approach[] = [];
    for (const a of localApproaches) {
        try {
            const row = await client.studioArtifacts.insert(
                approachToInsert(a)
            );
            const hydrated = rowToApproach(row);
            newApproaches.push(hydrated ?? a);
        } catch (err) {
            reportError(err, {
                op: "territory-architect.migrateLocalToCloud.approach",
                id: a.id
            });
            newApproaches.push(a);
        }
    }
    const newAccounts: TerritoryAccount[] = [];
    for (const a of localAccounts) {
        try {
            const row = await client.studioArtifacts.insert(
                accountToInsert(a)
            );
            const hydrated = rowToAccount(row);
            newAccounts.push(hydrated ?? a);
        } catch (err) {
            reportError(err, {
                op: "territory-architect.migrateLocalToCloud.account",
                id: a.id
            });
            newAccounts.push(a);
        }
    }
    setFocuses(newFocuses);
    setApproaches(newApproaches);
    setAccounts(newAccounts);
}

// ─── Per-kind save helpers ─────────────────────────────────────────────

export async function saveThesis(focus: Focus): Promise<Focus> {
    if (!clientRef) return focus;
    try {
        const isUpdate = looksLikePersistedId(focus.id);
        const row = isUpdate
            ? await clientRef.studioArtifacts.update(
                  focus.id,
                  focusToUpdate(focus)
              )
            : await clientRef.studioArtifacts.insert(focusToInsert(focus));
        const saved = rowToThesis(row);
        if (saved) {
            if (!isUpdate && saved.id !== focus.id) {
                setFocuses(
                    focuses.value
                        .filter((t) => t.id !== focus.id)
                        .concat(saved)
                );
            } else {
                setFocuses(
                    focuses.value.map((t) => (t.id === saved.id ? saved : t))
                );
            }
            trackEvent("territory_architect_save", {
                kind: "focus",
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return focus;
    } catch (err) {
        reportError(err, {
            op: "territory-architect.saveThesis",
            id: focus.id
        });
        return focus;
    }
}

export async function saveApproach(approach: Approach): Promise<Approach> {
    if (!clientRef) return approach;
    try {
        const isUpdate = looksLikePersistedId(approach.id);
        const row = isUpdate
            ? await clientRef.studioArtifacts.update(
                  approach.id,
                  approachToUpdate(approach)
              )
            : await clientRef.studioArtifacts.insert(
                  approachToInsert(approach)
              );
        const saved = rowToApproach(row);
        if (saved) {
            if (!isUpdate && saved.id !== approach.id) {
                setApproaches(
                    approaches.value
                        .filter((a) => a.id !== approach.id)
                        .concat(saved)
                );
            } else {
                setApproaches(
                    approaches.value.map((a) =>
                        a.id === saved.id ? saved : a
                    )
                );
            }
            trackEvent("territory_architect_save", {
                kind: "approach",
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return approach;
    } catch (err) {
        reportError(err, {
            op: "territory-architect.saveApproach",
            id: approach.id
        });
        return approach;
    }
}

export async function saveAccount(
    account: TerritoryAccount
): Promise<TerritoryAccount> {
    if (!clientRef) return account;
    try {
        const isUpdate = looksLikePersistedId(account.id);
        const row = isUpdate
            ? await clientRef.studioArtifacts.update(
                  account.id,
                  accountToUpdate(account)
              )
            : await clientRef.studioArtifacts.insert(
                  accountToInsert(account)
              );
        const saved = rowToAccount(row);
        if (saved) {
            if (!isUpdate && saved.id !== account.id) {
                setAccounts(
                    accounts.value
                        .filter((a) => a.id !== account.id)
                        .concat(saved)
                );
            } else {
                setAccounts(
                    accounts.value.map((a) => (a.id === saved.id ? saved : a))
                );
            }
            trackEvent("territory_architect_save", {
                kind: "account",
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return account;
    } catch (err) {
        reportError(err, {
            op: "territory-architect.saveAccount",
            id: account.id
        });
        return account;
    }
}

export async function deleteArtifactInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.studioArtifacts.remove(id);
    } catch (err) {
        reportError(err, {
            op: "territory-architect.deleteArtifactInCloud",
            id
        });
    }
}

// ─── Realtime ──────────────────────────────────────────────────────────

function payloadHasRow(value: unknown): value is { id: string } {
    return (
        !!value &&
        typeof value === "object" &&
        "id" in value &&
        typeof (value as { id?: unknown }).id === "string"
    );
}

export function applyRealtimePayload(payload: {
    eventType: string;
    new: unknown;
    old: unknown;
}): void {
    if (payload.eventType === "DELETE") {
        if (!payloadHasRow(payload.old)) return;
        const id = payload.old.id;
        // Search every list — id uniqueness across kinds is not enforced
        // by the schema, so a deleted row could be in any of the three.
        if (focuses.value.some((t) => t.id === id)) {
            setFocuses(focuses.value.filter((t) => t.id !== id));
            return;
        }
        if (approaches.value.some((a) => a.id === id)) {
            setApproaches(approaches.value.filter((a) => a.id !== id));
            return;
        }
        if (accounts.value.some((a) => a.id === id)) {
            setAccounts(accounts.value.filter((a) => a.id !== id));
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (!payloadHasRow(payload.new)) return;
        const row = payload.new as Row<"studio_artifacts">;
        const kind = rowKind(row);
        if (kind === KIND_FOCUS) {
            const t = rowToThesis(row);
            if (!t) return;
            const exists = focuses.value.some((x) => x.id === t.id);
            setFocuses(
                exists
                    ? focuses.value.map((x) => (x.id === t.id ? t : x))
                    : [...focuses.value, t]
            );
        } else if (kind === KIND_APPROACH) {
            const a = rowToApproach(row);
            if (!a) return;
            const exists = approaches.value.some((x) => x.id === a.id);
            setApproaches(
                exists
                    ? approaches.value.map((x) => (x.id === a.id ? a : x))
                    : [...approaches.value, a]
            );
        } else if (kind === KIND_ACCOUNT) {
            const a = rowToAccount(row);
            if (!a) return;
            const exists = accounts.value.some((x) => x.id === a.id);
            setAccounts(
                exists
                    ? accounts.value.map((x) => (x.id === a.id ? a : x))
                    : [...accounts.value, a]
            );
        }
    }
}

export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.studioArtifacts.subscribe((payload) => {
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

export function __getRealtimeChannelForTests(): RealtimeChannel | null {
    return realtimeChannel;
}

export async function teardownRealtime(): Promise<void> {
    if (!realtimeChannel) return;
    try {
        await realtimeChannel.unsubscribe();
    } catch (err) {
        reportError(err, { op: "territory-architect.teardownRealtime" });
    }
    realtimeChannel = null;
}
