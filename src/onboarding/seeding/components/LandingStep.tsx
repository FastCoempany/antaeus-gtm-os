import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { draft } from "../draft";
import { writeSeedingDraft } from "../lib/seed-writer";
import { mirrorSeedToCloud } from "../lib/cloud-mirror";
import { enrichedAccounts } from "./WakeStep";
import { diagnoseDeal } from "../lib/diagnose";
import type { SeedDeal } from "../draft";

/**
 * LandingStep (slice 7) — the end of setup. On arrival the draft
 * is written into the living rooms (ICP Studio, Signal Console, Deal
 * Workspace, Quota Workback) so the Dashboard is already alive. Then an
 * honest read of where they stand, and the invited-tail handoff (proof /
 * advisors / win-loss come later). "Open my morning" routes to the live
 * Dashboard.
 */
const persisted = signal(false);
let wrote = false;

function persistOnce(): void {
    if (wrote) return;
    wrote = true;
    try {
        writeSeedingDraft(draft.value, enrichedAccounts());
        persisted.value = true;
    } catch {
        // writeSeedingDraft already reports; the operator still lands.
        persisted.value = true;
    }
    // Cloud mirror, fire-and-forget — cross-device from the first morning.
    // The localStorage seed above is the immediate path; this never blocks.
    void mirrorSeedToCloud(draft.value, enrichedAccounts()).catch(() => undefined);
}

/** @internal test reset. */
export function __resetLandingForTests(): void {
    wrote = false;
    persisted.value = false;
}

const TONE_RANK = { red: 0, amber: 1, green: 2 } as const;

/** The deal to start with: the first one whose recorded fields show the
 * biggest gap (red before amber before green). Only recorded deal fields
 * drive this; account research never does. */
export function firstDealToReview(deals: ReadonlyArray<SeedDeal>): { account: string; move: string } | null {
    let best: { account: string; move: string; rank: number } | null = null;
    for (const d of deals) {
        if (!d.account.trim()) continue;
        const dx = diagnoseDeal(d);
        const rank = TONE_RANK[dx.tone];
        if (!best || rank < best.rank) best = { account: d.account.trim(), move: dx.move, rank };
    }
    return best ? { account: best.account, move: best.move } : null;
}

export function LandingStep(): JSX.Element {
    persistOnce();
    const first = firstDealToReview(draft.value.deals);
    return (
        <section class="sd-step sd-land">
            <p class="sd-kicker">{t("Setup complete", { class: "label" })}</p>
            <h1 class="sd-h1">{t("Your workspace is set up with what you entered.", { class: "body" })}</h1>
            <div class="sd-lmove">
                <div class="sd-lmove__k">{t("Where to start", { class: "label" })}</div>
                <div class="sd-lmove__t">
                    {first
                        ? t("{acct}: {move}", { class: "body" }).replace("{acct}", first.account).replace("{move}", first.move)
                        : t("Add your live deals so the workspace can suggest which one to review first.", { class: "body" })}
                </div>
            </div>
            <div class="sd-read2">
                <div class="sd-r2">
                    <div class="sd-r2__k">{t("Where you stand", { class: "body" })}</div>
                    <div class="sd-r2__t">
                        {t(
                            "Most of what a new hire would need still lives in your head. The workspace now has your targets, accounts, and deals, and it flags deals that need attention. Each week of recorded work makes it easier for someone else to pick up.",
                            { class: "body" }
                        )}
                    </div>
                </div>
                <div class="sd-r2">
                    <div class="sd-r2__k">{t("What's left — later, no rush", { class: "body" })}</div>
                    <div class="sd-r2__t">
                        {t(
                            "Over the coming days the workspace will ask about your pilots, your advisors, and your wins and losses. Each answer fills in another part of the workspace. The hardest part is done.",
                            { class: "body" }
                        )}
                    </div>
                </div>
            </div>
            <div class="sd-foot">
                <a class="sd-btn" href="/dashboard/">
                    {t("Open the Dashboard →", { class: "body" })}
                </a>
            </div>
        </section>
    );
}
