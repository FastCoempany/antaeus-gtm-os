import type { JSX } from "preact";
import { CommercialProfileBanner } from "./components/CommercialProfileBanner";
import { DarkHero } from "./components/DarkHero";
import { WorkArea } from "./components/WorkArea";
import { AnalyticsPanel } from "./components/AnalyticsPanel";

import { RoomChrome } from "@/lib/room-chrome";
/**
 * IcpStudio — Wave 1 root.
 *
 * Per Part II §4.8 ICP Studio is a Decision Bench hybrid:
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │  DarkHero — strategic headline (dark navy band, serif title)      │
 *   │  Wave 3 fills with live statement preview + quality readout    │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  WorkArea — bright work surface (form + build outputs)         │
 *   │  Wave 3 wires the 7-input role-aware form                      │
 *   ├────────────────────────────────────────────────────────────────┤
 *   │  AnalyticsPanel — saved library + cross-room outflow           │
 *   │  Wave 4 wires the library cards + outflow preview              │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Wave 1: structural completeness. Wave 2: build/quality engine port.
 * Wave 3: live form + outputs UI. Wave 4: persistence + analytics +
 * focus recommendation. Wave 5: cross-room outflow (ICP match score
 * publishing). Wave 6: legacy flag-redirect cutover.
 */
export function IcpStudio(): JSX.Element {
    return (
        <div class="icp-shell">
            <RoomChrome kicker="ICP STUDIO"/>
            <CommercialProfileBanner />
            <DarkHero />
            <WorkArea />
            <AnalyticsPanel />
        </div>
    );
}
