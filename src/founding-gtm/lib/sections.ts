import type {
    AuthoredSection,
    AutopsySnapshotRecord,
    DealRecord,
    IcpRecord,
    SectionId,
    SectionsInput,
    SurpriseCallout
} from "./types";
import { SECTION_KICKER, SECTION_TITLE } from "./types";
import { LOSS_LABELS } from "@/deal-workspace/lib/deal-shape";
import {
    benchmarkFor as quotaBenchmarkFor,
    computeMetrics as computeQuotaMetrics
} from "@/quota-workback/lib/engine";
import { DEFAULT_INPUTS as DEFAULT_QUOTA_INPUTS, EMPTY_COVERAGE } from "@/quota-workback/lib/types";
import type { PlanInputs } from "@/quota-workback/lib/types";

/** Plain names for Discovery segment keys (keys stay stable in storage). */
const SEGMENT_NAME: Readonly<Record<string, string>> = {
    "opening-frame": "Opening",
    "current-state-truth": "How they work today",
    "pain-and-consequence": "The problem and its cost",
    "trigger-and-urgency": "Why now",
    "stakeholder-and-ownership": "Who's involved",
    "proof-threshold": "What they need to see",
    "current-vendor-and-displacement": "Current vendor",
    "decision-architecture": "How they'll decide",
    "next-step-lock": "Next step",
    "post-call-routing": "After the call"
};
function segmentName(key: string): string {
    return SEGMENT_NAME[key] ?? key.replace(/-/g, " ");
}
function lossLabel(reason: string): string {
    return (LOSS_LABELS as Record<string, string>)[reason] ?? reason.replace(/_/g, " ");
}

/**
 * Sales-handoff section authoring.
 *
 * The underlying counts, readiness rules, and joins are unchanged. Generated
 * prose reports what is present in the recorded sample and avoids claiming
 * that a correlated behavior caused a win, loss, reply, or next meeting.
 */
function frame(
    id: SectionId,
    status: AuthoredSection["status"],
    body: ReadonlyArray<string>,
    evidence: ReadonlyArray<string>,
    surprise: SurpriseCallout | null
): AuthoredSection {
    return {
        id,
        kicker: SECTION_KICKER[id],
        title: SECTION_TITLE[id],
        status,
        body,
        evidence,
        surprise
    };
}

function trim(s: string, max: number): string {
    if (s.length <= max) return s;
    return s.slice(0, max - 1).trimEnd() + "…";
}

function dealKey(d: DealRecord): string {
    const icp = d.icpLabel.trim();
    const persona = d.persona.trim();
    const trigger = d.trigger.trim();
    return [icp || "—", persona || "—", trigger || "—"].join(" · ");
}

/** Plain channel names for outreach rows ("phone" → "Phone"). */
function channelName(ch: string): string {
    const known: Record<string, string> = { email: "Email", linkedin: "LinkedIn", phone: "Phone" };
    if (ch === "—") return "Channel not recorded";
    return known[ch.toLowerCase()] ?? ch.charAt(0).toUpperCase() + ch.slice(1);
}

/**
 * A deal's recorded profile in plain words: "ICP: SMB, buyer: VP Sales,
 * trigger not recorded", or "no ICP, buyer, or trigger recorded" when all
 * three are blank. Replaces the bare "— · — · —" rows, which read like
 * conflicting deal counts.
 */
function profileText(d: DealRecord): string {
    const icp = d.icpLabel.trim();
    const persona = d.persona.trim();
    const trigger = d.trigger.trim();
    if (!icp && !persona && !trigger) return "no ICP, buyer, or trigger recorded";
    return [
        icp ? `ICP: ${icp}` : "ICP not recorded",
        persona ? `buyer: ${persona}` : "buyer not recorded",
        trigger ? `trigger: ${trigger}` : "trigger not recorded"
    ].join(", ");
}

/**
 * Evidence rows for Section 1: one row per distinct profile, saying how
 * many deals share it ("3 wins with no ICP, buyer, or trigger recorded").
 */
function profileRows(
    deals: ReadonlyArray<DealRecord>,
    one: string,
    many: string,
    limit: number
): string[] {
    const groups = new Map<string, { count: number; text: string }>();
    deals.forEach((d) => {
        const key = dealKey(d);
        const g = groups.get(key) ?? { count: 0, text: profileText(d) };
        g.count += 1;
        groups.set(key, g);
    });
    return [...groups.values()].slice(0, limit).map((g) => {
        const noun = plural(g.count, one, many);
        return g.text.startsWith("no ") ? `${noun} with ${g.text}` : `${noun} · ${g.text}`;
    });
}

