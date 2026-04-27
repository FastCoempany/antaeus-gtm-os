import {
    EMPTY_ACCOUNT_COUNTS,
    type AccountCounts,
    type ChannelStats,
    type CueIndex,
    type Motion,
    type MotionContext
} from "./types";

/**
 * Phase 4 / Room 8 Wave 2 — motion engine.
 *
 * Faithful TypeScript port of the legacy `getMotion(c)` function
 * (`app/linkedin-playbook/index.html` line 109). Picks one of four
 * motion patterns based on the inbound cross-room context:
 *
 *   1. credibility           — default; no live signal yet
 *   2. warm_signal_account   — hottest account exists, no connection_request to it
 *   3. convert_connection    — connection_request to hottest account, no DM yet
 *   4. add_air_cover         — no hottest, but a recent outbound touch exists
 *
 * The motion drives: the recommended actionType, the booth-read narrative,
 * and the default cueIndex (which the operator can override by pinning).
 *
 * Pure: takes the context object explicitly so tests can probe every branch.
 */

const DEFAULT_THRESHOLDS = "35%+ acceptance and 15%+ DM reply after warming.";

function accountCountsFor(
    accountName: string | null | undefined,
    stats: ChannelStats
): AccountCounts {
    if (!accountName) return EMPTY_ACCOUNT_COUNTS;
    const key = accountName.trim().toLowerCase();
    if (!key) return EMPTY_ACCOUNT_COUNTS;
    return stats.byAccount[key] ?? EMPTY_ACCOUNT_COUNTS;
}

export function deriveMotion(ctx: MotionContext): Motion {
    const hottest = ctx.hottestAccount;
    const touch = ctx.latestTouch;
    const stats = ctx.stats;
    const acct = accountCountsFor(hottest?.name, stats);

    // Default pattern — no live signal context.
    let motion: Motion = {
        key: "credibility",
        label: "Build name familiarity before you ask for anything.",
        actionType: "content_engage",
        whyNow:
            "LinkedIn should warm the name and give outbound more credibility instead of replacing every other channel.",
        oneSession:
            "Leave two thoughtful comments on one target account and log the touch.",
        nextMove:
            "After two meaningful engagements, send one specific connection request.",
        thresholds: DEFAULT_THRESHOLDS,
        accountName: hottest?.name ?? touch?.accountName ?? "",
        context:
            "No live signal is being worked yet. Use LinkedIn to create air cover.",
        cueIndex: 1
    };

    // Branch 1 — hottest signal account exists, no connection_request to it yet.
    if (hottest && acct.connection_request === 0) {
        const heatSuffix = hottest.heat ? ` (heat ${hottest.heat})` : "";
        motion = {
            ...motion,
            key: "warm_signal_account",
            label: "Use the public cue before the request.",
            whyNow: `A real signal exists on ${hottest.name}, but LinkedIn trust is still cold. Make the account recognize your name before you ask for access.`,
            oneSession:
                "Engage with one post, leave one smart comment, then queue a signal-led connection request.",
            nextMove:
                "After one or two visible engagements, send one request tied to the active signal.",
            context: `Signal Console says ${hottest.name} is hot right now${heatSuffix}.`,
            cueIndex: (acct.content_engage > 0 ? 2 : 1) as CueIndex
        };
        return motion;
    }

    // Branch 2 — connection_request exists for hottest, no DM yet.
    if (hottest && acct.connection_request > 0 && acct.dm === 0) {
        motion = {
            ...motion,
            key: "convert_connection",
            label: "Convert the accepted route into a conversation.",
            actionType: "dm",
            whyNow: `The connection motion has already started on ${hottest.name}. The next useful move is a rapport DM or give-first follow-up.`,
            oneSession:
                "Send one rapport DM or give-first note that references their world, not your product.",
            nextMove:
                "If there is no reply after 3-5 days, send one give-first resource before asking for time.",
            context: `LinkedIn already has an opening on ${hottest.name}. Use it.`,
            cueIndex: 3
        };
        return motion;
    }

    // Branch 3 — no hottest signal account, but an outbound touch exists.
    if (touch && touch.accountName) {
        motion = {
            ...motion,
            key: "add_air_cover",
            label: "Add LinkedIn air cover to the outbound motion already in flight.",
            actionType: "content_share",
            whyNow: `Outbound is already working ${touch.accountName}. LinkedIn should reinforce that motion so the prospect sees your name in more than one place.`,
            oneSession:
                "Engage with their content or share one relevant insight, then log the action.",
            nextMove:
                "Return to the next outbound touch after the LinkedIn action is logged.",
            accountName: touch.accountName,
            context: `Latest outbound motion exists for ${touch.accountName}.`,
            cueIndex: 1
        };
        return motion;
    }

    // No branch fired — fall through with the default credibility motion.
    return motion;
}
