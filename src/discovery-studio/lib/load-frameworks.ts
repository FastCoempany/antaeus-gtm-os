import {
    FRAMEWORK_IDS,
    frameworkRegistry,
    type Branch,
    type BranchTone,
    type DossierItem,
    type DossierTopic,
    type Framework,
    type FrameworkId,
    type InboundHandler,
    type Interrupt,
    type ObjectionEntry,
    type Segment,
    type SegmentNode,
    type SkipAheadHandler
} from "../state";

/**
 * Wave 2 framework loader.
 *
 * The 9 legacy framework runtime files (js/discovery-segment-runtime.js
 * + 9 framework-specific runtimes) attach data to a global
 * `window.DISCOVERY_SEGMENT_RUNTIME` object. This module reads that
 * global, validates the shape, and projects it into typed Framework
 * objects suitable for the frameworkRegistry signal.
 *
 * The legacy runtime is loaded as side-effect <script> tags from the
 * Discovery Studio index.html (see Wave 2 changes there). After every
 * script has executed, calling loadFrameworks() walks the global and
 * returns the typed registry.
 *
 * No data duplication: legacy files remain the source of truth. When
 * the legacy framework data is updated (rare in steady state, but
 * possible), the new room picks it up on next deploy.
 *
 * Wave 4 will add a Supabase-side path that overlays per-workspace
 * customization on top of the static catalog. Wave 2 handles only the
 * static-catalog projection.
 */

// ─── The global shape we expect, conservatively typed ───────────────────

interface LegacyGlobal {
    readonly DISCOVERY_SEGMENT_RUNTIME?: {
        readonly version?: string;
        readonly schemaVersion?: string;
        readonly registry?: ReadonlyArray<{
            readonly id: string;
            readonly label?: string;
            readonly storageKey?: string;
        }>;
        readonly frameworks?: Readonly<Record<string, LegacyFramework>>;
    };
}

interface LegacyFramework {
    readonly id?: string;
    readonly label?: string;
    readonly short?: string;
    readonly storageKey?: string;
    readonly segments?: ReadonlyArray<LegacySegment>;
    readonly supportDossier?: ReadonlyArray<LegacyDossierTopic>;
    readonly objectionLibrary?: ReadonlyArray<{
        readonly trigger?: string;
        readonly reply?: string;
    }>;
    readonly inboundQuestionHandlers?: ReadonlyArray<{
        readonly question?: string;
        readonly bridge?: string;
    }>;
    readonly skipAheadHandlers?: ReadonlyArray<{
        readonly trigger?: string;
        readonly reply?: string;
    }>;
    readonly interrupts?: ReadonlyArray<LegacyInterrupt>;
}

interface LegacySegment {
    readonly key?: string;
    readonly num?: number;
    readonly title?: string;
    readonly cue?: string;
    readonly essential?: boolean;
    readonly nodes?: ReadonlyArray<LegacyNode>;
}

interface LegacyNode {
    readonly id?: string;
    readonly essential?: boolean;
    readonly tone?: string;
    readonly badge?: string;
    readonly text?: string;
    readonly note?: string;
    readonly branches?: ReadonlyArray<LegacyBranch>;
}

interface LegacyBranch {
    readonly tag?: string;
    readonly cls?: string;
    readonly quote?: string;
    readonly move?: string;
    readonly actions?: ReadonlyArray<{
        readonly label?: string;
        readonly target?: string;
        readonly tone?: string;
    }>;
    readonly clear?: string;
    readonly missing?: string;
}

interface LegacyDossierTopic {
    readonly title?: string;
    readonly items?: ReadonlyArray<unknown>;
}

