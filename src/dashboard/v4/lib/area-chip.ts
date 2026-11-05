import type { DimensionScore } from "@/lib/readiness";
import { PILOT_RESULTS_GAP } from "@/lib/readiness";
import { t } from "@/lib/voice/t";

/**
 * The quiet state chip for one readiness area — words, never scores.
 *
 * The pilots/reviews/handoff area can score well on deal-risk reviews and
 * handoff sections alone. When pilot results are still missing, the chip
 * says so, so it doesn't read "solid" next to a recommendation to run a
 * pilot.
 */
export function chipFor(d: DimensionScore): { cls: string; word: string } {
    const base =
        d.score >= 14
            ? { cls: "ok", word: t("solid") }
            : d.score >= 8
              ? { cls: "ok", word: t("workable") }
              : d.score > 0
                ? { cls: "thin", word: t("limited") }
                : { cls: "thin", word: t("none yet") };
    if (d.id === "proof" && d.score > 0 && d.gaps.includes(PILOT_RESULTS_GAP)) {
        return {
            cls: base.cls,
            word: `${base.word}${t(", but few pilot results are recorded", { class: "body" })}`
        };
    }
    return base;
}
