import type {
    AuthoredSection,
    DealRecord,
    IcpRecord,
    SectionId,
    SectionsInput,
    SurpriseCallout
} from "./types";
import { SECTION_KICKER, SECTION_TITLE } from "./types";

/**
 * Section authoring engines — Phase 5.B Wave 3.
 *
 * Per canon §4.19, each section produces:
 *   - 1-3 paragraphs of authored prose (NOT bullet aggregation)
 *   - concrete evidence (deal names, ICP labels, segment text)
 *   - one SURPRISE callout: the cross-room read no single room
 *     can surface alone
 *   - a status (ready / partial / empty) drawn from the underlying
 *     evidence
 *
 * The status logic is deliberately strict: a section is "ready"
 * only when there's enough underlying evidence that the authored
 * paragraph reads as truth, not as a placeholder. "Partial" means
 * there's signal but the section would mislead a hire if read as
 * complete. "Empty" means the workspace hasn't generated the
 * inputs yet.
 *
 * Total section-readiness count drives:
 *   - the topbar maturity band (N/7)
 *   - the readiness gate (Hire-ready, repeatable requires ≥5/7)
 *   - the ceremony moment trigger (set-piece on Building →
 *     Inheritable, only fires once per workspace)
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

// ─── §1 Who hits, who misses, why ─────────────────────────────────────

export function authorSection1(input: SectionsInput): AuthoredSection {
    const id: SectionId = "who_hits";
    const totalClosed = input.closedWon.length + input.closedLost.length;

    if (input.icps.length === 0 && totalClosed === 0) {
        return frame(
            id,
            "empty",
            [],
            [],
            null
        );
    }

    if (input.icps.length === 0 || totalClosed < 2) {
        const body =
            input.icps.length > 0
                ? [
                      `You've named ${plural(input.icps.length, "ICP", "ICPs")} but the workspace hasn't closed enough deals yet to confirm or contradict them. The first hire would inherit a hypothesis, not a pattern.`
                  ]
                : [
                      `You've closed ${plural(totalClosed, "deal", "deals")} without a named ICP. The workspace is going on instinct — repeatable for you, not transferable to a hire.`
                  ];
        return frame(id, "partial", body, [], null);
    }

    // Ready path — we have ICPs AND ≥2 closed deals.
    const wonKeys = input.closedWon.map(dealKey);
    const lostKeys = input.closedLost.map(dealKey);

    const wonPatterns = uniq(wonKeys).slice(0, 3);
    const lostPatterns = uniq(lostKeys).slice(0, 3);

    const body: string[] = [];
    body.push(
        `Out of ${plural(input.closedWon.length, "win", "wins")} and ${plural(input.closedLost.length, "loss", "losses")}, the pattern that closes is concrete — ${plural(wonPatterns.length, "shape", "shapes")} of customer.`
    );
    if (lostPatterns.length > 0) {
        body.push(
            `The losses are not random either — ${plural(lostPatterns.length, "shape", "shapes")} of customer never gets to yes here. A hire should know to disqualify these on intake.`
        );
    }

    const evidence: string[] = [];
    wonPatterns.forEach((p, i) => {
        evidence.push(`Won ${i + 1} · ${p}`);
    });
    lostPatterns.forEach((p, i) => {
        evidence.push(`Lost ${i + 1} · ${p}`);
    });

    // SURPRISE: stated ICP vs actual close pattern mismatch.
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
        actualIcpLabels.length === 0
            ? 1
            : matched.length / actualIcpLabels.length;

    let surprise: SurpriseCallout | null = null;
    if (statedIcpNames.length > 0 && actualIcpLabels.length > 0 && matchRatio < 0.5) {
        const off = Math.round((1 - matchRatio) * 100);
        surprise = {
            tone: "corrective",
            headline: "Your stated ICP doesn't match who actually closes.",
            body: `${off}% of closed-won deals don't match any of your named ICPs. The buyer you say you're going after and the buyer who actually buys are two different shapes. Worth sharpening before the new hire inherits the wrong target.`
        };
    } else if (matchRatio >= 0.8) {
        surprise = {
            tone: "affirming",
            headline: "Your stated ICP is also your actual ICP.",
            body: `Closed-won deals match the ICPs you've named. The hire inherits a clear target — keep it that way.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── §2 The rails that worked ─────────────────────────────────────────

export function authorSection2(input: SectionsInput): AuthoredSection {
    const id: SectionId = "rails_that_worked";
    const totalReach = input.touches.length + input.cues.length + input.coldCalls.length;

    if (totalReach === 0) {
        return frame(id, "empty", [], [], null);
    }

    // Tally by channel.
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
        bumpChannel("linkedin", c.outcome === "replied" || c.outcome === "meeting_booked" || c.outcome === "accepted")
    );
    input.coldCalls.forEach((c) =>
        bumpChannel("phone", c.outcome === "meeting_booked" || c.outcome === "callback_scheduled")
    );

    // Best channel ranked by reply rate (min 3 sends to qualify).
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
                `${plural(totalReach, "touch", "touches")} sent across channels — not enough volume yet to know which rail moves people. A hire would be guessing too.`
            ],
            [],
            null
        );
    }

    const top = ranked[0];
    const body: string[] = [];
    body.push(
        `${top.channel} is the channel that earns replies here. ${top.replied} replies on ${top.sent} sends — a ${Math.round(top.rate * 100)}% rate. The hire should start there and prove every other channel.`
    );

    // Best send-line (longest non-empty + replied outcome).
    const bestLines = input.touches
        .filter(
            (t) =>
                t.outcome === "replied" ||
                t.outcome === "meeting_booked"
        )
        .map((t) => t.sendLine.trim())
        .filter((s) => s.length > 0);
    if (bestLines.length > 0) {
        body.push(
            `The lines that worked share a tone — short, specific, named. Not generic.`
        );
    }

    const evidence: string[] = [];
    ranked.slice(0, 3).forEach((r) => {
        evidence.push(
            `${r.channel} · ${r.replied}/${r.sent} replied · ${Math.round(r.rate * 100)}%`
        );
    });
    bestLines.slice(0, 2).forEach((line) => {
        evidence.push(`Worked: "${trim(line, 90)}"`);
    });

    // SURPRISE: rails not yet tried.
    const triedChannels = new Set(channelCounts.keys());
    const expected = ["email", "linkedin", "phone"];
    const untried = expected.filter((c) => !triedChannels.has(c));
    let surprise: SurpriseCallout | null = null;
    if (untried.length > 0 && totalReach >= 10) {
        surprise = {
            tone: "corrective",
            headline: `You've never tried ${untried.join(" or ")} — the rail might already exist.`,
            body: `Every account in your workspace has been touched on a single channel family. The hire shouldn't have to guess if the unused channels would work — give them a 10-touch pilot and a kill rule.`
        };
    } else if (untried.length === 0) {
        surprise = {
            tone: "affirming",
            headline: "You've stress-tested every channel.",
            body: `Email, LinkedIn, and phone all have enough sends to compare. The hire inherits a real channel mix, not a hunch.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── §3 The questions that earned the next meeting ────────────────────

export function authorSection3(input: SectionsInput): AuthoredSection {
    const id: SectionId = "questions_that_earned";
    const stats = input.discoveryStats;
    const worked = input.discoveryWorked;

    // No discovery activity anywhere (no logged calls, no worked threads,
    // no planned agenda).
    if (!stats && worked.length === 0 && input.callPlanner.length === 0) {
        return frame(id, "empty", [], [], null);
    }

    const totalCalls = stats?.totalCalls ?? 0;
    const advancedCalls = stats?.advancedCalls ?? 0;

    // An agenda is planned but no completed discovery calls are logged yet.
    if (totalCalls === 0) {
        return frame(
            id,
            "partial",
            [
                `Discovery is being planned but no completed calls are logged yet. The hire would inherit an agenda, not a track record of what actually earns the next meeting.`
            ],
            [],
            null
        );
    }

    const advanceRate = Math.round((advancedCalls / totalCalls) * 100);

    const body: string[] = [];
    body.push(
        `${plural(totalCalls, "discovery call", "discovery calls")} logged, ${advancedCalls} of which earned the next meeting — a ${advanceRate}% advance rate. The hire's job is to hold or beat that line.`
    );
    if (worked.length > 0) {
        body.push(
            `Across those calls you keep pulling ${plural(worked.length, "discovery thread", "discovery threads")}. The hire should learn the ones you lean on before improvising new ones.`
        );
    }

    const evidence: string[] = [];
    evidence.push(
        `${advancedCalls} of ${totalCalls} calls advanced · ${advanceRate}%`
    );
    worked.slice(0, 6).forEach((seg) => {
        evidence.push(`Thread worked · ${seg}`);
    });

    // NOTE on §4.19 intent: this section wants to name the specific segments
    // that generated advancedCalls and the segments recent calls skipped.
    // Discovery Studio only persists aggregates — gtmos_discovery_stats
    // (counts) + gtmos_discovery_worked (a lifetime worked-set). There is no
    // per-call segment↔outcome record, so we can't yet tie a thread to an
    // advance or read recency. The honest signal we CAN surface is the
    // advance rate. Fully delivering §3 needs Discovery Studio to persist a
    // per-call record (segments worked + outcome) — flagged, not faked.
    let surprise: SurpriseCallout | null = null;
    if (advancedCalls === 0) {
        surprise = {
            tone: "corrective",
            headline: `Discovery is happening, but it isn't moving deals.`,
            body: `${plural(totalCalls, "call", "calls")} logged and not one has earned a next meeting. Worth figuring out which thread the calls keep missing before the hire arrives.`
        };
    } else if (advanceRate < 33) {
        surprise = {
            tone: "corrective",
            headline: `Most discovery calls aren't advancing.`,
            body: `Only ${advanceRate}% of logged calls earn the next meeting. The threads that move a deal aren't being pulled consistently — worth tightening before the hire learns the loose version.`
        };
    } else if (advanceRate >= 60) {
        surprise = {
            tone: "affirming",
            headline: `Your discovery calls advance more often than not.`,
            body: `A ${advanceRate}% advance rate is a real pattern. Whatever threads you're pulling, the hire should copy them exactly.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── §4 Where deals are won + where they leak ─────────────────────────

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
                `${plural(input.openDeals.length, "open deal", "open deals")} with ${plural(totalClosed, "close", "closes")}. Need more closes to draw a real funnel — currently the workspace is teaching the funnel, not reading it.`
            ],
            [],
            null
        );
    }

    // Reverse-engineer a stage map from the deals we have.
    const stageStops = new Map<
        string,
        { exited: number; advanced: number; lost: number; won: number }
    >();
    function bumpStage(stage: string, kind: "lost" | "won"): void {
        const key = (stage || "—").toLowerCase();
        const cur =
            stageStops.get(key) ??
            { exited: 0, advanced: 0, lost: 0, won: 0 };
        cur.exited += 1;
        if (kind === "lost") cur.lost += 1;
        else cur.won += 1;
        stageStops.set(key, cur);
    }
    input.closedLost.forEach((d) =>
        bumpStage(d.stage === "closed-lost" ? "—" : d.stage, "lost")
    );
    input.closedWon.forEach(() => bumpStage("closed-won", "won"));

    const advisorByStage = new Map<string, number>();
    input.advisorDeployments.forEach((dep) => {
        // We don't have stage on the deployment record itself — so we
        // look at the deal it's attached to.
        const deal = [...input.openDeals, ...input.closedWon, ...input.closedLost].find(
            (d) => d.accountName.toLowerCase() === dep.accountName.toLowerCase()
        );
        if (!deal) return;
        const k = deal.stage.toLowerCase();
        advisorByStage.set(k, (advisorByStage.get(k) ?? 0) + 1);
    });

    const winRate =
        totalClosed > 0
            ? Math.round((input.closedWon.length / totalClosed) * 100)
            : 0;

    const body: string[] = [];
    body.push(
        `Win rate is ${winRate}% across ${plural(totalClosed, "close", "closes")}. The losses cluster by stage — that's where the leak is, and that's where a hire's first 30-day diagnosis should focus.`
    );
    if (input.advisorDeployments.length > 0) {
        body.push(
            `Advisor leverage has been deployed ${plural(input.advisorDeployments.length, "time", "times")}. The hire should know which stage benefits most — and which stage you've been trying to brute-force without backup.`
        );
    }

    const evidence: string[] = [];
    [...stageStops.entries()]
        .sort((a, b) => b[1].exited - a[1].exited)
        .slice(0, 5)
        .forEach(([stage, v]) => {
            const advisorCount = advisorByStage.get(stage) ?? 0;
            evidence.push(
                `${stage} · ${v.won} won · ${v.lost} lost · ${advisorCount} advisor moves`
            );
        });

    // SURPRISE: leaky stage callout with advisor coverage gap.
    let leakyStage: string | null = null;
    let leakyLossCount = 0;
    [...stageStops.entries()].forEach(([stage, v]) => {
        if (v.lost > leakyLossCount && v.lost >= 2) {
            leakyStage = stage;
            leakyLossCount = v.lost;
        }
    });
    let surprise: SurpriseCallout | null = null;
    if (leakyStage && (advisorByStage.get(leakyStage) ?? 0) === 0) {
        surprise = {
            tone: "corrective",
            headline: `The stage that loses most has zero advisor coverage.`,
            body: `${leakyLossCount} losses in "${leakyStage}" — not one of them got an advisor deployed before close. The hire should treat this stage as the rule: anyone reaching ${leakyStage} gets a backchannel touch within 48 hours.`
        };
    } else if (input.advisorDeployments.length === 0 && totalClosed >= 3) {
        surprise = {
            tone: "corrective",
            headline: `You've never spent advisor leverage. That's free pipeline left on the table.`,
            body: `${input.closedWon.length} wins and ${input.closedLost.length} losses without a single advisor touch logged. The hire shouldn't inherit the same blindspot — give them a rolodex on day one.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── §5 The losses we paid for ────────────────────────────────────────

export function authorSection5(input: SectionsInput): AuthoredSection {
    const id: SectionId = "losses_paid_for";
    // Future Autopsy persists task completion, not a verdict — the room
    // regenerates verdict / kill-switch / cause at render time from the
    // deal, and none of that is durable. So §5 leans on what IS durable:
    // the loss + its reason (from closed-lost deals) and the commitments
    // the operator wrote down (checked autopsy tasks). A loss counts as
    // "examined" when its autopsy carries ≥1 checked task — or, for legacy
    // data, an explicit "corrected" verdict.
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
                `${plural(input.closedLost.length, "loss", "losses")} on record, but none have been through a forensic step. Losses without a postmortem become folklore — the hire would inherit the folklore, not the lesson.`
            ],
            [],
            null
        );
    }

    // Resolve each examined autopsy to its lost deal (the autopsy log is
    // keyed by deal id) so we can show the real account + loss reason.
    const lostById = new Map<string, DealRecord>();
    input.closedLost.forEach((d) => lostById.set(d.id, d));

    const body: string[] = [];
    body.push(
        `${plural(examined.length, "loss", "losses")} the workspace actually examined — the ones where you ran the postmortem and wrote down what not to repeat. These are the lessons the hire should read first.`
    );
    const killCount = examined.filter((a) => a.killSwitchFired).length;
    if (killCount > 0) {
        body.push(
            `${plural(killCount, "deal", "deals")} also fired a kill switch — the moment something irrecoverable showed up and the right move was to walk. The hire needs the same instinct.`
        );
    }

    const evidence: string[] = [];
    examined.slice(0, 5).forEach((a) => {
        const deal = lostById.get(a.dealId);
        const account = deal?.accountName || a.accountName || a.dealId;
        const reason = deal?.lossReason
            ? trim(deal.lossReason, 50)
            : "no reason logged";
        const doneCount = a.tasks.filter((t) => t.checked).length;
        evidence.push(
            `${account} · ${reason} · ${plural(doneCount, "commitment", "commitments")}`
        );
    });

    // SURPRISE: cross-reference loss reasons with current open deals.
    const lostReasons = input.closedLost
        .map((d) => d.lossReason.toLowerCase().trim())
        .filter((r) => r.length > 0);
    const openMatches: string[] = [];
    input.openDeals.forEach((d) => {
        const next = d.nextStep.toLowerCase();
        const trigger = d.trigger.toLowerCase();
        const acct = d.accountName;
        lostReasons.forEach((reason) => {
            const reasonWords = reason.split(/\s+/).filter((w) => w.length > 4);
            if (
                reasonWords.some(
                    (w) => next.includes(w) || trigger.includes(w)
                )
            ) {
                openMatches.push(`${acct} · matches "${trim(reason, 50)}"`);
            }
        });
    });
    let surprise: SurpriseCallout | null = null;
    if (openMatches.length > 0) {
        surprise = {
            tone: "corrective",
            headline: `Open deals are showing the symptoms of past losses.`,
            body: `${plural(openMatches.length, "open deal matches", "open deals match")} a closed-loss reason word-for-word. The same trap is still in front of you. Worth surfacing before the hire walks them straight into it.`
        };
    } else if (examined.length >= 3) {
        surprise = {
            tone: "affirming",
            headline: "Your losses are documented and disjoint from current pipeline.",
            body: `Past losses don't pattern-match anything currently open. The forensic discipline is paying off.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── §6 Why we win ────────────────────────────────────────────────────

export function authorSection6(input: SectionsInput): AuthoredSection {
    const id: SectionId = "why_we_win";

    if (input.closedWon.length === 0) {
        return frame(id, "empty", [], [], null);
    }

    if (input.closedWon.length === 1) {
        const w = input.closedWon[0];
        return frame(
            id,
            "partial",
            [
                `One win is an anecdote. ${w.accountName || "The deal"} closed — that's a story, not a pattern. The hire needs more wins before "why we win" can be more than a single trace.`
            ],
            [`${w.accountName} · ${dealKey(w)}`],
            null
        );
    }

    // Find shared traits.
    const personaCounts = new Map<string, number>();
    const triggerCounts = new Map<string, number>();
    const icpCounts = new Map<string, number>();
    input.closedWon.forEach((d) => {
        if (d.persona)
            personaCounts.set(d.persona, (personaCounts.get(d.persona) ?? 0) + 1);
        if (d.trigger)
            triggerCounts.set(d.trigger, (triggerCounts.get(d.trigger) ?? 0) + 1);
        if (d.icpLabel)
            icpCounts.set(d.icpLabel, (icpCounts.get(d.icpLabel) ?? 0) + 1);
    });
    const topPersona = [...personaCounts.entries()].sort(
        (a, b) => b[1] - a[1]
    )[0];
    const topTrigger = [...triggerCounts.entries()].sort(
        (a, b) => b[1] - a[1]
    )[0];

    const body: string[] = [];
    body.push(
        `${plural(input.closedWon.length, "win", "wins")} on record — and they share a shape. The wins look like each other in ways the losses don't.`
    );
    if (topPersona && topPersona[1] >= 2) {
        body.push(
            `${topPersona[1]} of the ${input.closedWon.length} wins were sold to "${topPersona[0]}". That's the buyer the hire should learn to recognize on a first call.`
        );
    }
    if (topTrigger && topTrigger[1] >= 2) {
        body.push(
            `${topTrigger[1]} of the wins came in with the same trigger — "${topTrigger[0]}". This is the moment a buyer is most ready to say yes; teach the hire to spot it.`
        );
    }

    const evidence: string[] = [];
    input.closedWon.slice(0, 5).forEach((d) => {
        evidence.push(`${d.accountName || "(unnamed)"} · ${dealKey(d)}`);
    });

    // SURPRISE: under-represented winning pattern in current open pipeline.
    const winningIcps = new Set(
        input.closedWon
            .map((d) => d.icpLabel.toLowerCase().trim())
            .filter((l) => l.length > 0)
    );
    const openIcps = input.openDeals
        .map((d) => d.icpLabel.toLowerCase().trim())
        .filter((l) => l.length > 0);
    const openIcpCounts = new Map<string, number>();
    openIcps.forEach((l) =>
        openIcpCounts.set(l, (openIcpCounts.get(l) ?? 0) + 1)
    );
    const missingFromPipeline = [...winningIcps].filter(
        (i) => (openIcpCounts.get(i) ?? 0) === 0
    );
    let surprise: SurpriseCallout | null = null;
    if (missingFromPipeline.length > 0 && input.openDeals.length > 0) {
        surprise = {
            tone: "corrective",
            headline: `The shape that wins is missing from your current pipeline.`,
            body: `Open deals don't include any "${missingFromPipeline[0]}" — the segment that's closed for you. The hire should know to bias new prospecting toward what's worked, not toward what's ambient.`
        };
    } else if (missingFromPipeline.length === 0 && input.openDeals.length > 0) {
        surprise = {
            tone: "affirming",
            headline: "Current pipeline mirrors the winning shape.",
            body: `Every open deal lines up with an ICP that's already won here. The hire inherits a pipeline already biased toward repeat patterns.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── §7 What the first week looks like ────────────────────────────────

export function authorSection7(input: SectionsInput): AuthoredSection {
    const id: SectionId = "day_one_rhythm";

    if (!input.quota) {
        return frame(id, "empty", [], [], null);
    }

    const acv = input.quota.acv > 0 ? input.quota.acv : 50000;
    const winRate = input.quota.winRate > 0 ? input.quota.winRate : 0.2;
    const dealsNeeded = Math.ceil(input.quota.quota / acv);
    const oppsNeeded = Math.ceil(dealsNeeded / winRate);
    const meetingsPerWeek = Math.max(2, Math.round(oppsNeeded / 26));
    const touchesPerDay = input.quota.touchesPerDay ?? Math.max(8, meetingsPerWeek * 6);

    const body: string[] = [];
    body.push(
        `The math says ${dealsNeeded} deals to hit the number. At the current win rate, that's ${oppsNeeded} qualified opportunities — about ${meetingsPerWeek} discovery meetings a week, every week, for the year.`
    );
    body.push(
        `That backsolves to ${touchesPerDay} touches a day. The day-one rhythm: Monday top-3 risks on the dashboard, Tuesday is outbound day, Wednesday discovery prep + calls, Thursday recovery on stalled deals, Friday next-week setup.`
    );

    const evidence: string[] = [
        `Annual quota: $${input.quota.quota.toLocaleString()}`,
        `Average ACV: $${acv.toLocaleString()}`,
        `Win rate: ${Math.round(winRate * 100)}%`,
        `Deals needed: ${dealsNeeded}`,
        `Touches per day: ${touchesPerDay}`,
        `Meetings per week: ${meetingsPerWeek}`
    ];

    // SURPRISE: what the founder tried that didn't stick.
    // Heuristic: look for a recent dropoff in any of the activity logs.
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
    if (
        olderTouches.length >= 8 &&
        recentTouches.length === 0 &&
        input.touches.length > 0
    ) {
        surprise = {
            tone: "corrective",
            headline: `Outbound used to be on, then went quiet.`,
            body: `${olderTouches.length} touches in the last 60 days, none in the last 14. Whatever the rhythm was, it broke. Worth telling the hire what stopped working before they assume the cadence is voluntary.`
        };
    } else if (
        recentTouches.length === 0 &&
        input.coldCalls.length === 0 &&
        input.cues.length === 0
    ) {
        surprise = {
            tone: "corrective",
            headline: `The math says ${touchesPerDay}/day. Nothing has been logged this week.`,
            body: `The plan is theoretical until it's daily. The hire shouldn't inherit a planning artifact disguised as a real week — get one full week on the board first.`
        };
    }

    const status = input.openDeals.length > 0 ? "ready" : "partial";
    return frame(id, status, body, evidence, surprise);
}

function daysAgo(iso: string): number {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return Infinity;
    return Math.round((Date.now() - t) / 86400000);
}

// ─── Aggregate ────────────────────────────────────────────────────────

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

/** Helper for tests + Wave 4: how many sections passed the readiness bar? */
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

// Re-export types used by this file only (for downstream test convenience).
export type { IcpRecord };
