/**
 * Briefing room state (B.2c-2 + B.3b + B.4c).
 *
 * The room reads synthesized Patterns from Supabase and renders them
 * (B.2c-2), reads the operator's armed Watch List triggers + the
 * fires they produced this week (B.3b), and reads the periphery
 * candidates the detector produced this run (B.4c). main.tsx calls
 * bootPatterns(), bootTriggers(), and bootPeriphery() after first
 * paint; the components read the signals.
 */

import { signal } from "@preact/signals";
import { type BriefingPattern, loadContrarianPatterns, loadStandardPatterns } from "./lib/patterns";
import {
    type ArmedTrigger,
    type TriggerFire,
    armTrigger,
    disableTrigger,
    loadArmedTriggers,
    loadRecentFires
} from "./lib/watchlist-client";
import type { TriggerParseResult } from "./lib/triggers/types";
import {
    type PeripheryCandidate,
    addPeripheryToWatchlist,
    dismissPeripheryCandidate,
    loadActivePeripheryCandidates,
    snoozePeripheryCandidate
} from "./lib/periphery-client";

export const patterns = signal<ReadonlyArray<BriefingPattern>>([]);
export const patternsLoaded = signal(false);

export const armedTriggers = signal<ReadonlyArray<ArmedTrigger>>([]);
export const recentFires = signal<ReadonlyArray<TriggerFire>>([]);
export const triggersLoaded = signal(false);

export const peripheryCandidates = signal<ReadonlyArray<PeripheryCandidate>>([]);
export const peripheryLoaded = signal(false);

export const contrarianPatterns = signal<ReadonlyArray<BriefingPattern>>([]);
export const contrarianLoaded = signal(false);

export async function bootPatterns(): Promise<void> {
    patterns.value = await loadStandardPatterns();
    patternsLoaded.value = true;
}

export async function bootContrarian(): Promise<void> {
    contrarianPatterns.value = await loadContrarianPatterns();
    contrarianLoaded.value = true;
}

export async function bootTriggers(): Promise<void> {
    const [armed, fires] = await Promise.all([loadArmedTriggers(), loadRecentFires()]);
    armedTriggers.value = armed;
    recentFires.value = fires;
    triggersLoaded.value = true;
}

/** Re-read armed triggers + fires after a mutation. */
export async function refreshTriggers(): Promise<void> {
    const [armed, fires] = await Promise.all([loadArmedTriggers(), loadRecentFires()]);
    armedTriggers.value = armed;
    recentFires.value = fires;
}

/**
 * Arm a parsed trigger, then refresh the list so the new one shows.
 * Returns true on success. The caller (AddTriggerFlow) closes its
 * panel only when this resolves true.
 */
export async function armParsedTrigger(
    parse: TriggerParseResult,
    naturalLanguage: string
): Promise<boolean> {
    const id = await armTrigger(parse, naturalLanguage);
    if (!id) return false;
    await refreshTriggers();
    return true;
}

/** Disable a trigger, then refresh so it drops out of the armed list. */
export async function disableArmedTrigger(id: string): Promise<boolean> {
    const ok = await disableTrigger(id);
    if (ok) await refreshTriggers();
    return ok;
}

export async function bootPeriphery(): Promise<void> {
    peripheryCandidates.value = await loadActivePeripheryCandidates();
    peripheryLoaded.value = true;
}

/** Drop a candidate from the local signal — the server already updated its status. */
function removeCandidate(id: string): void {
    peripheryCandidates.value = peripheryCandidates.value.filter((c) => c.id !== id);
}

export async function promotePeripheryCandidate(
    candidate: PeripheryCandidate
): Promise<boolean> {
    const ok = await addPeripheryToWatchlist(candidate);
    if (ok) {
        removeCandidate(candidate.id);
        // Refresh the armed-triggers + entities readouts so the newly
        // watched entity shows up in the Watch List section.
        await refreshTriggers();
    }
    return ok;
}

export async function snoozePeripheryAction(id: string): Promise<boolean> {
    const ok = await snoozePeripheryCandidate(id);
    if (ok) removeCandidate(id);
    return ok;
}

export async function dismissPeripheryAction(id: string): Promise<boolean> {
    const ok = await dismissPeripheryCandidate(id);
    if (ok) removeCandidate(id);
    return ok;
}

/** Test seam — reset signals between cases. */
export function __resetBriefingStateForTests(): void {
    patterns.value = [];
    patternsLoaded.value = false;
    armedTriggers.value = [];
    recentFires.value = [];
    triggersLoaded.value = false;
    peripheryCandidates.value = [];
    peripheryLoaded.value = false;
    contrarianPatterns.value = [];
    contrarianLoaded.value = false;
}
