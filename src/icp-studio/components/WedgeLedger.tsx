import type { JSX } from "preact";
import {
    draft,
    effectiveBuyer,
    effectiveIndustry
} from "../state";
import {
    BUYER_OPTIONS,
    GEO_OPTIONS,
    INDUSTRY_OPTIONS,
    PAIN_OPTIONS,
    PROOF_WINDOW_OPTIONS,
    SIZE_OPTIONS,
    TRIGGER_OPTIONS
} from "../lib/options";

/**
 * WedgeLedger — Program 6 / PR 5 (Variant 01 / Wedge Ledger refacing).
 *
 * The Wedge Ledger variant treats the ICP like a run-read, not a
 * worksheet. Seven rows, one per ICP input field:
 *
 *   ┌──────┬────────────┬────────────────────────┬───────────┐
 *   │ mark │ field      │ field copy             │ state pill│
 *   ├──────┼────────────┼────────────────────────┼───────────┤
 *   │  1   │ Industry   │ A real list exists.    │ Locked    │
 *   │  2   │ Buyer      │ VP Sales keeps         │ Runnable  │
 *   │      │            │ authority human.       │           │
 *   │  3   │ Size       │ 20–120 still needs a   │ Tighten   │
 *   │      │            │ stronger lower bound.  │           │
 *   │  4   │ Geo        │ NA only keeps the      │ Good      │
 *   │      │            │ territory real.        │           │
 *   │  5   │ Pain       │ "Rep productivity" is  │ Thin      │
 *   │      │            │ still board-room copy. │           │
 *   │  6   │ Trigger    │ No forcing event yet.  │ Missing   │
 *   │  7   │ Proof      │ Value visible inside   │ Clear     │
 *   │      │ window     │ one quarter.           │           │
 *   └──────┴────────────┴────────────────────────┴───────────┘
 *
 * Each row derives:
 *   - State pill (Locked / Runnable / Tighten / Good / Thin /
 *     Missing / Clear) from the input's emptiness + the field's
 *     specificity heuristic.
 *   - Field copy — a short, authored sentence describing the
 *     field's current shape. Falls back to "Not set yet." when
 *     the input is empty.
 *
 * Honest port: doesn't reshape the quality engine. The score +
 * tier still come from buildIcpQuality elsewhere; this component
 * is purely the visual ledger view of the same input data.
 */

type LedgerState =
    | "locked"
    | "runnable"
    | "tighten"
    | "good"
    | "thin"
    | "missing"
    | "clear";

interface LedgerRow {
    readonly num: number;
    readonly field: string;
    readonly copy: string;
    readonly state: LedgerState;
}

const STATE_LABEL: Record<LedgerState, string> = {
    locked: "Locked",
    runnable: "Runnable",
    tighten: "Tighten",
    good: "Good",
    thin: "Thin",
    missing: "Missing",
    clear: "Clear"
};

const STATE_TONE: Record<LedgerState, "good" | "warn" | "risk" | "info"> = {
    locked: "good",
    runnable: "good",
    good: "good",
    clear: "info",
    tighten: "warn",
    thin: "warn",
    missing: "risk"
};

function labelFor(
    value: string,
    options: ReadonlyArray<{ value: string; label: string }>
): string {
    const hit = options.find((o) => o.value === value);
    return hit?.label ?? value;
}

function nonEmpty(value: string): boolean {
    return value.trim().length > 0;
}

function buildLedger(): ReadonlyArray<LedgerRow> {
    const d = draft.value;
    const industry = effectiveIndustry.value;
    const buyer = effectiveBuyer.value;

    return [
        {
            num: 1,
            field: "Industry",
            state: industry.trim().length > 0 ? "locked" : "missing",
            copy: industry.trim().length > 0
                ? `${labelFor(industry, INDUSTRY_OPTIONS)} — narrow enough that a real list exists.`
                : "Not set yet. Without a real list, the ICP is not real yet."
        },
        {
            num: 2,
            field: "Buyer",
            state: buyer.trim().length > 0 ? "runnable" : "missing",
            copy: buyer.trim().length > 0
                ? `${labelFor(buyer, BUYER_OPTIONS)} keeps authority human + obvious.`
                : "Pick the buyer role. Authority must be specific."
        },
        {
            num: 3,
            field: "Size",
            state: nonEmpty(d.size) ? "good" : "tighten",
            copy: nonEmpty(d.size)
                ? `${labelFor(d.size, SIZE_OPTIONS)} — sourcing density is credible.`
                : "Pick a size band. Lower bound + upper bound = list density."
        },
        {
            num: 4,
            field: "Geo",
            state: nonEmpty(d.geo) ? "good" : "tighten",
            copy: nonEmpty(d.geo)
                ? `${labelFor(d.geo, GEO_OPTIONS)} keeps the territory real for a first 30-day run.`
                : "Pick a geography. A first 30-day run needs a tight box."
        },
        {
            num: 5,
            field: "Pain",
            state: paneState(d.pain),
            copy: nonEmpty(d.pain)
                ? `${labelFor(d.pain, PAIN_OPTIONS)} — operational pain a buyer would name out loud.`
                : "Name the pain. Operator-voice, not board-room copy."
        },
        {
            num: 6,
            field: "Trigger",
            state: nonEmpty(d.trigger) ? "good" : "missing",
            copy: nonEmpty(d.trigger)
                ? `${labelFor(d.trigger, TRIGGER_OPTIONS)} — the forcing event that makes now-not-later real.`
                : "No forcing event yet. A wedge without a trigger is half hope."
        },
        {
            num: 7,
            field: "Proof window",
            state: nonEmpty(d.proofWindow) ? "clear" : "thin",
            copy: nonEmpty(d.proofWindow)
                ? `${labelFor(d.proofWindow, PROOF_WINDOW_OPTIONS)} — the buyer can see value inside this window.`
                : "Pick a proof window. The buyer needs to feel speed-to-value."
        }
    ];
}

function paneState(pain: string): LedgerState {
    const v = pain.trim();
    if (v.length === 0) return "missing";
    // Heuristic: short generic pain copy reads as "thin"; longer or
    // operationally-named pain reads as "good." 24 chars is the band.
    if (v.length < 24) return "thin";
    return "good";
}

export function WedgeLedger(): JSX.Element {
    const rows = buildLedger();
    return (
        <section class="icp-ledger" aria-label="Wedge ledger">
            <header class="icp-ledger__head">
                <p class="icp-ledger__kicker">WEDGE LEDGER</p>
                <h2 class="icp-ledger__title">
                    Seven fields. One wedge the rest of the system can trust.
                </h2>
            </header>
            <ol class="icp-ledger__rows">
                {rows.map((row) => (
                    <li
                        key={row.num}
                        class={`icp-ledger__row icp-ledger__row--${STATE_TONE[row.state]}`}
                    >
                        <span class="icp-ledger__mark">
                            <span
                                class={`icp-ledger__mark-dot icp-ledger__mark-dot--${STATE_TONE[row.state]}`}
                                aria-hidden="true"
                            />
                            <span class="icp-ledger__mark-num">
                                {row.num}
                            </span>
                        </span>
                        <span class="icp-ledger__field">{row.field}</span>
                        <span class="icp-ledger__copy">{row.copy}</span>
                        <span
                            class={`icp-ledger__state icp-ledger__state--${STATE_TONE[row.state]}`}
                        >
                            {STATE_LABEL[row.state]}
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
