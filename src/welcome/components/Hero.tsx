import type { JSX } from "preact";
import { Wordmark } from "@/lib/wordmark";
import { activation, model, roleLabel } from "../state";

/**
 * Hero — threshold serif headline + activation chrome.
 *
 * Post first-90-seconds audit:
 *   - Threshold kicker removed (internal architecture language).
 *   - BackButton removed (Welcome is the threshold; there's nothing
 *     coherent to navigate back to from here).
 *   - Wordmark added in the top-left chrome (global brand presence;
 *     also gives the operator a reliable home link).
 *   - Chips are suppressed on the empty state — they were
 *     decorative when there's nothing to summarize. They return as
 *     soon as the workspace has any context (company name, role,
 *     completed anchors > 0).
 */
export function Hero(): JSX.Element {
    const m = model.value;
    const ctx = activation.value;
    const role = roleLabel.value;
    const isEmptyState = m.completed === 0;
    const chips = isEmptyState ? [] : buildChips(ctx, role, m);
    return (
        <header class="wel-hero">
            <div class="wel-hero__chrome">
                <Wordmark
                    kicker="WORKSPACE"
                    workspace={ctx.companyName ?? null}
                />
            </div>
            <h1 class="wel-hero__title">{m.headline}</h1>
            <p class="wel-hero__subtitle">{m.body}</p>
            {chips.length > 0 ? (
                <ul class="wel-hero__chips" aria-label="Activation context">
                    {chips.map((chip) => (
                        <li key={chip} class="wel-chip">
                            {chip}
                        </li>
                    ))}
                </ul>
            ) : null}
            {!isEmptyState ? (
                <div class="wel-hero__progress">
                    <span class="wel-hero__progress-label">Anchors live</span>
                    <span class="wel-hero__progress-count">
                        {m.completed} / {m.total}
                    </span>
                    <div class="wel-hero__progress-bar">
                        <span
                            class="wel-hero__progress-fill"
                            style={`width:${
                                m.total > 0
                                    ? (m.completed / m.total) * 100
                                    : 0
                            }%`}
                        />
                    </div>
                </div>
            ) : null}
        </header>
    );
}

function buildChips(
    ctx: { companyName: string | null; categoryLabel: string | null },
    role: string,
    m: { completed: number; total: number }
): string[] {
    const out: string[] = [];
    if (ctx.companyName) out.push(ctx.companyName);
    out.push(`${role} activation`);
    if (ctx.categoryLabel) out.push(ctx.categoryLabel);
    out.push(`${m.completed}/${m.total} anchors`);
    return out.slice(0, 4);
}
