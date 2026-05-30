import type {
    AdvisorDeploymentRecord,
    AutopsyRecord,
    AutopsySnapshotRecord,
    CallPlanRecord,
    ColdCallRecord,
    CueRecord,
    DealRecord,
    DiscoveryCallRecord,
    DiscoveryDisposition,
    DiscoveryStats,
    IcpRecord,
    ProofRecord,
    QuotaInputs,
    SectionsInput,
    TouchRecord
} from "./types";

const DISCOVERY_DISPOSITIONS: ReadonlySet<DiscoveryDisposition> = new Set<DiscoveryDisposition>([
    "advanced",
    "stalled",
    "lost",
    "won",
    "no-show"
]);

/**
 * Cross-room readers — turn cloud-mirrored localStorage into a typed
 * SectionsInput bag that the Wave 3 authoring engines consume.
 *
 * Reads:
 *   gtmos_icp_analytics       — ICPs (id/name/persona/trigger/qualityScore)
 *   gtmos_deal_workspaces     — deals (split into closedWon/closedLost/openDeals)
 *   gtmos_outbound_touches    — touches (channel + persona + outcome)
 *   gtmos_linkedin_log        — cues (cueIndex + actionType + outcome)
 *   gtmos_cold_call_log       — cold calls (outcome + account)
 *   gtmos_discovery_agenda    — call planner sessions
 *   gtmos_autopsy_log_v1      — autopsy task logs (per dealId)
 *   gtmos_poc_data            — proofs
 *   gtmos_advisor_deployments — advisor deployments (tier + moment + outcome)
 *   gtmos_qw_inputs           — quota math
 *
 * Pure: storage-injectable, defensive, never throws. Reused on every
 * input refresh (boot + storage event + visibilitychange).
 */

interface StorageLike {
    getItem(key: string): string | null;
}

function parseJson(raw: string | null): unknown {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asNumber(v: unknown, fallback = 0): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return fallback;
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asBool(v: unknown): boolean {
    return v === true;
}

function maybeArrayWithKey(
    obj: Record<string, unknown> | null,
    key: string
): ReadonlyArray<unknown> {
    if (!obj) return [];
    return asArray(obj[key]);
}

// ─── Per-source readers ────────────────────────────────────────────────

function readIcps(storage: StorageLike): ReadonlyArray<IcpRecord> {
    const root = asObject(parseJson(storage.getItem("gtmos_icp_analytics")));
    return maybeArrayWithKey(root, "icps")
        .map((raw): IcpRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            const id = asString(o.id);
            if (!id) return null;
            return {
                id,
                // ICP Studio persists `SavedIcp`, whose identity field is
                // `statement` (there is no `name`). Older/demo data used
                // `name`. Accept either so the ICP isn't nameless.
                name: asString(o.name) || asString(o.statement),
                // SavedIcp calls the persona `buyer`; legacy used `persona`.
                persona: asString(o.persona) || asString(o.buyer),
                trigger: asString(o.trigger),
                // SavedIcp has no per-ICP "worked" flag (only an aggregate
                // totalWorked on the analytics root). Unused by the section
                // authors today; kept best-effort for the bag's shape.
                worked: asBool(o.worked),
                qualityScore: asNumber(o.qualityScore)
            };
        })
        .filter((r): r is IcpRecord => r !== null);
}

function dealRecord(raw: unknown): DealRecord | null {
    const o = asObject(raw);
    if (!o) return null;
    const id = asString(o.id);
    if (!id) return null;
    return {
        id,
        accountName: asString(o.accountName ?? o.name),
        stage: asString(o.stage).toLowerCase(),
        value: asNumber(o.value),
        nextStep: asString(o.nextStep),
        icpLabel: asString(o.icpLabel ?? o.icp ?? o.segment),
        persona: asString(o.persona ?? o.buyerPersona),
        trigger: asString(o.trigger),
        lossReason: asString(o.lossReason),
        closeDate: asString(o.closeDate),
        createdAt: asString(o.createdAt ?? o.created_at)
    };
}

function readDeals(storage: StorageLike): {
    closedWon: ReadonlyArray<DealRecord>;
    closedLost: ReadonlyArray<DealRecord>;
    openDeals: ReadonlyArray<DealRecord>;
} {
    const arr = asArray(parseJson(storage.getItem("gtmos_deal_workspaces")));
    const closedWon: DealRecord[] = [];
    const closedLost: DealRecord[] = [];
    const openDeals: DealRecord[] = [];
    arr.forEach((raw) => {
        const r = dealRecord(raw);
        if (!r) return;
        if (r.stage === "closed-won") closedWon.push(r);
        else if (r.stage === "closed-lost") closedLost.push(r);
        else openDeals.push(r);
    });
    return { closedWon, closedLost, openDeals };
}

