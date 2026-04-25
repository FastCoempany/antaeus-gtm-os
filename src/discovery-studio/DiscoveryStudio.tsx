import type { JSX } from "preact";
import { FrameworkRail } from "./components/FrameworkRail";
import { SegmentRail } from "./components/SegmentRail";
import { RecoverRail } from "./components/RecoverRail";
import { LearnedTruthLedger } from "./components/LearnedTruthLedger";
import { WorkedMemory } from "./components/WorkedMemory";
import { NextStepDocket } from "./components/NextStepDocket";
import { SupportDossier } from "./components/SupportDossier";
import {
    activeFramework,
    activeInterrupt,
    clearInterrupt,
    frameworkRegistry
} from "./state";

/**
 * DiscoveryStudio — Wave 3 root.
 *
 * Lays out the 7 binding global rails plus a top-level interrupt
 * banner that surfaces when the user clicks any RecoverRail item.
 *
 * Layout intent (matches the legacy `dsj-shell` three-column structure):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Topbar: framework rail                      │
 *   ├──────────────────────────────────────────────┤
 *   │  [InterruptBanner — shown when active]       │
 *   ├────────────┬─────────────────┬───────────────┤
 *   │  Segment   │  Center work    │  Side dock:   │
 *   │  rail      │  area:          │  - Recover    │
 *   │            │  - Active node  │  - Learned    │
 *   │            │  - Next-step    │    truth      │
 *   │            │    docket       │  - Worked     │
 *   │            │                 │    memory     │
 *   ├────────────┴─────────────────┴───────────────┤
 *   │  Support dossier                             │
 *   └──────────────────────────────────────────────┘
 */
export function DiscoveryStudio(): JSX.Element {
    const fid = activeFramework.value;
    const fwLoaded = frameworkRegistry.value.length > 0;
    const interrupt = activeInterrupt.value;

    return (
        <div class="ds-shell">
            <header class="ds-topbar">
                <p class="ds-topbar__kicker">
                    DISCOVERY STUDIO · WAVE 4 · {fwLoaded
                        ? `${frameworkRegistry.value.length} frameworks loaded`
                        : "loading…"}
                </p>
                <h1 class="ds-topbar__title">
                    {fid
                        ? frameworkRegistry.value.find((f) => f.id === fid)
                              ?.label ?? "Live discovery"
                        : "Choose your framework to begin."}
                </h1>
                <FrameworkRail />
            </header>

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
