import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json, Row } from "@/lib/database.types";
import { reportError, trackEvent } from "@/lib/observability";
import { enqueueRetry } from "@/lib/cloud-sync-queue";
import {
    accountToInsert,
    accountToUpdate,
    approachToInsert,
    approachToUpdate,
    KIND_ACCOUNT,
    KIND_APPROACH,
    KIND_THESIS,
    looksLikePersistedId,
    partitionTerritoryRows,
    rowKind,
    rowToAccount,
    rowToApproach,
    rowToThesis,
    thesisToInsert,
    thesisToUpdate
} from "./territory-bridge";
import type { Approach, TerritoryAccount, Thesis } from "./types";
import {
    accounts,
    approaches,
    setAccounts,
    setApproaches,
    setTheses,
    theses
} from "../state";

/**
 * Territory Architect cloud persistence.
 *
 * Three entity kinds (theses, approaches, accounts) live in
 * studio_artifacts discriminated by data.kind. studio_artifacts has
 * no top-level filterable column for this discriminator, so boot
 * fetches every row owned by the workspace and partitions client-side.
 *
 * Boot flow:
 *   1. Fetch all studio_artifacts rows for the workspace
 *   2. Partition into theses / approaches / accounts (drops other kinds)
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
            partitioned.theses.length +
                partitioned.approaches.length +
                partitioned.accounts.length >
            0;
        if (cloudHasData) {
            setTheses(partitioned.theses);
            setApproaches(partitioned.approaches);
            setAccounts(partitioned.accounts);
            subscribeRealtime(client);
            trackEvent("territory_architect_boot", {
                mode: "cloud",
                theses: partitioned.theses.length,
                approaches: partitioned.approaches.length,
                accounts: partitioned.accounts.length
            });
            return {
                mode: "cloud",
                thesesCount: partitioned.theses.length,
                approachesCount: partitioned.approaches.length,
                accountsCount: partitioned.accounts.length
            };
        }
        const localTheses = theses.value;
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
                theses: localTheses.length,
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
            thesesCount: theses.value.length,
            approachesCount: approaches.value.length,
            accountsCount: accounts.value.length
        };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    localTheses: ReadonlyArray<Thesis>,
    localApproaches: ReadonlyArray<Approach>,
    localAccounts: ReadonlyArray<TerritoryAccount>
): Promise<void> {
    const newTheses: Thesis[] = [];
    for (const t of localTheses) {
        try {
            const row = await client.studioArtifacts.insert(thesisToInsert(t));
            const hydrated = rowToThesis(row);
            newTheses.push(hydrated ?? t);
        } catch (err) {
            reportError(err, {
                op: "territory-architect.migrateLocalToCloud.thesis",
                id: t.id
            });
            newTheses.push(t);
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
    setTheses(newTheses);
    setApproaches(newApproaches);
    setAccounts(newAccounts);
}

// ─── Per-kind save helpers ─────────────────────────────────────────────

export async function saveThesis(thesis: Thesis): Promise<Thesis> {
    if (!clientRef) return thesis;
    try {
        const isUpdate = looksLikePersistedId(thesis.id);
        const row = isUpdate
            ? await clientRef.studioArtifacts.update(
                  thesis.id,
                  thesisToUpdate(thesis)
              )
            : await clientRef.studioArtifacts.insert(thesisToInsert(thesis));
        const saved = rowToThesis(row);
        if (saved) {
            if (!isUpdate && saved.id !== thesis.id) {
                setTheses(
                    theses.value
                        .filter((t) => t.id !== thesis.id)
                        .concat(saved)
                );
            } else {
                setTheses(
                    theses.value.map((t) => (t.id === saved.id ? saved : t))
                );
            }
            trackEvent("territory_architect_save", {
                kind: "thesis",
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return thesis;
    } catch (err) {
        reportError(err, {
            op: "territory-architect.saveThesis",
            id: thesis.id
        });
        const isUpdate = looksLikePersistedId(thesis.id);
        enqueueRetry({
            table: "studio_artifacts",
            op: isUpdate ? "update" : "insert",
            rowId: isUpdate ? thesis.id : null,
            payload: (isUpdate
                ? thesisToUpdate(thesis)
                : thesisToInsert(thesis)) as unknown as Json,
            source: "territory-architect.saveThesis"
        });
        return thesis;
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
        const isUpdate = looksLikePersistedId(approach.id);
        enqueueRetry({
            table: "studio_artifacts",
            op: isUpdate ? "update" : "insert",
            rowId: isUpdate ? approach.id : null,
            payload: (isUpdate
                ? approachToUpdate(approach)
                : approachToInsert(approach)) as unknown as Json,
            source: "territory-architect.saveApproach"
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
        const isUpdate = looksLikePersistedId(account.id);
        enqueueRetry({
            table: "studio_artifacts",
            op: isUpdate ? "update" : "insert",
            rowId: isUpdate ? account.id : null,
            payload: (isUpdate
                ? accountToUpdate(account)
                : accountToInsert(account)) as unknown as Json,
            source: "territory-architect.saveAccount"
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
        enqueueRetry({
            table: "studio_artifacts",
            op: "delete",
            rowId: id,
            source: "territory-architect.deleteArtifactInCloud"
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
        if (theses.value.some((t) => t.id === id)) {
            setTheses(theses.value.filter((t) => t.id !== id));
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
        if (kind === KIND_THESIS) {
            const t = rowToThesis(row);
            if (!t) return;
            const exists = theses.value.some((x) => x.id === t.id);
            setTheses(
                exists
                    ? theses.value.map((x) => (x.id === t.id ? t : x))
                    : [...theses.value, t]
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
