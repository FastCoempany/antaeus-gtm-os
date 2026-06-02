/**
 * Briefing room state (B.2c-2 + B.3b + B.4c).
 *
 * The room reads synthesized Patterns from Supabase and renders them
 * (B.2c-2), reads the operator's armed Watch List triggers + the
 * fires they produced this week (B.3b), and reads the periphery
 * candidates the detector produced this run (B.4c). main.tsx calls
 * bootPatterns(), bootTriggers(), and bootPeriphery() after first
 * paint; the components read the signals.
 */

import { signal } from "@preact/signals";
import { type BriefingPattern, loadContrarianPatterns, loadStandardPatterns } from "./lib/patterns";
import {
    type AuditEnvelope,
    loadAuditEnvelope
} from "./lib/audit-envelope-client";
import {
    type BriefingLeadSummary,
    loadLatestBriefingLead
} from "./lib/compose-client";
import { type CostSummary } from "./lib/cost/tracker";
import { loadCostSummary } from "./lib/cost-client";
import {
    type ArmedTrigger,
    type TriggerFire,
    armTrigger,
    disableTrigger,
    loadArmedTriggers,
    loadRecentFires
} from "./lib/watchlist-client";
import type { TriggerParseResult } from "./lib/triggers/types";
import {
    type PeripheryCandidate,
    addPeripheryToWatchlist,
    dismissPeripheryCandidate,
    loadActivePeripheryCandidates,
    snoozePeripheryCandidate
} from "./lib/periphery-client";
import {
    type PatternMark,
    clearPatternMark,
    loadMyPatternMarks,
    setPatternMark
} from "./lib/marks-client";

export const patterns = signal<ReadonlyArray<BriefingPattern>>([]);
export const patternsLoaded = signal(false);

export const armedTriggers = signal<ReadonlyArray<ArmedTrigger>>([]);
export const recentFires = signal<ReadonlyArray<TriggerFire>>([]);
export const triggersLoaded = signal(false);

export const peripheryCandidates = signal<ReadonlyArray<PeripheryCandidate>>([]);
export const peripheryLoaded = signal(false);

export const contrarianPatterns = signal<ReadonlyArray<BriefingPattern>>([]);
export const contrarianLoaded = signal(false);

export const briefingLead = signal<BriefingLeadSummary | null>(null);
export const briefingLeadLoaded = signal(false);

export const costSummary = signal<CostSummary | null>(null);
export const costSummaryLoaded = signal(false);

/**
 * Behavioral feedback marks (Used / Met / Noise) keyed by pattern id.
 * Loaded once on boot; mutated via setMarkForPattern / clearMarkForPattern
 * which optimistically update + then call the RPC. Missing pattern_id
 * in the map means unmarked.
 */
export const patternMarks = signal<ReadonlyMap<string, PatternMark>>(new Map());
export const patternMarksLoaded = signal(false);

export async function bootBriefingLead(): Promise<void> {
    briefingLead.value = await loadLatestBriefingLead();
    briefingLeadLoaded.value = true;
}

// ─── Phase F (ADR-017) — pending proposals ──────────────────────────

import {
    decideProposal as decideProposalApi,
    loadPendingProposals,
    markProposalViewed,
    type PendingProposal,
    type ProposalDecision
} from "./lib/suggestions";

export const pendingProposals = signal<ReadonlyArray<PendingProposal>>([]);
export const pendingProposalsLoaded = signal(false);
export const decisionBusyId = signal<string | null>(null);
export const decisionError = signal<string | null>(null);

export async function bootPendingProposals(): Promise<void> {
    pendingProposals.value = await loadPendingProposals();
    pendingProposalsLoaded.value = true;
}

/** Operator clicked Accept / Dismiss / Snooze on a proposal. Optimistic
 * removal from the pending list; on failure we re-fetch + surface the
 * error. */
export async function decidePendingProposal(
    id: string,
    decision: ProposalDecision
): Promise<void> {
    if (decisionBusyId.value !== null) return;
    decisionBusyId.value = id;
    decisionError.value = null;
    const previous = pendingProposals.value;
    pendingProposals.value = previous.filter((p) => p.id !== id);
    try {
        const result = await decideProposalApi(id, decision);
        if (!result.ok) {
            decisionError.value = result.error ?? "Could not save your choice.";
            // Re-fetch so the room state matches the server.
            pendingProposals.value = await loadPendingProposals();
        }
    } finally {
        decisionBusyId.value = null;
    }
}

/** Fire-and-forget: mark the proposal viewed on first render. */
export function markPendingProposalViewed(id: string): void {
    void markProposalViewed(id);
}

export async function bootPatternMarks(): Promise<void> {
    patternMarks.value = await loadMyPatternMarks();
    patternMarksLoaded.value = true;
}

function applyMarkLocal(patternId: string, mark: PatternMark | null): void {
    const next = new Map(patternMarks.value);
    if (mark === null) next.delete(patternId);
    else next.set(patternId, mark);
    patternMarks.value = next;
}

