import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Row } from "@/lib/database-helpers";
import { reportError, trackEvent } from "@/lib/observability";
import {
    advisorToInsert,
    advisorToUpdate,
    KIND_ADVISOR_PROFILE,
    looksLikePersistedId,
    rowKind,
    rowToAdvisor,
    rowsToAdvisors
} from "./advisor-profile-bridge";
import type { Advisor } from "./types";
import { advisors, setAdvisors } from "../state";

/**
 * Advisor REGISTRY cloud persistence.
 *
 * Reads/writes saved advisors against `studio_artifacts` rows tagged
 * data.kind='advisor.profile'. Independent of the deployment cloud
 * loop — boots in parallel with bootCloudPersistence in
 * cloud-persistence.ts (which handles deployments).
 *
 * Boot flow:
 *   1. Fetch all studio_artifacts rows for the workspace
 *   2. Filter to advisor.profile kind
 *   3. If cloud has rows → cloud is canonical → setAdvisors(cloud)
 *   4. If cloud is empty AND localStorage has advisors → migrate up
 *   5. Subscribe to realtime; INSERT/UPDATE/DELETE on advisor.profile
 *      kind syncs in
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
    readonly advisorCount: number;
}

export async function bootAdvisorProfileCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.studioArtifacts.list({ limit: 1000 });
        const cloudAdvisors = rowsToAdvisors(rows);
        if (cloudAdvisors.length > 0) {
            setAdvisors(cloudAdvisors);
            subscribeRealtime(client);
            trackEvent("advisor_deploy_profile_boot", {
                mode: "cloud",
                count: cloudAdvisors.length
            });
            return { mode: "cloud", advisorCount: cloudAdvisors.length };
        }
        const local = advisors.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            trackEvent("advisor_deploy_profile_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", advisorCount: local.length };
        }
        subscribeRealtime(client);
        trackEvent("advisor_deploy_profile_boot", {
            mode: "empty",
            count: 0
        });
        return { mode: "empty", advisorCount: 0 };
    } catch (err) {
        reportError(err, {
            op: "advisor-deploy.bootAdvisorProfileCloudPersistence"
        });
        return { mode: "local-only", advisorCount: advisors.value.length };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    local: ReadonlyArray<Advisor>
): Promise<void> {
    const next: Advisor[] = [];
    for (const advisor of local) {
        try {
            const row = await client.studioArtifacts.insert(
                advisorToInsert(advisor)
            );
            const hydrated = rowToAdvisor(row);
            next.push(hydrated ?? advisor);
        } catch (err) {
            reportError(err, {
                op: "advisor-deploy.migrateAdvisorProfileToCloud",
                advisorId: advisor.id
            });
            next.push(advisor);
        }
    }
    setAdvisors(next);
}

export async function saveAdvisor(advisor: Advisor): Promise<Advisor> {
    if (!clientRef) return advisor;
    try {
        const isUpdate = looksLikePersistedId(advisor.id);
        const row = isUpdate
            ? await clientRef.studioArtifacts.update(
                  advisor.id,
                  advisorToUpdate(advisor)
              )
            : await clientRef.studioArtifacts.insert(
                  advisorToInsert(advisor)
              );
        const saved = rowToAdvisor(row);
        if (saved) {
            if (!isUpdate && saved.id !== advisor.id) {
                const without = advisors.value.filter(
                    (a) => a.id !== advisor.id
                );
                setAdvisors([...without, saved]);
            } else {
                setAdvisors(
                    advisors.value.map((a) => (a.id === saved.id ? saved : a))
                );
            }
            trackEvent("advisor_deploy_save_profile", {
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return advisor;
    } catch (err) {
        reportError(err, {
            op: "advisor-deploy.saveAdvisor",
            advisorId: advisor.id
        });
        return advisor;
    }
}

export async function deleteAdvisorInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.studioArtifacts.remove(id);
    } catch (err) {
        reportError(err, {
            op: "advisor-deploy.deleteAdvisorInCloud",
            advisorId: id
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

export function applyAdvisorProfileRealtimePayload(payload: {
    eventType: string;
    new: unknown;
    old: unknown;
}): void {
    if (payload.eventType === "DELETE") {
        if (!payloadHasRow(payload.old)) return;
        const id = payload.old.id;
        if (advisors.value.some((a) => a.id === id)) {
            setAdvisors(advisors.value.filter((a) => a.id !== id));
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (!payloadHasRow(payload.new)) return;
        const row = payload.new as Row<"studio_artifacts">;
        if (rowKind(row) !== KIND_ADVISOR_PROFILE) return;
        const advisor = rowToAdvisor(row);
        if (!advisor) return;
        const exists = advisors.value.some((a) => a.id === advisor.id);
        setAdvisors(
            exists
                ? advisors.value.map((a) =>
                      a.id === advisor.id ? advisor : a
                  )
                : [...advisors.value, advisor]
        );
    }
}

export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.studioArtifacts.subscribe((payload) => {
        applyAdvisorProfileRealtimePayload(
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
        reportError(err, {
            op: "advisor-deploy.teardownAdvisorProfileRealtime"
        });
    }
    realtimeChannel = null;
}
