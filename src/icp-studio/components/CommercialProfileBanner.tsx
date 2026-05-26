import type { JSX } from "preact";
import {
    profileDirty,
    profileDraft,
    profileLoaded,
    patchProfileDraft,
    commercialProfile
} from "../state";
import { saveProfile } from "../lib/profile-persistence";
import { trackEvent } from "@/lib/observability";

/**
 * CommercialProfileBanner (ADR-007) — the operator's own selling
 * identity, pinned above the ICP rows.
 *
 * What WE sell (product category, what-we-sell, value prop), as
 * distinct from who we sell to (the ICP rows below). One per
 * workspace; the single source of truth the Briefing reads to anchor
 * category-specific intelligence.
 *
 * Behavioral notes (canon Part III):
 *   - Rule 5 (every save must visibly matter): the Save control shows
 *     a clear dirty → saving → saved state; an unsaved edit is never
 *     ambiguous.
 *   - Frames the ICPs below — the kicker reads "…and here's who we
 *     sell it to" so the relationship between profile + ICPs is legible.
 */
export function CommercialProfileBanner(): JSX.Element {
    const draft = profileDraft.value;
    const dirty = profileDirty.value;
    const loaded = profileLoaded.value;
    const saved = commercialProfile.value;
    const hasSaved =
        saved.productCategory.length > 0 ||
        saved.whatWeSell.length > 0 ||
        saved.valueProp.length > 0;

    const onSave = (): void => {
        if (!dirty) return;
        void saveProfile(profileDraft.value);
        trackEvent("icp_profile_save_click", {});
    };

    return (
        <section class="icp-profile" aria-labelledby="icp-profile-title">
            <div class="icp-profile__head">
                <p class="icp-profile__kicker">
                    Your commercial identity
                </p>
                <h2 id="icp-profile-title" class="icp-profile__title">
                    What you sell.
                </h2>
                <p class="icp-profile__sub">
                    The category you compete in and the value you carry into
                    every deal. The briefing reads this to tell you what's
                    moving in your space — and who you compete with. Below,
                    you sharpen who you sell it to.
                </p>
            </div>

            <div class="icp-profile__fields">
                <label class="icp-profile__field">
                    <span class="icp-profile__label">Product category</span>
                    <input
                        type="text"
                        class="icp-profile__input"
                        placeholder="e.g. founder-to-first-operator revenue OS"
                        value={draft.productCategory}
                        disabled={!loaded}
                        onInput={(e) =>
                            patchProfileDraft({
                                productCategory: (e.target as HTMLInputElement).value
                            })
                        }
                    />
                </label>

                <label class="icp-profile__field">
                    <span class="icp-profile__label">What you sell</span>
                    <input
                        type="text"
                        class="icp-profile__input"
                        placeholder="e.g. a GTM operating system for founder-led teams"
                        value={draft.whatWeSell}
                        disabled={!loaded}
                        onInput={(e) =>
                            patchProfileDraft({
                                whatWeSell: (e.target as HTMLInputElement).value
                            })
                        }
                    />
                </label>

                <label class="icp-profile__field icp-profile__field--wide">
                    <span class="icp-profile__label">Value proposition</span>
                    <textarea
                        class="icp-profile__textarea"
                        rows={2}
                        placeholder="The core promise — what changes for the buyer because they bought you."
                        value={draft.valueProp}
                        disabled={!loaded}
                        onInput={(e) =>
                            patchProfileDraft({
                                valueProp: (e.target as HTMLTextAreaElement).value
                            })
                        }
                    />
                </label>
            </div>

            <div class="icp-profile__foot">
                <span
                    class={`icp-profile__state ${
                        dirty
                            ? "is-dirty"
                            : hasSaved
                            ? "is-saved"
                            : "is-empty"
                    }`}
                >
                    {!loaded
                        ? "Loading…"
                        : dirty
                        ? "Unsaved changes"
                        : hasSaved
                        ? "Saved"
                        : "Not set yet"}
                </span>
                <button
                    type="button"
                    class="icp-profile__save"
                    disabled={!dirty || !loaded}
                    onClick={onSave}
                >
                    Save commercial identity
                </button>
            </div>
        </section>
    );
}
