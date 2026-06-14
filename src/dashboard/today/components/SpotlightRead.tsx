import type { JSX } from "preact";
import { FocalRail } from "@/components";
import { t } from "@/lib/voice/t";
import { commandSummary } from "../../state";
import { RankedCard } from "./RankedCard";

/**
 * Spotlight — the single-focal-object read (spec 04 §3.2): one object at
 * full depth in the focal pane, the quiet remainder as a ranked rail.
 */
export function SpotlightRead(): JSX.Element {
    const summary = commandSummary.value;
    const focal = summary.spotlight;
    const rail = summary.queue.filter((o) => o.id !== focal?.id).slice(0, 6);

    return (
        <FocalRail
            railLabel={t("The rest, ranked")}
            focal={focal ? <RankedCard object={focal} /> : null}
            rail={rail.map((o) => (
                <RankedCard key={o.id} object={o} />
            ))}
        />
    );
}
