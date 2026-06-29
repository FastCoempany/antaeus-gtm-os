import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { draft, parseAccountNames, patchDraft } from "../draft";
import { nextStep } from "../state";

/**
 * AccountsStep (slice 3) — names only, breadth is cheap. The enrichment
 * finds the rest (slice 4). Local signal holds the raw textarea; on
 * advance we parse + store the names in the draft.
 */
const raw = signal("");

function advance(): void {
    const names = parseAccountNames(raw.value);
    patchDraft({ accountNames: names });
    nextStep();
}

export function AccountsStep(): JSX.Element {
    // Seed the textarea from any names already in the draft (resumable).
    if (raw.value === "" && draft.value.accountNames.length > 0) {
        raw.value = draft.value.accountNames.join("\n");
    }
    const count = parseAccountNames(raw.value).length;
    return (
        <section class="sd-step">
            <p class="sd-kicker">{t("The list · who you're chasing", { class: "body" })}</p>
            <h1 class="sd-h1">{t("Now — who are you chasing?", { class: "body" })}</h1>
            <p class="sd-lede">
                {t(
                    "Just the names. Don't research them, don't fill in fields. Paste who's on your mind and the system goes and finds the rest.",
                    { class: "body" }
                )}
            </p>
            <textarea
                class="sd-ta"
                spellcheck={false}
                placeholder={t("One company per line…", { class: "body" })}
                value={raw.value}
                onInput={(e) => {
                    raw.value = (e.currentTarget as HTMLTextAreaElement).value;
                }}
            />
            <p class="sd-hint">
                {count > 0
                    ? t("{n} pasted. Even 50 is a two-minute job — breadth is cheap here.", {
                          class: "body"
                      }).replace("{n}", String(count))
                    : t("Paste a list — even a rough one.", { class: "body" })}
            </p>
            <div class="sd-foot">
                <button
                    type="button"
                    class="sd-btn"
                    disabled={count === 0}
                    onClick={advance}
                >
                    {t("Enrich these →", { class: "body" })}
                </button>
            </div>
        </section>
    );
}
