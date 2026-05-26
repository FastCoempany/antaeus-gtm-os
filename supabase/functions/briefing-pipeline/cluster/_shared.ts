/**
 * Deno-side mirror of the Stage 3.4 Cluster core logic.
 *
 * Mirrors src/briefing/lib/cluster/core.ts verbatim. The src/ file is
 * the canonical reference + vitest-tested; if its behavior changes
 * (caught by vitest), the change has to be mirrored here by hand.
 * Same duplication pattern as the source fetchers + LLM layer.
 */

export type ClusterType =
    | "pain_tag"
    | "exec_move"
    | "narrative_shift"
    | "company_cluster";

export interface ClusterableItem {
    readonly enriched_id: string;
    readonly source_id: string;
    readonly published_date: string | null;
    readonly fetched_at: string;
    readonly companies: ReadonlyArray<string>;
    readonly exec_move_company: string | null;
    readonly event_category: string;
    readonly topic_tags: ReadonlyArray<string>;
    readonly pain_tags: ReadonlyArray<string>;
    readonly user_relevance_score: number;
    readonly is_noise: boolean;
}

export interface SourceConfig {
    readonly src_conf: number;
    readonly baseline_volume_per_day: number;
    readonly historical_snr: number;
}

export const SOURCE_CONFIG: Readonly<Record<string, SourceConfig>> = {
    hn_algolia: { src_conf: 0.62, baseline_volume_per_day: 12, historical_snr: 0.58 },
    techcrunch_rss: { src_conf: 0.78, baseline_volume_per_day: 8, historical_snr: 0.65 },
    pr_newswire_personnel: { src_conf: 0.86, baseline_volume_per_day: 0.5, historical_snr: 0.74 },
    wikipedia_pageviews: { src_conf: 0.85, baseline_volume_per_day: 0.3, historical_snr: 0.72 },
    github_releases_atom: { src_conf: 0.80, baseline_volume_per_day: 1, historical_snr: 0.70 },
    html_diff: { src_conf: 0.88, baseline_volume_per_day: 0.2, historical_snr: 0.81 }
};

export const DEFAULT_SOURCE_CONFIG: SourceConfig = {
    src_conf: 0.6,
    baseline_volume_per_day: 5,
    historical_snr: 0.6
};

// Operator-curated Signal Console intelligence (source_id `sc:<outlet>`):
// low volume + high reliability. Mirror of core.ts.
export const SIGNAL_CONSOLE_SOURCE_CONFIG: SourceConfig = {
    src_conf: 0.82,
    baseline_volume_per_day: 0.6,
    historical_snr: 0.75
};

export const SIGNAL_CONSOLE_SOURCE_PREFIX = "sc:";

export function sourceConfig(sourceId: string): SourceConfig {
    const exact = SOURCE_CONFIG[sourceId];
    if (exact) return exact;
    if (sourceId.startsWith(SIGNAL_CONSOLE_SOURCE_PREFIX)) {
        return SIGNAL_CONSOLE_SOURCE_CONFIG;
    }
    return DEFAULT_SOURCE_CONFIG;
}

const VOLUME_FACTOR_MIN = 0.35;
const VOLUME_FACTOR_MAX = 3.0;
const RECENCY_TAU_DAYS = 14;

export function inverseVolumeFactor(baselineVolumePerDay: number): number {
    const safeBaseline = baselineVolumePerDay > 0 ? baselineVolumePerDay : 0.1;
    const raw = Math.log(1 + 5 / safeBaseline);
    return Math.min(VOLUME_FACTOR_MAX, Math.max(VOLUME_FACTOR_MIN, raw));
}

export function recencyFactor(
    publishedOrFetched: string | null,
    nowIso: string
): number {
    if (!publishedOrFetched) return Math.exp(-7 / RECENCY_TAU_DAYS);
    const itemMs = new Date(publishedOrFetched).getTime();
    const nowMs = new Date(nowIso).getTime();
    if (!Number.isFinite(itemMs) || !Number.isFinite(nowMs)) {
        return Math.exp(-7 / RECENCY_TAU_DAYS);
    }
    const ageDays = Math.max(0, (nowMs - itemMs) / (24 * 60 * 60 * 1000));
    return Math.exp(-ageDays / RECENCY_TAU_DAYS);
}

export function computeItemWeight(item: ClusterableItem, nowIso: string): number {
    const cfg = sourceConfig(item.source_id);
    const vol = inverseVolumeFactor(cfg.baseline_volume_per_day);
    const rec = recencyFactor(item.published_date ?? item.fetched_at, nowIso);
    return cfg.src_conf * vol * cfg.historical_snr * rec;
}

export interface CandidateCluster {
    readonly cluster_type: ClusterType;
    readonly anchor: string;
    readonly items: ReadonlyArray<ClusterableItem>;
}