function uniq<T>(arr: ReadonlyArray<T>): ReadonlyArray<T> {
    const seen = new Set<string>();
    const out: T[] = [];
    arr.forEach((v) => {
        const key = JSON.stringify(v);
        if (!seen.has(key)) {
            seen.add(key);
            out.push(v);
        }
    });
    return out;
}

function plural(n: number, one: string, many: string): string {
    return n === 1 ? `${n} ${one}` : `${n} ${many}`;
}

// ─── 1 · Target customers and disqualification criteria ───────────────

export function authorSection1(input: SectionsInput): AuthoredSection {
    const id: SectionId = "who_hits";
    const totalClosed = input.closedWon.length + input.closedLost.length;

    if (input.icps.length === 0 && totalClosed === 0) {
        return frame(id, "empty", [], [], null);
    }

    if (input.icps.length === 0 || totalClosed < 2) {
        const body =
            input.icps.length > 0
                ? [
                      `You've defined ${plural(input.icps.length, "ICP", "ICPs")}, but only ${plural(totalClosed, "closed deal is", "closed deals are")} recorded. That is not enough outcome history to confirm or contradict them yet, so a new hire would inherit a starting guess, not a tested pattern.`
                  ]
                : [
                      `${plural(totalClosed, "closed deal is", "closed deals are")} recorded without a named ICP. You may know who buys, but a new hire would have no explicit targeting definition to work from. Save one in ICP Studio before they start.`
                  ];
        return frame(id, "partial", body, [], null);
    }

    const wonKeys = input.closedWon.map(dealKey);
    const lostKeys = input.closedLost.map(dealKey);
    const wonPatterns = uniq(wonKeys);
    const lostPatterns = uniq(lostKeys);

    const body: string[] = [
        `Across ${plural(input.closedWon.length, "win", "wins")} and ${plural(input.closedLost.length, "loss", "losses")}, the deals you won fall into ${plural(wonPatterns.length, "distinct customer profile", "distinct customer profiles")} (by ICP, buyer, and trigger). Point the new hire's prospecting at those first.`
    ];
    if (lostPatterns.length > 0) {
        body.push(
            `The deals you lost fall into ${plural(lostPatterns.length, "distinct profile", "distinct profiles")}. Teach the new hire to screen for these at intake and qualify out early when one shows up. The sample is small, so treat this as an early warning sign; it does not show that the profile caused the loss.`
        );
    }

    const evidence: string[] = [];
    // One row per distinct profile, each saying how many deals share it,
    // so the rows add up to the win/loss counts in the summary above.
    evidence.push(...profileRows(input.closedWon, "win", "wins", 3));
    evidence.push(...profileRows(input.closedLost, "loss", "losses", 3));

    const statedIcpNames = input.icps.map((i) => i.name.toLowerCase().trim());
    const actualIcpLabels = input.closedWon
        .map((d) => d.icpLabel.toLowerCase().trim())
        .filter((l) => l.length > 0);
    const matched = actualIcpLabels.filter((label) =>
        statedIcpNames.some(
            (n) => n.length > 0 && (label.includes(n) || n.includes(label))
        )
    );
    const matchRatio =
        actualIcpLabels.length === 0 ? 1 : matched.length / actualIcpLabels.length;

    let surprise: SurpriseCallout | null = null;
    if (statedIcpNames.length > 0 && actualIcpLabels.length > 0 && matchRatio < 0.5) {
        const off = Math.round((1 - matchRatio) * 100);
        surprise = {
            tone: "corrective",
            headline: "Your stated ICP does not match who actually buys.",
            body: `${off}% of closed-won deals with an ICP label do not match any ICP you've named. Make the ICP more specific (or fix how past deals were labeled) before the new hire starts prospecting against the wrong target.`
        };
    } else if (matchRatio >= 0.8 && actualIcpLabels.length > 0) {
        surprise = {
            tone: "affirming",
            headline: "Your stated ICP matches who actually buys.",
            body: `${Math.round(matchRatio * 100)}% of closed-won deals with an ICP label match an ICP you've named. The new hire inherits a clear target. Keep labeling new deals so it stays that way.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── 2 · Outreach patterns associated with responses ──────────────────

export function authorSection2(input: SectionsInput): AuthoredSection {
    const id: SectionId = "rails_that_worked";
    const totalReach = input.touches.length + input.cues.length + input.coldCalls.length;

    if (totalReach === 0) return frame(id, "empty", [], [], null);

    const channelCounts = new Map<string, { sent: number; replied: number }>();
    function bumpChannel(ch: string, replied: boolean): void {
        const key = ch || "—";
        const cur = channelCounts.get(key) ?? { sent: 0, replied: 0 };
        cur.sent += 1;
        if (replied) cur.replied += 1;
        channelCounts.set(key, cur);
    }
    input.touches.forEach((t) =>
        bumpChannel(t.channel, t.outcome === "replied" || t.outcome === "meeting_booked")
    );
    input.cues.forEach((c) =>
        bumpChannel(
            "linkedin",
            c.outcome === "replied" ||
                c.outcome === "meeting_booked" ||
                c.outcome === "accepted"
        )
    );
    input.coldCalls.forEach((c) =>
        bumpChannel(
            "phone",
            c.outcome === "meeting_booked" || c.outcome === "callback_scheduled"
        )
    );

    const ranked = [...channelCounts.entries()]
        .filter(([, v]) => v.sent >= 3)
        .map(([ch, v]) => ({
            channel: ch,
            sent: v.sent,
            replied: v.replied,
            rate: v.sent > 0 ? v.replied / v.sent : 0
        }))
        .sort((a, b) => b.rate - a.rate);

    if (totalReach < 10 || ranked.length === 0) {
        return frame(
            id,
            "partial",
            [
                `${plural(totalReach, "outreach activity is", "outreach activities are")} recorded. There is not yet enough channel volume for a useful comparison of observed response rates.`
            ],
            [],
            null
        );
    }

    const top = ranked[0]!;
    const body: string[] = [
        `${channelName(top.channel)} has the best observed response rate so far: ${top.replied} responses on ${top.sent} recorded attempts (${Math.round(top.rate * 100)}%). Start the new hire on that channel and have them test the others against it.`
    ];

    const bestLines = input.touches
        .filter((t) => t.outcome === "replied" || t.outcome === "meeting_booked")
        .map((t) => t.sendLine.trim())
        .filter((s) => s.length > 0);
    if (bestLines.length > 0) {
        body.push(
            `The messages below got a reply or a booked meeting. Have the new hire start from these instead of writing from scratch. The sample is small, so keep measuring; a reply doesn't prove the wording was the reason.`
        );
    }

    const evidence: string[] = [];
    ranked.slice(0, 3).forEach((r) => {
        evidence.push(
            `${channelName(r.channel)}: ${plural(r.replied, "response", "responses")} from ${plural(r.sent, "attempt", "attempts")} (${Math.round(r.rate * 100)}%)`
        );
    });
    bestLines.slice(0, 2).forEach((line) => {
        evidence.push(`Got a response: "${trim(line, 90)}"`);
    });

    const triedChannels = new Set(channelCounts.keys());
    const expected = ["email", "linkedin", "phone"];
    const untried = expected.filter((c) => !triedChannels.has(c));
    let surprise: SurpriseCallout | null = null;
    if (untried.length > 0 && totalReach >= 10) {
        surprise = {
            tone: "corrective",
            headline: `You haven't tried ${untried.join(" or ")} yet.`,
            body: `Every recorded attempt used the other channels, so nobody knows yet whether ${untried.join(" or ")} would work. Don't leave the new hire guessing: give them a 10-message test with a stop rule (for example, stop if none of the 10 gets a reply).`
        };
    } else if (untried.length === 0) {
        surprise = {
            tone: "affirming",
            headline: "You've tested email, LinkedIn, and phone.",
            body: `All three channels have recorded activity, so the new hire inherits a real comparison of what gets responses instead of a guess.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── 3 · Discovery patterns associated with progression ───────────────

export function authorSection3(input: SectionsInput): AuthoredSection {
    const id: SectionId = "questions_that_earned";
    const calls = input.discoveryCalls;
    const stats = input.discoveryStats;
    const worked = input.discoveryWorked;

    if (
        calls.length === 0 &&
        !stats &&
        worked.length === 0 &&
        input.callPlanner.length === 0
    ) {
        return frame(id, "empty", [], [], null);
    }

    if (calls.length > 0) {
        const advancedCalls = calls.filter((c) => c.disposition === "advanced");
        const totalLogged = calls.length;
        const advancedCount = advancedCalls.length;
        const advanceRate = Math.round((advancedCount / totalLogged) * 100);

        const advancingSegmentCounts = new Map<string, number>();
        advancedCalls.forEach((c) =>
            c.segmentKeysWorked.forEach((seg) => {
                advancingSegmentCounts.set(
                    seg,
                    (advancingSegmentCounts.get(seg) ?? 0) + 1
                );
            })
        );
        const advancingSegments = [...advancingSegmentCounts.entries()].sort(
            (a, b) => b[1] - a[1]
        );

        const body: string[] = [
            `${plural(totalLogged, "discovery call is", "discovery calls are")} logged. ${advancedCount} advanced to a next meeting, an observed advance rate of ${advanceRate}%.`
        ];
        if (advancingSegments.length > 0) {
            const top = advancingSegments[0]!;
            const topShare = Math.round((top[1] / Math.max(1, advancedCount)) * 100);
            body.push(
                `"${segmentName(top[0])}" comes up on ${topShare}% of the calls that advanced, more than any other part of the call. Teach that question first on Monday. It's a pattern in your calls so far; it does not show that the question caused the advance.`
            );
        }

        const evidence: string[] = [
            `${advancedCount} of ${totalLogged} calls recorded as advanced · ${advanceRate}%`
        ];
        advancingSegments.slice(0, 5).forEach(([seg, count]) => {
            evidence.push(`${segmentName(seg)} · covered on ${count} calls that advanced`);
        });

        const recentCalls = [...calls]
            .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))
            .slice(0, 5);
        const recentSegments = new Set(
            recentCalls.flatMap((c) => c.segmentKeysWorked)
        );
        const droppedSegments = [...advancingSegmentCounts.keys()].filter(
            (seg) => !recentSegments.has(seg)
        );

        let surprise: SurpriseCallout | null = null;
        if (droppedSegments.length > 0 && advancedCount > 0) {
            surprise = {
                tone: "corrective",
                headline: "You've stopped asking questions that used to come up on calls that advanced.",
                body: `${plural(droppedSegments.length, "part of the call", "parts of the call")} came up on earlier calls that advanced but not in your last five calls: ${droppedSegments.slice(0, 3).map(segmentName).join(", ")}. Unless you dropped them on purpose, bring them back before the new hire learns the thinner version.`
            };
        } else if (advancedCount === 0) {
            surprise = {
                tone: "corrective",
                headline: "No logged discovery call currently has an advanced outcome.",
                body: `${plural(totalLogged, "call is", "calls are")} logged and none led to a next meeting. Find what the calls keep missing (often who owns the problem, or a dated next step) before the new hire copies the approach.`
            };
        } else if (advanceRate < 33) {
            surprise = {
                tone: "corrective",
                headline: "Fewer than one third of logged discovery calls are recorded as advanced.",
                body: `Only ${advanceRate}% of logged calls led to a next meeting. Compare the calls that advanced with the ones that didn't, and tighten the questions and the next-step ask before the new hire learns the loose version.`
            };
        } else if (advanceRate >= 60) {
            surprise = {
                tone: "affirming",
                headline: "Most logged discovery calls are recorded as advanced.",
                body: `${advanceRate}% of logged calls led to a next meeting. Write down how you run these calls so the new hire can copy them closely.`
            };
        }

        return frame(id, "ready", body, evidence, surprise);
    }

    const totalCalls = stats?.totalCalls ?? 0;
    const advancedCalls = stats?.advancedCalls ?? 0;

    if (totalCalls === 0) {
        return frame(
            id,
            "partial",
            [
                `Discovery is planned, but no completed discovery calls are logged yet. A new hire would inherit an agenda without outcome history. Log your next few calls so they can see what gets the next meeting.`
            ],
            [],
            null
        );
    }

    const advanceRate = Math.round((advancedCalls / totalCalls) * 100);
    const body: string[] = [
        `${plural(totalCalls, "discovery call is", "discovery calls are")} logged. ${advancedCalls} advanced to a next meeting, an observed advance rate of ${advanceRate}%.`
    ];
    if (worked.length > 0) {
        body.push(
            `You keep coming back to ${plural(worked.length, "part of the discovery call", "parts of the discovery call")}. Teach the new hire those first before they improvise new ones, and log calls one by one so you can see which parts show up on calls that advance.`
        );
    }

    const evidence: string[] = [
        `${advancedCalls} of ${totalCalls} calls recorded as advanced · ${advanceRate}%`
    ];
    worked.slice(0, 6).forEach((seg) => evidence.push(`Recorded segment · ${seg}`));

    let surprise: SurpriseCallout | null = null;
    if (advancedCalls === 0) {
        surprise = {
            tone: "corrective",
            headline: "No logged discovery call currently has an advanced outcome.",
            body: `${plural(totalCalls, "call is", "calls are")} logged and none led to a next meeting. Find what the calls keep missing before the new hire copies the approach.`
        };
    } else if (advanceRate < 33) {
        surprise = {
            tone: "corrective",
            headline: "Fewer than one third of logged discovery calls are recorded as advanced.",
            body: `Only ${advanceRate}% of logged calls led to a next meeting. Tighten the questions and the next-step ask before the new hire learns the loose version.`
        };
    } else if (advanceRate >= 60) {
        surprise = {
            tone: "affirming",
            headline: "Most logged discovery calls are recorded as advanced.",
            body: `${advanceRate}% of logged calls led to a next meeting. Write down how you run these calls so the new hire can copy them closely.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── 4 · Where deals tend to advance or stall ─────────────────────────

export function authorSection4(input: SectionsInput): AuthoredSection {
    const id: SectionId = "won_and_leaked";
    const totalClosed = input.closedWon.length + input.closedLost.length;

    if (totalClosed === 0 && input.openDeals.length === 0) {
        return frame(id, "empty", [], [], null);
    }

    if (totalClosed < 2) {
        return frame(
            id,
            "partial",
            [
                `${plural(input.openDeals.length, "open deal is", "open deals are")} recorded with only ${plural(totalClosed, "closed deal", "closed deals")}. That is not enough closed-deal history to show where deals tend to stall yet.`
            ],
            [],
            null
        );
    }

    const stageStops = new Map<
        string,
        { exited: number; advanced: number; lost: number; won: number }
    >();
    function bumpStage(stage: string, kind: "lost" | "won"): void {
        const key = (stage || "stage before loss not recorded").toLowerCase();
        const cur =
            stageStops.get(key) ??
            { exited: 0, advanced: 0, lost: 0, won: 0 };
        cur.exited += 1;
        if (kind === "lost") cur.lost += 1;
        else cur.won += 1;
        stageStops.set(key, cur);
    }
    input.closedLost.forEach((d) =>
        bumpStage(d.stage === "closed-lost" ? "" : d.stage, "lost")
    );
    input.closedWon.forEach(() => bumpStage("closed-won", "won"));

    // Count each Call in a Favor request against the same stage key the
    // closed-deal rows use, and tally the ones on open (or unmatched)
    // deals separately, so the body's total and the rows describe the
    // same set of requests.
    const advisorByStage = new Map<string, number>();
    let advisorOnOpen = 0;
    let advisorUnmatched = 0;
    const sameAccount = (name: string) => (d: DealRecord) =>
        d.accountName.toLowerCase() === name.toLowerCase();
    input.advisorDeployments.forEach((dep) => {
        const won = input.closedWon.find(sameAccount(dep.accountName));
        const lost = won ? undefined : input.closedLost.find(sameAccount(dep.accountName));
        let k: string | null = null;
        if (won) k = "closed-won";
        else if (lost) k = ((lost.stage === "closed-lost" ? "" : lost.stage) || "stage before loss not recorded").toLowerCase();
        if (k) {
            advisorByStage.set(k, (advisorByStage.get(k) ?? 0) + 1);
        } else if (input.openDeals.some(sameAccount(dep.accountName))) {
            advisorOnOpen += 1;
        } else {
            advisorUnmatched += 1;
        }
    });
    const advisorOnClosed = input.advisorDeployments.length - advisorOnOpen - advisorUnmatched;

    const winRate =
        totalClosed > 0
            ? Math.round((input.closedWon.length / totalClosed) * 100)
            : 0;

    const body: string[] = [
        `The recorded closed-deal sample contains ${plural(input.closedWon.length, "win", "wins")} and ${plural(input.closedLost.length, "loss", "losses")}, an observed win rate of ${winRate}%. Look at which stage the lost deals stopped at: that's where the new hire's first 30 days of diagnosis should focus. The stage shows where deals stopped; it does not establish why they were lost.`
    ];
    if (input.advisorDeployments.length > 0) {
        const where = [
            `${advisorOnClosed} on closed deals (counted in the stage rows below)`,
            `${advisorOnOpen} on open deals`
        ];
        if (advisorUnmatched > 0) where.push(`${advisorUnmatched} not matched to a recorded deal`);
        body.push(
            `${plural(input.advisorDeployments.length, "Call in a Favor request is", "Call in a Favor requests are")} recorded: ${where.join(", ")}. Tell the new hire which stages that help made a difference at, and which stages you've been pushing through alone.`
        );
    }

    const evidence: string[] = [];
    [...stageStops.entries()]
        .sort((a, b) => b[1].exited - a[1].exited)
        .slice(0, 5)
        .forEach(([stage, v]) => {
            const advisorCount = advisorByStage.get(stage) ?? 0;
            evidence.push(
                `${stage} · ${v.won} won · ${v.lost} lost · ${plural(advisorCount, "Call in a Favor request", "Call in a Favor requests")}`
            );
        });

    let leakyStage: string | null = null;
    let leakyLossCount = 0;
    [...stageStops.entries()].forEach(([stage, v]) => {
        if (stage !== "stage before loss not recorded" && v.lost > leakyLossCount && v.lost >= 2) {
            leakyStage = stage;
            leakyLossCount = v.lost;
        }
    });
    let surprise: SurpriseCallout | null = null;
    if (leakyStage && (advisorByStage.get(leakyStage) ?? 0) === 0) {
        surprise = {
            tone: "corrective",
            headline: "The stage where you lose the most deals has no outside help logged.",
            body: `${leakyLossCount} losses stopped at "${leakyStage}," and none had a Call in a Favor request. Have the new hire test whether outside support helps there: when a deal reaches ${leakyStage}, ask an investor, advisor, or happy customer to put in a word within 48 hours.`
        };
    } else if (input.advisorDeployments.length === 0 && totalClosed >= 3) {
        surprise = {
            tone: "corrective",
            headline: "You haven't asked your network for help on any deal yet.",
            body: `${input.closedWon.length} wins and ${input.closedLost.length} losses are recorded without a Call in a Favor request. Your investors, advisors, and happy customers are an untested way to move stuck deals. Give the new hire a list of who to ask on day one.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── 5 · Loss patterns ─────────────────────────────────────────────────

export function authorSection5(input: SectionsInput): AuthoredSection {
    const id: SectionId = "losses_paid_for";
    const examined = input.autopsies.filter(
        (a) => a.verdict === "corrected" || a.tasks.some((t) => t.checked)
    );

    if (input.closedLost.length === 0 && input.autopsies.length === 0) {
        return frame(id, "empty", [], [], null);
    }

    if (examined.length === 0) {
        return frame(
            id,
            "partial",
            [
                `${plural(input.closedLost.length, "loss is", "losses are")} recorded, but no deal-risk review has a corrected assessment or completed corrective action. Run a review in Future Autopsy on the most recent loss and write down what not to repeat; that is the lesson a new hire needs most.`
            ],
            [],
            null
        );
    }

    const lostById = new Map<string, DealRecord>();
    input.closedLost.forEach((d) => lostById.set(d.id, d));

    const snapshotById = new Map<string, AutopsySnapshotRecord>();
    input.autopsySnapshots.forEach((snap) => snapshotById.set(snap.dealId, snap));

    const body: string[] = [
        `${plural(examined.length, "deal-risk review has", "deal-risk reviews have")} a corrected assessment or at least one completed corrective action: the cases where you wrote down what not to repeat. Have the new hire read these first. These reviews may include open deals, not just losses.`
    ];
    const killCount = examined.filter((a) => a.killSwitchFired).length;
    if (killCount > 0) {
        body.push(
            `${plural(killCount, "review met", "reviews met")} your criteria for walking away from the deal. Teach the new hire to spot that point and walk away instead of spending more time on a deal that can't be saved.`
        );
    }

    const causeCounts = new Map<string, number>();
    examined.forEach((a) => {
        const label = snapshotById.get(a.dealId)?.topCauseLabel;
        if (label && label.trim().length > 0) {
            causeCounts.set(label, (causeCounts.get(label) ?? 0) + 1);
        }
    });
    const sortedCauses = [...causeCounts.entries()].sort((a, b) => b[1] - a[1]);
    if (sortedCauses.length > 0 && sortedCauses[0]![1] >= 2) {
        const [top, count] = sortedCauses[0]!;
        body.push(
            `"${top}" is the most common top risk in these reviews, on ${count} of ${examined.length}. Have the new hire check for it early on every deal. It's a small sample, so treat it as a warning sign, not the known cause of the losses.`
        );
    }

    const evidence: string[] = [];
    examined.slice(0, 5).forEach((a) => {
        const deal = lostById.get(a.dealId);
        const snap = snapshotById.get(a.dealId);
        const account = deal?.accountName || a.accountName || "An unnamed deal";
        const reason = deal?.lossReason
            ? trim(lossLabel(deal.lossReason), 50)
            : snap?.topCauseLabel
              ? trim(snap.topCauseLabel, 50)
              : "no reason logged";
        const doneCount = a.tasks.filter((t) => t.checked).length;
        evidence.push(
            `${account} · ${reason} · ${plural(doneCount, "corrective action", "corrective actions")}`
        );
    });

    const lostReasons = input.closedLost
        .map((d) => d.lossReason.toLowerCase().trim())
        .filter((r) => r.length > 0);
    const openMatches = new Set<string>();
    input.openDeals.forEach((d) => {
        const next = d.nextStep.toLowerCase();
        const trigger = d.trigger.toLowerCase();
        lostReasons.forEach((reason) => {
            const reasonWords = reason.split(/\s+/).filter((w) => w.length > 4);
            if (reasonWords.some((w) => next.includes(w) || trigger.includes(w))) {
                openMatches.add(d.id);
            }
        });
    });
    let surprise: SurpriseCallout | null = null;
    if (openMatches.size > 0) {
        surprise = {
            tone: "corrective",
            headline: "Some open deals look like deals you've lost before.",
            body: `${plural(openMatches.size, "open deal has", "open deals have")} a keyword overlap between its next step or trigger and a past loss reason. Check those deals this week, before the new hire inherits them. It is a word match, not evidence that the same loss is repeating, so confirm the risk is real.`
        };
    } else if (examined.length >= 3) {
        surprise = {
            tone: "affirming",
            headline: "No open deal looks like a past loss.",
            body: `None of your open deals' next steps or triggers share words with a past loss reason. Keep running deal-risk reviews; a word check won't catch everything.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── 6 · Win patterns ──────────────────────────────────────────────────

export function authorSection6(input: SectionsInput): AuthoredSection {
    const id: SectionId = "why_we_win";

    if (input.closedWon.length === 0) return frame(id, "empty", [], [], null);

    if (input.closedWon.length === 1) {
        const w = input.closedWon[0]!;
        return frame(
            id,
            "partial",
            [
                `One closed-won deal is recorded. ${w.accountName || "The deal"} is a useful story, but one outcome is not enough to infer a repeatable win pattern. The new hire needs a few more wins before "why we win" can be trusted.`
            ],
            [`${w.accountName || "(unnamed)"}: ${profileText(w)}`],
            null
        );
    }

    const personaCounts = new Map<string, number>();
    const triggerCounts = new Map<string, number>();
    input.closedWon.forEach((d) => {
        if (d.persona) personaCounts.set(d.persona, (personaCounts.get(d.persona) ?? 0) + 1);
        if (d.trigger) triggerCounts.set(d.trigger, (triggerCounts.get(d.trigger) ?? 0) + 1);
    });
    const topPersona = [...personaCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topTrigger = [...triggerCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    const body: string[] = [
        `${plural(input.closedWon.length, "closed-won deal is", "closed-won deals are")} recorded. Below is what they have in common; the new hire should look for the same things when choosing accounts. This describes traits the wins share; it does not claim those traits caused the outcomes.`
    ];
    if (topPersona && topPersona[1] >= 2) {
        body.push(
            `"${topPersona[0]}" is the buyer on ${topPersona[1]} of ${input.closedWon.length} wins. Have the new hire go to that role first.`
        );
    }
    if (topTrigger && topTrigger[1] >= 2) {
        body.push(
            `"${topTrigger[0]}" was happening at ${topTrigger[1]} of ${input.closedWon.length} won accounts. Have the new hire watch for it and reach out soon after it shows up.`
        );
    }

    const evidence: string[] = [];
    input.closedWon.slice(0, 5).forEach((d) => {
        evidence.push(`${d.accountName || "(unnamed)"}: ${profileText(d)}`);
    });

    const winningIcps = new Set(
        input.closedWon
            .map((d) => d.icpLabel.toLowerCase().trim())
            .filter((l) => l.length > 0)
    );
    const openIcps = input.openDeals
        .map((d) => d.icpLabel.toLowerCase().trim())
        .filter((l) => l.length > 0);
    const openIcpCounts = new Map<string, number>();
    openIcps.forEach((l) => openIcpCounts.set(l, (openIcpCounts.get(l) ?? 0) + 1));
    const missingFromPipeline = [...winningIcps].filter(
        (i) => (openIcpCounts.get(i) ?? 0) === 0
    );
    let surprise: SurpriseCallout | null = null;
    if (missingFromPipeline.length > 0 && input.openDeals.length > 0) {
        surprise = {
            tone: "corrective",
            headline: "The kind of customer you win is missing from your open pipeline.",
            body: `No current open deal is labeled "${missingFromPipeline[0]}," even though that kind of customer shows up in your wins. Unless you stepped away from it on purpose, point the new hire's prospecting there.`
        };
    } else if (winningIcps.size > 0 && missingFromPipeline.length === 0 && input.openDeals.length > 0) {
        surprise = {
            tone: "affirming",
            headline: "Your open pipeline matches the customers you've won.",
            body: `Every ICP in your wins also shows up in your open deals. Keep the new hire prospecting toward the customers that have already bought.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── 7 · First-week operating cadence ─────────────────────────────────

export function authorSection7(input: SectionsInput): AuthoredSection {
    const id: SectionId = "day_one_rhythm";

    if (!input.quota) return frame(id, "empty", [], [], null);

    // Run Quota Workback's own engine over the same plan inputs the Quota
    // room uses, so this section states the same daily outreach, first
    // meetings, opportunities, and deals. (It used to compute its own
    // annual fallback — e.g. "12 a day" and "2 meetings a week" while the
    // Quota room said 48 a day and 15 first meetings a month.)
    const plan = quotaPlanFor(input.quota);
    const metrics = computeQuotaMetrics(plan, EMPTY_COVERAGE);
    const touchesPerDay = metrics.touchesDay;

    const body: string[] = [
        `To hit the number at the current Quota Workback assumptions, you need ${plural(metrics.dealsYear, "closed-won deal", "closed-won deals")} a year (about ${metrics.dealsQuarter} a quarter), which means about ${plural(metrics.oppsYear, "qualified opportunity", "qualified opportunities")} a year and about ${metrics.meetingsYear} first meetings a year (about ${metrics.meetingsWeek} a week).`,
        `Daily outreach target from Quota Workback: ${touchesPerDay} messages and calls per working day. The new hire's week: Monday, review the top three deal risks on the Dashboard; Tuesday, outbound; Wednesday, discovery prep and calls; Thursday, follow up on stalled deals; Friday, update next steps and set up the next week. Adjust this starting schedule using recorded results.`
    ];

    const evidence: string[] = [
        `Annual quota: $${plan.quota.toLocaleString()}`,
        `Average ACV: $${plan.acv.toLocaleString()}`,
        `Win-rate assumption: ${Math.round(plan.win)}%`,
        `Closed-won deals needed per year: ${metrics.dealsYear}`,
        `Messages and calls per working day: ${touchesPerDay}`,
        `First meetings per month: ${metrics.meetingsMonth}`
    ];

    const recentTouches = input.touches.filter((t) => {
        if (!t.createdAtIso) return false;
        const days = daysAgo(t.createdAtIso);
        return days <= 14;
    });
    const olderTouches = input.touches.filter((t) => {
        if (!t.createdAtIso) return false;
        const days = daysAgo(t.createdAtIso);
        return days > 14 && days <= 60;
    });
    let surprise: SurpriseCallout | null = null;
    if (olderTouches.length >= 8 && recentTouches.length === 0 && input.touches.length > 0) {
        surprise = {
            tone: "corrective",
            headline: "Recent outbound activity is lower than before: outreach was steady, then stopped.",
            body: `${olderTouches.length} outbound touches are recorded from 15–60 days ago and none in the last 14 days. Tell the new hire why it stopped (and whether it was on purpose) so they don't assume the cadence is optional.`
        };
    } else if (
        recentTouches.length === 0 &&
        input.coldCalls.length === 0 &&
        input.cues.length === 0
    ) {
        surprise = {
            tone: "corrective",
            headline: `The plan calls for ${touchesPerDay} outreach actions a day, but none are logged recently.`,
            body: `The plan is only on paper until it happens daily. Log one full week of real outreach before handing the plan to a new hire, so they inherit a real week, not a target.`
        };
    }

    const status = input.openDeals.length > 0 ? "ready" : "partial";
    return frame(id, status, body, evidence, surprise);
}