interface LegacyInterrupt {
    readonly id?: string;
    readonly label?: string;
    readonly tone?: string;
    // The authored runtime data names the recover guidance `reply`
    // (both the base seed + every framework-specific override). `recover`
    // is kept as a defensive fallback for any future data shape.
    readonly reply?: string;
    readonly recover?: string;
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Read window.DISCOVERY_SEGMENT_RUNTIME and return a typed registry.
 * Returns an empty array if the global is missing or malformed (the
 * loader is defensive — a malformed legacy file should result in an
 * empty room, not a thrown exception).
 */
export function loadFrameworks(globalRef?: unknown): ReadonlyArray<Framework> {
    const win =
        globalRef ??
        (typeof window === "undefined" ? undefined : (window as unknown));
    if (!win || typeof win !== "object") return [];

    const runtime = (win as LegacyGlobal).DISCOVERY_SEGMENT_RUNTIME;
    if (!runtime || !runtime.frameworks) return [];

    const result: Framework[] = [];
    for (const id of FRAMEWORK_IDS) {
        const legacy = runtime.frameworks[id];
        if (!legacy) continue;
        const projected = projectFramework(id, legacy);
        if (projected) result.push(projected);
    }
    return result;
}

/**
 * Side-effect helper: load + push into the registry signal in one call.
 * Returns the count loaded for caller convenience (e.g., the boot script
 * logs "loaded N frameworks").
 */
export function loadFrameworksIntoRegistry(globalRef?: unknown): number {
    const fws = loadFrameworks(globalRef);
    frameworkRegistry.value = fws;
    return fws.length;
}

// ─── Projection ─────────────────────────────────────────────────────────

function projectFramework(
    id: FrameworkId,
    legacy: LegacyFramework
): Framework | null {
    const segments = (legacy.segments ?? [])
        .map(projectSegment)
        .filter((s): s is Segment => s !== null);

    return {
        id,
        label: stringOr(legacy.label, id),
        short: optionalString(legacy.short),
        storageKey: optionalString(legacy.storageKey),
        segments,
        supportDossier: (legacy.supportDossier ?? [])
            .map(projectDossierTopic)
            .filter((t): t is DossierTopic => t !== null),
        objectionLibrary: (legacy.objectionLibrary ?? [])
            .map((o): ObjectionEntry => ({
                trigger: stringOr(o.trigger, ""),
                reply: stringOr(o.reply, "")
            }))
            .filter((o) => o.trigger.length > 0),
        inboundQuestionHandlers: (legacy.inboundQuestionHandlers ?? [])
            .map((i): InboundHandler => ({
                question: stringOr(i.question, ""),
                bridge: stringOr(i.bridge, "")
            }))
            .filter((i) => i.question.length > 0),
        skipAheadHandlers: (legacy.skipAheadHandlers ?? [])
            .map((s): SkipAheadHandler => ({
                trigger: stringOr(s.trigger, ""),
                reply: stringOr(s.reply, "")
            }))
            .filter((s) => s.trigger.length > 0),
        interrupts: (legacy.interrupts ?? [])
            .map(projectInterrupt)
            .filter((i): i is Interrupt => i !== null)
    };
}

function projectSegment(legacy: LegacySegment): Segment | null {
    const key = optionalString(legacy.key);
    if (!key) return null;
    return {
        key,
        num: typeof legacy.num === "number" ? legacy.num : 0,
        title: stringOr(legacy.title, key),
        cue: stringOr(legacy.cue, ""),
        essential: legacy.essential === true,
        nodes: (legacy.nodes ?? [])
            .map(projectNode)
            .filter((n): n is SegmentNode => n !== null)
    };
}

function projectNode(legacy: LegacyNode): SegmentNode | null {
    const id = optionalString(legacy.id);
    if (!id) return null;
    return {
        id,
        essential: legacy.essential === true,
        tone: toBranchTone(legacy.tone) ?? "blu",
        badge: stringOr(legacy.badge, ""),
        text: stringOr(legacy.text, ""),
        note: optionalString(legacy.note),
        branches: (legacy.branches ?? [])
            .map(projectBranch)
            .filter((b): b is Branch => b !== null)
    };
}

function projectBranch(legacy: LegacyBranch): Branch | null {
    if (!legacy.quote && !legacy.move) return null;
    return {
        tag: stringOr(legacy.tag, ""),
        cls: toBranchTone(legacy.cls) ?? "blu",
        quote: stringOr(legacy.quote, ""),
        move: stringOr(legacy.move, ""),
        actions: (legacy.actions ?? [])
            .map((a) => ({
                label: stringOr(a.label, ""),
                target: stringOr(a.target, ""),
                tone: toBranchTone(a.tone)
            }))
            .filter((a) => a.label.length > 0 && a.target.length > 0),
        clear: optionalString(legacy.clear),
        missing: optionalString(legacy.missing)
    };
}

function projectDossierTopic(legacy: LegacyDossierTopic): DossierTopic | null {
    const title = optionalString(legacy.title);
    if (!title) return null;
    const items: DossierItem[] = [];
    for (const item of legacy.items ?? []) {
        if (typeof item === "string") {
            items.push(item);
        } else if (
            item &&
            typeof item === "object" &&
            "heading" in item &&
            "body" in item
        ) {
            const obj = item as { heading: unknown; body: unknown };
            items.push({
                heading: typeof obj.heading === "string" ? obj.heading : "",
                body: typeof obj.body === "string" ? obj.body : ""
            });
        }
    }
    return { title, items };
}

function projectInterrupt(legacy: LegacyInterrupt): Interrupt | null {
    const id = optionalString(legacy.id);
    const label = optionalString(legacy.label);
    if (!id || !label) return null;
    return {
        id,
        label,
        tone: toBranchTone(legacy.tone) ?? "blu",
        // The authored field is `reply`; `recover` is the defensive
        // fallback. Reading only `recover` (the old behaviour) dropped
        // every interrupt's recover guidance across all 9 frameworks —
        // the recover rail (a §4.12 on-call control law) rendered blank.
        recover: stringOr(legacy.reply ?? legacy.recover, "")
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function stringOr(v: unknown, fallback: string): string {
    return typeof v === "string" ? v : fallback;
}

function optionalString(v: unknown): string | undefined {
    return typeof v === "string" && v.length > 0 ? v : undefined;
}

const TONE_VALUES: ReadonlySet<BranchTone> = new Set([
    "grn",
    "org",
    "red",
    "blu",
    "pur"
]);

function toBranchTone(v: unknown): BranchTone | undefined {
    if (typeof v !== "string") return undefined;
    return TONE_VALUES.has(v as BranchTone) ? (v as BranchTone) : undefined;
}
