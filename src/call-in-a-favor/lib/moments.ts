import type { Moment, MomentId } from "./types";

/**
 * Phase 4 / Room 10 Wave 2 — ask-moments.
 *
 * Faithful TypeScript port of the legacy `MOMENTS` array (`js/advisor-
 * deploy-backchannel.js` lines 11-22). Ten ask-moments — each is a
 * specific kind of backchannel ask the operator might want an advisor
 * to carry. The moment's `ask` template supports `[company]` and
 * `[buyer]` tokens that the ask-builder substitutes.
 *
 * Pure data — no signals, no DOM.
 */

export const MOMENTS: ReadonlyArray<Moment> = [
    {
        id: "intro",
        name: "Request an introduction",
        short: "Ask a relevant contact for an introduction to the buyer.",
        ask: "Can you make a warm introduction to [buyer] at [company]? I drafted the two-line context below so this stays easy.",
        proof: "Confirm the account fit and the advisor's relationship with the intended buyer.",
        advisorLine: "If this is relevant, I can introduce you to the team for an initial conversation.",
        outcome: "Aim: an introduction or first meeting."
    },
    {
        id: "eb_bridge",
        name: "Get an exec involved",
        short: "Request help identifying or contacting an executive approver.",
        ask: "Could you send [buyer] a short note that this deserves executive visibility at [company]?",
        proof: "Confirm the business issue and which executive role needs to be involved.",
        advisorLine: "Could you help identify who should review this at the executive level?",
        outcome: "Aim: an executive meeting or identified budget owner."
    },
    {
        id: "poc_stall",
        name: "Follow up on a stalled pilot",
        short: "The pilot went quiet. A neutral check from someone they trust often gets a clearer answer than another follow-up from you.",
        ask: "Could you ask whether the pilot at [company] is still moving forward or if timing changed?",
        proof: "Confirm the pilot results and last agreed next step; lack of a reply does not explain the buyer's priorities.",
        advisorLine: "Could you confirm whether the pilot is continuing and who owns the next decision?",
        outcome: "Aim: a dated next step or an explicit decision to stop."
    },
    {
        id: "procurement",
        name: "Clarify procurement timing",
        short: "Request the remaining approval steps, owner, and expected dates.",
        ask: "Could you ask [buyer] which procurement steps remain and when they expect to complete them?",
        proof: "Confirm the unresolved procurement question rather than assuming the business case is approved.",
        advisorLine: "Could you clarify the remaining procurement steps and the person responsible for each?",
        outcome: "Aim: a named timeline, owner, or escalation contact."
    },
    {
        id: "competitor",
        name: "Review evaluation criteria",
        short: "Ask an advisor to discuss relevant criteria with the buyer.",
        ask: "Could you spend ten minutes with [buyer] reviewing the criteria for evaluating this category?",
        proof: "Confirm which alternatives and decision criteria the buyer is considering.",
        advisorLine: "I can discuss the evaluation criteria and relevant tradeoffs from my experience.",
        outcome: "Aim: explicit criteria the buyer can use to compare options."
    },
    {
        id: "champion_left",
        name: "Find a new internal contact",
        short: "Identify another contact after the champion's departure.",
        ask: "Our champion at [company] left. Do you know another credible path into this account?",
        proof: "Confirm the departure and which responsibilities need a new owner.",
        advisorLine: "Could you identify the person now responsible for this evaluation?",
        outcome: "Aim: a new internal owner or a decision to close the opportunity."
    },
    {
        id: "budget_kill",
        name: "Review budget alternatives",
        short: "Discuss whether a smaller scope or later start is feasible.",
        ask: "Could you help us frame whether [company] should phase this instead of freezing it?",
        proof: "Confirm the budget constraint and whether a phased scope would still address the business need.",
        advisorLine: "Would a phased scope be worth evaluating within the available budget?",
        outcome: "Aim: an agreed phased budget or an explicit decline."
    },
    {
        id: "board_decision",
        name: "Request an executive reference",
        short: "Ask a qualified reference to address an executive approval question.",
        ask: "Could you speak with the executive approver at [company] about the company facts you can personally verify?",
        proof: "Confirm the approval question and the facts this advisor can substantiate; do not invent backing or endorsement.",
        advisorLine: "I can answer questions within my direct knowledge of the company.",
        outcome: "Aim: answers to the executive or board's approval questions."
    },
    {
        id: "reference",
        name: "Request a customer reference",
        short: "The buyer wants independent validation.",
        ask: "Could you speak with [buyer] for fifteen minutes and share what matters from your operator view?",
        proof: "Confirm that the reference has relevant first-hand experience and permission to discuss it.",
        advisorLine: "I can describe my experience, the results I observed, and the limitations.",
        outcome: "Aim: a completed reference conversation and an agreed next step."
    },
    {
        id: "renewal",
        name: "Prepare a renewal conversation",
        short: "Ask a relevant contact to discuss renewal priorities.",
        ask: "Could you check in with [buyer] before renewal and tee up the expansion conversation?",
        proof: "Confirm the renewal date, current customer priorities, and any open concerns.",
        advisorLine: "Could we discuss your priorities and any open questions before renewal?",
        outcome: "Aim: explicit renewal priorities and any expansion scope to evaluate."
    }
];

/** Look up a moment by id; falls back to the first moment (intro). */
export function findMoment(id: MomentId | string | null | undefined): Moment {
    return MOMENTS.find((m) => m.id === id) ?? MOMENTS[0]!;
}
