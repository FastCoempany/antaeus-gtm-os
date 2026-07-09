import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Row } from "@/lib/database-helpers";
import { reportError, trackEvent } from "@/lib/observability";
import {
    KIND_PROSPECT,
    KIND_QUERY_CARD,
    looksLikePersistedId,
    partitionSourcingRows,
    prospectToInsert,
    prospectToUpdate,
    queryCardToInsert,
    queryCardToUpdate,
    rowKind,
    rowToProspect,
    rowToQueryCard
} from "./sourcing-bridge";
import type { Prospect, QueryCard } from "./types";
import {
    prospects,
    queryCards,
    setProspects,
    setQueryCards
} from "../state";

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
    readonly queryCardsCount: number;
    readonly prospectsCount: number;
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.studioArtifacts.list({ limit: 1000 });
        const partitioned = partitionSourcingRows(rows);
        const cloudHasData =
            partitioned.queryCards.length + partitioned.prospects.length > 0;
        if (cloudHasData) {
            setQueryCards(partitioned.queryCards);
            setProspects(partitioned.prospects);
            subscribeRealtime(client);
            trackEvent("sourcing_workbench_boot", {
                mode: "cloud",
                queryCards: partitioned.queryCards.length,
                prospects: partitioned.prospects.length
            });
            return {
                mode: "cloud",
                queryCardsCount: partitioned.queryCards.length,
                prospectsCount: partitioned.prospects.length
            };
        }
        const localCards = queryCards.value;
        const localProspects = prospects.value;
        const localHasData = localCards.length + localProspects.length > 0;
        if (localHasData) {
            await migrateLocalToCloud(client, localCards, localProspects);
            subscribeRealtime(client);
            trackEvent("sourcing_workbench_boot", {
                mode: "migrated",
                queryCards: localCards.length,
                prospects: localProspects.length
            });
            return {
                mode: "migrated",
                queryCardsCount: localCards.length,
                prospectsCount: localProspects.length
            };
        }
        subscribeRealtime(client);
        trackEvent("sourcing_workbench_boot", { mode: "empty" });
        return { mode: "empty", queryCardsCount: 0, prospectsCount: 0 };
    } catch (err) {
        reportError(err, { op: "sourcing-workbench.bootCloudPersistence" });
        return {
            mode: "local-only",
            queryCardsCount: queryCards.value.length,
            prospectsCount: prospects.value.length
        };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    localCards: ReadonlyArray<QueryCard>,
    localProspects: ReadonlyArray<Prospect>
): Promise<void> {
    const newCards: QueryCard[] = [];
    for (const c of localCards) {
        try {
            const row = await client.studioArtifacts.insert(
                queryCardToInsert(c)
            );
            const hydrated = rowToQueryCard(row);
            newCards.push(hydrated ?? c);
        } catch (err) {
            reportError(err, {
                op: "sourcing-workbench.migrateLocalToCloud.queryCard",
                id: c.id
            });
            newCards.push(c);
        }
    }
    const newProspects: Prospect[] = [];
    for (const p of localProspects) {
        try {
            const row = await client.studioArtifacts.insert(
                prospectToInsert(p)
            );
            const hydrated = rowToProspect(row);
            newProspects.push(hydrated ?? p);
        } catch (err) {
            reportError(err, {
                op: "sourcing-workbench.migrateLocalToCloud.prospect",
                id: p.id
            });
            newProspects.push(p);
        }
    }
    setQueryCards(newCards);
    setProspects(newProspects);
}

export async function saveQueryCard(card: QueryCard): Promise<QueryCard> {
    if (!clientRef) return card;
    try {
        const isUpdate = looksLikePersistedId(card.id);
        const row = isUpdate
            ? await clientRef.studioArtifacts.update(
                  card.id,
                  queryCardToUpdate(card)
              )
            : await clientRef.studioArtifacts.insert(queryCardToInsert(card));
        const saved = rowToQueryCard(row);
        if (saved) {
            if (!isUpdate && saved.id !== card.id) {
                setQueryCards(
                    queryCards.value
                        .filter((x) => x.id !== card.id)
                        .concat(saved)
                );
            } else {
                setQueryCards(
                    queryCards.value.map((x) =>
                        x.id === saved.id ? saved : x
                    )
                );
            }
            trackEvent("sourcing_workbench_save", {
                kind: "queryCard",
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return card;
    } catch (err) {
        reportError(err, {
            op: "sourcing-workbench.saveQueryCard",
            id: card.id
        });
        return card;
    }
}

export async function saveProspect(prospect: Prospect): Promise<Prospect> {
    if (!clientRef) return prospect;
    try {
        const isUpdate = looksLikePersistedId(prospect.id);
        const row = isUpdate
            ? await clientRef.studioArtifacts.update(
                  prospect.id,
                  prospectToUpdate(prospect)
              )
            : await clientRef.studioArtifacts.insert(
                  prospectToInsert(prospect)
              );
        const saved = rowToProspect(row);
        if (saved) {
            if (!isUpdate && saved.id !== prospect.id) {
                setProspects(
                    prospects.value
                        .filter((x) => x.id !== prospect.id)
                        .concat(saved)
                );
            } else {
                setProspects(
                    prospects.value.map((x) =>
                        x.id === saved.id ? saved : x
                    )
                );
            }
            trackEvent("sourcing_workbench_save", {
                kind: "prospect",
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return prospect;
    } catch (err) {
        reportError(err, {
            op: "sourcing-workbench.saveProspect",
            id: prospect.id
        });
        return prospect;
    }
}

export async function deleteArtifactInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.studioArtifacts.remove(id);
    } catch (err) {
        reportError(err, {
            op: "sourcing-workbench.deleteArtifactInCloud",
            id
        });
    }
}

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
        if (queryCards.value.some((c) => c.id === id)) {
            setQueryCards(queryCards.value.filter((c) => c.id !== id));
            return;
        }
        if (prospects.value.some((p) => p.id === id)) {
            setProspects(prospects.value.filter((p) => p.id !== id));
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (!payloadHasRow(payload.new)) return;
        const row = payload.new as Row<"studio_artifacts">;
        const kind = rowKind(row);
        if (kind === KIND_QUERY_CARD) {
            const c = rowToQueryCard(row);
            if (!c) return;
            const exists = queryCards.value.some((x) => x.id === c.id);
            setQueryCards(
                exists
                    ? queryCards.value.map((x) =>
                          x.id === c.id ? c : x
                      )
                    : [...queryCards.value, c]
            );
        } else if (kind === KIND_PROSPECT) {
            const p = rowToProspect(row);
            if (!p) return;
            const exists = prospects.value.some((x) => x.id === p.id);
            setProspects(
                exists
                    ? prospects.value.map((x) =>
                          x.id === p.id ? p : x
                      )
                    : [...prospects.value, p]
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
        reportError(err, { op: "sourcing-workbench.teardownRealtime" });
    }
    realtimeChannel = null;
}
