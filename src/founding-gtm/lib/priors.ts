import { getBand, benchmarkFor } from "@/quota-workback/lib/engine";
import type { SectionId } from "./types";

/**
 * Priors — what the kit says before the operator's own record exists.
 *
 * "Starts smart, gets personal" (the 2026-07-09 capture + priors plan):
 * an empty section no longer sits bare for a quarter. It renders the
 * authored pattern for teams selling deals this size — explicitly
 * labeled as not-your-record — and the operator's own pattern takes
 * the page over as real deals land (the existing authored path wins
 * the moment a section has anything real to say).
 *
 * Two rules keep this honest:
 * - Every number is the SAME benchmark the Quota room uses
 *   (benchmarkFor — one source of truth, no second set of claims).
 * - The face always carries the source note; the prior is never
 *   dressed as the operator's own read.
 */

export interface SectionPrior {
    /** 2–3 short paragraphs of plain, band-aware prose. */
    readonly body: ReadonlyArray<string>;
    /** The source line the face renders in the blue system role. */
    readonly note: string;
}

interface StorageLike {
    getItem(key: string): string | null;
}

/** Typical deal size from the quota inputs; 50k (mid-market) default. */
export function readAcv(s?: StorageLike | null): number {
    let store: StorageLike | null = s ?? null;
    if (!store) {
        try {
            store = typeof localStorage !== "undefined" ? localStorage : null;
        } catch {
            store = null;
        }
    }
    if (!store) return 50_000;
    try {
        const raw = store.getItem("gtmos_qw_inputs");
        if (!raw) return 50_000;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const acv = Number(parsed["acv"]);
        return Number.isFinite(acv) && acv > 0 ? acv : 50_000;
    } catch {
        return 50_000;
    }
}

function money(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
    return `$${Math.round(v)}`;
}

/**
 * The authored pattern for one section, sized to the workspace's deal
 * band. Returns null only for unknown ids.
 */
export function priorForSection(
    id: SectionId,
    acv: number
): SectionPrior | null {
    const band = getBand(acv);
    const b = benchmarkFor(acv);
    const size = money(Math.max(acv, 1000));
    const bandName =
        band === "small"
            ? "SMB"
            : band === "mid"
              ? "mid-market"
              : band === "enterprise"
                ? "enterprise"
                : "strategic";
    const note = `This is how it usually goes for teams selling ${size} deals to ${bandName} buyers. As your own deals and calls land, this page rewrites itself around what actually happens for you.`;

    switch (id) {
        case "who_hits":
            return {
                note,
                body: [
                    `None of your own deals have closed yet, so here's the pattern that holds for teams selling ${size} deals: the wins come from accounts that match the stated target tightly — right size, right owner of the problem, and something observable that just happened (a raise, a new leader, a hiring push). The misses cluster in the "adjacent" accounts — close enough to take the meeting, not close enough to buy.`,
                    `Expect roughly ${b.winRate}% of real opportunities to close (${b.winRange} is the honest range), over about ${b.cycle} days each. When a deal of yours closes — either way — this page starts telling you where YOUR pattern differs from that, which is the part worth money.`
                ]
            };
        case "rails_that_worked":
            return {
                note,
                body: [
                    `No outreach logged yet. What lands for teams like yours: a short first message tied to something that just happened at the account, written to the person who owns the problem — not the person who fills in the CRM. Generic templates to bought lists convert near zero and burn the address doing it.`,
                    `The honest math at this deal size: about ${b.t2m} in every 100 targeted messages and calls turn into a first meeting. That's why the daily number in your plan looks the way it does — and why every message should carry the reason-right-now, not the pitch.`
                ]
            };
        case "questions_that_earned":
            return {
                note,
                body: [
                    `No calls logged yet. The questions that win second meetings are the ones that get the buyer saying something they haven't said out loud: what actually breaks today, what it costs when it does, and who signs when the fix is real. The call that stays on features gets a polite "send materials" and goes quiet.`,
                    `The one teams your size skip most — and pay for later — is the who-signs question. Ask it early, plainly, every time. When your own calls start landing here, this page shows which questions YOUR advanced calls actually asked.`
                ]
            };
        case "won_and_leaked":
            return {
                note,
                body: [
                    `The stage map for ${size} deals is consistent: they're won or lost at discovery, and they die after the verbal yes. About ${b.m2o}% of first meetings become real opportunities; the rest leak at two places — no dated next step after the first meeting, and the run from "we want this" to a signed contract, where security, legal, and finance can stall a deal nobody is arguing against.`,
                    `Keep ${b.coverage}× your number in open deals and both leaks stay survivable. Once your own deals move through stages, this page shows where YOUR pipeline actually thins.`
                ]
            };
        case "losses_paid_for":
            return {
                note,
                body: [
                    `You haven't lost a deal yet — you will, and knowing the usual shape ahead of time softens the cost. The most common loss at this deal size isn't a competitor: it's no decision. The buyer agreed there was a problem, never felt enough pressure to fix it this quarter, and went quiet.`,
                    `The second most common: the single-threaded deal. One contact carried everything, that contact got busy or left, and the deal went dark. When a real loss lands here, write down what you won't repeat — that sentence is what this section exists for.`
                ]
            };
        case "why_we_win":
            return {
                note,
                body: [
                    `You'll write this section with wins; until then, here's what it usually says for teams selling ${size} deals: they win on speed to something the buyer can defend internally — a pilot whose result the buyer's boss can act on without you in the room, and a champion who owns the number the product moves.`,
                    `They don't win on feature depth, and they rarely win on price. When your first wins land, the shared traits show up here — and that page, printed, is what your first hire runs on.`
                ]
            };
        case "day_one_rhythm":
            return {
                note,
                body: [
                    `Until your own numbers set the cadence, run the default week: mornings start in the Dashboard's ranked list — take the one move it hands you before opening anything else. Two outreach blocks a day, tied to real signals. Discovery calls midweek, prepped from the account's live signal.`,
                    `Friday, close the loops: log what happened, date every next step, and let the system read the week back to you Monday. Set your number in the quota room and this page rewrites itself around your real math.`
                ]
            };
        default:
            return null;
    }
}
