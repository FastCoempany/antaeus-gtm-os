import type { JSX } from "preact";
import type { HeatLedger as HeatLedgerData, HeatReading } from "../lib/types";

interface Props {
    readonly ledger: HeatLedgerData;
}

const LABELS: Record<keyof HeatLedgerData, string> = {
    claim: "Claim",
    owner: "Owner",
    kill: "Kill"
};

/**
 * HeatLedger — three heat bars in the forge panel.
 *
 * Per canon §4.15 the three dimensions (claim / owner / kill) are
 * the live read on whether the proof is ready. Bar width = value/100,
 * color = HeatReading.color.
 */
export function HeatLedger({ ledger }: Props): JSX.Element {
    return (
        <section class="poc-heat" aria-label="How strong each piece is">
            <p class="poc-heat__kicker">HOW STRONG EACH PIECE IS</p>
            <ul class="poc-heat__list">
                {(Object.keys(LABELS) as Array<keyof HeatLedgerData>).map((key) => (
                    <HeatRow key={key} label={LABELS[key]} reading={ledger[key]} />
                ))}
            </ul>
        </section>
    );
}

interface RowProps {
    readonly label: string;
    readonly reading: HeatReading;
}

function HeatRow({ label, reading }: RowProps): JSX.Element {
    const widthStyle = `width: ${reading.value}%; background: ${reading.color};`;
    return (
        <li class="poc-heat__row">
            <span class="poc-heat__label">{label}</span>
            <div class="poc-heat__bar">
                <div class="poc-heat__fill" style={widthStyle} />
            </div>
            <span class="poc-heat__value">
                {reading.value}{" "}
                <span class={`poc-heat__band poc-heat__band--${reading.label}`}>
                    {reading.label}
                </span>
            </span>
        </li>
    );
}
