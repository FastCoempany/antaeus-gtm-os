import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import {
    decidePendingProposal,
    decisionBusyId,
    decisionError,
    markPendingProposalViewed,
    pendingProposals,
    pendingProposalsLoaded
} from "../state";

/**
 * SuggestionsSection — Phase F (ADR-017) proposal surface in the
 * Briefing room.
 *
 * Per ADR-017 §"Proposal surface (a)" — one proposal at a time, never
 * a queue. The operator sees the most recent pending proposal with
 * three buttons (Accept / Dismiss / Snooze 30d). When acted on, the
 * next pending proposal slides up.
 *
 * Empty state: nothing rendered. The system is quiet when there's
 * nothing to propose — proposals are signal, not chrome.
 */
export function SuggestionsSection(): JSX.Element | null {
    const loaded = pendingProposalsLoaded.value;
    const all = pendingProposals.value;
    const busyId = decisionBusyId.value;
    const error = decisionError.value;

    // Show the most recent un-viewed proposal first; if all have been
    // viewed, show the most recent overall. The list is already
    // ordered newest-first by loadPendingProposals.
    const next = pickNext(all);

    useEffect(() => {
        if (next && next.viewedAt === null) {
            markPendingProposalViewed(next.id);
        }
    }, [next?.id]);

    if (!loaded || !next) return null;

    const busy = busyId === next.id;

    return (
        <section
            class="bf-suggestion"
            aria-labelledby="bf-suggestion-heading"
        >
            <p class="bf-suggestion__kicker">A SUGGESTION</p>
            <h2 id="bf-suggestion-heading" class="bf-suggestion__title">
                {next.title}
            </h2>
            <p class="bf-suggestion__noticed">
                <span class="bf-suggestion__label">What I noticed:</span>{" "}
                {next.whatNoticed}
            </p>
            <p class="bf-suggestion__changes">
                <span class="bf-suggestion__label">What would change:</span>{" "}
                {next.whatChanges}
            </p>
            <div class="bf-suggestion__actions">
                <button
                    type="button"
                    class="bf-suggestion__btn bf-suggestion__btn--primary"
                    onClick={() => void decidePendingProposal(next.id, "accepted")}
                    disabled={busy}
                >
                    {busy ? "Saving…" : "Yes, make that change"}
                </button>
                <button
                    type="button"
                    class="bf-suggestion__btn bf-suggestion__btn--ghost"
                    onClick={() => void decidePendingProposal(next.id, "snoozed")}
                    disabled={busy}
                >
                    Ask me again in a month
                </button>
                <button
                    type="button"
                    class="bf-suggestion__btn bf-suggestion__btn--ghost"
                    onClick={() => void decidePendingProposal(next.id, "dismissed")}
                    disabled={busy}
                >
                    Not now
                </button>
            </div>
            {error ? (
                <p class="bf-suggestion__error" role="alert">
                    {error}
                </p>
            ) : null}
        </section>
    );
}

function pickNext<T extends { id: string; viewedAt: string | null }>(
    list: ReadonlyArray<T>
): T | null {
    if (list.length === 0) return null;
    for (const p of list) {
        if (p.viewedAt === null) return p;
    }
    return list[0]!;
}
