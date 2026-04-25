import type { JSX } from "preact";
import { FrameworkRail } from "./components/FrameworkRail";
import { SegmentRail } from "./components/SegmentRail";
import { RecoverRail } from "./components/RecoverRail";
import { LearnedTruthLedger } from "./components/LearnedTruthLedger";
import { WorkedMemory } from "./components/WorkedMemory";
import { NextStepDocket } from "./components/NextStepDocket";
import { SupportDossier } from "./components/SupportDossier";
import { activeFramework, frameworkRegistry } from "./state";

/**
 * DiscoveryStudio — Wave 1 root.
 *
 * Lays out the 7 binding global rails. Wave 1 is structurally complete
 * (every rail renders something) but visually unstyled — Wave 2 brings
 * the legacy room's visual fidelity.
 *
 * Layout intent (matches the legacy `dsj-shell` three-column structure):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Topbar: framework rail                      │
 *   ├────────────┬─────────────────┬───────────────┤
 *   │  Segment   │  Center work    │  Side dock:   │
 *   │  rail      │  area:          │  - Recover    │
 *   │            │  - Active node  │  - Learned    │
 *   │            │  - Next-step    │    truth      │
 *   │            │    docket       │  - Worked     │
 *   │            │                 │    memory     │
 *   ├────────────┴─────────────────┴───────────────┤
 *   │  Support dossier (drawer; always rendered    │
 *   │   in Wave 1, drawer in Wave 2)               │
 *   └──────────────────────────────────────────────┘
 */
export function DiscoveryStudio(): JSX.Element {
    const fid = activeFramework.value;
    const fwLoaded = frameworkRegistry.value.length > 0;

    return (
        <div class="ds-shell">
            <header class="ds-topbar">
                <p class="ds-topbar__kicker">
                    DISCOVERY STUDIO · WAVE 1 · {fwLoaded
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
