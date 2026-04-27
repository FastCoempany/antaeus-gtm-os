import type { JSX } from "preact";
import { recentIcps, totalWorked } from "../state";

/**
 * DarkHero — Wave 1 placeholder.
 *
 * Per Part II §4.8 ICP Studio is a Decision Bench hybrid: dark hero
 * carries the strategic thesis above a bright work area where the
 * actual decision gets shaped. Wave 3 fills the hero with the live
 * statement preview + quality readout + recent-ICP carousel.
 */
export function DarkHero(): JSX.Element {
    const worked = totalWorked.value;
    const saved = recentIcps.value.length;
    return (
        <section class="icp-hero" aria-label="ICP Studio hero">
            <div class="icp-hero__inner">
                <p class="icp-hero__kicker">DECISION BENCH · ICP STUDIO</p>
                <h1 class="icp-hero__title">
                    Sharpen <span>one</span> wedge before scale compounds the
                    wrong things.
                </h1>
                <p class="icp-hero__note">
                    The ICP is the filter that becomes "ICP Match" scoring on
                    every Account everywhere. Thin means fewer assumptions,
                    fewer personas, fewer use cases.
                </p>
                <div class="icp-hero__meta" role="status">
                    <span class="icp-hero__badge">
                        {saved} {saved === 1 ? "ICP" : "ICPs"} saved
                    </span>
                    <span class="icp-hero__badge">
                        {worked} {worked === 1 ? "session" : "sessions"} worked
                    </span>
                </div>
            </div>
        </section>
    );
}
