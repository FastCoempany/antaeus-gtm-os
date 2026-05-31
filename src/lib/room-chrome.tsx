import type { JSX } from "preact";
import { Wordmark } from "./wordmark";
import { BackButton } from "./back-button";
import { PaletteTrigger } from "./palette/PaletteTrigger";
import { BirdseyeFloat } from "@/birdseye/BirdseyeFloat";
import { ScheduledFireToast } from "@/skills/ScheduledFireToast";
import { ScheduleModal } from "@/skills/ScheduleModal";
import "./room-chrome.css";

/**
 * RoomChrome — the top-of-room chrome strip every room mounts.
 *
 * Replaces the per-room `<div class="ant-room-chrome"><Wordmark .../></div>`
 * pattern with a single component that also renders the BackButton on
 * the right. BackButton itself is conditional — it renders null when
 * the URL carries no continuity params, so rooms loaded directly stay
 * looking exactly as they did before.
 *
 * Program 6 / PR 1 — closes the back-pill regression where Phase 2
 * wrote continuity params honestly but 18 of 20 destination rooms
 * never rendered the back-affordance. The shared component path
 * means future chrome additions (the cmd+K palette trigger,
 * workspace selector, etc.) get one home, not nineteen.
 *
 * Per canon Part II §1 (bright direction) + Part II §5 ("shell is
 * stable background, not a decision layer") — chrome stays
 * recessive; wordmark left, back-pill right, no competition with
 * room content.
 *
 * Usage:
 *
 *     <RoomChrome kicker="DEAL WORKSPACE" />
 *
 * Or with a workspace name:
 *
 *     <RoomChrome kicker="DASHBOARD" workspace="Antaeus" />
 *
 * `aux` lets a room slot extra chrome-level affordances between the
 * BackButton and the wordmark (rarely needed; reserved for future
 * room-specific chrome like the Readiness Anchor on Dashboard).
 */

export interface RoomChromeProps {
    readonly kicker?: string;
    readonly workspace?: string | null;
    /** Override the wordmark click destination. Defaults to "/". */
    readonly homeHref?: string;
    /** Optional extra chrome slot rendered before the BackButton. */
    readonly aux?: JSX.Element | null;
}

export function RoomChrome(props: RoomChromeProps): JSX.Element {
    return (
        <div class="ant-room-chrome">
            <Wordmark
                kicker={props.kicker}
                workspace={props.workspace}
                homeHref={props.homeHref}
            />
            <div class="ant-room-chrome__aux">
                {props.aux ?? null}
                <BackButton />
                <PaletteHintButton />
            </div>
            <PaletteTrigger />
            <BirdseyeFloat />
            <ScheduledFireToast />
            <ScheduleModal />
        </div>
    );
}

/**
 * Visible affordance for the cmd+K palette so it's discoverable for
 * mouse-first / non-keyboard users. Per canon Part II §5: "the
 * command palette is a force multiplier, not a dependency" + "the
 * mouse-first user must succeed." Clicking opens the same palette
 * the keyboard summons.
 */
function PaletteHintButton(): JSX.Element {
    return (
        <button
            type="button"
            class="ant-room-chrome__palette-hint"
            aria-label="Jump to a room (press cmd+K)"
            onClick={() => {
                // Lazy import to avoid the palette UI being on the
                // critical render path before it's needed.
                void import("./palette/Palette").then((m) => m.openPalette());
            }}
        >
            <span class="ant-room-chrome__palette-hint-icon" aria-hidden="true">⌘K</span>
            <span class="ant-room-chrome__palette-hint-label">Jump</span>
        </button>
    );
}
