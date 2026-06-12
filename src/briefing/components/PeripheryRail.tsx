import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { useState } from "preact/hooks";
import {
    dismissPeripheryAction,
    peripheryCandidates,
    peripheryLoaded,
    promotePeripheryCandidate,
    snoozePeripheryAction
} from "../state";
import type { PeripheryCandidate } from "../lib/periphery-client";

/**
 * PeripheryRail (B.4c) — the "consider watching" surface.
 *
 * Lists the candidates the detector produced for the latest run with
 * three actions per row: Add to watchlist (promotes the entity into
 * briefing_watchlist_entities), Snooze (hide for now), Dismiss (never
 * surface again). Renders nothing when there are no candidates — the
 * section shouldn't take vertical space on a quiet run.
 *
 * Per canon §4.21 this is the Coverage obligation's surface. Voice
 * (Part III §11): the header reads "Consider watching", not "Periphery
 * candidates" — a peer would name the move, not the concept.
 */

const ACTION_BUSY = "…";

function CandidateRow({ candidate }: { candidate: PeripheryCandidate }): JSX.Element {
    const [busy, setBusy] = useState<null | "add" | "snooze" | "dismiss">(null);
    const [error, setError] = useState<string | null>(null);

    async function handleAdd(): Promise<void> {
        if (busy) return;
        setBusy("add");
        setError(null);
        const ok = await promotePeripheryCandidate(candidate);
        if (!ok) {
            setError("Couldn't add it. Try again.");
            setBusy(null);
        }
        // On success the row drops out via the signal — no need to clear busy.
    }

    async function handleSnooze(): Promise<void> {
        if (busy) return;
        setBusy("snooze");
        const ok = await snoozePeripheryAction(candidate.id);
        if (!ok) {
            setError("Couldn't snooze it. Try again.");
            setBusy(null);
        }
    }

    async function handleDismiss(): Promise<void> {
        if (busy) return;
        setBusy("dismiss");
        const ok = await dismissPeripheryAction(candidate.id);
        if (!ok) {
            setError("Couldn't dismiss it. Try again.");
            setBusy(null);
        }
    }

    return (
        <li class="bf-peri">
            <div class="bf-peri__head">
                <p class="bf-peri__name">{candidate.entity_name}</p>
                <span class="bf-peri__score">
                    co-occ {candidate.co_occurrence_score}
                    {candidate.vocab_overlap_score > 0
                        ? ` · vocab ${candidate.vocab_overlap_score}`
                        : ""}
                </span>
            </div>
            <p class="bf-peri__why">{candidate.reasoning}</p>
            {candidate.entity_aliases.length > 0 && (
                <p class="bf-peri__aliases">
                    Also seen as: {candidate.entity_aliases.join(", ")}
                </p>
            )}
            <div class="bf-peri__actions">
                <button
                    type="button"
                    class="bf-btn bf-btn--primary bf-btn--small"
                    disabled={busy !== null}
                    onClick={() => void handleAdd()}
                >
                    {busy === "add" ? ACTION_BUSY : "Add to watchlist"}
                </button>
                <button
                    type="button"
                    class="bf-btn bf-btn--ghost bf-btn--small"
                    disabled={busy !== null}
                    onClick={() => void handleSnooze()}
                >
                    {busy === "snooze" ? ACTION_BUSY : "Snooze"}
                </button>
                <button
                    type="button"
                    class="bf-btn bf-btn--ghost bf-btn--small"
                    disabled={busy !== null}
                    onClick={() => void handleDismiss()}
                >
                    {busy === "dismiss" ? ACTION_BUSY : "Dismiss"}
                </button>
            </div>
            {error && <p class="bf-peri__error">{error}</p>}
        </li>
    );
}

export function PeripheryRail(): JSX.Element | null {
    if (!peripheryLoaded.value) return null;
    const list = peripheryCandidates.value;
    if (list.length === 0) return null;

    return (
        <section class="bf-peri-rail" aria-label={t("Consider watching")}>
            <div class="bf-peri-rail__head">
                <p class="bf-peri-rail__kicker">{t("Consider watching")}</p>
                <p class="bf-peri-rail__sub">
                    Companies you haven't named, but the data this week kept mentioning
                    them alongside the ones you have.
                </p>
            </div>
            <ul class="bf-peri-list">
                {list.map((c) => (
                    <CandidateRow candidate={c} key={c.id} />
                ))}
            </ul>
        </section>
    );
}
