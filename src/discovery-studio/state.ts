import { signal, computed, type Signal, type ReadonlySignal } from "@preact/signals";

/**
 * Discovery Studio state model — refactored Wave 2 to match the legacy
 * runtime data shape exactly. The legacy framework files (js/discovery-
 * segment-runtime-*.js) are the source of truth for field structure,
 * since they carry months of authoring decisions per framework.
 *
 * The 21 canonical primitives from CLAUDE.md Part I §4.12 are still
 * present — they're conceptual primitives, not field-name locks.
 *
 * Each primitive is a Preact signal. Components subscribe only to what
 * they read. State mutations happen through the action helpers below
 * (so the call site is greppable + audit-friendly).
 *
 * Persistence stays out of this file — Wave 4 wires up the data-client.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 3
 */

// ─── Static / structural shapes — match legacy runtime exactly ──────────

/**
 * The nine frameworks locked by canon §4.12. Order matches the legacy
 * registry rendering order.
 */
export const FRAMEWORK_IDS = [
    "legal",
    "recruiting",
    "product-ux",
    "govtech",
    "customer-support",
    "sales-revenue",
    "manufacturing",
    "data-intelligence",
    "ai-native"
] as const;

export type FrameworkId = (typeof FRAMEWORK_IDS)[number];

/**
 * Branch tone class — visual treatment for a branch.
 * Legacy `cls` field; mapped to color tokens in CSS.
 */
export type BranchTone = "grn" | "org" | "red" | "blu" | "pur";

/**
 * Action — a clickable target that may sit on a branch's `actions`
 * array. Targets follow the legacy convention: "node:<segment>--<slug>"
 * or "room:<roomId>".
 */
export interface Action {
    readonly label: string;
    readonly target: string;
    readonly tone?: BranchTone;
}

/**
 * Branch — one buyer-might-say + the recommended response. Legacy field
 * names preserved verbatim.
 *   tag   — short label / category
 *   cls   — tone class (color)
 *   quote — what the buyer might say
 *   move  — your next move / what to say
 *   actions — clickable jump targets (optional)
 *   clear   — what truth this branch confirms (optional)
 *   missing — what's still unanswered (optional)
 */
export interface Branch {
    readonly tag: string;
    readonly cls: BranchTone;
    readonly quote: string;
    readonly move: string;
    readonly actions?: ReadonlyArray<Action>;
    readonly clear?: string;
    readonly missing?: string;
}

/**
 * SegmentNode — one talking-point inside a segment. Legacy field names.
 *   id        — globally unique within the framework
 *   essential — true if shown in compression mode
 *   tone      — color treatment for the node card
 *   badge     — short label rendered next to the node
 *   text      — the talking-point itself
 *   note      — optional caveat / coaching note
 */
export interface SegmentNode {
    readonly id: string;
    readonly essential: boolean;
    readonly tone: BranchTone;
    readonly badge: string;
    readonly text: string;
    readonly note?: string;
    readonly branches: ReadonlyArray<Branch>;
}

/**
 * Segment — one stop on the 10-stop spine. Legacy field names.
 *   key       — segment identifier ("opening-frame", "current-state-truth", etc.)
 *   num       — 1-based ordinal
 *   title     — display title
 *   cue       — short coaching cue under the title
 *   essential — true if shown in compression mode
 *   nodes     — talking-points in order
 */
export interface Segment {
    readonly key: string;
    readonly num: number;
    readonly title: string;
    readonly cue: string;
    readonly essential: boolean;
    readonly nodes: ReadonlyArray<SegmentNode>;
}

/**
 * DossierTopic.items can be either strings (terse) or {heading, body}
 * objects (richer). The renderer handles both.
 */
export type DossierItem = string | { readonly heading: string; readonly body: string };

export interface DossierTopic {
    readonly title: string;
    readonly items: ReadonlyArray<DossierItem>;
}

