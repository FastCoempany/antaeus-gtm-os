import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { activation, model, roleLabel } from "../state";

/**
 * Hero — the threshold serif headline + activation chips. Per canon
 * §4.1 the room is invitational, bright, composed. The chips list
 * is intentionally short (<= 4) so the hero stays legible.
 */
export function Hero(): JSX.Element {
    const m = model.value;
    const ctx = activation.value;
    const role = roleLabel.value;
    const chips = buildChips(ctx, role, m);
    return (
        <header class="wel-hero">
            <BackButton />
            <p class="wel-hero__kicker">Threshold</p>
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
            <div class="wel-hero__progress">
                <span class="wel-hero__progress-label">
                    Anchors live
                </span>
                <span class="wel-hero__progress-count">
                    {m.completed} / {m.total}
                </span>
                <div class="wel-hero__progress-bar">
                    <span
                        class="wel-hero__progress-fill"
                        style={`width:${m.total > 0 ? (m.completed / m.total) * 100 : 0}%`}
                    />
                </div>
            </div>
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
