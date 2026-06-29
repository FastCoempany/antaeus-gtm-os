import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { ACCOUNT_FLOOR, parseAccountEntries, patchDraft, draft } from "../draft";
import { nextStep } from "../state";

/**
 * AccountsStep (slice 3) — names or domains, breadth is cheap, the
 * enrichment finds the rest (slice 4). The textarea takes commas,
 * semicolons, or newlines; every entry is parsed + validated live and
 * shown back as a chip (accepted, or flagged with a reason) so junk can't
 * be pasted in and clicked past. Domains are preferred — they're
 * unambiguous for the web search. On advance we store the accepted values.
 */
const raw = signal("");

function advance(entries: ReturnType<typeof parseAccountEntries>): void {
    const names = entries.filter((e) => e.valid).map((e) => e.value);
    patchDraft({ accountNames: names });
    nextStep();
}

/** @internal test reset. */
export function __resetAccountsStepForTests(): void {
    raw.value = "";
}

export function AccountsStep(): JSX.Element {
    // Seed the box from any names already in the draft (resumable / back-nav).
    if (raw.value === "" && draft.value.accountNames.length > 0) {
        raw.value = draft.value.accountNames.join("\n");
    }
    const entries = parseAccountEntries(raw.value);
    const valid = entries.filter((e) => e.valid);
    const flagged = entries.filter((e) => !e.valid);
    const enough = valid.length >= ACCOUNT_FLOOR;

    return (
        <section class="sd-step">
            <p class="sd-kicker">{t("The list · who you're chasing", { class: "body" })}</p>
            <h1 class="sd-h1">{t("Now — who are you chasing?", { class: "body" })}</h1>
            <p class="sd-lede">
                {t(
                    "Just the companies. One per line, or paste a comma-separated list. Their website beats the name — apex.com is one company, “Apex” is a thousand — so drop a domain wherever you have it. Don't research them; the system does that next.",
                    { class: "body" }
                )}
            </p>
            <textarea
                class="sd-ta"
                spellcheck={false}
                placeholder={t("apex.com, northwind.io, Brightwave…", { class: "body" })}
                value={raw.value}
                onInput={(e) => {
                    raw.value = (e.currentTarget as HTMLTextAreaElement).value;
                }}
            />

            {entries.length > 0 ? (
                <div class="sd-acc-chips">
                    {valid.map((e) => (
                        <span class="sd-acc-chip" key={e.value}>
                            {e.kind === "domain" ? <span class="sd-acc-chip__b">{t("site", { class: "body" })}</span> : null}
                            {e.value}
                        </span>
                    ))}
                    {flagged.map((e, i) => (
                        <span class="sd-acc-chip is-bad" key={`${e.raw}-${i}`} title={e.reason}>
                            {e.raw || t("(blank)", { class: "body" })}
                            <span class="sd-acc-chip__why">{e.reason}</span>
                        </span>
                    ))}
                </div>
            ) : null}

            <p class="sd-hint">
                {valid.length === 0
                    ? t("Paste at least five companies — even a rough list.", { class: "body" })
                    : enough
                      ? t("{n} good to go. Even fifty is a two-minute job — breadth is cheap here.", { class: "body" }).replace(
                            "{n}",
                            String(valid.length)
                        )
                      : t("{n} so far — {m} more to go. Breadth is cheap here.", { class: "body" })
                            .replace("{n}", String(valid.length))
                            .replace("{m}", String(ACCOUNT_FLOOR - valid.length))}
                {flagged.length > 0
                    ? t(" {f} flagged below — fix or ignore; they won't be sent.", { class: "body" }).replace(
                          "{f}",
                          String(flagged.length)
                      )
                    : ""}
            </p>

            <div class="sd-foot">
                <button
                    type="button"
                    class="sd-btn"
                    disabled={!enough}
                    onClick={() => advance(entries)}
                >
                    {t("Enrich these →", { class: "body" })}
                </button>
            </div>
        </section>
    );
}
