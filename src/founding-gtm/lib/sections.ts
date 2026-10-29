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
                      `You've defined ${plural(input.icps.length, "ICP", "ICPs")}, but only ${plural(totalClosed, "closed deal is", "closed deals are")} recorded. That is not enough outcome history to evaluate whether the stated ICP matches the customers in the closed-deal sample.`
                  ]
                : [
                      `${plural(totalClosed, "closed deal is", "closed deals are")} recorded without a named ICP. A new seller would have outcome history but no explicit targeting definition to compare it with.`
                  ];
        return frame(id, "partial", body, [], null);
    }

    const wonKeys = input.closedWon.map(dealKey);
    const lostKeys = input.closedLost.map(dealKey);
    const wonPatterns = uniq(wonKeys).slice(0, 3);
    const lostPatterns = uniq(lostKeys).slice(0, 3);

    const body: string[] = [
        `The recorded sample contains ${plural(input.closedWon.length, "win", "wins")} and ${plural(input.closedLost.length, "loss", "losses")}. Closed-won deals contain ${plural(wonPatterns.length, "distinct customer profile", "distinct customer profiles")} based on the ICP, persona, and trigger fields currently recorded.`
    ];
    if (lostPatterns.length > 0) {
        body.push(
            `Closed-lost deals contain ${plural(lostPatterns.length, "distinct profile", "distinct profiles")}. Treat those profiles as disqualification hypotheses to review, not as proof that the profile caused the loss.`
        );
    }

    const evidence: string[] = [];
    wonPatterns.forEach((p, i) => evidence.push(`Won ${i + 1} · ${p}`));
    lostPatterns.forEach((p, i) => evidence.push(`Lost ${i + 1} · ${p}`));

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
            headline: "The stated ICP does not match most recorded closed-won ICP labels.",
            body: `${off}% of closed-won deals with an ICP label do not match the names of the current ICPs. Review whether the ICP definition or the historical deal labeling needs to change before using this as a handoff rule.`
        };
    } else if (matchRatio >= 0.8 && actualIcpLabels.length > 0) {
        surprise = {
            tone: "affirming",
            headline: "The current ICP aligns with most recorded closed-won ICP labels.",
            body: `${Math.round(matchRatio * 100)}% of closed-won deals with an ICP label match a current ICP name. Preserve that alignment as new outcome data is added.`
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
        `${top.channel} has the highest observed response rate in the current sample: ${top.replied} response outcomes on ${top.sent} recorded attempts (${Math.round(top.rate * 100)}%). Use that as a starting hypothesis for the next seller, then keep measuring it as volume grows.`
    ];

    const bestLines = input.touches
        .filter((t) => t.outcome === "replied" || t.outcome === "meeting_booked")
        .map((t) => t.sendLine.trim())
        .filter((s) => s.length > 0);
    if (bestLines.length > 0) {
        body.push(
            `The messages below were used on outreach records that received a reply or booked meeting. The sample shows association with those outcomes; it does not establish that the wording caused them.`
        );
    }

    const evidence: string[] = [];
    ranked.slice(0, 3).forEach((r) => {
        evidence.push(
            `${r.channel} · ${r.replied}/${r.sent} response outcomes · ${Math.round(r.rate * 100)}%`
        );
    });
    bestLines.slice(0, 2).forEach((line) => {
        evidence.push(`Used on a responding record: "${trim(line, 90)}"`);
    });

    const triedChannels = new Set(channelCounts.keys());
    const expected = ["email", "linkedin", "phone"];
    const untried = expected.filter((c) => !triedChannels.has(c));
    let surprise: SurpriseCallout | null = null;
    if (untried.length > 0 && totalReach >= 10) {
        surprise = {
            tone: "corrective",
            headline: `There is no recorded test of ${untried.join(" or ")}.`,
            body: `The current data cannot compare the unused channel${untried.length > 1 ? "s" : ""} with the channels already in use. Run a small measured test before turning the existing channel mix into a handoff rule.`
        };
    } else if (untried.length === 0) {
        surprise = {
            tone: "affirming",
            headline: "Email, LinkedIn, and phone all have recorded activity.",
            body: `The handoff can compare observed response rates across all three channel families instead of relying on an untested channel assumption.`
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
            `${plural(totalLogged, "discovery call is", "discovery calls are")} logged. ${advancedCount} are recorded with the outcome "advanced," for an observed advance rate of ${advanceRate}%.`
        ];
        if (advancingSegments.length > 0) {
            const top = advancingSegments[0]!;
            const topShare = Math.round((top[1] / Math.max(1, advancedCount)) * 100);
            body.push(
                `"${top[0]}" appears on ${topShare}% of the recorded calls that advanced, more often than any other recorded discovery segment. Treat it as a pattern to test and teach, not as proof that the segment caused progression.`
            );
        }

        const evidence: string[] = [
            `${advancedCount} of ${totalLogged} calls recorded as advanced · ${advanceRate}%`
        ];
        advancingSegments.slice(0, 5).forEach(([seg, count]) => {
            evidence.push(`${seg} · present on ${count} advanced calls`);
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
                headline: "Some discovery segments associated with prior advanced calls are absent from the last five calls.",
                body: `${plural(droppedSegments.length, "segment", "segments")} appeared on earlier advanced calls but not in the five most recent records: ${droppedSegments.slice(0, 3).join(", ")}. Review whether that change is intentional before documenting the current approach for a new seller.`
            };
        } else if (advancedCount === 0) {
            surprise = {
                tone: "corrective",
                headline: "No logged discovery call currently has an advanced outcome.",
                body: `${plural(totalLogged, "call is", "calls are")} logged. Review the question flow, qualification, and next-step process before presenting the current discovery pattern as repeatable.`
            };
        } else if (advanceRate < 33) {
            surprise = {
                tone: "corrective",
                headline: "Fewer than one third of logged discovery calls are recorded as advanced.",
                body: `The current observed advance rate is ${advanceRate}%. Review the calls that advanced and the calls that did not before turning any one question pattern into a handoff rule.`
            };
        } else if (advanceRate >= 60) {
            surprise = {
                tone: "affirming",
                headline: "Most logged discovery calls are recorded as advanced.",
                body: `The current observed advance rate is ${advanceRate}%. Preserve the question patterns and qualification practices used on those calls, then continue measuring the relationship as the sample grows.`
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
                `Discovery planning exists, but no completed discovery calls are recorded yet. A new seller would inherit a planned approach without outcome history.`
            ],
            [],
            null
        );
    }

    const advanceRate = Math.round((advancedCalls / totalCalls) * 100);
    const body: string[] = [
        `${plural(totalCalls, "discovery call is", "discovery calls are")} logged. ${advancedCalls} are recorded as advanced, for an observed advance rate of ${advanceRate}%.`
    ];
    if (worked.length > 0) {
        body.push(
            `${plural(worked.length, "discovery segment is", "discovery segments are")} recorded as part of the current approach. Preserve them as the current playbook while collecting more per-call evidence about which combinations appear on progressed calls.`
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
            body: `${plural(totalCalls, "call is", "calls are")} logged. Review the current discovery approach before treating it as a repeatable handoff pattern.`
        };
    } else if (advanceRate < 33) {
        surprise = {
            tone: "corrective",
            headline: "Fewer than one third of logged discovery calls are recorded as advanced.",
            body: `The current observed advance rate is ${advanceRate}%. Treat the existing question set as a hypothesis to improve, not as a proven formula.`
        };
    } else if (advanceRate >= 60) {
        surprise = {
            tone: "affirming",
            headline: "Most logged discovery calls are recorded as advanced.",
            body: `The current observed advance rate is ${advanceRate}%. Preserve the approach as a documented starting point and continue measuring it.`
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
                `${plural(input.openDeals.length, "open deal is", "open deals are")} recorded with only ${plural(totalClosed, "closed deal", "closed deals")}. There is not enough closed-deal history to describe a stage pattern reliably.`
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

    const body: string[] = [
        `The recorded closed-deal sample contains ${plural(input.closedWon.length, "win", "wins")} and ${plural(input.closedLost.length, "loss", "losses")}, an observed win rate of ${winRate}%. Review the stages attached to lost deals as places to investigate; the stage record alone does not establish why the deals were lost.`
    ];
    if (input.advisorDeployments.length > 0) {
        body.push(
            `${plural(input.advisorDeployments.length, "Call in a Favor request is", "Call in a Favor requests are")} recorded. Compare their stage distribution with deal outcomes before turning outside support into a stage-specific rule.`
        );
    }

    const evidence: string[] = [];
    [...stageStops.entries()]
        .sort((a, b) => b[1].exited - a[1].exited)
        .slice(0, 5)
        .forEach(([stage, v]) => {
            const advisorCount = advisorByStage.get(stage) ?? 0;
            evidence.push(
                `${stage} · ${v.won} won · ${v.lost} lost · ${advisorCount} outside-support requests`
            );
        });

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
            headline: "The stage associated with the most recorded losses has no outside-support requests logged.",
            body: `${leakyLossCount} recorded losses share the stage "${leakyStage}," and no Call in a Favor request is associated with that stage in the current sample. Test whether outside support helps there before making it a required play.`
        };
    } else if (input.advisorDeployments.length === 0 && totalClosed >= 3) {
        surprise = {
            tone: "corrective",
            headline: "No outside-support requests are recorded across the closed-deal sample.",
            body: `${input.closedWon.length} wins and ${input.closedLost.length} losses are recorded without a Call in a Favor request. A new seller should know that this channel is currently untested rather than assume it is ineffective.`
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
                `${plural(input.closedLost.length, "loss is", "losses are")} recorded, but no deal-risk review with a completed corrective action is recorded. A new seller would have loss outcomes without a documented review of the associated conditions.`
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
        `${plural(examined.length, "recorded loss has", "recorded losses have")} a deal-risk review with at least one corrective action logged. Use these as documented examples of risk conditions that were present around lost deals, not as proof that those conditions caused the loss.`
    ];
    const killCount = examined.filter((a) => a.killSwitchFired).length;
    if (killCount > 0) {
        body.push(
            `${plural(killCount, "review met", "reviews met")} the configured criteria for considering closure. Preserve the criteria and the final decision separately so a new seller can see both the model output and what actually happened.`
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
            `"${top}" is the most frequently recorded top risk condition in this reviewed-loss sample, appearing on ${count} of ${examined.length}. Treat that frequency as a condition to watch for, not as a causal explanation of the losses.`
        );
    }

    const evidence: string[] = [];
    examined.slice(0, 5).forEach((a) => {
        const deal = lostById.get(a.dealId);
        const snap = snapshotById.get(a.dealId);
        const account = deal?.accountName || a.accountName || a.dealId;
        const reason = deal?.lossReason
            ? trim(deal.lossReason, 50)
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
    const openMatches: string[] = [];
    input.openDeals.forEach((d) => {
        const next = d.nextStep.toLowerCase();
        const trigger = d.trigger.toLowerCase();
        const acct = d.accountName;
        lostReasons.forEach((reason) => {
            const reasonWords = reason.split(/\s+/).filter((w) => w.length > 4);
            if (reasonWords.some((w) => next.includes(w) || trigger.includes(w))) {
                openMatches.push(`${acct} · keyword overlap with "${trim(reason, 50)}"`);
            }
        });
    });
    let surprise: SurpriseCallout | null = null;
    if (openMatches.length > 0) {
        surprise = {
            tone: "corrective",
            headline: "Some open-deal text overlaps with recorded loss-reason language.",
            body: `${plural(openMatches.length, "open deal has", "open deals have")} a keyword overlap between current next-step/trigger text and a historical loss reason. This is a text match for review, not evidence that the same loss pattern is repeating.`
        };
    } else if (examined.length >= 3) {
        surprise = {
            tone: "affirming",
            headline: "No simple keyword overlap was found between current open deals and recorded loss reasons.",
            body: `The current text check found no shared loss-reason keyword in open-deal next steps or triggers. That does not establish that the underlying risks are absent; continue using the deal-risk review.`
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
                `One closed-won deal is recorded. ${w.accountName || "The deal"} is a useful example, but one outcome is not enough to infer a repeatable win pattern.`
            ],
            [`${w.accountName} · ${dealKey(w)}`],
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
        `${plural(input.closedWon.length, "closed-won deal is", "closed-won deals are")} recorded. The handoff below describes recurring traits within those wins; it does not claim those traits caused the outcomes.`
    ];
    if (topPersona && topPersona[1] >= 2) {
        body.push(
            `"${topPersona[0]}" is the most frequently recorded persona among the wins, appearing on ${topPersona[1]} of ${input.closedWon.length}. Use that frequency as a prospecting hypothesis to keep testing.`
        );
    }
    if (topTrigger && topTrigger[1] >= 2) {
        body.push(
            `"${topTrigger[0]}" is the most frequently recorded trigger among the wins, appearing on ${topTrigger[1]} of ${input.closedWon.length}. It is a recurring context in the current sample, not proof of buyer readiness by itself.`
        );
    }

    const evidence: string[] = [];
    input.closedWon.slice(0, 5).forEach((d) => {
        evidence.push(`${d.accountName || "(unnamed)"} · ${dealKey(d)}`);
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
            headline: "A closed-won ICP label is absent from the current open pipeline.",
            body: `No current open deal is labeled "${missingFromPipeline[0]}," although that label appears in the closed-won sample. Review whether that reflects an intentional territory choice or a prospecting gap.`
        };
    } else if (missingFromPipeline.length === 0 && input.openDeals.length > 0) {
        surprise = {
            tone: "affirming",
            headline: "Current open deals include the ICP labels represented in the closed-won sample.",
            body: `Every ICP label represented in the recorded wins also appears in the current open pipeline. Continue measuring outcomes before treating that alignment as evidence of higher win probability.`
        };
    }

    return frame(id, "ready", body, evidence, surprise);
}

// ─── 7 · First-week operating cadence ─────────────────────────────────

export function authorSection7(input: SectionsInput): AuthoredSection {
    const id: SectionId = "day_one_rhythm";

    if (!input.quota) return frame(id, "empty", [], [], null);

    const acv = input.quota.acv > 0 ? input.quota.acv : 50000;
    const winRate = input.quota.winRate > 0 ? input.quota.winRate : 0.2;
    const dealsNeeded = Math.ceil(input.quota.quota / acv);
    const oppsNeeded = Math.ceil(dealsNeeded / winRate);
    const meetingsPerWeek = Math.max(2, Math.round(oppsNeeded / 26));
    const touchesPerDay = input.quota.touchesPerDay ?? Math.max(8, meetingsPerWeek * 6);

    const body: string[] = [
        `Using the current quota assumptions, the model requires ${dealsNeeded} closed deals and approximately ${oppsNeeded} qualified opportunities. The current planning formula translates that to about ${meetingsPerWeek} discovery meetings per week.`,
        `The recorded daily outreach target is ${touchesPerDay}. A practical first-week cadence is: Monday review pipeline and deal risk; Tuesday outbound; Wednesday discovery preparation and calls; Thursday follow-up on stalled deals; Friday update next steps and prepare the following week. Treat the cadence as an operating starting point, not as a claim that this schedule causes quota attainment.`
    ];

    const evidence: string[] = [
        `Annual quota: $${input.quota.quota.toLocaleString()}`,
        `Average ACV: $${acv.toLocaleString()}`,
        `Win-rate assumption: ${Math.round(winRate * 100)}%`,
        `Deals required by model: ${dealsNeeded}`,
        `Touches per day: ${touchesPerDay}`,
        `Meetings per week: ${meetingsPerWeek}`
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
            headline: "Recent outbound activity is lower than the earlier recorded period.",
            body: `${olderTouches.length} outbound touches are recorded from 15–60 days ago and none in the last 14 days. Document whether that change is intentional before presenting the current cadence to a new seller.`
        };
    } else if (
        recentTouches.length === 0 &&
        input.coldCalls.length === 0 &&
        input.cues.length === 0
    ) {
        surprise = {
            tone: "corrective",
            headline: `The plan calls for ${touchesPerDay} outreach actions per day, but no recent activity is recorded.`,
            body: `Treat the daily target as a planning assumption until actual activity is logged and compared with meetings and pipeline created.`
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
