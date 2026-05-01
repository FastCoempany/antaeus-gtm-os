import type { DataClient } from "@/lib/data-client";
import type { Verdict, VerdictTransition } from "@/lib/readiness";
import { reportError, trackEvent } from "@/lib/observability";
import { openCeremony } from "../state";

/**
 * Ceremony moment subscriber.
 *
 * Per canon §4.19: "when Readiness verdict transitions UP from
 * **Building → Inheritable with guardrails** for the first time in
 * a workspace, fire a **set-piece moment** (not a toast)."
 *
 * Source of truth: the cloud `readiness_snapshots` table (Phase 5.A
 * persister, PR #47). On boot we query the most-recent row, parse
 * its `data` jsonb for the full `transition` object, and decide
 * whether the ceremony should fire. Only fires once per workspace
 * per upward transition — idempotency tracked via a localStorage
 * flag (the cloud row itself is the durable "did this happen"
 * record, the local flag prevents re-firing across reloads).
 *
 * Downward transitions are silent. Repeated upward transitions
 * after dismissal are silent (idempotency). The first hire reading
 * the workspace fresh would not see the ceremony — that's
 * intentional; the moment is for the founder.
 */

const CEREMONY_FIRED_KEY = "gtmos_founding_gtm_ceremony_fired";

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function safeStorage(): StorageLike | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

export function hasCeremonyFired(storage: StorageLike | null): boolean {
    if (!storage) return false;
    try {
        return storage.getItem(CEREMONY_FIRED_KEY) === "1";
    } catch {
        return false;
    }
}

export function markCeremonyFired(storage: StorageLike | null): void {
    if (!storage) return;
    try {
        storage.setItem(CEREMONY_FIRED_KEY, "1");
    } catch {
        // ignore storage errors
    }
}

/**
 * Pure — should we fire the ceremony for this transition?
 *
 * The set-piece is reserved for the specific moment defined in the
 * canon: upward arrival into `inheritable_with_guardrails`. Other
 * upward transitions (Building → Hire-ready skipping a level,
 * Inheritable → Hire-ready) are meaningful but get a quieter
 * treatment elsewhere — not this set-piece.
 */
export function shouldFireCeremony(transition: VerdictTransition): boolean {
    if (transition.direction !== "up") return false;
    if (transition.to !== "inheritable_with_guardrails") return false;
    return true;
}

/** Shape of the most-recent snapshot row's data jsonb (the relevant subset). */
interface SnapshotData {
    readonly verdict?: Verdict;
    readonly transition?: {
        readonly from?: Verdict;
        readonly to?: Verdict;
        readonly direction?: "up" | "down" | "same";
        readonly at?: string;
    };
}

function parseSnapshotData(value: unknown): SnapshotData | null {
    if (!value || typeof value !== "object") return null;
    return value as SnapshotData;
}

/**
 * Read the latest readiness_snapshots row + its transition payload.
 * Returns null on no rows / parse failure / cloud unavailable.
 */
export async function loadLatestTransition(
    client: DataClient
): Promise<VerdictTransition | null> {
    try {
        const rows = await client.readinessSnapshots.list({
            orderBy: { column: "created_at", ascending: false },
            limit: 1
        });
        if (rows.length === 0) return null;
        const data = parseSnapshotData(rows[0].data);
        const t = data?.transition;
        if (!t || !t.from || !t.to || !t.direction || !t.at) return null;
        return {
            id: rows[0].id,
            from: t.from,
            to: t.to,
            atIso: t.at,
            direction: t.direction
        };
    } catch (err) {
        reportError(err, { op: "founding-gtm.loadLatestTransition" });
        return null;
    }
}

export interface BootCeremonyOptions {
    readonly client: DataClient;
    readonly storage?: StorageLike;
    /** Override the default open action — useful for tests. */
    readonly onFire?: (transition: VerdictTransition) => void;
}

/**
 * Boot the ceremony subscriber. Queries the cloud for the latest
 * readiness transition; fires if it qualifies and hasn't been
 * fired before. Async — returns a Promise so callers can await
 * but main.tsx doesn't (boot is non-blocking).
 */
export async function bootCeremonyMoment(
    options: BootCeremonyOptions
): Promise<void> {
    const storage = options.storage ?? safeStorage();
    if (hasCeremonyFired(storage)) return;

    const transition = await loadLatestTransition(options.client);
    if (!transition) return;

    if (!shouldFireCeremony(transition)) return;

    markCeremonyFired(storage);
    trackEvent("founding_gtm_ceremony_fired", {
        from: transition.from,
        to: transition.to,
        at: transition.atIso
    });
    if (options.onFire) {
        options.onFire(transition);
    } else {
        openCeremony();
    }
}
