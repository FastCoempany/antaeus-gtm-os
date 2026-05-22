import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import { reportError } from "@/lib/observability";
import {
    enrichAccount,
    enrichmentResponseToAccountPatch,
    enrichmentSignalsToSignals,
    type EnrichResult
} from "./enrichment";
import { saveAccount, replaceAccountSignals } from "./cloud-persistence";
import { allAccounts } from "../state";
import type { Account } from "./types";

/**
 * Enrich-all orchestrator + progress signals.
 *
 * Composes the enrichment library (Wave 4) with the dual-write
 * orchestrators (Wave 3) so one call to `runEnrichAll()` walks every
 * account through:
 *   1. POST /enrich with {name, domain, industry, ticker}
 *   2. Apply account patch (industry/employees/hq/enrichedAt) via saveAccount
 *   3. Replace account.signals[] wholesale + dual-write each to cloud
 *
 * Progress is exposed via signals so the UI can render per-account
 * state chips while a run is in flight. State is workspace-scoped
 * (cleared on resetSession or new run).
 *
 * Cancellation: a run-level AbortController lets the operator stop the
 * whole batch mid-flight; in-flight requests get aborted, queued
 * accounts get marked "skipped".
 *
 * Ref: deliverables/audit/data-parity-signal-console-2026-05-21.md §"Site 7"
 */

export type EnrichmentItemStatus =
    | "idle"
    | "queued"
    | "running"
    | "done"
    | "error"
    | "skipped";

/**
 * Per-account enrichment status, keyed by Account.id. Components
 * subscribe to this signal to render progress chips.
 */
export const enrichmentStatusByAccount: Signal<
    Record<string, EnrichmentItemStatus>
> = signal({});

/**
 * Per-account error message when status === "error". Keyed by id.
 */
export const enrichmentErrorByAccount: Signal<Record<string, string>> = signal(
    {}
);

/**
 * True while a batch (single-account or all-accounts) run is active.
 * UI uses this to disable the Enrich button and show a Cancel.
 */
export const isEnrichmentRunning: ReadonlySignal<boolean> = computed(() => {
    const map = enrichmentStatusByAccount.value;
    return Object.values(map).some(
        (s) => s === "queued" || s === "running"
    );
});

/**
 * Count of accounts in each terminal state for the active/last run.
 * UI shows this as "Enriched 3 of 8" while running.
 */
export const enrichmentProgress: ReadonlySignal<{
    queued: number;
    running: number;
    done: number;
    error: number;
    skipped: number;
    total: number;
}> = computed(() => {
    const map = enrichmentStatusByAccount.value;
    let queued = 0;
    let running = 0;
    let done = 0;
    let error = 0;
    let skipped = 0;
    for (const status of Object.values(map)) {
        if (status === "queued") queued += 1;
        else if (status === "running") running += 1;
        else if (status === "done") done += 1;
        else if (status === "error") error += 1;
        else if (status === "skipped") skipped += 1;
    }
    return {
        queued,
        running,
        done,
        error,
        skipped,
        total: queued + running + done + error + skipped
    };
});

let currentController: AbortController | null = null;

function setStatus(id: string, status: EnrichmentItemStatus): void {
    enrichmentStatusByAccount.value = {
        ...enrichmentStatusByAccount.value,
        [id]: status
    };
}

function setError(id: string, message: string): void {
    enrichmentErrorByAccount.value = {
        ...enrichmentErrorByAccount.value,
        [id]: message
    };
}

function clearError(id: string): void {
    if (!(id in enrichmentErrorByAccount.value)) return;
    const next = { ...enrichmentErrorByAccount.value };
    delete next[id];
    enrichmentErrorByAccount.value = next;
}

/**
 * Reset all enrichment state to idle. Called at the start of a new
 * run + by tests.
 */
export function resetEnrichmentState(): void {
    enrichmentStatusByAccount.value = {};
    enrichmentErrorByAccount.value = {};
    currentController = null;
}

/**
 * Enrich one account end-to-end: POST /enrich, then apply the
 * response via saveAccount (account patch) + replaceAccountSignals
 * (new signals[]). Updates the progress signals so the UI can render
 * the in-flight state.
 *
 * Returns the EnrichResult so callers can branch on error / aborted.
 * Never throws.
 */
