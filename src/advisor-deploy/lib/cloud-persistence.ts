import type { DataClient } from "@/lib/data-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json } from "@/lib/database.types";
import { reportError, trackEvent } from "@/lib/observability";
import { enqueueRetry } from "@/lib/cloud-sync-queue";
import {
    deploymentToInsert,
    deploymentToUpdate,
    looksLikePersistedId,
    rowToDeployment,
    rowsToDeployments
} from "./advisor-bridge";
import type { Deployment } from "./types";
import { advisors, deployments, prependDeployment, setDeployments } from "../state";

/**
 * Advisor Deploy cloud persistence (Supabase + realtime + first-sync
 * migration of any localStorage-only deployments).
 *
 * Mirrors the Signal Console / ICP / PoC templates: boot → load cloud
 * or migrate local up → subscribe realtime; saves go through saveDeployment
 * + deleteDeploymentInCloud helpers.
 *
 * The advisor REGISTRY (rolodex) is NOT cloud-synced in this batch —
 * it's a per-device quick-pick UI. Each deployment carries advisor_name
 * + advisor_tier denormalized so cross-device deployment history works.
 *
 * Boot flow (called from main.tsx after first paint):
 *   1. Load all rows for the current workspace
 *   2. If rows exist → cloud is canonical → setDeployments(rows)
 *   3. If rows are empty AND localStorage already had deployments →
 *      migrate them by inserting each one
 *   4. Subscribe to realtime so cross-tab + cross-device mutations
 *      flow into this room without a refresh
 *
 * Every public function catches + reports via Sentry; nothing throws.
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
    readonly deploymentCount: number;
}

/**
 * Resolve the in-memory advisor's tier (when present) so the row's
 * advisor_tier column never blanks.
 */
function tierForDeployment(deployment: Deployment): "t1" | "t2" | "t3" | "t4" {
    const advisor = advisors.value.find((a) => a.id === deployment.advisorId);
    return advisor?.tier ?? "t2";
}

export async function bootCloudPersistence(
    client: DataClient
): Promise<BootResult> {
    clientRef = client;
    try {
        const rows = await client.advisorDeployments.list({ limit: 500 });
        if (rows.length > 0) {
            const deps = rowsToDeployments(rows);
            setDeployments(deps);
            subscribeRealtime(client);
            trackEvent("advisor_deploy_boot", {
                mode: "cloud",
                count: deps.length
            });
            return { mode: "cloud", deploymentCount: deps.length };
        }
        const local = deployments.value;
        if (local.length > 0) {
            await migrateLocalToCloud(client, local);
            subscribeRealtime(client);
            trackEvent("advisor_deploy_boot", {
                mode: "migrated",
                count: local.length
            });
            return { mode: "migrated", deploymentCount: local.length };
        }
        subscribeRealtime(client);
        trackEvent("advisor_deploy_boot", { mode: "empty", count: 0 });
        return { mode: "empty", deploymentCount: 0 };
    } catch (err) {
        reportError(err, { op: "advisor-deploy.bootCloudPersistence" });
        return {
            mode: "local-only",
            deploymentCount: deployments.value.length
        };
    }
}

async function migrateLocalToCloud(
    client: DataClient,
    localDeps: ReadonlyArray<Deployment>
): Promise<void> {
    const next: Deployment[] = [];
    for (const dep of localDeps) {
        try {
            const insert = deploymentToInsert(dep, tierForDeployment(dep));
            const row = await client.advisorDeployments.insert(insert);
            const hydrated = rowToDeployment(row);
            next.push(hydrated ?? dep);
        } catch (err) {
            reportError(err, {
                op: "advisor-deploy.migrateLocalToCloud",
                deploymentId: dep.id
            });
            next.push(dep);
        }
    }
    setDeployments(next);
}

/**
 * Persist a Deployment create/update. Optimistic — `prependDeployment`
 * already happened in the caller; this routes to insert vs update
 * based on the id shape.
 */
export async function saveDeployment(deployment: Deployment): Promise<Deployment> {
    if (!clientRef) return deployment;
    try {
        const isUpdate = looksLikePersistedId(deployment.id);
        const row = isUpdate
            ? await clientRef.advisorDeployments.update(
                  deployment.id,
                  deploymentToUpdate(deployment, tierForDeployment(deployment))
              )
            : await clientRef.advisorDeployments.insert(
                  deploymentToInsert(
                      deployment,
                      tierForDeployment(deployment)
                  )
              );
        const saved = rowToDeployment(row);
        if (saved) {
            if (!isUpdate && saved.id !== deployment.id) {
                // Drop the legacy-id row from state and prepend the new one.
                const without = deployments.value.filter(
                    (d) => d.id !== deployment.id
                );
                setDeployments([saved, ...without]);
            } else {
                // Update in place.
                setDeployments(
                    deployments.value.map((d) =>
                        d.id === saved.id ? saved : d
                    )
                );
            }
            trackEvent("advisor_deploy_save", {
                mode: isUpdate ? "update" : "insert"
            });
            return saved;
        }
        return deployment;
    } catch (err) {
        reportError(err, {
            op: "advisor-deploy.saveDeployment",
            deploymentId: deployment.id
        });
        const isUpdate = looksLikePersistedId(deployment.id);
        const tier = tierForDeployment(deployment);
        enqueueRetry({
            table: "advisor_deployments",
            op: isUpdate ? "update" : "insert",
            rowId: isUpdate ? deployment.id : null,
            payload: (isUpdate
                ? deploymentToUpdate(deployment, tier)
                : deploymentToInsert(deployment, tier)) as unknown as Json,
            source: "advisor-deploy.saveDeployment"
        });
        return deployment;
    }
}

export async function deleteDeploymentInCloud(id: string): Promise<void> {
    if (!clientRef) return;
    if (!looksLikePersistedId(id)) return;
    try {
        await clientRef.advisorDeployments.remove(id);
    } catch (err) {
        reportError(err, {
            op: "advisor-deploy.deleteDeploymentInCloud",
            deploymentId: id
        });
        enqueueRetry({
            table: "advisor_deployments",
            op: "delete",
            rowId: id,
            source: "advisor-deploy.deleteDeploymentInCloud"
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
        if (payloadHasRow(payload.old)) {
            const id = payload.old.id;
            setDeployments(deployments.value.filter((d) => d.id !== id));
        }
        return;
    }
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payloadHasRow(payload.new)) {
            const dep = rowToDeployment(payload.new);
            if (!dep) return;
            const exists = deployments.value.some((d) => d.id === dep.id);
            if (exists) {
                setDeployments(
                    deployments.value.map((d) => (d.id === dep.id ? dep : d))
                );
            } else {
                prependDeployment(dep);
            }
        }
    }
}

export function subscribeRealtime(client: DataClient): RealtimeChannel {
    const channel = client.advisorDeployments.subscribe((payload) => {
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
        reportError(err, { op: "advisor-deploy.teardownRealtime" });
    }
    realtimeChannel = null;
}
