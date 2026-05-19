import type { JSX } from "preact";
import {
    draft,
    effectiveBuyer,
    effectiveIndustry,
    recentIcps
} from "../state";
import { buildIcpQuality } from "../lib/quality";

/**
 * RunDocket — Variant 01 / Wedge Ledger right-aside.
 *
 * Sits to the right of the WedgeLedger. Three blocks:
 *
 *   ┌─────────────────────────────────┐
 *   │ Read score — big number + label │
 *   ├─────────────────────────────────┤
 *   │ Weakest field — headline + copy │
 *   ├─────────────────────────────────┤
 *   │ Broad version to avoid          │
 *   │ — operator-voice headline + copy│
 *   ├─────────────────────────────────┤
 *   │ Downstream changes              │
 *   │ — what other rooms will adopt   │
 *   │   once this wedge is saved      │
 *   └─────────────────────────────────┘
 *
 * Derives:
 *   - Score + label from buildIcpQuality
 *   - Weakest field: first input that's empty or thin
 *   - Broad version: opposite-of-wedge sentence the system rejects
 *   - Downstream changes: which rooms will sharpen + how
 */

function parseActiveAccounts(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

interface WeakestField {
    readonly headline: string;
    readonly copy: string;
}

function findWeakest(): WeakestField | null {
    const d = draft.value;
    if (effectiveIndustry.value.trim().length === 0) {
        return {
            headline: "Industry is unset.",
            copy: "Without one named industry, you can't build a real list. The ICP is half a strategy."
        };
    }
    if (effectiveBuyer.value.trim().length === 0) {
        return {
            headline: "Buyer is unset.",
            copy: "Pick the buyer role. If you don't name who has authority, outbound is guessing."
        };
    }
    if (d.trigger.trim().length === 0) {
        return {
            headline: "Trigger is still implied.",
            copy: "Until you name the event that's forcing the buyer to act, the ICP is still half a strategy and half hope."
        };
    }
    if (d.pain.trim().length === 0) {
        return {
            headline: "Pain is not named.",
            copy: "Write the pain the way a buyer would say it out loud, not as a category label."
        };
    }
    if (d.pain.trim().length < 24) {
        return {
            headline: "Pain reads as a category.",
            copy: "Write the pain the way a real buyer would speak it, not the way a slide deck would phrase it."
        };
    }
    if (d.size.trim().length === 0) {
        return {
            headline: "Size band is unset.",
            copy: "Pick a size range. How big or small the list ends up depends on it."
        };
    }
    if (d.proofWindow.trim().length === 0) {
        return {
            headline: "Proof window is unset.",
            copy: "Pick a window the buyer can hold in their head. Something like a quarter is the right size."
        };
    }
    return null;
}

export function RunDocket(): JSX.Element {
    const d = draft.value;
    const industry = effectiveIndustry.value;
    const buyer = effectiveBuyer.value;
    const quality = buildIcpQuality({
        role: d.role,
        industry,
        size: d.size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow,
        activeAccounts: parseActiveAccounts(d.engineActive)
    });
    const weakest = findWeakest();
    const savedCount = recentIcps.value.length;

    return (
        <aside class="icp-docket" aria-label="Run docket">
            <div class={`icp-docket__score icp-docket__score--${quality.tier}`}>
                <div class="icp-docket__score-head">
                    <p class="icp-docket__score-kicker">RUN READ</p>
                    <p class="icp-docket__score-label">{quality.label}</p>
                </div>
                <p class="icp-docket__score-value">{quality.score}</p>
            </div>

            <article class="icp-docket__block">
                <p class="icp-docket__block-label">Weakest field</p>
                <p class="icp-docket__block-headline">
                    {weakest?.headline ?? "The ICP holds together."}
                </p>
                <p class="icp-docket__block-copy">
                    {weakest?.copy ??
                        "No obviously weak field. Revisit the trigger if the pressure on the buyer shifts."}
                </p>
            </article>

            <article class="icp-docket__block">
                <p class="icp-docket__block-label">Broad version to avoid</p>
                <p class="icp-docket__block-headline">
                    "B2B companies needing more pipeline."
                </p>
                <p class="icp-docket__block-copy">
                    The room should visibly punish this kind of language. A sentence anyone could write is a sentence the rest of the app can't target against.
                </p>
            </article>

            <article class="icp-docket__block">
                <p class="icp-docket__block-label">Downstream changes</p>
                <p class="icp-docket__block-copy">
                    Territory narrows to a real geography. Sourcing looks for the specific buyer role. Outbound stops writing generic productivity language. Discovery opens on the named pain.
                </p>
            </article>

            <p class="icp-docket__foot">
                {savedCount > 0
                    ? `${savedCount} ICP${savedCount === 1 ? "" : "s"} saved in this workspace.`
                    : "No ICP saved yet. The score becomes the read once you save."}
            </p>
        </aside>
    );
}
