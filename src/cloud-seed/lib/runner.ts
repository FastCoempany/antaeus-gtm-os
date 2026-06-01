import type { DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import {
    SEED_ACCOUNTS,
    SEED_DEALS,
    SEED_MARKER_ACCOUNT_KEY,
    SEED_PROOFS,
    SEED_SIGNALS,
    type SeedAccountRow,
    type SeedDealRow,
    type SeedProofRow,
    type SeedSignalRow
} from "./seed-data";

/**
 * Cloud-seed runner — writes the seed to the operator's workspace via
 * the typed data client.
 *
 * Idempotency: the seed inserts a marker `signal_console_accounts` row
 * with `account_key = "__cloud_seed_marker__"` as the FIRST write.
 * Every subsequent run checks for that row and aborts if present.
 * Operators who want a clean re-seed delete the marker manually.
 *
 * Errors surface in the result so the page UI can render a status
 * line — the runner never throws. Per-write failures roll up into
 * `errors[]` but don't halt the run; the operator sees partial state +
 * the exact failing rows.
 */

export interface SeedReport {
    readonly ok: boolean;
    readonly skipped?: "already-seeded";
    readonly counts: {
        readonly deals: number;
        readonly accounts: number;
        readonly signals: number;
        readonly proofs: number;
    };
    readonly errors: ReadonlyArray<string>;
}

export interface SeedOptions {
    readonly data: DataClient;
    /** When true, do everything except the writes — for the UI's "dry run." */
    readonly dryRun?: boolean;
}

const EMPTY_COUNTS = { deals: 0, accounts: 0, signals: 0, proofs: 0 };

export async function runCloudSeed(opts: SeedOptions): Promise<SeedReport> {
    const { data, dryRun = false } = opts;
    const errors: string[] = [];
    let dealsWritten = 0;
    let accountsWritten = 0;
    let signalsWritten = 0;
    let proofsWritten = 0;

    try {
        // Idempotency gate.
        const existingMarker = await data.signalConsoleAccounts.list({
            where: { account_key: SEED_MARKER_ACCOUNT_KEY },
            limit: 1
        });
        if (existingMarker.length > 0) {
            return {
                ok: true,
                skipped: "already-seeded",
                counts: EMPTY_COUNTS,
                errors: []
            };
        }
    } catch (err) {
        // Couldn't run the gate — could be RLS / network. Treat as
        // fatal: refuse to write rather than risk duplicate seed.
        reportError(err, { op: "cloud-seed.idempotency-check" });
        return {
            ok: false,
            counts: EMPTY_COUNTS,
            errors: [
                `Couldn't verify whether the workspace was already seeded: ${
                    err instanceof Error ? err.message : String(err)
                }`
            ]
        };
    }

    if (dryRun) {
        return {
            ok: true,
            counts: {
                deals: SEED_DEALS.length,
                accounts: SEED_ACCOUNTS.length,
                signals: SEED_SIGNALS.length,
                proofs: SEED_PROOFS.length
            },
            errors: []
        };
    }

    // ─── Pass 1: write the marker first so a partial run still gates
    //              subsequent attempts. ──────────────────────────────
    try {
        await data.signalConsoleAccounts.insert({
            account_key: SEED_MARKER_ACCOUNT_KEY,
            account_name: null,
            heat: 0,
            relationship_type: "marker"
        });
    } catch (err) {
        return {
            ok: false,
            counts: EMPTY_COUNTS,
            errors: [
                `Couldn't write the idempotency marker: ${
                    err instanceof Error ? err.message : String(err)
                }`
            ]
        };
    }

    // ─── Pass 2: deals ───────────────────────────────────────────────
    for (const seed of SEED_DEALS) {
        try {
            await data.deals.insert(seedDealToInsert(seed));
            dealsWritten += 1;
        } catch (err) {
            errors.push(
                `deal "${seed.account_name}": ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    }

    // ─── Pass 3: accounts (collect ids so signals can reference) ──
    const accountIdByKey = new Map<string, string>();
    for (const seed of SEED_ACCOUNTS) {
        try {
            const inserted = await data.signalConsoleAccounts.insert(
                seedAccountToInsert(seed)
            );
            accountIdByKey.set(seed.account_key, inserted.id);
            accountsWritten += 1;
        } catch (err) {
            errors.push(
                `account "${seed.account_key}": ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    }

    // ─── Pass 4: signals ─────────────────────────────────────────────
    for (const seed of SEED_SIGNALS) {
        const accountId = accountIdByKey.get(seed.account_key);
        if (!accountId) {
            errors.push(
                `signal "${seed.headline.slice(0, 40)}…": parent account "${
                    seed.account_key
                }" wasn't written; skipping`
            );
            continue;
        }
        try {
            await data.signals.insert(
                seedSignalToInsert(seed, accountId)
            );
            signalsWritten += 1;
        } catch (err) {
            errors.push(
                `signal "${seed.headline.slice(0, 40)}…": ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    }

    // ─── Pass 5: proofs ──────────────────────────────────────────────
    for (const seed of SEED_PROOFS) {
        try {
            await data.proofs.insert(seedProofToInsert(seed));
            proofsWritten += 1;
        } catch (err) {
            errors.push(
                `proof "${seed.claim.slice(0, 40)}…": ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    }

    return {
        ok: errors.length === 0,
        counts: {
            deals: dealsWritten,
            accounts: accountsWritten,
            signals: signalsWritten,
            proofs: proofsWritten
        },
        errors
    };
}

// ─── Row converters ───────────────────────────────────────────────────

function dayOffsetIso(daysAgo: number): string {
    return new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000
    ).toISOString();
}

function seedDealToInsert(seed: SeedDealRow) {
    return {
        account_name: seed.account_name,
        stage: seed.stage,
        is_active: seed.is_active,
        recovery_rank: seed.recovery_rank,
        next_step_date: seed.next_step_date,
        next_steps: seed.next_steps,
        deal_value: seed.deal_value,
        stage_history: seed.stage_history,
        champion: seed.champion,
        economic_buyer: seed.economic_buyer,
        pain_points: seed.pain_points
    } as never;
}

function seedAccountToInsert(seed: SeedAccountRow) {
    return {
        account_key: seed.account_key,
        account_name: seed.account_name,
        heat: seed.heat,
        relationship_type: seed.relationship_type,
        industry: seed.industry,
        domain: seed.domain
    } as never;
}

function seedSignalToInsert(seed: SeedSignalRow, accountId: string) {
    return {
        account_id: accountId,
        headline: seed.headline,
        signal_type: seed.signal_type,
        source: seed.source,
        confidence: seed.confidence,
        is_ai: seed.is_ai,
        flagged: seed.flagged,
        published_date: dayOffsetIso(seed.published_offset_days),
        fetched_at: dayOffsetIso(seed.published_offset_days)
    } as never;
}

function seedProofToInsert(seed: SeedProofRow) {
    return {
        claim: seed.claim,
        claim_owner: seed.claim_owner,
        success_metric: seed.success_metric,
        kill_rule: seed.kill_rule,
        duration_days: seed.duration_days,
        outcome_state: seed.outcome_state,
        created_at: dayOffsetIso(seed.created_offset_days)
    } as never;
}
