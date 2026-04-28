/**
 * Phase 4 / Room 16 — Welcome types.
 *
 * Per canon §4.1 (Threshold family) the room moves the user from
 * setup into the first real operating move. Primitives: counts of
 * core nouns, milestone ladder, ranked next-action list.
 */

export interface WorkspaceCounts {
    readonly icps: number;
    readonly deals: number;
    readonly accounts: number;
    readonly signals: number;
    readonly touches: number;
    readonly calls: number;
}

export const EMPTY_COUNTS: WorkspaceCounts = {
    icps: 0,
    deals: 0,
    accounts: 0,
    signals: 0,
    touches: 0,
    calls: 0
};

export interface Milestone {
    readonly key: string;
    readonly label: string;
    readonly copy: string;
    readonly done: boolean;
}

export interface NextAction {
    readonly key: string;
    readonly title: string;
    readonly body: string;
    readonly href: string;
    readonly cta: string;
    readonly state: "now" | "next" | "ready";
    readonly meta: ReadonlyArray<string>;
    readonly why: string;
    readonly unlocks: string;
}

export interface ActivationContext {
    readonly companyName: string | null;
    readonly role: string | null;
    readonly categoryLabel: string | null;
}

export const EMPTY_ACTIVATION: ActivationContext = {
    companyName: null,
    role: null,
    categoryLabel: null
};
