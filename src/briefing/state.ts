/**
 * Briefing room state (B.2c-2).
 *
 * The room reads synthesized Patterns from Supabase and renders them.
 * Three signals drive the view: whether the load has finished, the
 * Patterns themselves, and the run they came from. main.tsx calls
 * bootPatterns() after first paint; Briefing.tsx reads the signals.
 */

import { signal } from "@preact/signals";
import { type BriefingPattern, loadStandardPatterns } from "./lib/patterns";

export const patterns = signal<ReadonlyArray<BriefingPattern>>([]);
export const patternsLoaded = signal(false);

export async function bootPatterns(): Promise<void> {
    patterns.value = await loadStandardPatterns();
    patternsLoaded.value = true;
}

/** Test seam — reset signals between cases. */
export function __resetBriefingStateForTests(): void {
    patterns.value = [];
    patternsLoaded.value = false;
}
