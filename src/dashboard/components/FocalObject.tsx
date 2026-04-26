import type { JSX } from "preact";
import type { CommandObject } from "../lib/types";
import { explainCommandObject } from "../lib/command-intelligence";
import { CommandReasons } from "./CommandReasons";

interface Props {
    readonly object: CommandObject;
}

/**
 * FocalObject — the dominant card in Spotlight mode.
 *
 * Per canon §4.2 + Part III §3 rule 1: "one dominant move per screen."
 * Renders title + family kicker + score + explanation + reasons + a
 * single primary CTA (the first action). Secondary actions are
 * available but visually quieter.
 */
export function FocalObject({ object }: Props): JSX.Element {
    const explanation = explainCommandObject(object, "spotlight");
    const primary = object.actions[0];
    const secondary = object.actions.slice(1, 3);

    return (
        <article class="db-focal" aria-labelledby={`focal-${object.id}`}>
            <header class="db-focal__header">
                <p class="db-focal__kicker">
                    {object.roomFamilyLabel} · score {object.score}
                </p>
                <h2 id={`focal-${object.id}`} class="db-focal__title">
                    {object.title}
                </h2>
                {object.copy ? (
                    <p class="db-focal__copy">{object.copy}</p>
                ) : null}
            </header>

            <section class="db-focal__why" aria-label={explanation.label}>
                <p class="db-focal__why-label">{explanation.label}</p>
                <p class="db-focal__why-title">{explanation.title}</p>
                <p class="db-focal__why-copy">{explanation.copy}</p>
                <CommandReasons reasons={object.scoreReasons} />
            </section>

            {primary ? (
                <footer class="db-focal__actions">
                    <a
                        class="db-focal__cta db-focal__cta--primary"
                        href={primary.href}
                    >
                        {primary.label}
                    </a>
                    {secondary.map((a) => (
                        <a
                            key={a.href}
                            class="db-focal__cta db-focal__cta--ghost"
                            href={a.href}
                        >
                            {a.label}
                        </a>
                    ))}
                </footer>
            ) : null}
        </article>
    );
}
