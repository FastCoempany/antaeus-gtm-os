import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { draft } from "../draft";
import { writeSeedingDraft } from "../lib/seed-writer";
import { enrichedAccounts } from "./WakeStep";

/**
 * LandingStep (slice 7) — the workspace greets them. On arrival the draft
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
}

/** @internal test reset. */
export function __resetLandingForTests(): void {
    wrote = false;
    persisted.value = false;
}

export function LandingStep(): JSX.Element {
    persistOnce();
    const topAccount = enrichedAccounts()[0]?.name ?? "your hottest account";
    return (
        <section class="sd-step sd-land">
            <p class="sd-kicker">{t("Awake · your workspace", { class: "body" })}</p>
            <h1 class="sd-h1">{t("This is yours now. It was thinking while you worked.", { class: "body" })}</h1>
            <div class="sd-lmove">
                <div class="sd-lmove__k">{t("The morning · your one move", { class: "body" })}</div>
                <div class="sd-lmove__t">
                    {t("{acct} is closest to slipping — get a date on the next step today.", { class: "body" }).replace(
                        "{acct}",
                        topAccount
                    )}
                </div>
            </div>
            <div class="sd-read2">
                <div class="sd-r2">
                    <div class="sd-r2__k">{t("Where you stand", { class: "body" })}</div>
                    <div class="sd-r2__t">
                        {t(
                            "Right now this all lives in you. The system can see it, rank it, and catch what's decaying — but a hire couldn't run it yet. That climbs as you keep going.",
                            { class: "body" }
                        )}
                    </div>
                </div>
                <div class="sd-r2">
                    <div class="sd-r2__k">{t("What's left — later, no rush", { class: "body" })}</div>
                    <div class="sd-r2__t">
                        {t(
                            "Over the coming days it'll ask for your proof, your advisors, and your wins and losses. Each one wakes another room. You've done the hard part today.",
                            { class: "body" }
                        )}
                    </div>
                </div>
            </div>
            <div class="sd-foot">
                <a class="sd-btn" href="/dashboard/">
                    {t("Open my morning →", { class: "body" })}
                </a>
            </div>
        </section>
    );
}
