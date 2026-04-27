import {
    computed,
    effect,
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
    type DeploymentOutcome,
    type DeskState
} from "./lib/types";
import { findMoment } from "./lib/moments";
import { buildAsk } from "./lib/ask-builder";
import { saveAdvisors, saveDeployments, uid } from "./lib/persistence";
import { syncDeploymentToDeal } from "./lib/sync-back";

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
    // PR #26 Codex P1 fix: clear customAsk when the active deal
    // changes. buildAsk prefers customAsk over the generated line
    // when present; without this clear, an edited ask for Deal A
    // would persist into Deal B and logDeployment would freeze it
    // with the wrong account name. Only clear when the id actually
    // changes — same-id no-ops keep the operator's edits.
    if (desk.value.dealId !== id) {
        patchDesk({ dealId: id, customAsk: "" });
    } else {
        patchDesk({ dealId: id });
    }
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

// ─── High-level actions ────────────────────────────────────────────────

/**
 * Save the current advisor draft as a new Advisor. Returns null when
 * the name is blank (legacy line 530 guard) — the caller should toast.
 * Otherwise appends, points the desk at the new advisor, and resets
 * the draft. Persistence side-effect mirrors via startAdvisorPersistence.
 */
export function saveAdvisorFromDraft(
    now: number = Date.now()
): Advisor | null {
    const d = advisorDraft.value;
    const name = d.name.trim();
    if (!name) return null;
    const advisor: Advisor = {
        id: uid("adv", now),
        name,
        title: d.title.trim(),
        tier: d.tier,
        expertise: d.expertise.trim(),
        equity: "",
        companies: d.companies
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        notes: d.notes.trim(),
        relationship: "active",
        createdAt: new Date(now).toISOString()
    };
    appendAdvisor(advisor);
    desk.value = { ...desk.value, advisorId: advisor.id };
    advisorDraft.value = EMPTY_ADVISOR_DRAFT;
    return advisor;
}

/**
 * Log a deployment with the given outcome. Freezes the live ctx
 * (deal × advisor × moment + buildAsk output) into a Deployment.
 * Returns null when no deal or no advisor is selected. Mirrors
 * legacy `logDeployment(outcome)` (lines 459-476).
 */
export function logDeployment(
    outcome: DeploymentOutcome,
    now: number = Date.now()
): Deployment | null {
    const deal = selectedDeal.value;
    const advisor = selectedAdvisor.value;
    if (!deal) return null;
    if (!advisor) return null;
    const moment = findMoment(desk.value.momentId);
    const generated = buildAsk({
        deal,
        advisor,
        moment,
        customAsk: desk.value.customAsk
    });
    const dep: Deployment = {
        id: uid("dep", now),
        dealId: deal.id,
        dealName: deal.accountName,
        dealStage: deal.stage,
        advisorId: advisor.id,
        advisorName: advisor.name,
        momentId: moment.id,
        momentName: moment.name,
        ask: generated.ask,
        forwardableNote: generated.forward,
        outcome,
        notes:
            outcome === "pending"
                ? "Ask sent from Backchannel Desk."
                : outcome === "hold"
                  ? "Held before spending advisor trust."
                  : outcome === "reroute"
                    ? "Rerouted before sending."
                    : "",
        createdAt: new Date(now).toISOString(),
        outcomeDate:
            outcome === "pending" ? null : new Date(now).toISOString()
    };
    prependDeployment(dep);
    // Wave 5 — mirror the deployment's effect onto the matching deal in
    // gtmos_deal_workspaces (advisorHistory + nextStep + nextStepDate).
    // Failure is silent — the deployment was already logged.
    syncDeploymentToDeal(dep, now);
    return dep;
}

/**
 * Update the outcome on an existing deployment. Mirrors legacy
 * `updateDeploymentOutcome`. Returns the updated deployment, or null
 * when no row matches.
 */
export function updateDeploymentOutcome(
    id: string,
    outcome: DeploymentOutcome,
    now: number = Date.now()
): Deployment | null {
    let updated: Deployment | null = null;
    deployments.value = deployments.value.map((d) => {
        if (d.id !== id) return d;
        const next: Deployment = {
            ...d,
            outcome,
            outcomeDate: new Date(now).toISOString()
        };
        updated = next;
        return next;
    });
    // Wave 5 — mirror the updated outcome back to the deal so its
    // advisorHistory entry + nextStep stay coherent with the latest state.
    if (updated) syncDeploymentToDeal(updated, now);
    return updated;
}

// ─── Persistence side-effects ──────────────────────────────────────────

let advisorPersistStop: (() => void) | null = null;
let deploymentPersistStop: (() => void) | null = null;

/**
 * Mirror advisors writes to localStorage. Skip first run to avoid
 * redundant boot-time write — same pattern as Phase 4 / Rooms 3-9.
 */
export function startAdvisorPersistence(): () => void {
    if (advisorPersistStop) return advisorPersistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const next = advisors.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveAdvisors(next);
    });
    advisorPersistStop = () => {
        dispose();
        advisorPersistStop = null;
    };
    return advisorPersistStop;
}

export function startDeploymentPersistence(): () => void {
    if (deploymentPersistStop) return deploymentPersistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const next = deployments.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveDeployments(next);
    });
    deploymentPersistStop = () => {
        dispose();
        deploymentPersistStop = null;
    };
    return deploymentPersistStop;
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
