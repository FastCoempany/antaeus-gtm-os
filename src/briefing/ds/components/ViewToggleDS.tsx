import type { JSX } from "preact";
import { SegmentedControl } from "@/components";
import { t } from "@/lib/voice/t";
import type { BriefingView } from "../../lib/view-state";
import { activeBriefingView, setBriefingView } from "../../components/ViewToggle";

/**
 * ViewToggleDS — the Workspace / World switcher (ADR-014) on the library
 * SegmentedControl. Shares the module-level view signal with the legacy
 * ViewToggle (activeBriefingView / setBriefingView), so the choice
 * persists per device and the surrounding surface re-renders on switch.
 * The Workspace / World toggle is the room's organizing axis (canon
 * §4.21), so it sits prominent above the streams.
 */
const OPTIONS: ReadonlyArray<{ key: BriefingView; label: string }> = [
    { key: "workspace", label: t("Your work") },
    { key: "world", label: t("Your market") }
];

export function ViewToggleDS(): JSX.Element {
    return (
        <div class="bfd-toggle">
            <SegmentedControl<BriefingView>
                label={t("Briefing view")}
                active={activeBriefingView()}
                onChange={setBriefingView}
                options={OPTIONS}
            />
        </div>
    );
}
