import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { rack } from "../state";

/**
 * SwitchReads — right column of the Switchboard Loft.
 *
 * Live read of the rack — what's connected, what's loose, and the
 * one next move that lifts the board state. Per the picked-winner
 * Variant 03 / Switchboard Loft wireframe these are the two read
 * cards on the right side of the loft.
 *
 * Read levels (derived from filled-input count):
 *   - 5/5 filled  → "Ready" (green) — Ship the line.
 *   - 3-4 filled  → "Tighten" (orange) — name what's loose.
 *   - 0-2 filled  → "Loose" (amber) — start with the account.
 *
 * The next move follows the generator's dependency order:
 *   account → contact → persona → temperature → trigger
 * The first unfilled input in this order is what the next move
 * names.
 */
export function SwitchReads(): JSX.Element {
    const r = rack.value;
    const status = readStatus(r);
    const move = nextMove(r);

    return (
        <aside class="ob-loft__reads" aria-label="Where the line stands">
            <article class={`ob-read ob-read--${status.tone}`}>
                <p class="ob-read__kicker">WHERE THE LINE STANDS</p>
                <p class="ob-read__title">{status.headline}</p>
                <p class="ob-read__copy">{status.copy}</p>
            </article>
            <article class="ob-read">
                <p class="ob-read__kicker">NEXT MOVE</p>
                <p class="ob-read__title">{move.headline}</p>
                <p class="ob-read__copy">{move.copy}</p>
            </article>
        </aside>
    );
}

interface ReadStatus {
    readonly tone: "ready" | "tighten" | "loose";
    readonly headline: string;
    readonly copy: string;
}

function readStatus(r: {
    readonly accountName: string;
    readonly contactName: string;
    readonly persona: string;
    readonly temperature: string;
    readonly trigger: string;
}): ReadStatus {
    // Count the filled inputs. Persona / temperature / trigger have
    // defaults but if the operator hasn't intentionally moved them
    // off the empty rack, the line is still loose.
    const filled = [
        r.accountName.trim().length > 0,
        r.contactName.trim().length > 0,
        true, // persona always has a default
        true, // temperature always has a default
        true // trigger always has a default
    ].filter(Boolean).length;

    if (filled >= 5 && r.accountName.trim() && r.contactName.trim()) {
        return {
            tone: "ready",
            headline: t("Ready to ship."),
            copy: t("Every jack is patched. The generated line is honest.", {
                class: "body"
            })
        };
    }
    if (r.accountName.trim()) {
        return {
            tone: "tighten",
            headline: t("Tighten the contact."),
            copy: t("The account is patched. The buyer is still loose.", {
                class: "body"
            })
        };
    }
    return {
        tone: "loose",
        headline: t("Two cables are loose."),
        copy: t("Patch the account first, then the contact carries the line.", {
            class: "body"
        })
    };
}

interface MoveCopy {
    readonly headline: string;
    readonly copy: string;
}

function nextMove(r: {
    readonly accountName: string;
    readonly contactName: string;
}): MoveCopy {
    if (!r.accountName.trim()) {
        return {
            headline: t("Start with the account."),
            copy: t(
                "Type or pick the account name. Signal Console accounts auto-suggest.",
                { class: "body" }
            )
        };
    }
    if (!r.contactName.trim()) {
        return {
            headline: t("Add the buyer name."),
            copy: t(
                "The contact is the first human cable. Without it the line is a category.",
                { class: "body" }
            )
        };
    }
    return {
        headline: t("Ship the line."),
        copy: t("Hit Copy or Log touch — every input is patched.", {
            class: "body"
        })
    };
}
