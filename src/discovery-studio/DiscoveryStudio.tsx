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
import { Wordmark } from "@/lib/wordmark";
import {
    activeFramework,
    activeInterrupt,
    clearInterrupt,
    frameworkRegistry
} from "./state";

/**
 * DiscoveryStudio — Wave 5 root.
 *
 * Wave 5 adds the on-call control surfaces required by the Lumana
 * on-call control lock guardian spec:
 *   - Visible CallClock at the top of the topbar
 *   - CompressionToggle for off/essentials/emergency mode
 *   - SkipAheadTray exposing the active framework's skip-ahead handlers
 *   - LearnedTruthLedger with hold/deploy buttons (tieback ledger)
 *   - SegmentRail with per-segment minute hints (phase tempo guidance)
 *
 * Layout (matches the legacy `dsj-shell` three-column structure plus
 * the new control band):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Topbar: kicker / title / framework rail     │
 *   ├──────────────────────────────────────────────┤
 *   │  Control band: CallClock + CompressionToggle │
 *   ├──────────────────────────────────────────────┤
 *   │  [InterruptBanner — shown when active]       │
 *   ├────────────┬─────────────────┬───────────────┤
 *   │  Segment   │  Center work    │  Side dock:   │
 *   │  rail      │  area:          │  - Recover    │
 *   │            │  - Next-step    │  - Skip-ahead │
 *   │            │    docket       │  - Learned    │
 *   │            │                 │    truth      │
 *   │            │                 │  - Worked     │
 *   │            │                 │    memory     │
 *   ├────────────┴─────────────────┴───────────────┤
 *   │  Support dossier                             │
 *   └──────────────────────────────────────────────┘
 */
export function DiscoveryStudio(): JSX.Element {
    const fid = activeFramework.value;
    const fwLoaded = frameworkRegistry.value.length > 0;
    const interrupt = activeInterrupt.value;
    const activeFw = fid
        ? frameworkRegistry.value.find((f) => f.id === fid)
        : null;
    const kicker = activeFw
        ? `DISCOVERY STUDIO · ${activeFw.label}`
        : fwLoaded
          ? "DISCOVERY STUDIO"
          : "DISCOVERY STUDIO · loading…";

    return (
        <div class="ds-shell">
            <div class="ant-room-chrome">
                <Wordmark kicker="DISCOVERY STUDIO" />
            </div>
            <header class="ds-topbar">
                <p class="ds-topbar__kicker">{kicker}</p>
                <h1 class="ds-topbar__title">
                    {activeFw
                        ? activeFw.label
                        : "Choose your framework to begin."}
                </h1>
                <FrameworkRail />
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

            <main class="ds-main">
                <aside class="ds-main__left">
                    <SegmentRail />
                </aside>
                <section class="ds-main__center">
                    <NextStepDocket />
                </section>
                <aside class="ds-main__right">
                    <RecoverRail />
                    <SkipAheadTray />
                    <LearnedTruthLedger />
                    <WorkedMemory />
                </aside>
            </main>

            <footer class="ds-footer">
                <SupportDossier />
            </footer>
        </div>
    );
}
