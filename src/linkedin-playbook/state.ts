import {
    computed,
    effect,
    signal,
    type ReadonlySignal,
    type Signal
} from "@preact/signals";
import {
    EMPTY_DRAFT,
    EMPTY_STATS,
    type ActionEntry,
    type ActionType,
    type BestIcp,
    type ChannelStats,
    type CueIndex,
    type Draft,
    type HottestAccount,
    type LatestTouch,
    type Outcome
} from "./lib/types";
import { findCue, resolveCueIndex } from "./lib/cues";
import { deriveMotion } from "./lib/motion";
import { saveActions } from "./lib/persistence";

/**
 * Phase 4 / Room 8 — LinkedIn Playbook runtime state.
 *
 * Per canon §4.10 the room runs a 5-cue ladder against a live cross-room
 * context (best ICP / hottest signal account / latest outbound touch).
 * Wave 1 establishes the shape; subsequent waves wire the motion engine,
 * cue booth UI, persistence, and cross-room handoff.
 */

// ─── Source of truth ────────────────────────────────────────────────────

/** Persistent action log (mirrored to `gtmos_linkedin_log` in Wave 4). */
export const actions: Signal<ReadonlyArray<ActionEntry>> = signal([]);

/**
 * Active cue index. `null` means "let the motion engine pick" — Wave 2
 * computes the default from the inbound context. The operator can pin a
 * specific cue by clicking a row in the cue strip; that sets a number
 * here and pins the booth until they click another or reset.
 */
export const activeCueIndex: Signal<CueIndex | null> = signal(null);

/** Cue ledger draft — what the rep is about to log. */
export const draft: Signal<Draft> = signal(EMPTY_DRAFT);

/** Inbound context — seeded at boot from cross-room localStorage keys. */
export const bestIcp: Signal<BestIcp | null> = signal(null);
export const hottestAccount: Signal<HottestAccount | null> = signal(null);
export const latestTouch: Signal<LatestTouch | null> = signal(null);

export const loaded: Signal<boolean> = signal(false);

// ─── Derived projections ────────────────────────────────────────────────

/** Channel stats aggregated from the action log. */
export const stats: ReadonlySignal<ChannelStats> = computed(() => {
    const list = actions.value;
    if (list.length === 0) return EMPTY_STATS;
    let connections = 0;
    let accepted = 0;
    let dms = 0;
    let replies = 0;
    const byAccount: Record<
        string,
        { content_engage: number; connection_request: number; dm: number }
    > = {};
    for (const a of list) {
        if (a.actionType === "connection_request") {
            connections += 1;
            if (a.outcome === "accepted") accepted += 1;
        } else if (a.actionType === "dm") {
            dms += 1;
            if (a.outcome === "replied") replies += 1;
        }
        const key = a.accountName.trim().toLowerCase();
        if (!key) continue;
        if (!byAccount[key]) {
            byAccount[key] = {
                content_engage: 0,
                connection_request: 0,
                dm: 0
            };
        }
        if (
            a.actionType === "content_engage" ||
            a.actionType === "connection_request" ||
            a.actionType === "dm"
        ) {
            byAccount[key]![a.actionType] += 1;
        }
    }
    const acceptRate =
        connections > 0 ? Math.round((accepted / connections) * 100) : 0;
    const replyRate = dms > 0 ? Math.round((replies / dms) * 100) : 0;
    return {
        total: list.length,
        connections,
        accepted,
        dms,
        replies,
        acceptRate,
        replyRate,
        byAccount
    };
});

// ─── Actions ────────────────────────────────────────────────────────────

export function setActions(next: ReadonlyArray<ActionEntry>): void {
    actions.value = next;
}

export function appendAction(entry: ActionEntry): void {
    actions.value = [...actions.value, entry];
}

export function setActiveCue(index: CueIndex | null): void {
    activeCueIndex.value = index;
}

export function patchDraft(part: Partial<Draft>): void {
    draft.value = { ...draft.value, ...part } as Draft;
}

export function setDraftActionType(t: ActionType): void {
    patchDraft({ actionType: t });
}

