import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import type { AuthoredSection, SectionsInput } from "./lib/types";
import { authorAllSections } from "./lib/sections";

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
 * Computed authored sections — Wave 3 wires the real authoring engines
 * (lib/sections.ts) over the live sectionsInput signal.
 */
export const authoredSections: ReadonlySignal<ReadonlyArray<AuthoredSection>> =
    computed(() => authorAllSections(sectionsInput.value));

/** Share-link composer overlay (Wave 4 wires send action). */
export const shareComposerOpen: Signal<boolean> = signal(false);

/** Ceremony moment overlay state — set by Wave 4's ceremony subscriber. */
export const ceremonyOpen: Signal<boolean> = signal(false);

/**
 * Optional snapshot the ceremony overlay reads. Wave 4 sets this via
 * the ceremony subscriber. Keeping it on its own signal so the
 * overlay re-renders cleanly when the trigger fires.
 */
export interface CeremonyEvent {
    readonly fromLabel: string;
    readonly toLabel: string;
    readonly sectionsBefore: number;
    readonly sectionsAfter: number;
}

export const ceremonyEvent: Signal<CeremonyEvent | null> = signal(null);

export function setCeremonyEvent(e: CeremonyEvent | null): void {
    ceremonyEvent.value = e;
}

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
    ceremonyEvent.value = null;
}
