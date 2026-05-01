import type {
    AdvisorDeploymentRecord,
    AutopsyRecord,
    CallPlanRecord,
    ColdCallRecord,
    CueRecord,
    DealRecord,
    IcpRecord,
    ProofRecord,
    QuotaInputs,
    SectionsInput,
    TouchRecord
} from "./types";

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
                name: asString(o.name),
                persona: asString(o.persona),
                trigger: asString(o.trigger),
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

function readCallPlanner(storage: StorageLike): ReadonlyArray<CallPlanRecord> {
    const arr = asArray(parseJson(storage.getItem("gtmos_discovery_agenda")));
    return arr
        .map((raw): CallPlanRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            const segs = asArray(o.segmentsWorked).filter(
                (s): s is string => typeof s === "string"
            );
            return {
                accountName: asString(o.accountName),
                persona: asString(o.persona),
                outcome: asString(o.outcome),
                nextStep: asString(o.nextStep ?? o.advanceAsk ?? ""),
                createdAtIso: asString(o.createdAtIso ?? o.createdAt),
                segmentsWorked: segs
            };
        })
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
            // Legacy { taskId: true } map → synthetic task list
            const map = tasksObj ?? o;
            tasks = Object.entries(map)
                .filter(([, v]) => v === true)
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
    const arr = asArray(parseJson(storage.getItem("gtmos_poc_data")));
    return arr
        .map((raw): ProofRecord | null => {
            const o = asObject(raw);
            if (!o) return null;
            const id = asString(o.id);
            if (!id) return null;
            return {
                id,
                accountName: asString(o.accountName ?? o.account),
                outcome: asString(o.outcome),
                score: asNumber(asObject(o.quality)?.score),
                band: asString(asObject(o.quality)?.band)
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
                accountName: asString(o.accountName),
                tier: asString(o.tier),
                moment: asString(o.momentId ?? o.moment),
                outcome: asString(o.outcome)
            };
        })
        .filter((r): r is AdvisorDeploymentRecord => r !== null);
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
            proofs: [],
            advisorDeployments: [],
            quota: null
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
        proofs: readProofs(storage),
        advisorDeployments: readAdvisorDeployments(storage),
        quota: readQuota(storage)
    };
}