function readTouches(storage: StorageLike): ReadonlyArray<TouchRecord> {
    const root = asObject(parseJson(storage.getItem("gtmos_outbound_touches")));
    return maybeArrayWithKey(root, "touches")
        .map((raw): TouchRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            return {
                accountName: asString(o.accountName),
                persona: asString(o.persona),
                temperature: asString(o.temperature),
                trigger: asString(o.trigger),
                channel: asString(o.channel),
                outcome: asString(o.outcome),
                sendLine: asString(o.sendLine ?? o.line ?? ""),
                createdAtIso: asString(o.createdAtIso ?? o.createdAt)
            };
        })
        .filter((r): r is TouchRecord => r !== null);
}

function readCues(storage: StorageLike): ReadonlyArray<CueRecord> {
    const root = asObject(parseJson(storage.getItem("gtmos_linkedin_log")));
    return maybeArrayWithKey(root, "actions")
        .map((raw): CueRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            return {
                accountName: asString(o.accountName),
                cueIndex: asNumber(o.cueIndex),
                actionType: asString(o.actionType),
                outcome: asString(o.outcome),
                createdAtIso: asString(o.createdAtIso ?? o.createdAt)
            };
        })
        .filter((r): r is CueRecord => r !== null);
}

function readColdCalls(storage: StorageLike): ReadonlyArray<ColdCallRecord> {
    const root = asObject(parseJson(storage.getItem("gtmos_cold_call_log")));
    return maybeArrayWithKey(root, "calls")
        .map((raw): ColdCallRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            return {
                accountName: asString(o.accountName),
                outcome: asString(o.outcome),
                createdAtIso: asString(o.createdAtIso ?? o.createdAt)
            };
        })
        .filter((r): r is ColdCallRecord => r !== null);
}

function callPlanRecord(raw: unknown): CallPlanRecord | null {
    const o = asObject(raw);
    if (!o) return null;
    const segs = asArray(o.segmentsWorked).filter(
        (s): s is string => typeof s === "string"
    );
    // Call Planner's AgendaSnapshot names the account `company` and the
    // advance ask `nextMove`; legacy/demo data used `accountName` +
    // `nextStep`/`advanceAsk`. Accept either.
    const accountName = asString(o.accountName) || asString(o.company);
    if (!accountName) return null;
    return {
        accountName,
        persona: asString(o.persona),
        // NOTE: the AgendaSnapshot is a *plan*, not a completed-call log —
        // it carries no `outcome` and no `segmentsWorked`. Section 3's
        // "calls that earned an advance" detection therefore reads empty
        // from this source. Completed discovery outcomes live in Discovery
        // Studio (gtmos_discovery_stats / segment data); routing Section 3
        // at that source is a follow-up, not done here.
        outcome: asString(o.outcome),
        nextStep:
            asString(o.nextStep) ||
            asString(o.advanceAsk) ||
            asString(o.nextMove),
        createdAtIso:
            asString(o.createdAtIso) ||
            asString(o.createdAt) ||
            asString(o.preparedAt),
        segmentsWorked: segs
    };
}

function readCallPlanner(storage: StorageLike): ReadonlyArray<CallPlanRecord> {
    const parsed = parseJson(storage.getItem("gtmos_discovery_agenda"));
    // Call Planner persists a single AgendaSnapshot object (the latest
    // plan); legacy/demo data used a bare array of planned calls. Accept
    // either shape.
    const rows: ReadonlyArray<unknown> = Array.isArray(parsed)
        ? parsed
        : asObject(parsed)
          ? [parsed]
          : [];
    return rows
        .map(callPlanRecord)
        .filter((r): r is CallPlanRecord => r !== null);
}

