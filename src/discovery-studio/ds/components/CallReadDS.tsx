import type { JSX } from "preact";
import { StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import { learnedFacts, nextStepLock } from "../../state";
import { docketLabel, docketStatus, docketTone } from "../lib/adapters";

/**
 * CallReadDS — a compact live read for the control band. After the clock
 * and tempo were retired (founder direction 2026-06-16), the band carried
 * only the compression toggle and read thin. This folds the live call
 * state back in without re-introducing pacing: where the next-step lock
 * stands, and how much truth the call has captured so far. Both are real
 * primitives (nextStepLock, learnedFacts) — glanceable here, fully worked
 * below in the docket + the learned-truth ledger.
 *
 * Hook-free: it reads the module-level signals directly so it renders
 * under the vitest transform.
 */
export function CallReadDS(): JSX.Element {
    const status = docketStatus(nextStepLock.value);
    const factCount = learnedFacts.value.length;
    const factLabel =
        factCount === 1
            ? t("1 thing learned", { class: "body" })
            : t("{n} things learned", { class: "body" }).replace(
                  "{n}",
                  String(factCount)
              );

    return (
        <div class="dsd-call-read" aria-label={t("Live call read")}>
            <span class="dsd-call-read__lead">{t("Next step")}</span>
            <StatusChip label={docketLabel(status)} tone={docketTone(status)} />
            <span class="dsd-call-read__facts">{factLabel}</span>
        </div>
    );
}
