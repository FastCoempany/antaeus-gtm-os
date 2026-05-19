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
        name: "Warm introduction",
        short: "No meeting yet. One trusted person can open the door for us.",
        ask: "Can you make a warm introduction to [buyer] at [company]? I drafted the two-line context below so this stays easy.",
        proof: "The account fits what we're going after, but we don't have a way in yet.",
        advisorLine: "You only need to open the door. I will carry the actual sale.",
        outcome: "First meeting booked from a credible source."
    },
    {
        id: "eb_bridge",
        name: "Executive bridge",
        short: "Champion is alive, but executive authority is not in the thread.",
        ask: "Could you send [buyer] a short note that this deserves executive visibility at [company]?",
        proof: "Pain and proof exist. Authority is the missing bridge.",
        advisorLine: "This is a signal that the work is worth executive attention, not a request to sell it for us.",
        outcome: "Executive meeting or named budget owner."
    },
    {
        id: "poc_stall",
        name: "Post-proof stall",
        short: "Proof landed, but the deal went quiet.",
        ask: "Could you ask whether the proof from [company] is still moving forward or if timing changed?",
        proof: "The product proved itself. The silence is a prioritization problem.",
        advisorLine: "A neutral check from you will get a clearer answer than another founder follow-up.",
        outcome: "Next step revived or closed cleanly."
    },
    {
        id: "procurement",
        name: "Procurement pressure",
        short: "Contract is stuck and nobody will name timing.",
        ask: "Could you ask [buyer] whether procurement timing is real or if the deal needs a different path?",
        proof: "The business case is no longer the blocker. Process opacity is.",
        advisorLine: "You are not pressuring procurement. You are asking whether the timeline is honest.",
        outcome: "Named timeline, owner, or escalation path."
    },
    {
        id: "competitor",
        name: "Competitive frame",
        short: "A competitor entered and the buyer needs outside perspective.",
        ask: "Could you give [buyer] ten minutes of pattern recognition on what matters in this category?",
        proof: "The prospect is comparing options. Third-party credibility can reset the criteria.",
        advisorLine: "No pitch. Just help them avoid choosing the wrong evaluation frame.",
        outcome: "Criteria reset around the problem we solve best."
    },
    {
        id: "champion_left",
        name: "Champion loss",
        short: "The internal carrier disappeared.",
        ask: "Our champion at [company] left. Do you know another credible path into this account?",
        proof: "The deal was real, but the thread lost its carrier.",
        advisorLine: "Speed matters more than perfection. We need one safe re-entry point.",
        outcome: "New internal owner or clean exit."
    },
    {
        id: "budget_kill",
        name: "Budget freeze",
        short: "The deal has proof but lost the budget fight.",
        ask: "Could you help us frame whether [company] should phase this instead of freezing it?",
        proof: "The work may still be valuable, but the spend path got compressed.",
        advisorLine: "The ask is a smaller path forward, not a plea for budget.",
        outcome: "Phased budget or explicit no."
    },
    {
        id: "board_decision",
        name: "Board signal",
        short: "Approval needs board or C-suite confidence.",
        ask: "Could you signal to the executive path at [company] that this is a serious backed company?",
        proof: "This is too expensive to spend casually. Use only when the deal merits it.",
        advisorLine: "A board-level mention can change trust faster than another deck.",
        outcome: "Executive or board approval path opens."
    },
    {
        id: "reference",
        name: "Reference proof",
        short: "The buyer wants independent validation.",
        ask: "Could you speak with [buyer] for fifteen minutes and share what matters from your operator view?",
        proof: "The buyer needs confidence from someone who has lived the problem.",
        advisorLine: "Keep it practical. What broke, what changed, what you would watch.",
        outcome: "Reference call completed and decision advances."
    },
    {
        id: "renewal",
        name: "Renewal expansion",
        short: "Existing customer needs a strategic touch before the next phase.",
        ask: "Could you check in with [buyer] before renewal and tee up the expansion conversation?",
        proof: "The relationship is already live. The next phase needs executive oxygen.",
        advisorLine: "This is partnership reinforcement, not a save attempt.",
        outcome: "Renewal stays warm and expansion gets named."
    }
];

/** Look up a moment by id; falls back to the first moment (intro). */
export function findMoment(id: MomentId | string | null | undefined): Moment {
    return MOMENTS.find((m) => m.id === id) ?? MOMENTS[0]!;
}
