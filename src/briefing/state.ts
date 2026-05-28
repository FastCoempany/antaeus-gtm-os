/**
 * Briefing room state (B.2c-2 + B.3b).
 *
 * The room reads synthesized Patterns from Supabase and renders them
 * (B.2c-2), and reads the operator's armed Watch List triggers + the
 * fires they produced this week (B.3b). main.tsx calls bootPatterns()
 * and bootTriggers() after first paint; the components read the signals.
 */

import { signal } from "@preact/signals";
import { type BriefingPattern, loadStandardPatterns } from "./lib/patterns";
import {
    type ArmedTrigger,
    type TriggerFire,
    armTrigger,
    disableTrigger,
    loadArmedTriggers,
    loadRecentFires
} from "./lib/watchlist-client";
import type { TriggerParseResult } from "./lib/triggers/types";

export const patterns = signal<ReadonlyArray<BriefingPattern>>([]);
export const patternsLoaded = signal(false);

export const armedTriggers = signal<ReadonlyArray<ArmedTrigger>>([]);
export const recentFires = signal<ReadonlyArray<TriggerFire>>([]);
export const triggersLoaded = signal(false);

export async function bootPatterns(): Promise<void> {
    patterns.value = await loadStandardPatterns();
    patternsLoaded.value = true;
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

/** Test seam — reset signals between cases. */
export function __resetBriefingStateForTests(): void {
    patterns.value = [];
    patternsLoaded.value = false;
    armedTriggers.value = [];
    recentFires.value = [];
    triggersLoaded.value = false;
}
