import type { JSX } from "preact";
import { Hero } from "./components/Hero";
import { LaunchFolio } from "./components/LaunchFolio";
import { MilestoneLadder } from "./components/MilestoneLadder";
import { ActionStack } from "./components/ActionStack";

/**
 * Welcome — Phase 4 / Room 16, refaced in Program 6 / PR 3 against
 * the picked-winner Launch Folio · Commission Lock variant.
 *
 * Per canon §4.1 (Threshold family): move the user from setup into
 * the first real operating move. Bright field. Composed. One
 * dominant action per surface.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  Hero: headline + Week N · Day N stamp + chips        │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  LaunchFolio: 2×2 mandate panel — "Open the live mandate."   │
 *   │   • Where you are       • What is missing (LOCKED cell)      │
 *   │   • What unlocks next   • Return behavior                    │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  MilestoneLadder │ ActionStack                               │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * The Hero + LaunchFolio carry the "authored mandate" feeling
 * (canon §1 emotional territory). The Ladder + ActionStack carry
 * the operational moves (Phase 4 / first-90-seconds audit work).
 * Both layers preserved.
 */
export function Welcome(): JSX.Element {
    return (
        <div class="wel-shell">
            <Hero />
            <LaunchFolio />
            <div class="wel-grid">
                <MilestoneLadder />
                <ActionStack />
            </div>
        </div>
    );
}
