import type { JSX } from "preact";
import { RoomChrome } from "@/lib/room-chrome";
import { activation, model, roleLabel, stamp } from "../state";

/**
 * Hero — threshold serif headline + activation chrome.
 *
 * Post first-90-seconds audit:
 *   - Threshold kicker removed (internal architecture language).
 *   - Chips are suppressed on the empty state — they were
 *     decorative when there's nothing to summarize. They return as
 *     soon as the workspace has any context (company name, role,
 *     completed anchors > 0).
 *
 * Program 6 / PR 1: chrome strip now goes through the shared
 * RoomChrome component. Welcome is normally the threshold, but the
 * back-pill still appears when Sarah arrives via a sibling room
 * with continuity params (e.g. Settings → "Re-run onboarding" loops
 * her through Welcome). Continuity-aware → renders only when there
 * is somewhere coherent to return to.
 *
 * Program 6 / PR 3: gained the Launch Folio · Commission Lock
 * stamp affordance ("Week N · Day N"). Sits quietly in the top-
 * right of the hero, gives the surface temporal presence + the
 * "this file has been live since…" feeling the wireframe carried.
 */
export function Hero(): JSX.Element {
    const m = model.value;
    const ctx = activation.value;
    const role = roleLabel.value;
    const stampVal = stamp.value;
    const isEmptyState = m.completed === 0;
    const chips = isEmptyState ? [] : buildChips(ctx, role, m);
    return (
        <header class="wel-hero">
            <div class="wel-hero__chrome">
                <RoomChrome
                    kicker="WELCOME"
                    workspace={ctx.companyName ?? null}
                />
            </div>
            <div class="wel-hero__head">
                <h1 class="wel-hero__title">{m.headline}</h1>
                <span class="wel-hero__stamp" aria-label="Workspace age">
                    {stampVal.label}
                </span>
            </div>
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
    out.push(`${role}`);
    if (ctx.categoryLabel) out.push(ctx.categoryLabel);
    out.push(`${m.completed}/${m.total} anchors live`);
    return out.slice(0, 4);
}
