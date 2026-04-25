import { signal, computed, type Signal, type ReadonlySignal } from "@preact/signals";

/**
 * Discovery Studio state model — Phase 3 Wave 1.
 *
 * The canonical 21 primitives from CLAUDE.md Part I §4.12 + the runtime
 * primitives wiring sheet at deliverables/design-principle-strict-bible/
 * 08-room-guardian-specs/runtime-primitives-wiring-sheet-2026-04-10.md.
 *
 * Each primitive is a Preact signal. Components subscribe only to what
 * they read. State mutations happen through small action helpers below
 * (preferred over direct .value = ... mutation in components, so the
 * mutation site is greppable + audit-friendly).
 *
 * Persistence is intentionally NOT in this file — Wave 4 wires up
 * data.discoveryFrameworks reads/writes through the typed data-client.
 *
 * Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Phase 3
 */

// ─── Static / structural shapes ─────────────────────────────────────────

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
 * The 10-segment fixed spine. Same for every framework. Canon §4.12.
 */
export const SEGMENT_IDS = [
    "opening-frame",
    "current-state-truth",
    "pain-and-consequence",
    "trigger-and-urgency",
    "stakeholder-and-ownership",
    "proof-threshold",
    "current-vendor-and-displacement",
    "decision-architecture",
    "next-step-lock",
    "post-call-routing"
] as const;

export type SegmentId = (typeof SEGMENT_IDS)[number];

/**
 * Branch tone — the visual treatment that distinguishes a "buyer might
 * say this and it's good" from "buyer might say this and it's a risk."
 * Mapped to color tokens in CSS.
 */
export type BranchTone = "grn" | "org" | "red" | "blu" | "pur";

export interface Branch {
    readonly id: string;
    readonly tone: BranchTone;
    readonly label: string;
    readonly quote: string;
    readonly sayNext: string;
    readonly facts: ReadonlyArray<{ title: string; copy: string }>;
    readonly recover: ReadonlyArray<{ title: string; copy: string }>;
    readonly leave: ReadonlyArray<{ title: string; copy: string }>;
}

export interface SegmentNode {
    readonly id: string;
    readonly label: string;
    readonly essential: boolean;
    readonly branches: ReadonlyArray<Branch>;
}

export interface Segment {
    readonly id: SegmentId;
    readonly label: string;
    readonly nodes: ReadonlyArray<SegmentNode>;
}

export interface Framework {
    readonly id: FrameworkId;
    readonly label: string;
    readonly category: string;
    readonly segments: ReadonlyArray<Segment>;
    readonly supportDossier: ReadonlyArray<DossierTopic>;
    readonly objectionLibrary: ReadonlyArray<ObjectionEntry>;
    readonly inboundQuestionHandlers: ReadonlyArray<InboundHandler>;
    readonly skipAheadHandlers: ReadonlyArray<SkipAheadHandler>;
    readonly interrupts: ReadonlyArray<Interrupt>;
}