function readAutopsies(storage: StorageLike): ReadonlyArray<AutopsyRecord> {
    const root = asObject(parseJson(storage.getItem("gtmos_autopsy_log_v1")));
    if (!root) return [];
    const out: AutopsyRecord[] = [];
    Object.entries(root).forEach(([dealId, raw]) => {
        const o = asObject(raw);
        // Legacy shape: dealId → { taskId: true, ... }
        // New shape: dealId → { account_name, verdict, kill_switch, tasks: [...] }
        if (!o) return;
        const tasksObj = asObject(o.tasks);
        const tasksArr = asArray(o.tasks);
        let tasks: AutopsyRecord["tasks"];
        if (tasksArr.length > 0) {
            // Assumed-rich shape: tasks as [{ id, text, checked }].
            tasks = tasksArr
                .map((t): AutopsyRecord["tasks"][number] | null => {
                    const tObj = asObject(t);
                    if (!tObj) return null;
                    return {
                        id: asString(tObj.id),
                        text: asString(tObj.text),
                        checked: asBool(tObj.checked)
                    };
                })
                .filter(
                    (t): t is AutopsyRecord["tasks"][number] => t !== null
                );
        } else {
            // Future Autopsy actually persists tasks as an object map
            // { taskId: { done: bool, doneAt? } }; the oldest legacy shape
            // was a bare { taskId: true } map. Accept either — a task
            // counts as checked when its value is `true` or `{ done: true }`.
            // NOTE: the task-log stores no task *text* (only completion
            // state), so `text` falls back to the id; verdict / kill-switch
            // / account_name aren't in the log either (the room regenerates
            // them at render time). Section 5's richer copy needs that
            // regeneration as a source — a follow-up, not done here.
            const map = tasksObj ?? o;
            tasks = Object.entries(map)
                .filter(([, v]) => v === true || asObject(v)?.done === true)
                .map(([id]) => ({ id, text: id, checked: true }));
        }
        const verdictRaw = asString(o.verdict);
        const verdict: AutopsyRecord["verdict"] =
            verdictRaw === "left_alone" || verdictRaw === "corrected"
                ? verdictRaw
                : "unknown";
        out.push({
            dealId,
            accountName: asString(o.account_name ?? o.accountName),
            verdict,
            killSwitchFired: asBool(o.kill_switch ?? o.killSwitchFired),
            tasks
        });
    });
    return out;
}

function readProofs(storage: StorageLike): ReadonlyArray<ProofRecord> {
    const parsed = parseJson(storage.getItem("gtmos_poc_data"));
    // PoC Framework persists `{ pocs: Proof[] }`; legacy/demo data used a
    // bare array. Accept either — reading the bare array off the real
    // `{ pocs: [...] }` object is what silently returned zero proofs before.
    const arr: ReadonlyArray<unknown> = Array.isArray(parsed)
        ? parsed
        : maybeArrayWithKey(asObject(parsed), "pocs");
    return arr
        .map((raw): ProofRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            const id = asString(o.id);
            if (!id) return null;
            const quality = asObject(o.quality);
            return {
                id,
                // Proof uses `account`; legacy used `accountName`.
                accountName:
                    asString(o.accountName) ||
                    asString(o.account) ||
                    asString(o.linkedDealName),
                // Proof uses `outcome`; the cloud column is `outcome_state`.
                outcome: asString(o.outcome) || asString(o.outcomeState),
                // Proof persists flat `qualityScore` / `qualityBand`; legacy
                // nested them under `quality{}`. Prefer the flat fields.
                score:
                    o.qualityScore !== undefined
                        ? asNumber(o.qualityScore)
                        : asNumber(quality?.score),
                band: asString(o.qualityBand) || asString(quality?.band)
            };
        })
        .filter((r): r is ProofRecord => r !== null);
}

function readAdvisorDeployments(
    storage: StorageLike
): ReadonlyArray<AdvisorDeploymentRecord> {
    const root = asObject(
        parseJson(storage.getItem("gtmos_advisor_deployments"))
    );
    return maybeArrayWithKey(root, "deployments")
        .map((raw): AdvisorDeploymentRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            const id = asString(o.id);
            if (!id) return null;
            return {
                id,
                // Deployment carries `dealName` (the account the deal is
                // against), not `accountName`. Section 4's advisor
                // coverage-gap surprise matches this against deal accounts,
                // so it must resolve — reading bare `accountName` left it
                // empty and broke the match. Legacy/demo used `accountName`.
                accountName: asString(o.accountName) || asString(o.dealName),
                // Per-row tier isn't on the Deployment (tier lives on the
                // advisor in gtmos_advisor_registry, keyed by advisorId).
                // Unused by the section authors today; left best-effort.
                tier: asString(o.tier),
                moment:
                    asString(o.momentId) ||
                    asString(o.moment) ||
                    asString(o.momentName),
                outcome: asString(o.outcome) || asString(o.outcomeStamp)
            };
        })
        .filter((r): r is AdvisorDeploymentRecord => r !== null);
}

