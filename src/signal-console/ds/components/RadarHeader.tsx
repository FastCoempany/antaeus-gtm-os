import type { JSX } from "preact";
import { Heading } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";

/**
 * RadarHeader — the room's one authored line (Live Instrument: top
 * behaves like a working console, not a report). The serif statement
 * carries the argument; the line beneath is the operator's mental
 * model. Copy preserved verbatim from the shipped room — the §4.7
 * voice rewrite the founder flagged still awaits explicit ack (canon
 * Part IV §4), so this carries it as-is rather than changing the mind.
 */
export function RadarHeader(): JSX.Element {
    return (
        <header class="scd-header">
            <div class="scd-header__kicker">
                <Icon name="signal" size={16} />
                <span class="ds-kicker">{t("THE RADAR")}</span>
            </div>
            <Heading level="display">
                {t("Where account heat becomes real work.", { class: "body" })}
            </Heading>
            <p class="scd-header__sub">
                {t(
                    "Signals are time-limited. Heat ranks them. Motion comes from the account ledger — not from research piling up.",
                    { class: "body" }
                )}
            </p>
        </header>
    );
}
