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
 * Accounts-to-consider surface. Lists companies that repeatedly appear in
 * relevant evidence alongside watched accounts but are not on the current
 * watchlist. The user can add, temporarily hide, or dismiss each account.
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
    }

    async function handleSnooze(): Promise<void> {
        if (busy) return;
        setBusy("snooze");
        const ok = await snoozePeripheryAction(candidate.id);
        if (!ok) {
            setError("Couldn't hide it for now. Try again.");
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
                    {t("co-occurrence")} {candidate.co_occurrence_score}
                    {candidate.vocab_overlap_score > 0
                        ? ` · ${t("topic overlap")} ${candidate.vocab_overlap_score}`
                        : ""}
                </span>
            </div>
            <p class="bf-peri__why">{candidate.reasoning}</p>
            {candidate.entity_aliases.length > 0 && (
                <p class="bf-peri__aliases">
                    {t("Also seen as:")} {candidate.entity_aliases.join(", ")}
                </p>
            )}
            <div class="bf-peri__actions">
                <button
                    type="button"
                    class="bf-btn bf-btn--primary bf-btn--small"
                    disabled={busy !== null}
                    onClick={() => void handleAdd()}
                >
                    {busy === "add" ? ACTION_BUSY : t("Add to watchlist")}
                </button>
                <button
                    type="button"
                    class="bf-btn bf-btn--ghost bf-btn--small"
                    disabled={busy !== null}
                    onClick={() => void handleSnooze()}
                >
                    {busy === "snooze" ? ACTION_BUSY : t("Hide for now")}
                </button>
                <button
                    type="button"
                    class="bf-btn bf-btn--ghost bf-btn--small"
                    disabled={busy !== null}
                    onClick={() => void handleDismiss()}
                >
                    {busy === "dismiss" ? ACTION_BUSY : t("Dismiss")}
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
        <section class="bf-peri-rail" aria-label={t("Accounts to consider")}>
            <div class="bf-peri-rail__head">
                <p class="bf-peri-rail__kicker">{t("Accounts to consider")}</p>
                <p class="bf-peri-rail__sub">
                    {t("These companies repeatedly appear in relevant evidence alongside watched accounts but are not currently on your watchlist.", { class: "body" })}
                </p>
            </div>
            <ul class="bf-peri-list">
                {list.map((candidate) => (
                    <CandidateRow candidate={candidate} key={candidate.id} />
                ))}
            </ul>
        </section>
    );
}