export interface ObjectionEntry {
    readonly trigger: string;
    readonly reply: string;
}

export interface InboundHandler {
    readonly question: string;
    readonly bridge: string;
}

export interface SkipAheadHandler {
    readonly trigger: string;
    readonly reply: string;
}

export interface Interrupt {
    readonly id: string;
    readonly label: string;
    readonly tone: BranchTone;
    readonly recover: string;
}

export interface Framework {
    readonly id: FrameworkId;
    readonly label: string;
    readonly short?: string;
    readonly storageKey?: string;
    readonly segments: ReadonlyArray<Segment>;
    readonly supportDossier: ReadonlyArray<DossierTopic>;
    readonly objectionLibrary: ReadonlyArray<ObjectionEntry>;
    readonly inboundQuestionHandlers: ReadonlyArray<InboundHandler>;
    readonly skipAheadHandlers: ReadonlyArray<SkipAheadHandler>;
    readonly interrupts: ReadonlyArray<Interrupt>;
}

// ─── Runtime / per-session shapes ───────────────────────────────────────

export interface LearnedFact {
    readonly nodeId: string;
    readonly branchIndex: number;
    readonly fact: string;
    readonly recordedAt: string;
}

export interface NextStepLock {
    readonly date: string;
    readonly owner: string;
    readonly attendees: string;
    readonly purpose: string;
    readonly reason: string;
}

export type CompressionMode = "off" | "essentials" | "emergency";

export type CallDisposition =
    | "in-progress"
    | "advanced"
    | "stalled"
    | "lost"
    | "won"
    | "no-show";

export interface PhaseTempoMark {
    readonly segmentKey: string;
    readonly minutesAllotted: number;
}

export interface SignalLedgerEntry {
    readonly nodeId: string;
    readonly branchIndex: number;
    readonly tone: BranchTone;
    readonly recordedAt: string;
}

export interface TiebackLedgerEntry {
    readonly nodeId: string;
    readonly branchIndex: number;
    readonly fact: string;
    readonly status: "hold" | "deployed";
    readonly recordedAt: string;
}

export interface PostCallPackage {
    readonly disposition: CallDisposition;
    readonly nextStep: NextStepLock | null;
    readonly facts: ReadonlyArray<LearnedFact>;
    readonly stakeholders: ReadonlyArray<string>;
    readonly competitors: ReadonlyArray<string>;
    readonly proofGapNotes: string;
    readonly preparedAt: string;
}

// ─── Signals — the 21 primitives ────────────────────────────────────────

/**
 * 1. frameworkRegistry — the static catalog of all 9 frameworks. Loaded
 *    once at boot from the legacy runtime via lib/load-frameworks.ts.
 */
export const frameworkRegistry: Signal<ReadonlyArray<Framework>> = signal([]);

/** 2. activeFramework — currently chosen framework. */
export const activeFramework: Signal<FrameworkId | null> = signal(null);

/** 3. callClock — wall-clock since call start. Null = no live call. */
export const callClock: Signal<{ startedAt: number } | null> = signal(null);

/** 4. phaseTempoPlan — recommended minutes per segment. */
export const phaseTempoPlan: Signal<ReadonlyArray<PhaseTempoMark>> = signal([]);

/** 5. activeNode — { segmentKey, nodeId } currently open. Null = none. */
export const activeNode: Signal<{
    segmentKey: string;
    nodeId: string;
} | null> = signal(null);

/** 6. activeTrack — call disposition being favored. */
export const activeTrack: Signal<CallDisposition> = signal("in-progress");

/**
 * 7. essentialNodeSet — node IDs visible in compression mode. Computed
 *    from activeFramework. (Compression filtering itself is in components.)
 */
