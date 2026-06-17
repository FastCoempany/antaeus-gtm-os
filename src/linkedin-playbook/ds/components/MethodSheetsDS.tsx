import { signal, type Signal } from "@preact/signals";
import type { JSX } from "preact";
import { Button, Kicker } from "@/components";
import { t } from "@/lib/voice/t";
import { METHOD_TEMPLATES, type MethodTemplate } from "../../lib/scripts";

/**
 * MethodSheetsDS — the secondary reference panel (canon §4.10: "these
 * support the cue, they do not organize the room"). The four message
 * archetypes (Connection / Public cue / Give-first / Ask) as always-
 * visible, copy-to-clipboard scaffolds with the [token] blanks marked.
 *
 * Ported back into the DS surface 2026-06-17. The cue stage shows the
 * live single-step script for the cue you're on; this is the full
 * reference library with copy buttons — and for a room whose whole job
 * is "send the right message," losing copy-to-clipboard was the real
 * regression in the first DS rebuild.
 *
 * Hook-free (module-level signal for the per-card copy flash) so it
 * renders under the vitest transform — same pattern as CueStage.
 */

const copyState: Signal<{ key: string; msg: string } | null> = signal(null);

function doCopy(tpl: MethodTemplate): void {
    const set = (msg: string): void => {
        copyState.value = { key: tpl.key, msg };
        setTimeout(() => {
            if (copyState.value?.key === tpl.key) copyState.value = null;
        }, 1800);
    };
    if (
        typeof navigator === "undefined" ||
        !navigator.clipboard ||
        !navigator.clipboard.writeText
    ) {
        set(t("Copy unavailable", { class: "body" }));
        return;
    }
    navigator.clipboard
        .writeText(tpl.body)
        .then(() => set(t("Copied")))
        .catch(() => set(t("Copy failed", { class: "body" })));
}

function highlightTokens(body: string): JSX.Element[] {
    // Split on bracketed tokens like [Name] / [pressure] and mark each.
    const parts = body.split(/(\[[^\]]+\])/g).filter((p) => p.length > 0);
    return parts.map((p, i) =>
        p.startsWith("[") && p.endsWith("]") ? (
            <em key={i} class="lpd-method__token">
                {p}
            </em>
        ) : (
            <span key={i}>{p}</span>
        )
    );
}

export function MethodSheetsDS(): JSX.Element {
    const flash = copyState.value;
    return (
        <section class="lpd-method" aria-label={t("Method reference")}>
            <header class="lpd-method__head">
                <Kicker>{t("METHOD SHEETS")}</Kicker>
                <p class="lpd-method__copy">
                    {t("Reference for the cue you're on. Copy, fill the blanks, send.", {
                        class: "body"
                    })}
                </p>
            </header>
            <div class="lpd-method__grid">
                {METHOD_TEMPLATES.map((tpl) => (
                    <article
                        key={tpl.key}
                        class="lpd-method__card"
                        data-lp-method={tpl.key}
                    >
                        <p class="lpd-method__kicker">{tpl.kicker}</p>
                        <h3 class="lpd-method__heading">{tpl.heading}</h3>
                        <p class="lpd-method__small">{tpl.small}</p>
                        <p class="lpd-method__body">{highlightTokens(tpl.body)}</p>
                        <div class="lpd-method__foot">
                            <Button variant="secondary" onClick={() => doCopy(tpl)}>
                                {t("Copy line")}
                            </Button>
                            {flash && flash.key === tpl.key ? (
                                <span class="lpd-method__flash" role="status">
                                    {flash.msg}
                                </span>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
