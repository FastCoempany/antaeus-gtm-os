import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { METHOD_TEMPLATES, type MethodTemplate } from "../lib/scripts";

/**
 * MethodSheets — Wave 3 implementation.
 *
 * Per canon §4.10: "These support the cue. They do not organize the
 * room." Renders the 4 reference templates (Connection / Public cue /
 * Give-first / Ask) with copy-to-clipboard buttons. Substitution tokens
 * like [Name] / [topic] / [pressure] are highlighted in orange so the
 * operator scans them quickly.
 */

function highlightTokens(body: string): JSX.Element[] {
    // Splits on bracketed tokens like [Name] or [specific strain] and
    // renders each match as <em>. The empty-string segments between
    // adjacent matches are filtered.
    const parts = body.split(/(\[[^\]]+\])/g).filter((p) => p.length > 0);
    return parts.map((p, i) =>
        p.startsWith("[") && p.endsWith("]") ? (
            <em key={i}>{p}</em>
        ) : (
            <span key={i}>{p}</span>
        )
    );
}

interface SheetProps {
    readonly template: MethodTemplate;
}

function Sheet({ template }: SheetProps): JSX.Element {
    const [toast, setToast] = useState<string>("");

    function flash(msg: string): void {
        setToast(msg);
        setTimeout(() => setToast(""), 1800);
    }

    function copy(): void {
        if (
            typeof navigator === "undefined" ||
            !navigator.clipboard ||
            !navigator.clipboard.writeText
        ) {
            flash("Copy unavailable");
            return;
        }
        navigator.clipboard
            .writeText(template.body)
            .then(() => flash("Copied"))
            .catch(() => flash("Copy failed"));
    }

    return (
        <article class="lp-sheet" data-lp-method={template.key}>
            <p class="lp-sheet__kicker">{template.kicker}</p>
            <h3 class="lp-sheet__heading">{template.heading}</h3>
            <p class="lp-sheet__small">{template.small}</p>
            <p class="lp-sheet__body">{highlightTokens(template.body)}</p>
            <button type="button" class="lp-sheet__copy" onClick={copy}>
                Copy line
            </button>
            {toast ? (
                <span class="lp-sheet__toast" role="status">
                    {toast}
                </span>
            ) : null}
        </article>
    );
}

export function MethodSheets(): JSX.Element {
    return (
        <section class="lp-method" aria-label="LinkedIn method sheets">
            <header class="lp-method__head">
                <div>
                    <p class="lp-method__kicker">SECONDARY METHOD SHEETS</p>
                    <h2 class="lp-method__title">
                        Reference stays below the booth.
                    </h2>
                </div>
                <p class="lp-method__copy">
                    These support the cue. They do not organize the room.
                </p>
            </header>
            <div class="lp-method__grid">
                {METHOD_TEMPLATES.map((t) => (
                    <Sheet key={t.key} template={t} />
                ))}
            </div>
        </section>
    );
}
