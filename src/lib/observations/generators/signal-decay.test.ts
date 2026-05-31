import { describe, expect, it } from "vitest";
import {
    SIGNAL_DECAY_GENERATOR_ID,
    SILENCE_THRESHOLD_DAYS,
    deriveSignalDecayObservations,
    selectSilentAccounts,
    type AccountForSilenceCheck,
    type SignalForSilenceCheck
} from "./signal-decay";
import { validateObservation } from "@/lib/voice/voice-document";

const NOW = new Date("2026-05-31T12:00:00.000Z");

function daysAgo(n: number): string {
    return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

function acct(over: Partial<AccountForSilenceCheck> = {}): AccountForSilenceCheck {
    return { id: "a_1", account_name: "Acme", ...over };
}

function sig(over: Partial<SignalForSilenceCheck> = {}): SignalForSilenceCheck {
    return {
        account_id: "a_1",
        published_date: daysAgo(2),
        fetched_at: null,
        captured_at: null,
        flagged: false,
        ...over
    };
}

describe("selectSilentAccounts — threshold semantics", () => {
    it("ignores accounts with a fresh signal", () => {
        const out = selectSilentAccounts(
            [acct()],
            [sig({ published_date: daysAgo(2) })],
            NOW
        );
        expect(out).toEqual([]);
    });

    it("includes an account whose newest signal is exactly at the threshold", () => {
        const out = selectSilentAccounts(
            [acct()],
            [sig({ published_date: daysAgo(SILENCE_THRESHOLD_DAYS) })],
            NOW
        );
        expect(out.length).toBe(1);
    });

    it("flags an account with no signals at all (watchlist orphan)", () => {
        const out = selectSilentAccounts([acct({ id: "a_lonely" })], [], NOW);
        expect(out.length).toBe(1);
        expect(out[0]!.lastSignalIso).toBeNull();
    });

    it("ignores flagged signals when computing freshness", () => {
        const out = selectSilentAccounts(
            [acct()],
            [
                sig({ published_date: daysAgo(2), flagged: true }),
                sig({ published_date: daysAgo(30), flagged: false })
            ],
            NOW
        );
        // Newest unflagged is 30 days old → silent.
        expect(out.length).toBe(1);
        expect(out[0]!.daysSilent).toBeGreaterThanOrEqual(30);
    });

    it("uses the newest of (published, fetched, captured) per signal", () => {
        const out = selectSilentAccounts(
            [acct()],
            [
                sig({
                    published_date: null,
                    fetched_at: null,
                    captured_at: daysAgo(2)
                })
            ],
            NOW
        );
        // Captured 2d ago → fresh → not silent.
        expect(out).toEqual([]);
    });

    it("sorts most-silent first", () => {
        const out = selectSilentAccounts(
            [
                acct({ id: "a_older", account_name: "Older" }),
                acct({ id: "a_younger", account_name: "Younger" })
            ],
            [
                sig({ account_id: "a_older", published_date: daysAgo(30) }),
                sig({ account_id: "a_younger", published_date: daysAgo(15) })
            ],
            NOW
        );
        expect(out.map((s) => s.account.id)).toEqual(["a_older", "a_younger"]);
    });
});

describe("deriveSignalDecayObservations — voice + shape", () => {
    it("renders 'silent for N days' when signals exist but stale", () => {
        const [c] = deriveSignalDecayObservations(
            [acct({ account_name: "Acme" })],
            [sig({ published_date: daysAgo(21) })],
            NOW
        );
        expect(c!.observationText).toContain("Acme");
        expect(c!.observationText).toContain("silent");
        expect(c!.observationText).toContain("21");
    });

    it("renders 'no signals on record' when account has zero signals", () => {
        const [c] = deriveSignalDecayObservations(
            [acct({ account_name: "Orphan" })],
            [],
            NOW
        );
        expect(c!.observationText).toContain("Orphan");
        expect(c!.observationText).toContain("no signals are on record");
    });

    it("each candidate carries account-scoped supersession metadata", () => {
        const [c] = deriveSignalDecayObservations(
            [acct({ id: "a_special" })],
            [sig({ published_date: daysAgo(30) })],
            NOW
        );
        expect(c!.relatedObjectType).toBe("account");
        expect(c!.relatedObjectId).toBe("a_special");
        expect(c!.supersedesPrior).toBe(true);
    });

    it("every produced candidate passes the Voice Document validator", () => {
        const candidates = deriveSignalDecayObservations(
            [
                acct({ id: "a1", account_name: "Acme" }),
                acct({ id: "a2", account_name: "Globex" }),
                acct({ id: "a3", account_name: "Lonely" })
            ],
            [
                sig({ account_id: "a1", published_date: daysAgo(30) }),
                sig({ account_id: "a2", published_date: daysAgo(60) })
            ],
            NOW
        );
        for (const c of candidates) {
            const v = validateObservation(c.observationText);
            expect(
                v.valid,
                `voice failed for: "${c.observationText}" — ${v.violations.map((x) => x.message).join("; ")}`
            ).toBe(true);
        }
    });
});

describe("SIGNAL_DECAY_GENERATOR_ID", () => {
    it("follows the phase-b/<name> convention", () => {
        expect(SIGNAL_DECAY_GENERATOR_ID).toBe("phase-b/signal-decay");
    });
});
