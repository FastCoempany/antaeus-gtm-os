import type { JSX } from "preact";
import { Card, HandoffStrip, Kicker, StatusChip } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import { draft, recentIcps } from "../../state";
import {
    hrefToOutboundStudio,
    hrefToSignalConsole,
    hrefToSourcingWorkbench,
    hrefToTerritoryArchitect
} from "../../lib/handoff";
import { buildLiveOutputs, checkIcon, checkTone, tierTone } from "../lib/adapters";

/**
 * IcpObject — the shaped ICP, the dominant half of the Decision Bench
 * (canon §4.4 / spec 05 ObjectControls: the made thing out-weighs the
 * making). The live statement carries the bet; the quality readout shows
 * what truth is being improved; the outputs (focus, buying group,
 * evidence) prove downstream consequence; the handoff carries the sharp
 * ICP into the strategy flow. Composed on the library over the unchanged
 * build/quality engine.
 */
export function IcpObject(): JSX.Element {
    const out = buildLiveOutputs(draft.value);
    const q = out.quality;
    const industry = out.industry;
    const saved = recentIcps.value;

    return (
        <div class="icpd-object">
            {/* The quality readout — the Decision Bench top: what truth is
                being improved. */}
            <div class="icpd-quality">
                <div class="icpd-quality__head">
                    <Kicker>{t("ICP QUALITY")}</Kicker>
                    <StatusChip label={q.label} tone={tierTone(q.tier)} />
                    <span class="icpd-quality__score">{q.score}<span class="icpd-quality__cap">/100</span></span>
                </div>
                <p class="icpd-quality__summary">{q.summary}</p>
                {showsAnnotations() && q.checks.length > 0 ? (
                    <ul class="icpd-checks">
                        {q.checks.map((c, i) => (
                            <li key={i} class="icpd-check">
                                <span class={`icpd-check__mark icpd-check__mark--${checkTone(c.tone)}`}>
                                    <Icon name={checkIcon(c.tone)} size={16} />
                                </span>
                                <span class="icpd-check__text">{c.text}</span>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            {/* The statement — the bet, in the headline voice. */}
            <Card icon="icp" kicker={t("THE ICP")} tone={tierTone(q.tier)}>
                <p class="icpd-statement">{out.statement}</p>
                {showsAnnotations() ? (
                    <p class="icpd-statement__hint">{out.statementHint}</p>
                ) : null}
            </Card>

            {/* The downstream outputs — proof of consequence. */}
            <div class="icpd-outputs">
                <Card icon="account" kicker={t("FOCUS")}>
                    <p class="ds-card__copy">{out.focus}</p>
                </Card>
                <Card icon="advisor" kicker={t("BUYING GROUP")}>
                    <ul class="icpd-list">
                        {out.buyingGroup.map((b) => (
                            <li key={b}>{b}</li>
                        ))}
                    </ul>
                </Card>
                <Card icon="signal" kicker={t("EVIDENCE SIGNALS")}>
                    <ul class="icpd-list">
                        {out.evidence.map((e) => (
                            <li key={e}>{e}</li>
                        ))}
                    </ul>
                </Card>
            </div>

            {saved.length > 0 ? (
                <div class="icpd-saved">
                    <Kicker>{t("SAVED ICPS")}</Kicker>
                    <ul class="icpd-saved__list">
                        {saved.slice(0, 4).map((icp) => (
                            <li key={icp.id} class="icpd-saved__row">
                                <StatusChip
                                    label={`${icp.qualityScore}`}
                                    tone={icp.qualityScore >= 85 ? "green" : icp.qualityScore >= 70 ? "blue" : "amber"}
                                />
                                <span class="icpd-saved__text">{icp.statement}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {industry ? (
                <HandoffStrip
                    label={t("Carry the ICP into the motion")}
                    kicker={t("RUN THE ICP")}
                    title={t("Take this target into the strategy flow", {
                        class: "body"
                    })}
                    routes={[
                        {
                            label: t("Build the territory"),
                            href: hrefToTerritoryArchitect(industry),
                            primary: true
                        },
                        { label: t("Source prospects"), href: hrefToSourcingWorkbench(industry) },
                        { label: t("Watch the radar"), href: hrefToSignalConsole(industry) },
                        { label: t("Compose outbound"), href: hrefToOutboundStudio(industry) }
                    ]}
                />
            ) : null}
        </div>
    );
}
