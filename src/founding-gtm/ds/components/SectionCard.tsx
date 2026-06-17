import type { JSX } from "preact";
import { Card, Kicker, StatusChip } from "@/components";
import { t } from "@/lib/voice/t";
import type {
    AuthoredSection,
    SectionId,
    SectionStatus
} from "../../lib/types";
import { SECTION_KICKER, SECTION_TITLE } from "../../lib/types";
import { statusTone, surpriseTone } from "../lib/adapters";

/**
 * SectionCard — renders ONE of the seven authored Founding GTM sections
 * on the design system (canon §4.19: authored opinion + cross-room
 * synthesis, never a bullet aggregation). The status chip carries the
 * readiness, the body is the authored prose, the evidence is concrete,
 * and the surprise callout is the cross-room read that earns the section
 * its place. Composed on the library over the unchanged authoring engine.
 */

const STATUS_LABEL: Record<SectionStatus, string> = {
    ready: "Ready",
    partial: "Partial",
    empty: "Empty"
};

export interface SectionCardProps {
    readonly id: SectionId;
    readonly section: AuthoredSection | null;
}

export function SectionCard(props: SectionCardProps): JSX.Element {
    const { id, section } = props;
    const kicker = section?.kicker ?? SECTION_KICKER[id];
    const title = section?.title ?? SECTION_TITLE[id];
    const status: SectionStatus = section?.status ?? "empty";

    return (
        <Card kicker={kicker} tone={statusTone(status)}>
            <div class="fgd-section">
                <div class="fgd-section__head">
                    <h2 class="fgd-section__title">{title}</h2>
                    <StatusChip
                        label={STATUS_LABEL[status]}
                        tone={statusTone(status)}
                    />
                </div>

                {section && section.body.length > 0 ? (
                    <div class="fgd-section__body">
                        {section.body.map((p, i) => (
                            <p class="fgd-section__para" key={i}>
                                {p}
                            </p>
                        ))}
                    </div>
                ) : (
                    <p class="fgd-section__empty">
                        {t(
                            "Not yet authored — this fills in once the rooms have real evidence.",
                            { class: "body" }
                        )}
                    </p>
                )}

                {section && section.evidence.length > 0 ? (
                    <ul class="fgd-section__evidence">
                        {section.evidence.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                ) : null}

                {section?.surprise ? (
                    <aside
                        class={`fgd-surprise fgd-surprise--${section.surprise.tone}`}
                    >
                        <Kicker>{t("SURPRISE")}</Kicker>
                        <p class="fgd-surprise__headline">
                            {section.surprise.headline}
                        </p>
                        <p class="fgd-surprise__body">{section.surprise.body}</p>
                        <span
                            class="fgd-surprise__rule"
                            data-tone={surpriseTone(section.surprise.tone)}
                            aria-hidden="true"
                        />
                    </aside>
                ) : null}
            </div>
        </Card>
    );
}