export const essentialNodeSet: ReadonlySignal<ReadonlyArray<string>> = computed(
    () => {
        const fid = activeFramework.value;
        if (!fid) return [];
        const fw = frameworkRegistry.value.find((f) => f.id === fid);
        if (!fw) return [];
        const ids: string[] = [];
        for (const seg of fw.segments) {
            for (const node of seg.nodes) {
                if (node.essential) ids.push(node.id);
            }
        }
        return ids;
    }
);

/** 8. skipAheadHandlers — current framework's projection. */
export const skipAheadHandlers: ReadonlySignal<
    ReadonlyArray<SkipAheadHandler>
> = computed(() => {
    const fid = activeFramework.value;
    if (!fid) return [];
    return (
        frameworkRegistry.value.find((f) => f.id === fid)?.skipAheadHandlers ??
        []
    );
});

/**
 * 9. responseSet — branches available on the active node.
 */
export const responseSet: ReadonlySignal<ReadonlyArray<Branch>> = computed(
    () => {
        const fid = activeFramework.value;
        const node = activeNode.value;
        if (!fid || !node) return [];
        const fw = frameworkRegistry.value.find((f) => f.id === fid);
        if (!fw) return [];
        const seg = fw.segments.find((s) => s.key === node.segmentKey);
        if (!seg) return [];
        return seg.nodes.find((nn) => nn.id === node.nodeId)?.branches ?? [];
    }
);

/** 10. expandedResponse — index of the expanded branch on the active node. */
export const expandedResponse: Signal<number | null> = signal(null);

/** 11. learnedFacts — facts the buyer revealed during the call. */
export const learnedFacts: Signal<ReadonlyArray<LearnedFact>> = signal([]);

/** 12. signalLedger — buyer-side branch-toggle log for tone-over-time. */
export const signalLedger: Signal<ReadonlyArray<SignalLedgerEntry>> = signal(
    []
);

/** 13. tiebackLedger — facts on hold vs. deployed back into conversation. */
export const tiebackLedger: Signal<ReadonlyArray<TiebackLedgerEntry>> = signal(
    []
);

/** 14. supportDossier — current framework's reference panels. */
export const supportDossier: ReadonlySignal<ReadonlyArray<DossierTopic>> =
    computed(() => {
        const fid = activeFramework.value;
        if (!fid) return [];
        return (
            frameworkRegistry.value.find((f) => f.id === fid)?.supportDossier ??
            []
        );
    });

/** 15. objectionLibrary — current framework's objection-handler entries. */
export const objectionLibrary: ReadonlySignal<ReadonlyArray<ObjectionEntry>> =
    computed(() => {
        const fid = activeFramework.value;
        if (!fid) return [];
        return (
            frameworkRegistry.value.find((f) => f.id === fid)
                ?.objectionLibrary ?? []
        );
    });

/** 16. inboundQuestionHandlers — current framework's bridges. */
export const inboundQuestionHandlers: ReadonlySignal<
    ReadonlyArray<InboundHandler>
> = computed(() => {
    const fid = activeFramework.value;
    if (!fid) return [];
    return (
        frameworkRegistry.value.find((f) => f.id === fid)
            ?.inboundQuestionHandlers ?? []
    );
});

/** 17. compressionMode — off | essentials | emergency. */
export const compressionMode: Signal<CompressionMode> = signal("off");

/** 18. nextStepLock — five fields needed before clean handoff. */
export const nextStepLock: Signal<NextStepLock> = signal({
    date: "",
    owner: "",
    attendees: "",
    purpose: "",
    reason: ""
});

/** 19. callDisposition — final outcome at post-call routing. */
export const callDisposition: Signal<CallDisposition> = signal("in-progress");

/** 20. postCallPackage — full structured handoff record. */
export const postCallPackage: Signal<PostCallPackage | null> = signal(null);

/** 21. handoffPayload — targeted projection for the next room. */
export const handoffPayload: Signal<{
    targetRoom: string;
    payload: Record<string, unknown>;
} | null> = signal(null);

// ─── Wave 3 interaction state ───────────────────────────────────────────

