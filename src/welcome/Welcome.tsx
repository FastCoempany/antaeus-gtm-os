import type { JSX } from "preact";
import { Hero } from "./components/Hero";
import { MilestoneLadder } from "./components/MilestoneLadder";
import { ActionStack } from "./components/ActionStack";

/**
 * Welcome — Phase 4 / Room 16 root.
 *
 * Per canon §4.1 (Threshold family): move the user from setup into
 * the first real operating move. Bright field. Composed. One
 * dominant action per surface.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  Hero: thesis headline + chips + progress    │
 *   ├──────────────────────────────────────────────┤
 *   │  MilestoneLadder │ ActionStack               │
 *   └──────────────────────────────────────────────┘
 */
export function Welcome(): JSX.Element {
    return (
        <div class="wel-shell">
            <Hero />
            <div class="wel-grid">
                <MilestoneLadder />
                <ActionStack />
            </div>
        </div>
    );
}
