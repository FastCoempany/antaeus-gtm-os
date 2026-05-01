import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import type { AuthoredSection, SectionsInput } from "./lib/types";

/**
 * Founding GTM runtime state.
 *
 * The room owns very little persistent state — its content is
 * generated on every render from the cross-room readers (Wave 2).
 * What the room DOES own:
 *   - the live `SectionsInput` snapshot (refreshed from cloud-mirrored
 *     localStorage on boot + visibility change + storage events)
 *   - the open/closed state of the share-link composer
 *   - the open/closed state of the ceremony moment overlay (Wave 4)
 *
 * `authoredSections` is computed — the section authoring engines
 * (Wave 3) run synchronously from the input bag.
 */

export const sectionsInput: Signal<SectionsInput> = signal({
    icps: [],
    closedWon: [],
    closedLost: [],
    openDeals: [],
    touches: [],
    cues: [],
    coldCalls: [],
    callPlanner: [],
    autopsies: [],
    proofs: [],
    advisorDeployments: [],
    quota: null
});

/**
 * Computed authored sections. Wave 1 returns an empty placeholder for
 * each id; Wave 3 wires the real authoring engines.
 */
export const authoredSections: ReadonlySignal<ReadonlyArray<AuthoredSection>> =
    computed(() => {
        // Wave 1 placeholder — Wave 3 replaces with the real
        // section authoring engines.
        return [];
    });

/** Share-link composer overlay (Wave 4 wires send action). */
export const shareComposerOpen: Signal<boolean> = signal(false);

/** Ceremony moment overlay state (Wave 4 wires the trigger + dismiss). */
export const ceremonyOpen: Signal<boolean> = signal(false);

export function setSectionsInput(next: SectionsInput): void {
    sectionsInput.value = next;
}

export function openShareComposer(): void {
    shareComposerOpen.value = true;
}

export function closeShareComposer(): void {
    shareComposerOpen.value = false;
}

export function openCeremony(): void {
    ceremonyOpen.value = true;
}

export function closeCeremony(): void {
    ceremonyOpen.value = false;
}

/** Test-only — reset signals between cases. */
export function __resetForTests(): void {
    sectionsInput.value = {
        icps: [],
        closedWon: [],
        closedLost: [],
        openDeals: [],
        touches: [],
        cues: [],
        coldCalls: [],
        callPlanner: [],
        autopsies: [],
        proofs: [],
        advisorDeployments: [],
        quota: null
    };
    shareComposerOpen.value = false;
    ceremonyOpen.value = false;
}