/**
 * activeInterrupt — Wave 3. The recover-the-call interrupt the user is
 * currently displaying (clicked from RecoverRail). When set, the
 * DiscoveryStudio shell renders the interrupt's recover copy in a
 * prominent banner. Null = no interrupt active.
 *
 * Not one of the canonical 21 primitives (interrupts themselves live on
 * the framework's `interrupts` array — a static catalog). This signal is
 * just the "currently surfaced" projection, similar to expandedResponse
 * for branches.
 */
export const activeInterrupt: Signal<Interrupt | null> = signal(null);

/**
 * workedNodeIds — Wave 3. Distinct node IDs the user has interacted
 * with this session, derived from signalLedger. Drives the WorkedMemory
 * rail's count + list.
 */
export const workedNodeIds: ReadonlySignal<ReadonlyArray<string>> = computed(
    () => {
        const seen = new Set<string>();
        for (const entry of signalLedger.value) {
            seen.add(entry.nodeId);
        }
        return Array.from(seen);
    }
);

// ─── Action helpers ─────────────────────────────────────────────────────

export function selectFramework(id: FrameworkId): void {
    activeFramework.value = id;
    activeNode.value = null;
    expandedResponse.value = null;
}

export function setActiveNode(segmentKey: string, nodeId: string): void {
    activeNode.value = { segmentKey, nodeId };
    expandedResponse.value = null;
}

export function expandResponse(branchIndex: number): void {
    expandedResponse.value = branchIndex;
}

export function collapseResponse(): void {
    expandedResponse.value = null;
}

export function recordLearnedFact(
    nodeId: string,
    branchIndex: number,
    fact: string
): void {
    learnedFacts.value = [
        ...learnedFacts.value,
        { nodeId, branchIndex, fact, recordedAt: new Date().toISOString() }
    ];
}

/**
 * Append a SignalLedgerEntry. Tone-over-time log driven by branch
 * interactions during the call. Wave 3 adds this; Wave 5+ may compute
 * call-tone summaries from it for post-call routing.
 */
export function recordSignal(
    nodeId: string,
    branchIndex: number,
    tone: BranchTone
): void {
    signalLedger.value = [
        ...signalLedger.value,
        { nodeId, branchIndex, tone, recordedAt: new Date().toISOString() }
    ];
}

/**
 * Convenience wrapper called by SegmentRail's BranchPicker on click.
 * Records both the signal-ledger entry (always) and the learned fact
 * (only when the branch carries a `clear` value — branches without one
 * are buyer-tone signals without confirmable truth yet).
 *
 * Idempotency: if the same (nodeId, branchIndex) was already recorded,
 * skip — toggling a branch open/closed shouldn't multiply the trace.
 */
export function recordBranchInteraction(
    nodeId: string,
    branchIndex: number,
    branch: Branch
): void {
    const alreadyRecorded = signalLedger.value.some(
        (e) => e.nodeId === nodeId && e.branchIndex === branchIndex
    );
    if (alreadyRecorded) return;
    recordSignal(nodeId, branchIndex, branch.cls);
    if (branch.clear && branch.clear.length > 0) {
        recordLearnedFact(nodeId, branchIndex, branch.clear);
    }
}

export function triggerInterrupt(it: Interrupt): void {
    activeInterrupt.value = it;
}

export function clearInterrupt(): void {
    activeInterrupt.value = null;
}

// ─── Wave 5 — tieback hold / deploy ────────────────────────────────────

/**
 * Mark a learned fact as "held" — it's been recorded but not yet
 * deployed back into the conversation. Adds an entry to tiebackLedger
 * if not already present, with status "hold".
 *
 * Idempotent: re-holding the same (nodeId, branchIndex) is a no-op
 * and preserves any existing "deployed" status (don't downgrade).
 */
