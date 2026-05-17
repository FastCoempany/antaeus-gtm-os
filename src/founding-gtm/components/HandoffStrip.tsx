import type { JSX } from "preact";

/**
 * HandoffStrip — bottom-of-room culmination affordance.
 *
 * Per canon §4.19 Founding GTM is the culmination — the room a first
 * hire opens on day one. The handoff is unusual because the room
 * doesn't push downstream into another working room; it pushes
 * outward into the world (the share-link mechanic is what makes it
 * the "kit" a hire actually inherits).
 *
 * Phase 2.7 audit — before this PR Founding GTM had ZERO outbound
 * affordances at all. Even the back-to-Dashboard breadcrumb didn't
 * render when arriving with continuity params. This strip adds:
 *
 *   - Open the Dashboard (primary)  — Sarah's daily rhythm anchor
 *   - Refine the quota math         — Section 7 source
 *   - Re-run onboarding             — when the workspace needs reset
 *
 * The share-link mechanic from canon §4.19 ("share-link mechanic —
 * read-mode workspace access for an external email") is a separate
 * future feature; this strip is the path back to the working rooms
 * that feed the kit.
 */
export function HandoffStrip(): JSX.Element {
    return (
        <section class="fg-handoff" aria-label="Carry the kit forward">
            <header class="fg-handoff__head">
                <p class="fg-handoff__kicker">CARRY THE KIT FORWARD</p>
                <h2 class="fg-handoff__title">
                    Run the daily rhythm. Sharpen the math.
                </h2>
                <p class="fg-handoff__sub">
                    The kit is read-mode here. Real updates come from the
                    rooms that feed it.
                </p>
            </header>
            <nav class="fg-handoff__row" aria-label="Cross-room handoff">
                <a
                    class="fg-handoff__cta fg-handoff__cta--primary"
                    href="/dashboard/"
                    data-fg-handoff="dashboard"
                >
                    Open the Dashboard
                </a>
                <a
                    class="fg-handoff__cta"
                    href="/quota-workback/"
                    data-fg-handoff="quota-workback"
                >
                    Refine the quota math
                </a>
                <a
                    class="fg-handoff__cta"
                    href="/onboarding/"
                    data-fg-handoff="onboarding"
                >
                    Re-run onboarding
                </a>
            </nav>
        </section>
    );
}
