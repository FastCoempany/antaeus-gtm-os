import type { ObservationCandidate, RelatedObjectType } from "./types";
import { isPlaceholderName } from "./placeholders";

/**
 * `signal_decay` generator — pure function form.
 *
 * Emits one observation per watched account that has gone silent.
 * An account is "silent" when:
 *
 *   - It exists in `signal_console_accounts` for the workspace, AND
 *   - Its newest signal (by published_date, fetched_at, or
 *     captured_at) is ≥ SILENCE_THRESHOLD_DAYS old, AND
 *   - The signal isn't flagged (flagged signals are operator-dismissed
 *     noise and shouldn't keep an account out of decay)
 *
 * 14 days is the canonical default (per ADR-009). The Dashboard card
 * doesn't currently filter signal_decay by a toggle — the 14d/7d
 * toggle is deal_decay-specific.
 *
 * Voice contract: observation_text passes through the Voice Document
 * validator before the writer commits. Tests below assert valid voice.
 *
 * Ref: ADR-009 §"Four initial generators" — signal_decay.
 */

export const SILENCE_THRESHOLD_DAYS = 14;
export const SIGNAL_DECAY_GENERATOR_ID = "phase-b/signal-decay";
const RELATED_OBJECT_TYPE: RelatedObjectType = "account";

/** Subset of `signal_console_accounts` the generator reads. */
export interface AccountForSilenceCheck {
    readonly id: string;
    readonly account_name: string | null;
}

/** Subset of `signals` the generator reads. */
export interface SignalForSilenceCheck {
    readonly account_id: string;
    readonly published_date: string | null;
    readonly fetched_at: string | null;
    readonly captured_at: string | null;
    readonly flagged: boolean | null;
}

interface SilentAccount {
    readonly account: AccountForSilenceCheck;
    readonly daysSilent: number;
    /** Null when the account has zero non-flagged signals. */
    readonly lastSignalIso: string | null;
}

function bestTimestamp(s: SignalForSilenceCheck): string | null {
    return s.published_date ?? s.fetched_at ?? s.captured_at ?? null;
}

/**
 * For each account, find the newest non-flagged signal timestamp,
 * compare to `now`, and return the silent ones. Exported separately
 * so tests can assert threshold semantics without touching voice.
 */
export function selectSilentAccounts(
    accounts: ReadonlyArray<AccountForSilenceCheck>,
    signals: ReadonlyArray<SignalForSilenceCheck>,
    now: Date
): ReadonlyArray<SilentAccount> {
    // Group newest non-flagged signal per account.
    const newestByAccount = new Map<string, number>();
    for (const s of signals) {
        if (s.flagged) continue;
        const iso = bestTimestamp(s);
        if (!iso) continue;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) continue;
        const prev = newestByAccount.get(s.account_id);
        if (prev === undefined || t > prev) {
            newestByAccount.set(s.account_id, t);
        }
    }

    const out: SilentAccount[] = [];
    for (const a of accounts) {
        // Skip migration-blob placeholders + nameless accounts —
        // surfacing "An unnamed account is on the watchlist" is noise,
        // not a useful read. A real watched account always has a name.
        if (isPlaceholderName(a.account_name)) continue;
        if (!a.account_name || a.account_name.trim().length === 0) continue;
        const newest = newestByAccount.get(a.id);
        if (newest === undefined) {
            // No signals ever → fire with the "no signals on record"
            // variant. Operator-meaningful: they're watching an account
            // we have nothing on.
            out.push({
                account: a,
                daysSilent: SILENCE_THRESHOLD_DAYS,
                lastSignalIso: null
            });
            continue;
        }
        const daysSilent = Math.floor(
            (now.getTime() - newest) / (1000 * 60 * 60 * 24)
        );
        if (daysSilent < SILENCE_THRESHOLD_DAYS) continue;
        out.push({
            account: a,
            daysSilent,
            lastSignalIso: new Date(newest).toISOString()
        });
    }
    return out.sort((x, y) => y.daysSilent - x.daysSilent);
}

function renderCandidate(s: SilentAccount): ObservationCandidate {
    const account = s.account.account_name?.trim() || "An unnamed account";
    const text =
        s.lastSignalIso === null
            ? `${account} is on the watchlist but no signals are on record.`
            : `${account} has been silent for ${s.daysSilent} days — no fresh signal coverage.`;
    return {
        observationText: text,
        relatedObjectType: RELATED_OBJECT_TYPE,
        relatedObjectId: s.account.id,
        confidence: "high",
        supersedesPrior: true
    };
}

export function deriveSignalDecayObservations(
    accounts: ReadonlyArray<AccountForSilenceCheck>,
    signals: ReadonlyArray<SignalForSilenceCheck>,
    now: Date
): ReadonlyArray<ObservationCandidate> {
    return selectSilentAccounts(accounts, signals, now).map(renderCandidate);
}
