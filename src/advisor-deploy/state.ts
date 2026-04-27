import {
    computed,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_ADVISOR_DRAFT,
    EMPTY_DESK_STATE,
    type Advisor,
    type AdvisorDeal,
    type AdvisorDraft,
    type Deployment,
    type DeskState
} from "./lib/types";

/**
 * Phase 4 / Room 10 — Advisor Deploy runtime state.
 *
 * Per canon §4.16 the room is a "private influence desk" pointed at one
 * deal × advisor × ask-moment at a time. Wave 1 establishes the shape;
 * subsequent waves wire the recommend/score/build helpers, persistence,
 * and the cross-room write-back into `gtmos_deal_workspaces`.
 */

// ─── Source of truth ────────────────────────────────────────────────────

export const advisors: Signal<ReadonlyArray<Advisor>> = signal([]);
export const deployments: Signal<ReadonlyArray<Deployment>> = signal([]);
export const dealOptions: Signal<ReadonlyArray<AdvisorDeal>> = signal([]);

/** Live desk routing state — what deal × advisor × ask-moment is active. */
export const desk: Signal<DeskState> = signal(EMPTY_DESK_STATE);

/** Form draft for the Save advisor panel. */
export const advisorDraft: Signal<AdvisorDraft> = signal(EMPTY_ADVISOR_DRAFT);

export const loaded: Signal<boolean> = signal(false);

// ─── Derived projections ────────────────────────────────────────────────

/** Active deals (excludes closed-won + closed-lost). */
export const activeDeals: ReadonlySignal<ReadonlyArray<AdvisorDeal>> =
    computed(() => {
        return dealOptions.value.filter(
            (d) => d.stage !== "closed-won" && d.stage !== "closed-lost"
        );
    });

/** Selected deal record, or null. */
export const selectedDeal: ReadonlySignal<AdvisorDeal | null> = computed(
    () => {
        const id = desk.value.dealId;
        if (!id) return null;
        return dealOptions.value.find((d) => d.id === id) ?? null;
    }
);

/** Selected advisor record, or null. */
export const selectedAdvisor: ReadonlySignal<Advisor | null> = computed(
    () => {
        const id = desk.value.advisorId;
        if (!id) return null;
        return advisors.value.find((a) => a.id === id) ?? null;
    }
);

/** Most-recent deployments (newest first). */
export const recentDeployments: ReadonlySignal<ReadonlyArray<Deployment>> =
    computed(() => {
        return deployments.value
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
            );
    });

// ─── Actions ────────────────────────────────────────────────────────────

export function setAdvisors(next: ReadonlyArray<Advisor>): void {
    advisors.value = next;
}

export function appendAdvisor(advisor: Advisor): void {
    advisors.value = [...advisors.value, advisor];
}

export function removeAdvisor(id: string): void {
    advisors.value = advisors.value.filter((a) => a.id !== id);
    if (desk.value.advisorId === id) {
        desk.value = { ...desk.value, advisorId: "" };
    }
}

export function setDeployments(next: ReadonlyArray<Deployment>): void {
    deployments.value = next;
}

export function prependDeployment(dep: Deployment): void {
    deployments.value = [dep, ...deployments.value];
}

export function setDealOptions(next: ReadonlyArray<AdvisorDeal>): void {
    dealOptions.value = next;
}

export function patchDesk(part: Partial<DeskState>): void {
    desk.value = { ...desk.value, ...part } as DeskState;
}

export function setDealId(id: string): void {
    patchDesk({ dealId: id });
}

export function setAdvisorId(id: string): void {
    patchDesk({ advisorId: id });
}

export function setMomentId(id: DeskState["momentId"]): void {
    patchDesk({ momentId: id });
}

export function setCustomAsk(ask: string): void {
    patchDesk({ customAsk: ask });
}

export function patchAdvisorDraft(part: Partial<AdvisorDraft>): void {
    advisorDraft.value = { ...advisorDraft.value, ...part } as AdvisorDraft;
}

export function resetAdvisorDraft(): void {
    advisorDraft.value = EMPTY_ADVISOR_DRAFT;
}

export function resetDesk(): void {
    desk.value = EMPTY_DESK_STATE;
}

export function resetSession(): void {
    advisors.value = [];
    deployments.value = [];
    dealOptions.value = [];
    desk.value = EMPTY_DESK_STATE;
    advisorDraft.value = EMPTY_ADVISOR_DRAFT;
    loaded.value = false;
}

// Test seed helpers ─────────────────────────────────────────────────────

export function __setAdvisorsForTests(next: ReadonlyArray<Advisor>): void {
    advisors.value = next;
}

export function __setDeploymentsForTests(
    next: ReadonlyArray<Deployment>
): void {
    deployments.value = next;
}

export function __setDealOptionsForTests(
    next: ReadonlyArray<AdvisorDeal>
): void {
    dealOptions.value = next;
}
