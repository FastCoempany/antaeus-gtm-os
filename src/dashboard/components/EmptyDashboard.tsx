import type { JSX } from "preact";

/**
 * EmptyDashboard — replaces every mode view (Read/Focus/Triage) when
 * the workspace has no ranked objects yet.
 *
 * Per the Dashboard audit (2026-05): a brand-new workspace produced a
 * silent empty dashboard. The room's thesis-line ("What is under the
 * most pressure right now") asked a question that nothing on the page
 * answered. The Command Chamber sat empty.
 *
 * The Antaeus ranking engine draws from THREE families of input data:
 *   - Sourcing prospects feed the targeting layer
 *   - Signal Console accounts feed the heat / radar layer
 *   - Deal Workspace deals feed the pressure / pipeline layer
 *
 * On an empty workspace we offer one path into each family, in
 * priority order. Three concrete paths, no hallway — consistent with
 * canon §4.2.
 *
 * Future-state hook: this is where a "market intelligence" surface
 * could live in the meantime — e.g. industry news the operator could
 * read while the workspace fills up. Not built today; the slot below
 * the three paths is reserved for it.
 */
export function EmptyDashboard(): JSX.Element {
    return (
        <section class="db-empty" aria-label="Get started">
            <header class="db-empty__head">
                <p class="db-empty__kicker">Dashboard is quiet</p>
                <h2 class="db-empty__title">
                    Nothing's under pressure yet because nothing's in the
                    workspace yet.
                </h2>
                <p class="db-empty__sub">
                    The ranking engine waits on three kinds of input — targets,
                    signals, and deals. Start with whichever you have a few
                    minutes for; the dashboard will start carrying weight the
                    moment one of them has real content.
                </p>
            </header>

            <ol class="db-empty__paths">
                <li class="db-empty__path">
                    <p class="db-empty__path-kicker">First · Targeting</p>
                    <h3 class="db-empty__path-title">
                        Push 10–25 prospects into the funnel.
                    </h3>
                    <p class="db-empty__path-body">
                        Sourcing Workbench is where prospects become qualified
                        accounts. The system needs a few before signal heat and
                        pipeline pressure mean anything.
                    </p>
                    <a class="db-empty__path-cta" href="/sourcing-workbench/">
                        Open Sourcing Workbench →
                    </a>
                </li>

                <li class="db-empty__path">
                    <p class="db-empty__path-kicker">Or · Live signal</p>
                    <h3 class="db-empty__path-title">
                        Add one real account you're watching right now.
                    </h3>
                    <p class="db-empty__path-body">
                        Signal Console is the radar. One live account with a
                        recent event lets the heat engine start firing — and
                        the dashboard can rank against that.
                    </p>
                    <a class="db-empty__path-cta" href="/signal-console/">
                        Open Signal Console →
                    </a>
                </li>

                <li class="db-empty__path">
                    <p class="db-empty__path-kicker">Or · Live pressure</p>
                    <h3 class="db-empty__path-title">
                        Load one deal you're currently working.
                    </h3>
                    <p class="db-empty__path-body">
                        Deal Workspace turns pipeline into recovery pressure.
                        A single live deal makes the ranking concrete: which
                        deal is weakest, what's the next corrective move.
                    </p>
                    <a class="db-empty__path-cta" href="/deal-workspace/">
                        Open Deal Workspace →
                    </a>
                </li>
            </ol>

            <p class="db-empty__foot">
                Coming later: a market-intelligence brief in this slot so
                there's something worth reading even before the workspace
                fills up.
            </p>
        </section>
    );
}
