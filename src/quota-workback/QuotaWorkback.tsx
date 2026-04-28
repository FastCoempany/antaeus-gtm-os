import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { CoveragePanel } from "./components/CoveragePanel";
import { InputForm } from "./components/InputForm";
import { PlanReadout } from "./components/PlanReadout";
import { SystemHealth } from "./components/SystemHealth";
import { HandoffStrip } from "./components/HandoffStrip";

/**
 * QuotaWorkback — Phase 4 / Room 14 root.
 *
 * Per canon §4.18 (System Ledger family). Founder directive 2026-04-27
 * overrides §4.8: room is bright, not dark. Layout:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Topbar: hero touches/day + posture pill     │
 *   ├──────────────────────────────────────────────┤
 *   │  CoveragePanel: live pipeline ratio          │
 *   ├──────────────────────────────────────────────┤
 *   │  SystemHealth: compounding vs still weak     │
 *   ├──────────────────────────────────────────────┤
 *   │  InputForm: targets + advanced conversion    │
 *   ├──────────────────────────────────────────────┤
 *   │  PlanReadout: 4 anchor cards + raw math      │
 *   ├──────────────────────────────────────────────┤
 *   │  HandoffStrip: 4 downstream destinations     │
 *   └──────────────────────────────────────────────┘
 */
export function QuotaWorkback(): JSX.Element {
    return (
        <div class="qw-shell">
            <Topbar />
            <CoveragePanel />
            <SystemHealth />
            <InputForm />
            <PlanReadout />
            <HandoffStrip />
        </div>
    );
}
