import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";
import {
    EMPTY_RACK,
    type AccountOption,
    type Angle,
    type OperatorRack,
    type Persona,
    type Temperature,
    type Touch,
    type TouchOutcome,
    type TriggerKey
} from "./lib/types";

/**
 * Phase 4 / Room 6 — Outbound Studio runtime state.
 *
 * Per canon §4.8 the room routes one live outbound line. The operator
 * rack carries the inputs (account / contact / persona / temperature /
 * trigger / no-ask). Touches + angles persist as separate histories.
 *
 * Wave 4 will wire persistence (read/write `gtmos_outbound_touches` +
 * `gtmos_angles`). Wave 1 keeps state in-memory.
 */

// ─── Source of truth ────────────────────────────────────────────────────

export const rack: Signal<OperatorRack> = signal(EMPTY_RACK);

export const allTouches: Signal<ReadonlyArray<Touch>> = signal([]);

export const allAngles: Signal<ReadonlyArray<Angle>> = signal([]);

/** Accounts loaded from Signal Console for the dropdown. */
export const accountOptions: Signal<ReadonlyArray<AccountOption>> = signal([]);

export const loaded: Signal<boolean> = signal(false);

// ─── Derived projections ────────────────────────────────────────────────

/** Touches for the current rack's account (drives the per-account log). */
export const touchesForRack: ReadonlySignal<ReadonlyArray<Touch>> = computed(
    () => {
        const account = rack.value.accountName.trim().toLowerCase();
        if (!account) return [];
        return allTouches.value.filter(
            (t) => t.account.toLowerCase() === account
        );
    }
);

/** Whether the rack has the minimum to generate (account + contact). */
export const canGenerate: ReadonlySignal<boolean> = computed(() => {
    const r = rack.value;
    return r.accountName.trim().length > 0 && r.contactName.trim().length > 0;
});

// ─── Actions ────────────────────────────────────────────────────────────

export function patchRack(part: Partial<OperatorRack>): void {
    rack.value = { ...rack.value, ...part } as OperatorRack;
}

export function setAccount(name: string): void {
    patchRack({ accountName: name });
}

export function setContact(name: string): void {
    patchRack({ contactName: name });
}

export function setPersona(persona: Persona): void {
    patchRack({ persona });
}

export function setTemperature(temperature: Temperature): void {
    patchRack({ temperature });
}

export function setTrigger(trigger: TriggerKey): void {
    patchRack({ trigger });
}

export function setNextQuestion(q: string): void {
    patchRack({ nextQuestion: q });
}

export function toggleNoAsk(): void {
    patchRack({ noAsk: !rack.value.noAsk });
}

export function setAllTouches(touches: ReadonlyArray<Touch>): void {
    allTouches.value = touches;
}

export function setAllAngles(angles: ReadonlyArray<Angle>): void {
    allAngles.value = angles;
}

export function setAccountOptions(options: ReadonlyArray<AccountOption>): void {
    accountOptions.value = options;
}

export function appendTouch(touch: Touch): void {
    allTouches.value = [touch, ...allTouches.value];
}

export function appendAngle(angle: Angle): void {
    allAngles.value = [angle, ...allAngles.value];
}

/** Update the outcome on an existing touch (drives Signal Console temp). */
export function setTouchOutcome(id: string, outcome: TouchOutcome | null): void {
    const next = allTouches.value.map((t) =>
        t.id === id
            ? {
                  ...t,
                  outcome,
                  outcomeDate: outcome ? new Date().toISOString() : null
              }
            : t
    );
    allTouches.value = next;
}

export function resetRack(): void {
    rack.value = EMPTY_RACK;
}

export function resetSession(): void {
    rack.value = EMPTY_RACK;
    allTouches.value = [];
    allAngles.value = [];
    accountOptions.value = [];
    loaded.value = false;
}

/** Test-only — seed the touch / angle / option lists. */
export function __setAllTouchesForTests(touches: ReadonlyArray<Touch>): void {
    allTouches.value = touches;
}

export function __setAllAnglesForTests(angles: ReadonlyArray<Angle>): void {
    allAngles.value = angles;
}

export function __setAccountOptionsForTests(
    options: ReadonlyArray<AccountOption>
): void {
    accountOptions.value = options;
}
