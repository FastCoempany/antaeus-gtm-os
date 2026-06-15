import type { JSX } from "preact";
import { Card, HandoffStrip, Kicker, Ribbon, Select, Stat, StatusChip } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import {
    inboundFocus,
    prospects,
    prospectsByStage,
    setProspectStage,
    stats
} from "../../state";
import {
    PROSPECT_STAGES,
    STAGE_LABELS,
    type Prospect,
    type ProspectStage
} from "../../lib/types";
import { getProspectQuality } from "../../lib/quality";
import { hrefToOutboundStudio, hrefToSignalConsole } from "../../lib/handoff";
import { bandTone, EDGE_LABELS, qualityTone, stageTone, workbenchRead } from "../lib/adapters";

const STAGE_OPTIONS = PROSPECT_STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }));

/**
 * WorkbenchObject — the shaped prospect pipeline, the dominant half of
 * the Decision Bench (canon §4.6). The workbench read is the bench top
 * (is the bench shipping); the stats are the pipeline shape; the
 * prospects move stage by stage toward "ready to push"; the handoff
 * pushes the qualified ones into Signal Console (the discipline: only
 * ready prospects pass forward). Composed on the library over the
 * unchanged read + quality engine.
 */
export function WorkbenchObject(): JSX.Element {
    const read = workbenchRead();
    const s = stats.value;
    const byStage = prospectsByStage.value;
    const focus = inboundFocus.value;
    const total = prospects.value.length;

    return (
        <div class="swd-object">
            {/* The workbench read — the bench top. */}
            <div class="swd-read">
                <div class="swd-read__head">
                    <Kicker>{t("WHERE THE BENCH STANDS")}</Kicker>
                    <StatusChip label={read.bandLabel} tone={bandTone(read.band)} />
                    <span class="swd-read__score">
                        {read.score}
                        <span class="swd-read__cap">/100</span>
                    </span>
                </div>
                <p class="swd-read__line">{read.weekRead}</p>
                <p class="swd-read__move">
                    <span class="swd-read__move-mark">{t("NEXT")}</span> {read.operatorMove}
                </p>
            </div>

            {/* Pipeline shape. */}
            <aside class="swd-stats" aria-label={t("Pipeline")}>
                <Stat value={s.captured} label={t("CAPTURED")} />
                <Stat value={s.researched} label={t("RESEARCHED")} />
                <Stat value={s.ready} label={t("READY")} />
                <Stat value={s.pushed} label={t("PUSHED")} />
            </aside>

            {/* The staged prospects. */}
            {total === 0 ? (
                <section class="swd-empty">
                    <div class="swd-empty__head">
                        <Icon name="find" size={24} />
                        <Kicker>{t("NO PROSPECTS YET")}</Kicker>
                    </div>
                    <h2 class="swd-empty__title">
                        {t("Capture the first name — turn a focus into something pushable.", {
                            class: "body"
                        })}
                    </h2>
                    <p class="swd-empty__body">
                        {t(
                            "Build a query, capture the names it surfaces, research them forward. Only the ones that reach ready get pushed into Signal Console.",
                            { class: "body" }
                        )}
                    </p>
                </section>
            ) : (
                <div class="swd-pipeline">
                    {PROSPECT_STAGES.map((stage) => {
                        const list = byStage[stage];
                        if (list.length === 0) return null;
                        return (
                            <div key={stage} class="swd-zone">
                                <Ribbon
                                    label={STAGE_LABELS[stage].toUpperCase()}
                                    suffix={String(list.length)}
                                    tone={stageTone(stage)}
                                />
                                <div class="swd-grid">
                                    {list.map((p) => (
                                        <ProspectCard key={p.id} prospect={p} stage={stage} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {total > 0 ? (
                <HandoffStrip
                    label={t("Push the bench forward")}
                    kicker={t("PUSH FORWARD")}
                    title={t("Send the ready prospects onward")}
                    routes={[
                        {
                            label: t("Push to Signal Console"),
                            href: hrefToSignalConsole({ account: focus || undefined }),
                            primary: true
                        },
                        {
                            label: t("Compose outbound"),
                            href: hrefToOutboundStudio({ account: focus || undefined })
                        }
                    ]}
                />
            ) : null}
        </div>
    );
}

function ProspectCard(props: {
    readonly prospect: Prospect;
    readonly stage: ProspectStage;
}): JSX.Element {
    const p = props.prospect;
    const quality = getProspectQuality(p);
    const annotate = showsAnnotations();

    return (
        <Card
            icon="find"
            kicker={EDGE_LABELS[p.leverage]}
            title={p.accountName}
            tone={stageTone(props.stage)}
            footer={
                <>
                    <Select
                        value={p.stage}
                        onChange={(stage) => setProspectStage(p.id, stage as ProspectStage)}
                        options={STAGE_OPTIONS}
                    />
                    {props.stage === "ready" ? (
                        <a
                            class="ds-btn ds-btn--accent"
                            href={hrefToSignalConsole({ account: p.accountName || undefined })}
                        >
                            <Icon name="account" size={16} /> {t("Push")}
                        </a>
                    ) : null}
                </>
            }
        >
            {p.contactName ? (
                <p class="swd-card__contact">
                    {p.contactName}
                    {p.contactTitle ? ` · ${p.contactTitle}` : ""}
                </p>
            ) : null}
            <div class="swd-card__chips">
                <StatusChip label={`${quality.score}`} tone={qualityTone(quality.band)} />
                {p.entryPoint ? <span class="swd-card__entry">{p.entryPoint}</span> : null}
            </div>
            {annotate && quality.gaps.length > 0 ? (
                <ul class="swd-card__gaps">
                    {quality.gaps.slice(0, 2).map((g) => (
                        <li key={g}>{g}</li>
                    ))}
                </ul>
            ) : null}
        </Card>
    );
}