export function holdFact(nodeId: string, branchIndex: number): void {
    const existing = tiebackLedger.value.find(
        (e) => e.nodeId === nodeId && e.branchIndex === branchIndex
    );
    if (existing) return;

    const fact = learnedFacts.value.find(
        (f) => f.nodeId === nodeId && f.branchIndex === branchIndex
    );
    if (!fact) return;

    tiebackLedger.value = [
        ...tiebackLedger.value,
        {
            nodeId,
            branchIndex,
            fact: fact.fact,
            status: "hold",
            recordedAt: new Date().toISOString()
        }
    ];
}

/**
 * Mark a held fact as deployed — the user has used it in the call.
 * If the entry doesn't exist yet (user goes straight from learned to
 * deployed without the hold step), it's created in deployed state.
 */
export function deployFact(nodeId: string, branchIndex: number): void {
    const existing = tiebackLedger.value.find(
        (e) => e.nodeId === nodeId && e.branchIndex === branchIndex
    );
    if (existing) {
        if (existing.status === "deployed") return;
        tiebackLedger.value = tiebackLedger.value.map((e) =>
            e.nodeId === nodeId && e.branchIndex === branchIndex
                ? { ...e, status: "deployed" as const }
                : e
        );
        return;
    }

    const fact = learnedFacts.value.find(
        (f) => f.nodeId === nodeId && f.branchIndex === branchIndex
    );
    if (!fact) return;

    tiebackLedger.value = [
        ...tiebackLedger.value,
        {
            nodeId,
            branchIndex,
            fact: fact.fact,
            status: "deployed",
            recordedAt: new Date().toISOString()
        }
    ];
}

/**
 * Returns the tieback status for a (nodeId, branchIndex) pair:
 *   - "deployed" if it's been used back in the conversation
 *   - "hold"     if it's queued for tieback but not yet used
 *   - null       if the fact has been recorded but not held/deployed
 */
export function factStatusFor(
    nodeId: string,
    branchIndex: number
): "hold" | "deployed" | null {
    const entry = tiebackLedger.value.find(
        (e) => e.nodeId === nodeId && e.branchIndex === branchIndex
    );
    return entry?.status ?? null;
}

/**
 * Find the segment key that owns the given node ID, in the active
 * framework. Returns null if the framework isn't loaded or the node
 * doesn't belong to it. Used by LearnedTruthLedger click-to-jump.
 */
export function getSegmentKeyForNode(nodeId: string): string | null {
    const fid = activeFramework.value;
    if (!fid) return null;
    const fw = frameworkRegistry.value.find((f) => f.id === fid);
    if (!fw) return null;
    for (const seg of fw.segments) {
        if (seg.nodes.some((n) => n.id === nodeId)) {
            return seg.key;
        }
    }
    return null;
}

export function setNextStepField<K extends keyof NextStepLock>(
    field: K,
    value: NextStepLock[K]
): void {
    nextStepLock.value = { ...nextStepLock.value, [field]: value };
}

export function setCompressionMode(mode: CompressionMode): void {
    compressionMode.value = mode;
}

export function startCallClock(): void {
    callClock.value = { startedAt: Date.now() };
}

export function stopCallClock(): void {
    callClock.value = null;
}

export function resetSession(): void {
    activeFramework.value = null;
    callClock.value = null;
    phaseTempoPlan.value = [];
    activeNode.value = null;
    activeTrack.value = "in-progress";
    expandedResponse.value = null;
    learnedFacts.value = [];
    signalLedger.value = [];
    tiebackLedger.value = [];
    compressionMode.value = "off";
    nextStepLock.value = {
        date: "",
        owner: "",
        attendees: "",
        purpose: "",
        reason: ""
    };
    callDisposition.value = "in-progress";
    postCallPackage.value = null;
    handoffPayload.value = null;
    activeInterrupt.value = null;
}

export function __setFrameworkRegistryForTests(
    fixtures: ReadonlyArray<Framework>
): void {
    frameworkRegistry.value = fixtures;
}
