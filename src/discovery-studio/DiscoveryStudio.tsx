import type { JSX } from "preact";
import { CallClock } from "./components/CallClock";
import { CompressionToggle } from "./components/CompressionToggle";
import { FrameworkRail } from "./components/FrameworkRail";
import { SegmentRail } from "./components/SegmentRail";
import { RecoverRail } from "./components/RecoverRail";
import { LearnedTruthLedger } from "./components/LearnedTruthLedger";
import { WorkedMemory } from "./components/WorkedMemory";
import { NextStepDocket } from "./components/NextStepDocket";
import { SkipAheadTray } from "./components/SkipAheadTray";
import { SupportDossier } from "./components/SupportDossier";
import { HandoffStrip } from "./components/HandoffStrip";
import { RoomChrome } from "@/lib/room-chrome";
import {
    activeFramework,
    activeInterrupt,
    clearInterrupt,
    focusedAccount,
    frameworkRegistry
} from "./state";

/**
 * DiscoveryStudio — Program 6 / PR 4 refacing.
 *
 * Per canon §4.12 (Discovery Studio — Live Instrument / Diagnosis
 * Table hybrid) + the picked-winner Ledger Spine Canonical
 * wireframe (`deliverables/prototypes/wireframes/antaeus-discovery-
 * studio-control-face-ledger-spine-canonical-2026-04-11.html`).
 *
 * Layout (after PR 4 refacing):
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ RoomChrome (wordmark + back-pill + ⌘K palette)                 │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │ Mast: kicker + serif "Ledger spine." brand + framework stamp   │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │ Control band: CallClock + CompressionToggle                    │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │ Interrupt banner (conditional, when active)                    │
 *   ├──────────────┬────────────────────────────────────┬────────────┤
 *   │ Frameworks   │ Section title:                     │ Side dock: │
 *   │ rail (206px, │ "Open one segment. Run the call    │ - Skip-    │
 *   │ vertical,    │  from there."                      │   Ahead    │
 *   │ Ledger Spine │                                    │ - Worked-  │
 *   │ signature)   │ SegmentRail (single-column,        │   Memory   │
 *   │              │ expandable-segment model — only    │ - Learned- │
 *   │              │ ONE segment open at a time)        │   Truth    │
 *   │              │                                    │ - Recover  │
 *   │              │ NextStepDocket below the rail      │            │
 *   ├──────────────┴────────────────────────────────────┴────────────┤
 *   │ SupportDossier + HandoffStrip footer                           │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Two structural shifts from the previous (Wave 5) layout:
 *
 *   1. FrameworkRail moved from horizontal topbar pills → vertical
 *      left rail (the Ledger Spine signature affordance).
 *   2. SegmentRail adopts the expandable-segment model — non-active
 *      segments collapse to dot + num + title; the active segment
 *      expands inline with nodes + branches. The model change lives
 *      inside SegmentRail.tsx (driven by activeNode.segmentKey).
 *
 * Mind preserved (canon §4.12): all 21 primitives, all 7 required
 * rails, the 9-frameworks × 10-segment spine, the Wave 5 on-call
 * control surfaces (CallClock / CompressionToggle / SkipAheadTray).
 *
 * Deferred (named explicitly in the audit doc): the 3-col grid
 * inside expanded segments (Say now / Buyer might say / Command col
 * with tool tabs) — requires reshaping the framework data files,
 * multi-PR scope.
 */
export function DiscoveryStudio(): JSX.Element {
    const fid = activeFramework.value;
    const fwLoaded = frameworkRegistry.value.length > 0;
    const interrupt = activeInterrupt.value;
    const activeFw = fid
        ? frameworkRegistry.value.find((f) => f.id === fid)
        : null;
    const account = focusedAccount.value;

    return (
        <div class="ds-shell">
            <RoomChrome kicker="DISCOVERY STUDIO" />
            <header class="ds-mast">
                <div class="ds-mast__lead">
                    <p class="ds-mast__kicker">
                        Discovery Studio · Canonical Control Face
                        {account ? ` · with ${account}` : ""}
                    </p>
                    <h1 class="ds-mast__brand">Ledger spine.</h1>
                </div>
                <span class="ds-mast__stamp" aria-label="Active framework">
                    {!fwLoaded
                        ? "loading…"
                        : activeFw
                          ? activeFw.label
                          : "Pick a framework"}
                </span>
            </header>

            <div class="ds-control-band">
                <CallClock />
                <CompressionToggle />
            </div>

            {interrupt ? (
                <section
                    class={`ds-interrupt-banner ds-interrupt-banner--${interrupt.tone}`}
                    aria-label="Active recover interrupt"
                >
                    <div class="ds-interrupt-banner__inner">
                        <p class="ds-interrupt-banner__kicker">
                            Recover · {interrupt.label}
                        </p>
                        <p class="ds-interrupt-banner__copy">
                            {interrupt.recover}
                        </p>
                        <button
                            type="button"
                            class="ds-interrupt-banner__dismiss"
                            onClick={clearInterrupt}
                            aria-label="Dismiss interrupt"
                        >
                            Dismiss
                        </button>
                    </div>
                </section>
            ) : null}

            <main class="ds-board">
                <aside class="ds-board__rail" aria-label="Frameworks">
                    <p class="ds-board__rail-kicker">FRAMEWORKS</p>
                    <FrameworkRail />
                    <p class="ds-board__rail-note">
                        Switch the lens only when the room actually changes.
                    </p>
                </aside>
                <section class="ds-board__main">
                    <p class="ds-board__main-title">
                        Open one segment. Run the call from there.
                    </p>
                    <SegmentRail />
                    <NextStepDocket />
                </section>
                <aside class="ds-board__dock" aria-label="On-call rails">
                    <SkipAheadTray />
                    <WorkedMemory />
                    <LearnedTruthLedger />
                    <RecoverRail />
                </aside>
            </main>

            <footer class="ds-footer">
                <SupportDossier />
                <HandoffStrip />
            </footer>
        </div>
    );
}
