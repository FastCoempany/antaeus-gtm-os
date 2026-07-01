import type { ActionPlan, ActionRoute, AutopsyDoc, CauseId } from "./types";
import {
    hrefToCallPlanner,
    hrefToDealWorkspace,
    hrefToDiscoveryStudio,
    hrefToNegotiation,
    hrefToPoC
} from "./handoff";

/**
 * Phase 4 / Room 4 Wave 5 — action-plan router.
 *
 * Picks primary / secondary / tertiary routes from the autopsy doc.
 * Faithful spirit of the legacy `getActionPlan(vitals, doc)` (lines
 * 2313-2364): top cause + stage drives the primary route; secondary
 * fills in a complementary room; tertiary backfills with a generic
 * route.
 *
 * Routing rules (preserved from legacy):
 *   - Champion / EB issues   → Discovery Studio (qualify the room)
 *   - Process / late-stage   → Call Planner (set up the EB call)
 *   - PoC issues             → PoC Framework
 *   - Stuck / stale / no-NS  → Deal Workspace (write a real next step)
 *   - default                → Deal Workspace
 */

const PRIMARY_BY_CAUSE: Readonly<Record<CauseId, "deal" | "call" | "poc" | "discovery">> = {
    no_nextstep: "deal",
    next_step_overdue: "deal",
    stage_stuck: "deal",
    stale_thread: "deal",
    no_champion: "discovery",
    champion_weak: "discovery",
    no_eb: "call",
    no_process: "call",
    impact_not_real: "discovery",
    usecase_blurry: "discovery",
    competition_unknown: "discovery",
    single_threaded: "call",
    poc_no_criteria: "poc"
};

function buildRoute(
    target: "deal" | "call" | "poc" | "discovery" | "negotiation",
    accountName: string,
    dealId: string,
    tone: ActionRoute["tone"],
    reason: string
): ActionRoute {
    switch (target) {
        case "deal":
            return {
                label: "Open the deal",
                href: hrefToDealWorkspace(accountName, dealId),
                roomLabel: "Deal Workspace",
                tone,
                reason
            };
        case "call":
            return {
                label: "Plan the next call",
                href: hrefToCallPlanner(accountName),
                roomLabel: "Call Planner",
                tone,
                reason
            };
        case "poc":
            return {
                label: "Forge the evidence",
                href: hrefToPoC(accountName),
                roomLabel: "PoC Framework",
                tone,
                reason
            };
        case "discovery":
            return {
                label: "Run discovery again",
                href: hrefToDiscoveryStudio(accountName),
                roomLabel: "Discovery Studio",
                tone,
                reason
            };
        case "negotiation":
            return {
                label: "Rehearse the negotiation",
                href: hrefToNegotiation(accountName, dealId),
                roomLabel: "Negotiation",
                tone,
                reason
            };
    }
}

export function buildActionPlan(doc: AutopsyDoc): ActionPlan {
    const accountName = doc.deal.name;
    const dealId = doc.deal.id;
    const stageRaw = doc.deal.stageRaw;
    const topCause = doc.causes[0]?.id ?? null;

    // Primary: derived from top cause, with stage overrides for late-stage
    // / PoC contexts. Phase 4: negotiation / verbal-yes stages route to
    // the Negotiation desk per canon §4.16b — the deal's pressure shifts
    // from qualification to terms once we're past evaluation.
    let primaryTarget: "deal" | "call" | "poc" | "discovery" | "negotiation" =
        "deal";
    let primaryReason = "The most direct way to act on what's hurting this deal.";
    if (stageRaw === "negotiation" || stageRaw === "verbal-yes") {
        primaryTarget = "negotiation";
        primaryReason =
            stageRaw === "verbal-yes"
                ? "Verbal-yes stage — terms are the live conversation now."
                : "Negotiation stage — rehearse what you'll say before pricing or terms land.";
    } else if (stageRaw === "poc") {
        primaryTarget = "poc";
        primaryReason = "PoC stage — write down what you're proving before going further.";
    } else if (topCause && topCause in PRIMARY_BY_CAUSE) {
        primaryTarget = PRIMARY_BY_CAUSE[topCause as keyof typeof PRIMARY_BY_CAUSE];
        const causeLabel = doc.causes[0]?.label ?? topCause;
        primaryReason = `Top cause: ${causeLabel.toLowerCase()}.`;
    }

    // Secondary: a complementary route. If primary is Deal Workspace,
    // secondary qualifies further via Discovery; otherwise secondary is
    // always Deal Workspace (the deal is what we're operating on).
    const secondaryTarget: "deal" | "discovery" =
        primaryTarget === "deal" ? "discovery" : "deal";
    const secondaryReason =
        secondaryTarget === "deal"
            ? "Write the autopsy findings back into the deal record."
            : "Tighten qualification before the next move.";

    // Tertiary: PoC Framework if we haven't already routed there +
    // there's any proof concern; otherwise Call Planner as a backstop.
    const hasPoCConcern = doc.causes.some(
        (c) => c.id === "poc_no_criteria" || stageRaw === "poc"
    );
    let tertiaryTarget: "poc" | "call" = "call";
    let tertiaryReason = "Worst case, get the next conversation on the calendar.";
    if (hasPoCConcern && primaryTarget !== "poc") {
        tertiaryTarget = "poc";
        tertiaryReason = "There's still an open question about what you're proving — write it down.";
    }

    return {
        primary: buildRoute(primaryTarget, accountName, dealId, "primary", primaryReason),
        secondary: buildRoute(
            secondaryTarget,
            accountName,
            dealId,
            "secondary",
            secondaryReason
        ),
        tertiary: buildRoute(
            tertiaryTarget,
            accountName,
            dealId,
            "tertiary",
            tertiaryReason
        )
    };
}
