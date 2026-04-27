import { computed, effect, signal, type ReadonlySignal, type Signal } from "@preact/signals";
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
import { generateSendLine, type GenerateOutput } from "./lib/generator";
import { saveAngles, saveTouches } from "./lib/persistence";

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

/**
 * Live generator output — recomputed whenever the rack or the source
 * accounts list changes. Wave 4 reads this in the OutputPanel + uses
 * it on save / log actions.
 */
export const currentSendLine: ReadonlySignal<GenerateOutput> = computed(() => {
    const r = rack.value;
    const account = accountOptions.value.find(
        (a) => a.name.toLowerCase() === r.accountName.trim().toLowerCase()
    );
    return generateSendLine({
        rack: r,
        ...(account ? { signalHeadline: account.name } : {})
    });
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

/**
 * Log a touch from the current rack — freezes the generator output,
 * appends to allTouches (which Phase 4 / Rooms 3 + 4 read for
 * execution-context temperature), persists to localStorage on the
 * next effect tick.
 */
export function logTouchFromRack(now: number = Date.now()): Touch | null {
    if (!canGenerate.value) return null;
    const r = rack.value;
    const out = currentSendLine.value;
    const touch: Touch = {
        id: `touch_${now}_${Math.random().toString(36).slice(2, 8)}`,
        account: r.accountName.trim().toLowerCase(),
        accountName: r.accountName.trim(),
        contactName: r.contactName.trim(),
        contactTitle: "",
        persona: r.persona,
        temperature: r.temperature,
        channel: out.channel,
        trigger: r.trigger,
        ctaType: out.ctaKey,
        assetUsed: out.asset,
        content: out.content,
        outcome: null,
        outcomeDate: null,
        dealId: null,
        qualityScore: out.qualityScore,
        motionBand: out.motionBand,
        createdAt: new Date(now).toISOString()
    };
    appendTouch(touch);
    return touch;
}

/**
 * Save the current rack as an Angle (saved value proposition for
 * later reuse). Dedupes on company + trigger + persona by replacing
 * existing matching entry.
 */
export function saveAngleFromRack(now: number = Date.now()): Angle | null {
    if (!canGenerate.value) return null;
    const r = rack.value;
    const out = currentSendLine.value;
    const angle: Angle = {
        id: `angle_${now}_${Math.random().toString(36).slice(2, 8)}`,
        company: r.accountName.trim(),
        trigger: r.trigger,
        persona: r.persona,
        email: out.content,
        temperature: r.temperature,
        channel: out.channel,
        ctaType: out.ctaKey,
        assetUsed: out.asset,
        qualityScore: out.qualityScore,
        motionBand: out.motionBand,
        nextMove: "",
        savedAt: new Date(now).toISOString()
    };
    appendAngle(angle);
    return angle;
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

let touchPersistStop: (() => void) | null = null;
let anglePersistStop: (() => void) | null = null;

/**
 * Wire the side-effects that mirror touches + angles to localStorage.
 * Skip first run to avoid redundant boot-time write — same pattern as
 * Phase 4 / Rooms 3-5.
 */
export function startTouchPersistence(): () => void {
    if (touchPersistStop) return touchPersistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const t = allTouches.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveTouches(t);
    });
    touchPersistStop = () => {
        dispose();
        touchPersistStop = null;
    };
    return touchPersistStop;
}

export function startAnglePersistence(): () => void {
    if (anglePersistStop) return anglePersistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const a = allAngles.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveAngles(a);
    });
    anglePersistStop = () => {
        dispose();
        anglePersistStop = null;
    };
    return anglePersistStop;
}