export function groupIntoCandidates(
    items: ReadonlyArray<ClusterableItem>
): ReadonlyArray<CandidateCluster> {
    const live = items.filter((i) => !i.is_noise);
    const candidates: CandidateCluster[] = [];

    const byPainTag = new Map<string, ClusterableItem[]>();
    for (const item of live) {
        for (const tag of item.pain_tags) {
            const key = tag.trim().toLowerCase();
            if (key.length === 0) continue;
            const bucket = byPainTag.get(key) ?? [];
            bucket.push(item);
            byPainTag.set(key, bucket);
        }
    }
    for (const [anchor, bucket] of byPainTag) {
        candidates.push({ cluster_type: "pain_tag", anchor, items: bucket });
    }

    const byExecCompany = new Map<string, ClusterableItem[]>();
    for (const item of live) {
        if (item.exec_move_company === null) continue;
        const key = item.exec_move_company.trim().toLowerCase();
        if (key.length === 0) continue;
        const bucket = byExecCompany.get(key) ?? [];
        bucket.push(item);
        byExecCompany.set(key, bucket);
    }
    for (const [anchor, bucket] of byExecCompany) {
        candidates.push({ cluster_type: "exec_move", anchor, items: bucket });
    }

    const byTopic = new Map<string, ClusterableItem[]>();
    for (const item of live) {
        for (const tag of item.topic_tags) {
            const key = tag.trim().toLowerCase();
            if (key.length === 0) continue;
            const bucket = byTopic.get(key) ?? [];
            bucket.push(item);
            byTopic.set(key, bucket);
        }
    }
    for (const [anchor, bucket] of byTopic) {
        if (bucket.length >= 2) {
            candidates.push({ cluster_type: "narrative_shift", anchor, items: bucket });
        }
    }

    return candidates;
}

export interface ClusterEvaluation {
    readonly cluster_type: ClusterType;
    readonly anchor: string;
    readonly items: ReadonlyArray<ClusterableItem>;
    readonly weighted_evidence: number;
    readonly distinct_sources: number;
    readonly distinct_accounts: number;
    readonly max_relevance: number;
    readonly qualifies: boolean;
    readonly reason: string;
}

const PAIN_NARRATIVE_MIN_EVIDENCE = 3.0;
const EXEC_MOVE_MIN_EVIDENCE = 1.0;
const EXEC_MOVE_SINGLE_SOURCE_CONF = 0.7;
const CONFIGURED_RELEVANCE_GATE = 0.7;

export interface QualifyOptions {
    readonly nowIso: string;
    readonly workspaceConfigured: boolean;
}

export function evaluateCluster(
    candidate: CandidateCluster,
    opts: QualifyOptions
): ClusterEvaluation {
    const { items } = candidate;
    const weighted = items.reduce(
        (sum, item) => sum + computeItemWeight(item, opts.nowIso),
        0
    );
    const distinctSources = new Set(items.map((i) => i.source_id)).size;
    const accounts = new Set<string>();
    for (const item of items) {
        for (const c of item.companies) {
            const key = c.trim().toLowerCase();
            if (key.length > 0) accounts.add(key);
        }
        if (item.exec_move_company) {
            accounts.add(item.exec_move_company.trim().toLowerCase());
        }
    }
    const distinctAccounts = accounts.size;
    const maxRelevance = items.reduce(
        (m, i) => Math.max(m, i.user_relevance_score),
        0
    );
    const relevanceGate = opts.workspaceConfigured ? CONFIGURED_RELEVANCE_GATE : 0;

    let qualifies = false;
    let reason = "";

    if (candidate.cluster_type === "exec_move") {
        const evidenceOk = weighted >= EXEC_MOVE_MIN_EVIDENCE;
        const primaryConf = Math.max(
            ...items.map((i) => sourceConfig(i.source_id).src_conf)
        );
        const sourceOk =
            distinctSources >= 2 ||
            (distinctSources === 1 && primaryConf >= EXEC_MOVE_SINGLE_SOURCE_CONF);
        qualifies = evidenceOk && sourceOk;
        reason = qualifies
            ? `exec_move qualifies: evidence ${weighted.toFixed(2)} >= ${EXEC_MOVE_MIN_EVIDENCE}, sources ${distinctSources}${distinctSources === 1 ? ` (primary conf ${primaryConf.toFixed(2)})` : ""}`
            : `exec_move rejected: ${!evidenceOk ? `evidence ${weighted.toFixed(2)} < ${EXEC_MOVE_MIN_EVIDENCE}` : `single low-conf source (${primaryConf.toFixed(2)} < ${EXEC_MOVE_SINGLE_SOURCE_CONF})`}`;
    } else {
        const evidenceOk = weighted >= PAIN_NARRATIVE_MIN_EVIDENCE;
        const sourcesOk = distinctSources >= 2;
        const accountsOk = distinctAccounts >= 2;
        const relevanceOk = maxRelevance >= relevanceGate;
        qualifies = evidenceOk && sourcesOk && accountsOk && relevanceOk;
        if (qualifies) {
            reason = `${candidate.cluster_type} qualifies: evidence ${weighted.toFixed(2)} >= ${PAIN_NARRATIVE_MIN_EVIDENCE}, sources ${distinctSources}, accounts ${distinctAccounts}, max relevance ${maxRelevance.toFixed(2)}`;
        } else {
            const fails: string[] = [];
            if (!evidenceOk) fails.push(`evidence ${weighted.toFixed(2)} < ${PAIN_NARRATIVE_MIN_EVIDENCE}`);
            if (!sourcesOk) fails.push(`sources ${distinctSources} < 2`);
            if (!accountsOk) fails.push(`accounts ${distinctAccounts} < 2`);
            if (!relevanceOk) fails.push(`max relevance ${maxRelevance.toFixed(2)} < ${relevanceGate}`);
            reason = `${candidate.cluster_type} rejected: ${fails.join(", ")}`;
        }
    }

    return {
        cluster_type: candidate.cluster_type,
        anchor: candidate.anchor,
        items,
        weighted_evidence: weighted,
        distinct_sources: distinctSources,
        distinct_accounts: distinctAccounts,
        max_relevance: maxRelevance,
        qualifies,
        reason
    };
}

export function clusterItems(
    items: ReadonlyArray<ClusterableItem>,
    opts: QualifyOptions
): ReadonlyArray<ClusterEvaluation> {
    return groupIntoCandidates(items).map((c) => evaluateCluster(c, opts));
}
