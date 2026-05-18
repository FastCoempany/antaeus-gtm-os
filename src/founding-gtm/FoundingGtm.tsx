import type { JSX } from "preact";
import {
    authoredSections,
    ceremonyEvent,
    ceremonyOpen,
    readinessVerdictLabel
} from "./state";
import { Topbar } from "./components/Topbar";
import { SectionFrame } from "./components/SectionFrame";
import { CeremonyOverlay } from "./components/CeremonyOverlay";
import { HandoffStrip } from "./components/HandoffStrip";
import { SECTION_IDS } from "./lib/types";

import { Wordmark } from "@/lib/wordmark";
/**
 * Founding GTM root — Wave 1.
 *
 * Layout per canon §4.19:
 *
 *   ┌───────────────────────────────────────────────────────────┐
 *   │  Topbar — kicker + thesis + maturity band                 │
 *   ├───────────────────────────────────────────────────────────┤
 *   │  Section §1                                               │
 *   │  Section §2                                               │
 *   │  ...                                                      │
 *   │  Section §7                                               │
 *   └───────────────────────────────────────────────────────────┘
 *
 * Wave 1 renders the seven section frames with their canonical
 * titles + status badges. Body content is empty until Wave 3's
 * authoring engines + Wave 2's cross-room readers wire in.
 */
export function FoundingGtm(): JSX.Element {
    const sections = authoredSections.value;

    const sectionsReady = sections.filter((s) => s.status === "ready").length;
    const sectionsPartial = sections.filter(
        (s) => s.status === "partial"
    ).length;

    const showCeremony = ceremonyOpen.value;
    const event = ceremonyEvent.value;

    return (
        <div class="fg-shell">
            <div class="ant-room-chrome">
                <Wordmark kicker="FOUNDING GTM" />
            </div>
            <Topbar
                sectionsReady={sectionsReady}
                sectionsPartial={sectionsPartial}
                verdictLabel={readinessVerdictLabel.value}
            />
            <main class="fg-stack">
                {SECTION_IDS.map((id) => {
                    const section = sections.find((s) => s.id === id) ?? null;
                    return <SectionFrame id={id} section={section} key={id} />;
                })}
            </main>
            <HandoffStrip />
            {showCeremony && event && (
                <CeremonyOverlay
                    fromLabel={event.fromLabel}
                    toLabel={event.toLabel}
                    sectionsBefore={event.sectionsBefore}
                    sectionsAfter={event.sectionsAfter}
                />
            )}
        </div>
    );
}
