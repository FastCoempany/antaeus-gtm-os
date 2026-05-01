import type { JSX } from "preact";
import { authoredSections } from "./state";
import { Topbar } from "./components/Topbar";
import { SectionFrame } from "./components/SectionFrame";
import { SECTION_IDS } from "./lib/types";

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

    return (
        <div class="fg-shell">
            <Topbar
                sectionsReady={sectionsReady}
                sectionsPartial={sectionsPartial}
                verdictLabel={null}
            />
            <main class="fg-stack">
                {SECTION_IDS.map((id) => {
                    const section = sections.find((s) => s.id === id) ?? null;
                    return <SectionFrame id={id} section={section} key={id} />;
                })}
            </main>
        </div>
    );
}
