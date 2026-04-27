import type { ActionPlan, ActionRoute, AutopsyDoc, CauseId } from "./types";
import {
    hrefToCallPlanner,
    hrefToDealWorkspace,
    hrefToDiscoveryStudio,
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
    target: "deal" | "call" | "poc" | "discovery",
    accountName: string,
    dealId: string,
    tone: ActionRoute["tone"],
    reason: string
): ActionRoute {
    switch (target) {
        case "deal":
            return {
                label: "Open in Deal Workspace",
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
                label: "Open the PoC frame",
                href: hrefToPoC(accountName),
                roomLabel: "PoC Framework",
                tone,
                reason
            };
        case "discovery":
            return {
                label: "Re-enter Discovery Studio",
                href: hrefToDiscoveryStudio(accountName),
                roomLabel: "Discovery Studio",
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
    // / PoC contexts.
    let primaryTarget: "deal" | "call" | "poc" | "discovery" = "deal";
    let primaryReason = "Most-direct intervention for this deal's pressure.";
    if (stageRaw === "poc") {
        primaryTarget = "poc";
        primaryReason = "PoC stage — frame success criteria first.";
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
            ? "Reflect the autopsy back into the deal record."
            : "Sharpen qualification before the next move.";

    // Tertiary: PoC Framework if we haven't already routed there +
    // there's any proof concern; otherwise Call Planner as a backstop.
    const hasPoCConcern = doc.causes.some(
        (c) => c.id === "poc_no_criteria" || stageRaw === "poc"
    );
    let tertiaryTarget: "poc" | "call" = "call";
    let tertiaryReason = "Backstop: get the next conversation on the calendar.";
    if (hasPoCConcern && primaryTarget !== "poc") {
        tertiaryTarget = "poc";
        tertiaryReason = "Proof concern still open — frame it.";
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
