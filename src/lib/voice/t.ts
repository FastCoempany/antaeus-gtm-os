/**
 * t() — the operator-facing string marker (scoping doc §3.5, decision
 * #5, green-lit 2026-06-08).
 *
 * An identity function: `t("Send it now")` returns its first argument
 * unchanged at runtime. Its job is at build time — every operator-
 * facing string in the product is declared through t(), which gives
 * the voice gate (voice-gate.test.ts) an unambiguous, grep-able
 * registry of every string the operator can read, each validated
 * against the voice rules (validator.ts) on every CI run.
 *
 * Usage:
 *   t("Send it now")                                   // label, default family
 *   t("Champion quiet for twelve days.", { class: "body" })
 *   t("...", { class: "authored", family: "system-ledger" })
 *
 * The first argument MUST be a string literal (or template literal
 * without expressions) so the static gate can read it. Interpolated
 * values go through the second pattern the spec allows: validate the
 * template, interpolate after —
 *   t("Quiet for {days} days.", { class: "body" }).replace("{days}", n)
 *
 * Waivers (decision #4): a t() call may be preceded by a comment
 *   // voice-waiver: <rule> — <reason>
 * on the same or previous line. The gate skips validation for that
 * call, counts it toward the product-wide ceiling of 10 active
 * waivers, and fails CI above the ceiling. Adding a waiver is a
 * founder-approved canon change (01 §2.5).
 */
import type { StringClass } from "./validator";
import type { VoiceFamily } from "./family-temperatures";

export interface TMeta {
    readonly class?: StringClass;
    readonly family?: VoiceFamily;
}

export function t(text: string, _meta?: TMeta): string {
    return text;
}
