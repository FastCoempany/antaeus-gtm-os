import type { JSX } from "preact";
import { Kicker } from "@/components";
import { t } from "@/lib/voice/t";
import { activeThread, setActiveThread } from "../../state";
import { THREADS } from "../../lib/threads";

/**
 * ThreadRail — the six threads as the FocalRail rail (canon §4.9: Prep →
 * Opener → Pressure → Proof → Ask → Exit). The active thread is the
 * focal; the rest stay compressed but jumpable. The rep can pull any
 * thread, but lives in one at a time.
 */
export function ThreadRail(): JSX.Element {
    const active = activeThread.value;
    return (
        <nav class="ccd-rail" aria-label={t("Threads")}>
            <Kicker>{t("THE THREADS")}</Kicker>
            <ul class="ccd-rail__list">
                {THREADS.map((thread) => (
                    <li key={thread.id}>
                        <button
                            type="button"
                            class={`ccd-rail__row${active === thread.id ? " is-active" : ""}`}
                            aria-pressed={active === thread.id}
                            onClick={() => setActiveThread(thread.id)}
                        >
                            <span class="ccd-rail__num">{thread.num}</span>
                            <span class="ccd-rail__title">{thread.title}</span>
                            <span class="ccd-rail__verb">{thread.verb}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