/**
 * Set the operator's mark on a Pattern. Optimistic: applies the new
 * mark locally first, then calls the RPC. On RPC failure, reverts to
 * the previous mark (or unmarked).
 */
export async function setMarkForPattern(
    patternId: string,
    mark: PatternMark
): Promise<boolean> {
    const previous = patternMarks.value.get(patternId) ?? null;
    applyMarkLocal(patternId, mark);
    const ok = await setPatternMark(patternId, mark);
    if (!ok) applyMarkLocal(patternId, previous);
    return ok;
}

/**
 * Remove the operator's mark on a Pattern. Same optimistic pattern
 * as setMarkForPattern.
 */
export async function clearMarkForPattern(patternId: string): Promise<boolean> {
    const previous = patternMarks.value.get(patternId) ?? null;
    if (previous === null) return true; // nothing to do
    applyMarkLocal(patternId, null);
    const ok = await clearPatternMark(patternId);
    if (!ok) applyMarkLocal(patternId, previous);
    return ok;
}

export async function bootCostSummary(): Promise<void> {
    costSummary.value = await loadCostSummary();
    costSummaryLoaded.value = true;
}

/**
 * Audit envelopes (B.6b). Lazy: an envelope only loads when the
 * operator clicks "Show the work" on a Pattern card. The two
 * signals together track per-pattern state — open/closed in
 * envelopeOpen, fetched data (or "loading"/"error") in envelopeCache.
 */
export type EnvelopeCacheEntry = AuditEnvelope | "loading" | "error" | "missing";

export const envelopeCache = signal<ReadonlyMap<string, EnvelopeCacheEntry>>(
    new Map()
);
export const envelopeOpen = signal<ReadonlySet<string>>(new Set());

function setCacheEntry(patternId: string, entry: EnvelopeCacheEntry): void {
    const next = new Map(envelopeCache.value);
    next.set(patternId, entry);
    envelopeCache.value = next;
}

function setOpen(patternId: string, open: boolean): void {
    const next = new Set(envelopeOpen.value);
    if (open) next.add(patternId);
    else next.delete(patternId);
    envelopeOpen.value = next;
}

/**
 * Toggle a Pattern's "show your work" panel. Opens trigger a lazy
 * load on first open; subsequent opens use the cached entry.
 */
export async function toggleEnvelope(patternId: string): Promise<void> {
    if (!patternId) return;
    const isOpen = envelopeOpen.value.has(patternId);
    if (isOpen) {
        setOpen(patternId, false);
        return;
    }
    setOpen(patternId, true);
    if (envelopeCache.value.has(patternId)) return; // already fetched (or fetching)
    setCacheEntry(patternId, "loading");
    const envelope = await loadAuditEnvelope(patternId);
    if (envelope === null) {
        // Distinguish "no envelope row" from "load errored" — we
        // can't easily tell from the client, so treat both as "missing"
        // for now. The panel renders an honest line either way.
        setCacheEntry(patternId, "missing");
    } else {
        setCacheEntry(patternId, envelope);
    }
}

export async function bootPatterns(): Promise<void> {
    patterns.value = await loadStandardPatterns();
    patternsLoaded.value = true;
}

export async function bootContrarian(): Promise<void> {
    contrarianPatterns.value = await loadContrarianPatterns();
    contrarianLoaded.value = true;
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

export async function bootPeriphery(): Promise<void> {
    peripheryCandidates.value = await loadActivePeripheryCandidates();
    peripheryLoaded.value = true;
}

/** Drop a candidate from the local signal — the server already updated its status. */
function removeCandidate(id: string): void {
    peripheryCandidates.value = peripheryCandidates.value.filter((c) => c.id !== id);
}

export async function promotePeripheryCandidate(
    candidate: PeripheryCandidate
): Promise<boolean> {
    const ok = await addPeripheryToWatchlist(candidate);
    if (ok) {
        removeCandidate(candidate.id);
        // Refresh the armed-triggers + entities readouts so the newly
        // watched entity shows up in the Watch List section.
        await refreshTriggers();
    }
    return ok;
}

export async function snoozePeripheryAction(id: string): Promise<boolean> {
    const ok = await snoozePeripheryCandidate(id);
    if (ok) removeCandidate(id);
    return ok;
}

export async function dismissPeripheryAction(id: string): Promise<boolean> {
    const ok = await dismissPeripheryCandidate(id);
    if (ok) removeCandidate(id);
    return ok;
}

/** Test seam — reset signals between cases. */
export function __resetBriefingStateForTests(): void {
    patterns.value = [];
    patternsLoaded.value = false;
    armedTriggers.value = [];
    recentFires.value = [];
    triggersLoaded.value = false;
    peripheryCandidates.value = [];
    peripheryLoaded.value = false;
    contrarianPatterns.value = [];
    contrarianLoaded.value = false;
    envelopeCache.value = new Map();
    envelopeOpen.value = new Set();
    briefingLead.value = null;
    briefingLeadLoaded.value = false;
    costSummary.value = null;
    costSummaryLoaded.value = false;
    patternMarks.value = new Map();
    patternMarksLoaded.value = false;
}