function readAutopsySnapshots(
    storage: StorageLike
): ReadonlyArray<AutopsySnapshotRecord> {
    const root = asObject(
        parseJson(storage.getItem("gtmos_autopsy_snapshots"))
    );
    return maybeArrayWithKey(root, "snapshots")
        .map((raw): AutopsySnapshotRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            const dealId = asString(o.dealId);
            if (!dealId) return null;
            const verdict = asString(o.verdictMode);
            if (verdict !== "left" && verdict !== "corrected") return null;
            return {
                dealId,
                accountName: asString(o.accountName),
                verdictMode: verdict,
                killSwitch: asString(o.killSwitch),
                topCauseLabel:
                    typeof o.topCauseLabel === "string"
                        ? o.topCauseLabel
                        : null
            };
        })
        .filter((r): r is AutopsySnapshotRecord => r !== null);
}

function readDiscoveryCalls(
    storage: StorageLike
): ReadonlyArray<DiscoveryCallRecord> {
    const root = asObject(
        parseJson(storage.getItem("gtmos_discovery_call_log"))
    );
    return maybeArrayWithKey(root, "calls")
        .map((raw): DiscoveryCallRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            const id = asString(o.id);
            if (!id) return null;
            const disp = asString(o.disposition);
            if (!DISCOVERY_DISPOSITIONS.has(disp as DiscoveryDisposition)) {
                return null;
            }
            const fw = asString(o.activeFramework);
            const segs = asArray(o.segmentKeysWorked).filter(
                (s): s is string => typeof s === "string"
            );
            return {
                id,
                createdAtIso: asString(o.createdAtIso) || asString(o.createdAt),
                accountName: asString(o.accountName),
                activeFramework: fw ? fw : null,
                segmentKeysWorked: segs,
                disposition: disp as DiscoveryDisposition
            };
        })
        .filter((r): r is DiscoveryCallRecord => r !== null);
}

function readDiscoveryStats(storage: StorageLike): DiscoveryStats | null {
    const o = asObject(parseJson(storage.getItem("gtmos_discovery_stats")));
    if (!o) return null;
    const totalCalls = asNumber(o.totalCalls);
    if (totalCalls <= 0) return null;
    return {
        totalCalls,
        advancedCalls: asNumber(o.advancedCalls)
    };
}

function readDiscoveryWorked(storage: StorageLike): ReadonlyArray<string> {
    // Discovery Studio persists a flat { segmentNodeId: true } map of every
    // segment node worked across the room's lifetime. We surface the set of
    // worked node ids; a node counts as worked when its value is truthy.
    const o = asObject(parseJson(storage.getItem("gtmos_discovery_worked")));
    if (!o) return [];
    return Object.entries(o)
        .filter(([, v]) => v === true || v === 1 || v === "true")
        .map(([id]) => id);
}

function readQuota(storage: StorageLike): QuotaInputs | null {
    const o = asObject(parseJson(storage.getItem("gtmos_qw_inputs")));
    if (!o) return null;
    const quota = asNumber(o.quota);
    if (quota <= 0) return null;
    return {
        quota,
        acv: asNumber(o.acv),
        winRate: asNumber(o.winRate ?? o.win),
        cycle: asNumber(o.cycle),
        touchesPerDay: asNumber(o.touchesPerDay) || undefined,
        meetingsPerWeek: asNumber(o.meetingsPerWeek) || undefined
    };
}

// ─── Public aggregator ─────────────────────────────────────────────────

export interface LoadOptions {
    readonly storage?: StorageLike;
}

export function loadSectionsInput(
    options: LoadOptions = {}
): SectionsInput {
    const storage =
        options.storage ??
        (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) {
        return {
            icps: [],
            closedWon: [],
            closedLost: [],
            openDeals: [],
            touches: [],
            cues: [],
            coldCalls: [],
            callPlanner: [],
            autopsies: [],
            autopsySnapshots: [],
            proofs: [],
            advisorDeployments: [],
            quota: null,
            discoveryCalls: [],
            discoveryStats: null,
            discoveryWorked: []
        };
    }

    const deals = readDeals(storage);

    return {
        icps: readIcps(storage),
        closedWon: deals.closedWon,
        closedLost: deals.closedLost,
        openDeals: deals.openDeals,
        touches: readTouches(storage),
        cues: readCues(storage),
        coldCalls: readColdCalls(storage),
        callPlanner: readCallPlanner(storage),
        autopsies: readAutopsies(storage),
        autopsySnapshots: readAutopsySnapshots(storage),
        proofs: readProofs(storage),
        advisorDeployments: readAdvisorDeployments(storage),
        quota: readQuota(storage),
        discoveryCalls: readDiscoveryCalls(storage),
        discoveryStats: readDiscoveryStats(storage),
        discoveryWorked: readDiscoveryWorked(storage)
    };
}
