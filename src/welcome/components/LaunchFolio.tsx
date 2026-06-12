import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { actions, activation, model } from "../state";

/**
 * LaunchFolio — the Commission Lock 2×2 mandate panel.
 *
 * Per the Launch Folio · Commission Lock wireframe
 * (deliverables/prototypes/wireframes/antaeus-welcome-launch-folio-
 * triptych-2026-04-08.html), the variant's signature is a four-cell
 * mandate map where ONE cell is visually locked — the unresolved
 * gap forcing the next operating move.
 *
 * Cells:
 *   ┌────────────────────────────┬───────────────────────────────┐
 *   │ Where you are              │ What is missing (LOCKED)      │
 *   │ (synthesized from done     │ (the next missing milestone — │
 *   │  anchors + activation ctx) │  the cell reads as the gap)   │
 *   ├────────────────────────────┼───────────────────────────────┤
 *   │ What unlocks next          │ Return behavior               │
 *   │ (from the dominant         │ (the room Sarah re-enters     │
 *   │  ActionStack item)         │  once the lock unlocks)       │
 *   └────────────────────────────┴───────────────────────────────┘
 *
 * Empty-state behavior: when no anchors are live, the locked cell
 * names the first ICP as the gap; the "where you are" cell names
 * the activation context (or "fresh workspace" if nothing yet).
 *
 * All-anchors-live behavior: the lock relaxes — the locked-cell
 * variant drops from the missing cell, and the panel reads as
 * "live mandate, daily rhythm runs from here."
 */
export function LaunchFolio(): JSX.Element {
    const m = model.value;
    const ctx = activation.value;
    const ranked = actions.value;
    const dominant = ranked[0] ?? null;

    const completed = m.completed;
    const total = m.total;
    const isCold = completed === 0;
    const allLive = completed > 0 && total > 0 && completed === total;

    const whereYouAre = buildWhereYouAre(ctx, completed, total);
    const whatsMissing = buildWhatsMissing(m, isCold, allLive);
    const whatUnlocks = buildWhatUnlocks(dominant, allLive);
    const returnBehavior = buildReturnBehavior(dominant, allLive);

    return (
        <section class="wel-folio" aria-label={t("Launch folio")}>
            <header class="wel-folio__head">
                <p class="wel-folio__kicker">{t("LAUNCH FOLIO · COMMISSION LOCK")}</p>
                <h2 class="wel-folio__title">{t("Open the live mandate.")}</h2>
                <p class="wel-folio__support">
                    The file is commissioned. One cell stays locked until
                    the next anchor lands.
                </p>
            </header>
            <ul class="wel-folio__grid" aria-label={t("Mandate map")}>
                <FolioCell
                    label={t("Where you are")}
                    value={whereYouAre.value}
                    note={whereYouAre.note}
                />
                <FolioCell
                    label={t("What is missing")}
                    value={whatsMissing.value}
                    note={whatsMissing.note}
                    variant={allLive ? "default" : "locked"}
                />
                <FolioCell
                    label={t("What opens up next")}
                    value={whatUnlocks.value}
                    note={whatUnlocks.note}
                />
                <FolioCell
                    label={t("Return behavior")}
                    value={returnBehavior.value}
                    note={returnBehavior.note}
                />
            </ul>
        </section>
    );
}

function FolioCell(props: {
    readonly label: string;
    readonly value: string;
    readonly note: string;
    readonly variant?: "default" | "locked";
}): JSX.Element {
    const variant = props.variant ?? "default";
    return (
        <li class={`wel-folio__cell wel-folio__cell--${variant}`}>
            <p class="wel-folio__cell-label">{props.label}</p>
            <p class="wel-folio__cell-value">{props.value}</p>
            <p class="wel-folio__cell-note">{props.note}</p>
        </li>
    );
}

// ─── Cell builders ────────────────────────────────────────────────

interface CellContent {
    readonly value: string;
    readonly note: string;
}

function buildWhereYouAre(
    ctx: { companyName: string | null; categoryLabel: string | null; role: string | null },
    completed: number,
    total: number
): CellContent {
    if (completed === 0) {
        const companyPiece = ctx.companyName ? `${ctx.companyName} workspace` : "Fresh workspace";
        return {
            value: companyPiece,
            note: "Onboarding is closed. The room is waiting for the first anchor."
        };
    }
    return {
        value: `${completed} of ${total} anchors live.`,
        note: completed === total
            ? "The workspace is operating. Daily rhythm runs from the Dashboard."
            : "Internal shape is forming. The downstream rooms are listening."
    };
}

function buildWhatsMissing(
    m: { nextMilestone: { key: string; label: string; copy: string } | null },
    isCold: boolean,
    allLive: boolean
): CellContent {
    if (allLive) {
        return {
            value: "Nothing — the file is live.",
            note: "Every anchor has landed. Depth is the next thing, not setup."
        };
    }
    if (!m.nextMilestone) {
        return {
            value: "First ICP.",
            note: "The first thing the rest of the app needs is a clear definition of who you sell to."
        };
    }
    const lead = isCold ? "First ICP." : `${m.nextMilestone.label}.`;
    return {
        value: lead,
        note: m.nextMilestone.copy
    };
}

function buildWhatUnlocks(
    dominant: { title: string; unlocks: string } | null,
    allLive: boolean
): CellContent {
    if (allLive) {
        return {
            value: "The daily rhythm.",
            note: "Brief / Spotlight / Queue carry the workspace from here."
        };
    }
    if (!dominant) {
        return {
            value: "Sharper signals + cleaner outbound.",
            note: "The Dashboard brief sharpens around the first anchor."
        };
    }
    return {
        value: shorten(dominant.title),
        note: dominant.unlocks
    };
}

function buildReturnBehavior(
    dominant: { href: string } | null,
    allLive: boolean
): CellContent {
    if (allLive) {
        return {
            value: "Re-enter through the Dashboard.",
            note: "The room knows enough to rank what to work on."
        };
    }
    if (!dominant) {
        return {
            value: "Re-enter through the Dashboard.",
            note: "The brief sharpens once the first anchor is live."
        };
    }
    const roomLabel = roomLabelFromHref(dominant.href);
    return {
        value: `Re-enter through ${roomLabel}.`,
        note: "Each anchor lights up another part of the workspace."
    };
}

function shorten(s: string): string {
    if (s.length <= 48) return s;
    return s.slice(0, 45).trim() + "…";
}

function roomLabelFromHref(href: string): string {
    const map: Record<string, string> = {
        "/icp-studio/": "ICP Studio",
        "/signal-console/": "Signal Console",
        "/deal-workspace/": "Deal Workspace",
        "/outbound-studio/": "Outbound Studio",
        "/quota-workback/": "Quota Workback",
        "/settings/": "Settings",
        "/dashboard/": "the Dashboard"
    };
    for (const [path, label] of Object.entries(map)) {
        if (href.startsWith(path)) return label;
    }
    return "the next room";
}