export function setBestIcp(next: BestIcp | null): void {
    bestIcp.value = next;
}

export function setHottestAccount(next: HottestAccount | null): void {
    hottestAccount.value = next;
}

export function setLatestTouch(next: LatestTouch | null): void {
    latestTouch.value = next;
}

export function resetDraft(): void {
    draft.value = EMPTY_DRAFT;
}

/**
 * Log a cue from the current draft + active context. Freezes the
 * motion + active cue into the entry so the activity board can show
 * "what cue did I take" months later. Returns the new entry, or null
 * when the form has neither account nor contact (legacy guard at
 * line 115).
 */
export function logCue(now: number = Date.now()): ActionEntry | null {
    const d = draft.value;
    const account = d.accountName.trim();
    const contact = d.contactName.trim();
    if (!account && !contact) return null;

    const ctx = {
        icp: bestIcp.value,
        hottestAccount: hottestAccount.value,
        latestTouch: latestTouch.value,
        stats: stats.value
    };
    const motion = deriveMotion(ctx);
    const cueIdx = resolveCueIndex(activeCueIndex.value, motion.cueIndex);
    const cue = findCue(cueIdx);

    const entry: ActionEntry = {
        id: `li_${now}_${Math.random().toString(36).slice(2, 8)}`,
        accountName: account,
        contactName: contact,
        actionType: d.actionType,
        temperature: "ice_cold",
        content: "",
        motionKey: motion.key,
        motionLabel: motion.label,
        cueLabel: cue.name,
        whyNow: motion.whyNow,
        recommendedNext: motion.nextMove,
        outcome: null,
        outcomeDate: null,
        createdAt: new Date(now).toISOString()
    };
    appendAction(entry);
    // Reset the form fields (account + contact) — keep the actionType
    // selection so the operator can log a quick chain of similar cues.
    draft.value = { ...EMPTY_DRAFT, actionType: d.actionType };
    return entry;
}

/**
 * Update the outcome on a logged action. Mirrors legacy `updateLiOutcome`
 * (line 117). null clears outcome + outcomeDate; a valid Outcome stamps
 * the current ISO timestamp. Returns the updated entry, or null when no
 * row matches.
 */
export function updateOutcome(
    id: string,
    outcome: Outcome | null,
    now: number = Date.now()
): ActionEntry | null {
    let updated: ActionEntry | null = null;
    actions.value = actions.value.map((a) => {
        if (a.id !== id) return a;
        const next: ActionEntry = {
            ...a,
            outcome,
            outcomeDate: outcome ? new Date(now).toISOString() : null
        };
        updated = next;
        return next;
    });
    return updated;
}

let actionsPersistStop: (() => void) | null = null;

/**
 * Wire the side-effect that mirrors actions writes to localStorage.
 * Skip first run to avoid a redundant boot-time write — same pattern as
 * Phase 4 / Rooms 3-7.
 */
export function startActionsPersistence(): () => void {
    if (actionsPersistStop) return actionsPersistStop;
    let firstRun = true;
    const dispose = effect(() => {
        const next = actions.value;
        if (firstRun) {
            firstRun = false;
            return;
        }
        saveActions(next);
    });
    actionsPersistStop = () => {
        dispose();
        actionsPersistStop = null;
    };
    return actionsPersistStop;
}

export function resetSession(): void {
    actions.value = [];
    activeCueIndex.value = null;
    draft.value = EMPTY_DRAFT;
    bestIcp.value = null;
    hottestAccount.value = null;
    latestTouch.value = null;
    loaded.value = false;
}

/** Test-only seed helpers. */
export function __setActionsForTests(
    next: ReadonlyArray<ActionEntry>
): void {
    actions.value = next;
}

export function __setHottestAccountForTests(
    next: HottestAccount | null
): void {
    hottestAccount.value = next;
}

export function __setLatestTouchForTests(next: LatestTouch | null): void {
    latestTouch.value = next;
}

export function __setBestIcpForTests(next: BestIcp | null): void {
    bestIcp.value = next;
}