export interface DossierTopic {
    readonly title: string;
    readonly items: ReadonlyArray<{ heading: string; body: string }>;
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
    readonly segmentId: SegmentId;
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
 *    once at boot. Read-only after load. Wave 1 leaves this empty; Wave 2
 *    populates it from the legacy framework runtime modules.
 */
export const frameworkRegistry: Signal<ReadonlyArray<Framework>> = signal([]);

/**
 * 2. activeFramework — the framework currently in use for this call.
 *    Switching frameworks is intentional + commits to a specific buyer
 *    type; not casual.
 */
export const activeFramework: Signal<FrameworkId | null> = signal(null);

/**
 * 3. callClock — wall-clock seconds since the call started. Drives the
 *    visible call timer + the phase-tempo guidance. Null = no live call.
 */
export const callClock: Signal<{ startedAt: number } | null> = signal(null);

/**
 * 4. phaseTempoPlan — recommended minute allocation per segment, derived
 *    from the active framework + call duration target. Wave 5 wires the
 *    UI; Wave 1 just reserves the signal.
 */
export const phaseTempoPlan: Signal<ReadonlyArray<PhaseTempoMark>> = signal([]);

/**
 * 5. activeNode — { segmentId, nodeId } the user is currently working
 *    inside. One open node at a time. Null = no open node yet.
 */
export const activeNode: Signal<{
    segmentId: SegmentId;
    nodeId: string;
} | null> = signal(null);

/**
 * 6. activeTrack — which disposition track the call is currently
 *    favoring. Updates as the call progresses.
 */
export const activeTrack: Signal<CallDisposition> = signal("in-progress");

/**
 * 7. essentialNodeSet — the filtered subset of nodes visible in
 *    compression mode. Computed from activeFramework + compressionMode.
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

/**
 * 8. skipAheadHandlers — current framework's skip-ahead handlers. Computed
 *    from activeFramework. (The static catalog lives on the framework;
 *    this is the live-display projection.)
 */
export const skipAheadHandlers: ReadonlySignal<
    ReadonlyArray<SkipAheadHandler>
> = computed(() => {
    const fid = activeFramework.value;
    if (!fid) return [];
    const fw = frameworkRegistry.value.find((f) => f.id === fid);
    return fw?.skipAheadHandlers ?? [];
});

/**
 * 9. responseSet — the full set of branches available on the active node.
 *    Computed from activeFramework + activeNode.
 */
export const responseSet: ReadonlySignal<ReadonlyArray<Branch>> = computed(
    () => {
        const fid = activeFramework.value;
        const node = activeNode.value;
        if (!fid || !node) return [];
        const fw = frameworkRegistry.value.find((f) => f.id === fid);
        if (!fw) return [];
        const seg = fw.segments.find((s) => s.id === node.segmentId);
        if (!seg) return [];
        const n = seg.nodes.find((nn) => nn.id === node.nodeId);
        return n?.branches ?? [];
    }
);

/**
 * 10. expandedResponse — which branch on the active node is currently
 *     expanded (showing facts/recover/leave). Index into responseSet.
 *     Null = nothing expanded yet.
 */
export const expandedResponse: Signal<number | null> = signal(null);

/**
 * 11. learnedFacts — running list of facts the buyer revealed during the
 *     call. Each fact is keyed to the node + branch that surfaced it,
 *     so the post-call package knows where each piece of truth came from.
 */
export const learnedFacts: Signal<ReadonlyArray<LearnedFact>> = signal([]);

/**
 * 12. signalLedger — running list of buyer-side signals (every branch
 *     toggle leaves a trace) so post-call analysis can read tone-over-time.
 */
export const signalLedger: Signal<ReadonlyArray<SignalLedgerEntry>> = signal(
    []
);

/**
 * 13. tiebackLedger — facts the user has noted but not yet deployed back
 *     into the conversation. Hold/deploy distinction so the user can see
 *     what they could still tie back to vs. what they've already used.
 */
export const tiebackLedger: Signal<ReadonlyArray<TiebackLedgerEntry>> = signal(
    []
);

/**
 * 14. supportDossier — current framework's reference panels. Surface for
 *     proof + decision anchors that don't belong in the segment rail.
 */
export const supportDossier: ReadonlySignal<ReadonlyArray<DossierTopic>> =
    computed(() => {
        const fid = activeFramework.value;
        if (!fid) return [];
        return (
            frameworkRegistry.value.find((f) => f.id === fid)?.supportDossier ??
            []
        );
    });

/**
 * 15. objectionLibrary — current framework's objection-handler entries.
 */
export const objectionLibrary: ReadonlySignal<ReadonlyArray<ObjectionEntry>> =
    computed(() => {
        const fid = activeFramework.value;
        if (!fid) return [];
        return (
            frameworkRegistry.value.find((f) => f.id === fid)
                ?.objectionLibrary ?? []
        );
    });

/**
 * 16. inboundQuestionHandlers — current framework's bridges for buyer
 *     questions that try to derail the agenda (pricing, timeline, etc.).
 */
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

/**
 * 17. compressionMode — whether the room is showing all nodes (off),
 *     just essentials (essentials), or only the current node (emergency).
 */
export const compressionMode: Signal<CompressionMode> = signal("off");

/**
 * 18. nextStepLock — the five required fields the user must fill before
 *     the call can hand off cleanly. Empty strings = unfilled.
 */
export const nextStepLock: Signal<NextStepLock> = signal({
    date: "",
    owner: "",
    attendees: "",
    purpose: "",
    reason: ""
});

/**
 * 19. callDisposition — the final outcome of the call. Locked at
 *     post-call routing.
 */
export const callDisposition: Signal<CallDisposition> = signal("in-progress");

/**
 * 20. postCallPackage — the structured handoff payload other rooms read.
 *     Computed from the runtime state at post-call-routing time.
 */
export const postCallPackage: Signal<PostCallPackage | null> = signal(null);

/**
 * 21. handoffPayload — what we hand to the next room (typically Deal
 *     Workspace or Future Autopsy). Distinct from postCallPackage in
 *     that it's the *targeted* projection rather than the full record.
 */
export const handoffPayload: Signal<{
    targetRoom: string;
    payload: Record<string, unknown>;
} | null> = signal(null);

// ─── Action helpers ─────────────────────────────────────────────────────
// Mutations go through these so the call site is greppable + auditable.
// Components should not write `.value =` directly except in trivial hooks.

export function selectFramework(id: FrameworkId): void {
    activeFramework.value = id;
    activeNode.value = null;
    expandedResponse.value = null;
}

export function setActiveNode(segmentId: SegmentId, nodeId: string): void {
    activeNode.value = { segmentId, nodeId };
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

/**
 * Reset the per-session signals back to defaults. Used when the user
 * picks up a different call (different framework, different deal) so
 * old state doesn't bleed through.
 *
 * frameworkRegistry stays — it's static catalog, not session state.
 */
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
}

/**
 * Test hook — replace the framework registry with a fixture. Production
 * code uses loadFrameworks() from lib/load-frameworks.ts (Wave 2).
 */
export function __setFrameworkRegistryForTests(
    fixtures: ReadonlyArray<Framework>
): void {
    frameworkRegistry.value = fixtures;
}
