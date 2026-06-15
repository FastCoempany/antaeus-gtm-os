import type { JSX } from "preact";
import { PulseHorizon, PulseTimeline, PulseZone } from "@/components";
import { showsAnnotations } from "@/lib/density";
import { t } from "@/lib/voice/t";
import { commandSummary } from "../../state";
import { toZones } from "../lib/adapters";
import { RankedCard } from "./RankedCard";

/**
 * Queue — the triage read (spec 04 §3.2): the full ranked pipeline as
 * the Pulse timeline. The most-pressured break into NOW; the rest
 * compress into THIS WEEK; the quiet/overdue fall to GONE QUIET
 * (absence is a signal). One object per zone breaks rank (spec §2.4).
 * A horizon strip of counts closes the page.
 */
export function QueueRead(): JSX.Element {
    const summary = commandSummary.value;
    const zones = toZones(summary.ranked);
    const ranked = summary.ranked;
    // The "most pressured" tag is an annotation (02 §3.4) — present in
    // Show me how, gone in Step back. The card still breaks rank either
    // way; only the label recedes.
    const annotate = showsAnnotations();

    return (
        <div class="dbt-queue">
            <PulseTimeline label={t("The ranked pipeline")}>
                <PulseZone
                    label={t("NOW")}
                    suffix={countSuffix(zones.now.length)}
                    tone="red"
                >
                    {zones.now.map((o, i) => (
                        <RankedCard
                            key={o.id}
                            object={o}
                            offset={i === 0}
                            offsetTag={
                                i === 0 && annotate
                                    ? t("— Most pressured")
                                    : undefined
                            }
                        />
                    ))}
                </PulseZone>
                <PulseZone
                    label={t("THIS WEEK")}
                    suffix={countSuffix(zones.thisWeek.length)}
                    depth={1}
                >
                    {zones.thisWeek.map((o) => (
                        <RankedCard key={o.id} object={o} />
                    ))}
                </PulseZone>
                <PulseZone
                    label={t("GONE QUIET")}
                    suffix={countSuffix(zones.goneQuiet.length)}
                    depth={2}
                    tone="amber"
                >
                    {zones.goneQuiet.map((o) => (
                        <RankedCard key={o.id} object={o} />
                    ))}
                </PulseZone>
            </PulseTimeline>
            <PulseHorizon
                counts={[
                    { label: t("ranked"), value: ranked.length },
                    { label: t("now"), value: zones.now.length },
                    { label: t("gone quiet"), value: zones.goneQuiet.length }
                ]}
            />
        </div>
    );
}

function countSuffix(n: number): string {
    return n === 1 ? "1" : String(n);
}
