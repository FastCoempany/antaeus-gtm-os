import type { ThreadId } from "./types";

/**
 * Phase 4 / Room 7 Wave 2 — personalize() + loomScore().
 *
 * Faithful TypeScript port of the legacy personalize / loomScore
 * helpers (`app/cold-call-studio/index.html` lines 134-169).
 *
 * personalize(text, ctx) substitutes three tokens in any thread copy:
 *   [account]   → the account name (defaults to "[account]")
 *   [pressure]  → the top signal headline (defaults to
 *                 "a visible operating pressure")
 *   [company]   → the operator's company (defaults to "[your company]")
 *
 * loomScore() returns 44-92 derived from rack completeness:
 *   base 44
 *   + 16 if an account is selected
 *   + 12 if account heat > 65 (pressure is concrete)
 *   + 10 if active thread is proof OR ask (pressure has been forced)
 *   + 5  if a buyer reply has been chosen
 * The 92 ceiling is preserved from legacy — the score never claims
 * "ready" because a cold call is never fully ready.
 */

export interface PersonalizeContext {
    readonly accountName?: string | null;
    readonly topSignal?: string | null;
    readonly companyName?: string | null;
}

const DEFAULT_ACCOUNT = "[account]";
const DEFAULT_PRESSURE = "a visible operating pressure";
const DEFAULT_COMPANY = "[your company]";

export function personalize(
    text: string,
    ctx: PersonalizeContext = {}
): string {
    if (!text) return "";
    const account = (ctx.accountName ?? "").trim() || DEFAULT_ACCOUNT;
    const pressure = (ctx.topSignal ?? "").trim() || DEFAULT_PRESSURE;
    const company = (ctx.companyName ?? "").trim() || DEFAULT_COMPANY;
    return text
        .replace(/\[account\]/g, account)
        .replace(/\[pressure\]/g, pressure)
        .replace(/\[company\]/g, company);
}

export interface LoomScoreInputs {
    readonly hasAccount: boolean;
    /** 0-99 from Signal Console; >65 boosts. Pass 0 when account is unset. */
    readonly heat: number;
    readonly threadId: ThreadId;
    readonly hasReply: boolean;
}

export function loomScore(inputs: LoomScoreInputs): number {
    let score = 44;
    if (inputs.hasAccount) score += 16;
    if (inputs.heat > 65) score += 12;
    if (inputs.threadId === "proof" || inputs.threadId === "ask") score += 10;
    if (inputs.hasReply) score += 5;
    return Math.min(92, score);
}

/**
 * Returns the weakest-thread coach copy — surfaces in the loom-read
 * panel. Mirrors the legacy logic (lines 191-194):
 *   - no account selected: "No account selected. Do not dial generic."
 *   - account selected:    "Response path must become a dated move."
 */
export function weakestThreadCopy(hasAccount: boolean): string {
    return hasAccount
        ? "Response path must become a dated move."
        : "No account selected. Do not dial generic.";
}