/**
 * Quota Workback plan inputs for Section 7. Prefers the inputs read with
 * Quota Workback's own loader; otherwise fills the assumptions this bag
 * lacks with Quota Workback's defaults (including the benchmark
 * outreach-to-meeting rate for the deal size), as its loader does.
 */
function quotaPlanFor(q: NonNullable<SectionsInput["quota"]>): PlanInputs {
    if (q.plan) return q.plan;
    const acv = q.acv > 0 ? q.acv : DEFAULT_QUOTA_INPUTS.acv;
    // Quota Workback stores the win rate as a whole-number percent (22);
    // older rows may hold a fraction (0.22).
    const win = q.winRate > 1 ? q.winRate : q.winRate > 0 ? q.winRate * 100 : DEFAULT_QUOTA_INPUTS.win;
    return {
        ...DEFAULT_QUOTA_INPUTS,
        quota: q.quota,
        acv,
        win,
        t2m: quotaBenchmarkFor(acv).t2m,
        cycle: q.cycle > 0 ? q.cycle : DEFAULT_QUOTA_INPUTS.cycle
    };
}

function daysAgo(iso: string): number {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return Infinity;
    return Math.round((Date.now() - t) / 86400000);
}

export function authorAllSections(
    input: SectionsInput
): ReadonlyArray<AuthoredSection> {
    return [
        authorSection1(input),
        authorSection2(input),
        authorSection3(input),
        authorSection4(input),
        authorSection5(input),
        authorSection6(input),
        authorSection7(input)
    ];
}

export function countReady(
    sections: ReadonlyArray<AuthoredSection>
): { ready: number; partial: number; empty: number } {
    let ready = 0;
    let partial = 0;
    let empty = 0;
    sections.forEach((s) => {
        if (s.status === "ready") ready += 1;
        else if (s.status === "partial") partial += 1;
        else empty += 1;
    });
    return { ready, partial, empty };
}

export type { IcpRecord };
