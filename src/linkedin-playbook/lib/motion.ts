import {
    EMPTY_ACCOUNT_COUNTS,
    type AccountCounts,
    type ChannelStats,
    type CueIndex,
    type Motion,
    type MotionContext
} from "./types";
import { findCue } from "./cues";

/**
 * LinkedIn recommendation engine.
 *
 * Existing motion keys are retained for compatibility. User-facing text is
 * derived from recorded facts: whether an account has a current signal,
 * whether a LinkedIn engagement/request/DM is logged, and whether a recent
 * outbound touch exists. No fixed acceptance/reply benchmark is asserted.
 */

const NO_FIXED_THRESHOLD =
    "No fixed acceptance or reply benchmark is configured. Review your recorded rates over a meaningful sample.";

function accountCountsFor(
    accountName: string | null | undefined,
    stats: ChannelStats
): AccountCounts {
    if (!accountName) return EMPTY_ACCOUNT_COUNTS;
    const key = accountName.trim().toLowerCase();
    if (!key) return EMPTY_ACCOUNT_COUNTS;
    return stats.byAccount[key] ?? EMPTY_ACCOUNT_COUNTS;
}

/**
 * Align the per-account action counts the recommendation reads with the
 * sequence steps the room shows as logged. The step rail is built from
 * each logged action's step name (cueLabel); the counts come from its
 * actionType. When the two disagree (older or seeded logs), the room used
 * to say "step 4: a connection request is logged" and then "why: no
 * connection request is logged". When any step is logged for the
 * account, the counts are taken from the logged steps (each step counts as
 * its step's action type), so the reason and the step rail agree.
 */
export function statsWithLoggedSteps(
    stats: ChannelStats,
    accountName: string | null | undefined,
    doneSteps: ReadonlySet<CueIndex>
): ChannelStats {
    if (!accountName) return stats;
    const key = accountName.trim().toLowerCase();
    if (!key) return stats;
    const fromSteps = { content_engage: 0, connection_request: 0, dm: 0 };
    doneSteps.forEach((i) => {
        const action = findCue(i).action;
        if (action === "content_engage" || action === "connection_request" || action === "dm") {
            fromSteps[action] += 1;
        }
    });
    if (doneSteps.size === 0) return stats;
    return {
        ...stats,
        byAccount: { ...stats.byAccount, [key]: fromSteps }
    };
}

export function deriveMotion(ctx: MotionContext): Motion {
    const highestPriority = ctx.hottestAccount;
    const touch = ctx.latestTouch;
    const stats = ctx.stats;
    const acct = accountCountsFor(highestPriority?.name, stats);

    let motion: Motion = {
        key: "credibility",
        label: "Build familiarity before making a meeting request.",
        actionType: "content_engage",
        whyNow:
            "No account-specific LinkedIn action is required by the current data. Start with a relevant public interaction before making a meeting request.",
        oneSession:
            "Review a relevant post from one target account and leave one substantive comment if you have something useful to add.",
        nextMove:
            "After a useful public interaction is logged, decide whether a connection request is appropriate.",
        thresholds: NO_FIXED_THRESHOLD,
        accountName: highestPriority?.name ?? touch?.accountName ?? "",
        context:
            "No current account signal or LinkedIn request state is determining the next action.",
        cueIndex: 1,
        recovery:
            "If you do not have a useful contribution to make, do not force a comment. Wait for a more relevant post or use another outreach channel."
    };

    // Current signal exists and no connection request is logged.
    if (highestPriority && acct.connection_request === 0) {
        const heatSuffix = highestPriority.heat ? ` Priority score ${highestPriority.heat} out of 99.` : "";
        motion = {
            ...motion,
            key: "warm_signal_account",
            label: "Use a relevant public interaction before the connection request.",
            whyNow: `Signal Console has a current signal for ${highestPriority.name}, and no LinkedIn connection request is logged for the account.`,
            oneSession:
                "Review one relevant post from the account or contact. Comment only when you have a specific, useful observation to add.",
            nextMove:
                "After a substantive public interaction, decide whether to send a connection request tied to the relevant topic.",
            context: `${highestPriority.name} has a current Signal Console priority.${heatSuffix}`,
            cueIndex: (acct.content_engage > 0 ? 2 : 1) as CueIndex,
            recovery: `If your interpretation of ${highestPriority.name}'s situation is corrected, update the account context and use the corrected information in later outreach.`
        };
        return motion;
    }

    // Connection request exists, but no DM is logged.
    if (highestPriority && acct.connection_request > 0 && acct.dm === 0) {
        motion = {
            ...motion,
            key: "convert_connection",
            label: "A connection request is logged; no direct message is logged yet.",
            actionType: "dm",
            whyNow: `A LinkedIn connection request is already logged for ${highestPriority.name}, and no direct message is recorded for the account.`,
            oneSession:
                "If the connection is accepted and you have something relevant to send, send one concise message tied to the account context.",
            nextMove:
                "If there is no response, do not manufacture another reason to message. Return to the broader outreach plan and wait for new context.",
            context: `LinkedIn activity for ${highestPriority.name} includes a connection request and no recorded DM.`,
            cueIndex: 3,
            recovery:
                "If the direct message gets no response, avoid repeated LinkedIn follow-ups unless new account context gives you a specific reason."
        };
        return motion;
    }

    // Connection request and direct message both logged: the last step is
    // a short meeting request, when there is a specific topic.
    // Keeps the default motion key (it is not the "send a DM" branch); only
    // the wording reflects the logged state.
    if (highestPriority && acct.connection_request > 0 && acct.dm > 0) {
        motion = {
            ...motion,
            key: "credibility",
            label: "A connection request and a direct message are logged.",
            actionType: "dm",
            whyNow: `A LinkedIn connection request and a direct message are already logged for ${highestPriority.name}. The remaining step is a short meeting request, and only when there is a specific topic to discuss.`,
            oneSession:
                "If the contact responded to your message, ask for a short meeting about that specific topic.",
            nextMove:
                "If there is no response, stop the LinkedIn sequence and continue the account's broader outreach plan.",
            context: `LinkedIn activity for ${highestPriority.name} includes a connection request and a direct message.`,
            cueIndex: 4,
            recovery:
                "If the contact did not respond, do not send a meeting request on LinkedIn. Use another channel when there is a new reason to reach out."
        };
        return motion;
    }

    // No higher-priority signal account, but a recent outbound touch exists.
    if (touch && touch.accountName) {
        motion = {
            ...motion,
            key: "add_air_cover",
            label: "A recent outbound touch exists; consider one relevant LinkedIn action.",
            actionType: "content_share",
            whyNow: `A recent outbound touch is recorded for ${touch.accountName}. LinkedIn can support that outreach when there is a relevant public interaction available.`,
            oneSession:
                "Review the account or contact on LinkedIn. Engage only if there is a relevant post or useful information to share.",
            nextMove:
                "After the LinkedIn action is logged, continue the account's broader outreach plan.",
            accountName: touch.accountName,
            context: `The latest recorded outbound touch is for ${touch.accountName}.`,
            cueIndex: 1,
            recovery: `If there is no relevant LinkedIn action for ${touch.accountName}, skip the channel and continue the account's other outreach.`
        };
        return motion;
    }

    return motion;
}
