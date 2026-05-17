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
                <p class="db-empty__kicker">DASHBOARD IS QUIET</p>
                <h2 class="db-empty__title">
                    Nothing's under pressure yet because nothing's in the
                    workspace yet.
                </h2>
                <p class="db-empty__sub">
                    The ranking engine waits on three kinds of input —
                    targets, signals, and deals. Start with whichever you
                    have a few minutes for.
                </p>
            </header>

            <ol class="db-empty__paths">
                <li class="db-empty__path">
                    <p class="db-empty__path-kicker">FIRST · TARGETING</p>
                    <h3 class="db-empty__path-title">
                        Push 10–25 prospects into the funnel.
                    </h3>
                    <p class="db-empty__path-body">
                        Sourcing Workbench is where prospects become
                        qualified accounts. A few real names unlock signal
                        heat + pipeline pressure.
                    </p>
                    <a
                        class="db-empty__path-cta"
                        href="/sourcing-workbench/?returnTo=%2Fdashboard%2F&returnLabel=Back%20to%20Dashboard&fromMode=system&fromSurface=dashboard-empty"
                    >
                        Add prospects to the funnel
                    </a>
                </li>

                <li class="db-empty__path">
                    <p class="db-empty__path-kicker">OR · LIVE SIGNAL</p>
                    <h3 class="db-empty__path-title">
                        Add one real account you're watching right now.
                    </h3>
                    <p class="db-empty__path-body">
                        Signal Console is the radar. One live account with
                        a recent event lights up the heat engine — and the
                        Dashboard ranks against that.
                    </p>
                    <a
                        class="db-empty__path-cta"
                        href="/signal-console/?returnTo=%2Fdashboard%2F&returnLabel=Back%20to%20Dashboard&fromMode=system&fromSurface=dashboard-empty"
                    >
                        Add an account to the radar
                    </a>
                </li>

                <li class="db-empty__path">
                    <p class="db-empty__path-kicker">OR · LIVE PRESSURE</p>
                    <h3 class="db-empty__path-title">
                        Load one deal you're currently working.
                    </h3>
                    <p class="db-empty__path-body">
                        Deal Workspace turns pipeline into recovery
                        pressure. One live deal makes the ranking concrete:
                        which deal is weakest, what's the next move.
                    </p>
                    <a
                        class="db-empty__path-cta"
                        href="/deal-workspace/?returnTo=%2Fdashboard%2F&returnLabel=Back%20to%20Dashboard&fromMode=system&fromSurface=dashboard-empty"
                    >
                        Load a live deal
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
