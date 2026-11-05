import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import type { ProspectResearch } from "../lib/types";
import { SignalLine, SourceLinks } from "./ResearchFind";
import { formatDate } from "./research-format";

/** The cited research attached to a prospect, shown in the Qualify panel. */
export function ResearchDetail({ r }: { readonly r: ProspectResearch }): JSX.Element {
    const n = r.sources.length;
    return (
        <div class="pd4-rdet">
            <div class="pd4-rdk">
                {r.sample ? t("Sample research from the demo data") : t("Researched by Antaeus")}
                {" · "}{formatDate(r.researchedAt)}{" · "}{n} {n === 1 ? t("source") : t("sources")}
            </div>
            {r.summary ? <div class="pd4-hitw">{r.summary}</div> : null}
            {r.signals.map((s, i) => <SignalLine s={s} key={i} />)}
            {r.fitUnknowns.length > 0 ? <div class="pd4-hitr"><b>{t("Not confirmed:")}</b> {r.fitUnknowns.join(" ")}</div> : null}
            {r.openingAngle ? <div class="pd4-hitr"><b>{t("Possible opening:")}</b> {r.openingAngle}</div> : null}
            <SourceLinks urls={r.sources} />
        </div>
    );
}

/**
 * A suggested answer from research. It only fills the field when the
 * seller clicks "Use this"; until then the question stays unanswered.
 */
export function SuggestedAnswer(props: {
    readonly text: string;
    readonly current: string;
    readonly onUse: (text: string) => void;
}): JSX.Element | null {
    const text = props.text.trim();
    if (!text || props.current.trim() === text) return null;
    return (
        <div class="pd4-sugg">
            <span class="pd4-suggk">{t("Suggested from research:")}</span> {text}
            <button type="button" class="pd4-sugguse" onClick={() => props.onUse(text)}>
                {props.current.trim() ? t("Replace with this") : t("Use this")}
            </button>
        </div>
    );
}
