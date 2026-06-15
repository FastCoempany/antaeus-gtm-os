import type { JSX } from "preact";
import { Button, Card, RiskCard } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import type { RecoveryAssessment } from "../../lib/recovery";
import { STAGE_LABELS } from "../../lib/deal-shape";
import { openDealEditor } from "../../state";
import { hrefToFutureAutopsy } from "../../lib/handoff";
import { fmtMoney, laneIcon, laneTone } from "../lib/adapters";

/**
 * DealCard — one deal in the recovery board. A deal that needs
 * intervention renders as a RiskCard (the cause, the corrective move,
 * the pressure score at recovery scale, toned red/amber by lane); a
 * healthy deal renders as a calm library Card. The dominant move — open
 * the deal and act — is the one orange button; pre-mortem is the
 * secondary route (canon §4.13 flows-out → Future Autopsy).
 *
 * Diagnosis Table law (canon Part II §4.5): risk and what's happening
 * are legible before any explanation, and the corrective route is
 * obvious — that's the `move` line.
 */
export function DealCard(props: {
    readonly assessment: RecoveryAssessment;
}): JSX.Element {
    const { deal, lane, score, causes, nextMove } = props.assessment;
    const kicker = `${STAGE_LABELS[deal.stage]} · ${fmtMoney(deal.value)}`;

    const actions = (
        <>
            <Button variant="accent" onClick={() => openDealEditor(deal)}>
                <span class="dwd-btn-row">
                    <Icon name="edit" size={16} /> {t("Open the deal")}
                </span>
            </Button>
            <a class="ds-btn ds-btn--ghost" href={hrefToFutureAutopsy(deal.accountName)}>
                {t("Pre-mortem")}
            </a>
        </>
    );

    if (lane === "healthy") {
        return (
            <Card
                icon="deal"
                kicker={kicker}
                title={deal.accountName}
                tone={laneTone(lane)}
                footer={actions}
            >
                {showsAnnotations() ? (
                    <p class="ds-card__copy">
                        {causes.length > 0 ? causes.join(" · ") : t("On pace.")}
                    </p>
                ) : null}
            </Card>
        );
    }

    return (
        <RiskCard
            kicker={kicker}
            icon={laneIcon(lane)}
            tone={lane === "critical" ? "red" : "amber"}
            title={deal.accountName}
            cause={causes.length > 0 ? causes.join(" · ") : t("Needs a next step.")}
            move={nextMove}
            score={score}
            actions={actions}
        />
    );
}