export async function enrichAccountAndApply(
    account: Account,
    options: { signal?: AbortSignal } = {}
): Promise<EnrichResult> {
    setStatus(account.id, "running");
    clearError(account.id);

    const result = await enrichAccount(account, { signal: options.signal });

    if (result.status === "aborted") {
        setStatus(account.id, "skipped");
        return result;
    }
    if (result.status === "error") {
        setStatus(account.id, "error");
        setError(account.id, result.message);
        return result;
    }

    // Apply: account patch + signals replacement.
    try {
        const patch = enrichmentResponseToAccountPatch(result.response);
        const patched: Account = { ...account, ...patch };
        await saveAccount(patched);
        const signals = enrichmentSignalsToSignals(
            result.response.signals,
            result.response.enrichedAt
        );
        // replaceAccountSignals operates on the (possibly uuid-swapped)
        // current account id. saveAccount may have minted a new uuid
        // for a previously-legacy id; look it up from state.
        const currentId = findCurrentAccountId(patched);
        await replaceAccountSignals(currentId, signals);
        setStatus(account.id, "done");
        return result;
    } catch (err) {
        reportError(err, {
            op: "signal-console.enrichAccountAndApply",
            accountId: account.id
        });
        setStatus(account.id, "error");
        setError(
            account.id,
            err instanceof Error ? err.message : "Failed to apply enrichment"
        );
        return {
            status: "error",
            message: err instanceof Error ? err.message : "apply failed"
        };
    }
}

/**
 * If saveAccount minted a new uuid for a previously-legacy account,
 * the local state holds the new id but the patched object still has
 * the old one. Resolve by name to pick up the current id.
 */
function findCurrentAccountId(account: Account): string {
    const byName = allAccounts.value.find(
        (a) => a.name.toLowerCase() === account.name.toLowerCase()
    );
    return byName?.id ?? account.id;
}

export interface EnrichAllOptions {
    /**
     * Optional filter: only enrich accounts that pass this predicate.
     * Default: all accounts.
     */
    readonly filter?: (account: Account) => boolean;
    /**
     * Optional concurrency cap. Default 1 (sequential) — the server's
     * 30-90s response time + 12-req/min rate limit means parallelism
     * doesn't help and risks the rate limit ceiling.
     */
    readonly concurrency?: number;
}

export interface EnrichAllSummary {
    readonly attempted: number;
    readonly succeeded: number;
    readonly failed: number;
    readonly aborted: boolean;
}

/**
 * Walk every account through enrichAccountAndApply. Sequential by
 * default. Cancellation via the returned `cancel()` aborts in-flight
 * + skips queued.
 *
 * Returns a promise that resolves with a summary when the run
 * completes (or is cancelled). Never rejects.
 */
export async function runEnrichAll(
    options: EnrichAllOptions = {}
): Promise<EnrichAllSummary> {
    // If a previous run is still in flight, refuse — caller must
    // cancel first. (Two concurrent runs would race the progress
    // signals.)
    if (currentController) {
        return {
            attempted: 0,
            succeeded: 0,
            failed: 0,
            aborted: false
        };
    }
    const controller = new AbortController();
    currentController = controller;

    const filter = options.filter ?? ((): boolean => true);
    const targets = allAccounts.value.filter(filter);

    // Seed status to "queued" for every target.
    const seed: Record<string, EnrichmentItemStatus> = {};
    for (const a of targets) seed[a.id] = "queued";
    enrichmentStatusByAccount.value = seed;
    enrichmentErrorByAccount.value = {};

    let succeeded = 0;
    let failed = 0;
    let aborted = false;

    for (const account of targets) {
        if (controller.signal.aborted) {
            // Mark all remaining queued items as skipped.
            if (enrichmentStatusByAccount.value[account.id] === "queued") {
                setStatus(account.id, "skipped");
            }
            aborted = true;
            continue;
        }
        const result = await enrichAccountAndApply(account, {
            signal: controller.signal
        });
        if (result.status === "ok") succeeded += 1;
        else if (result.status === "error") failed += 1;
        else if (result.status === "aborted") aborted = true;
    }

    currentController = null;
    return {
        attempted: targets.length,
        succeeded,
        failed,
        aborted
    };
}

/**
 * Cancel the in-flight enrich-all run, if any. No-op if none.
 */
export function cancelEnrichAll(): void {
    if (currentController) {
        currentController.abort();
    }
}

/** Test-only — read whether a run is currently active. */
export function __isEnrichmentRunActive(): boolean {
    return currentController !== null;
}

/** Test-only — clear all state. */
export function __resetForTests(): void {
    if (currentController) {
        currentController.abort();
    }
    currentController = null;
    enrichmentStatusByAccount.value = {};
    enrichmentErrorByAccount.value = {};
}
