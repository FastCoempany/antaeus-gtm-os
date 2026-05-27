import type { JSX } from "preact";
import { useState } from "preact/hooks";
import {
    type ParseTriggerResponse,
    canArm,
    parseTriggerNL,
    resolveWorkspaceId
} from "../lib/watchlist-client";
import type { ParseDisposition } from "../lib/triggers/types";
import { armParsedTrigger } from "../state";

/**
 * AddTriggerFlow (B.3b) — the in-place "arm a standing order" flow.
 *
 * The operator types a plain-language watch ("tell me when two or more
 * EOR competitors launch a product in 30 days"), the Edge Function's
 * parse_trigger action turns it into a structured query, and the
 * operator confirms the rephrasing before it's armed. Confidence drives
 * the disposition: a clear parse offers Confirm immediately; a fuzzy one
 * surfaces the ambiguities and asks for a sharper wording first.
 */

const DISPOSITION_COPY: Record<ParseDisposition, { tone: string; line: string }> = {
    arm_ready: { tone: "ready", line: "Clear enough to arm. Confirm the wording below." },
    confirm_minor: { tone: "ready", line: "Read it back. If that's what you meant, arm it." },
    resolve_first: {
        tone: "fuzzy",
        line: "A couple of details are fuzzy. You can still arm it, or tighten the wording first."
    },
    clarify_only: {
        tone: "blocked",
        line: "Too ambiguous to arm. Rework the wording using the questions below."
    }
};

export function AddTriggerFlow({ onDone }: { onDone: () => void }): JSX.Element {
    const [text, setText] = useState("");
    const [parsing, setParsing] = useState(false);
    const [arming, setArming] = useState(false);
    const [resp, setResp] = useState<ParseTriggerResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleParse(): Promise<void> {
        const nl = text.trim();
        if (nl.length === 0 || parsing) return;
        setParsing(true);
        setError(null);
        setResp(null);
        const workspaceId = await resolveWorkspaceId();
        if (!workspaceId) {
            setError("Couldn't find your workspace. Reload and try again.");
            setParsing(false);
            return;
        }
        const r = await parseTriggerNL(workspaceId, nl);
        setResp(r);
        if (!r.ok) setError(r.error ?? "The parser couldn't read that. Try rephrasing.");
        setParsing(false);
    }

    async function handleArm(): Promise<void> {
        if (!resp || !resp.parse || arming) return;
        setArming(true);
        const ok = await armParsedTrigger(resp.parse, text.trim());
        setArming(false);
        if (ok) {
            onDone();
        } else {
            setError("Couldn't arm that trigger. Try again.");
        }
    }

    const parse = resp?.parse ?? null;
    const disposition = resp?.disposition ?? null;
    const dispCopy = disposition ? DISPOSITION_COPY[disposition] : null;
    const armable = resp ? canArm(resp) : false;

    return (
        <div class="bf-addtrigger">
            <label class="bf-addtrigger__label" for="bf-trigger-input">
                What should the system watch for?
            </label>
            <textarea
                id="bf-trigger-input"
                class="bf-addtrigger__input"
                rows={3}
                placeholder="e.g. Tell me when two or more EOR competitors launch a new product within 30 days"
                value={text}
                disabled={parsing || arming}
                onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            />

            <div class="bf-addtrigger__actions">
                <button
                    type="button"
                    class="bf-btn bf-btn--primary"
                    disabled={text.trim().length === 0 || parsing || arming}
                    onClick={() => void handleParse()}
                >
                    {parsing ? "Reading…" : "Read it"}
                </button>
                <button
                    type="button"
                    class="bf-btn bf-btn--ghost"
                    disabled={parsing || arming}
                    onClick={onDone}
                >
                    Cancel
                </button>
            </div>

            {error && <p class="bf-addtrigger__error">{error}</p>}

            {parse && parse.parse_succeeded && dispCopy && (
                <div class={`bf-parse bf-parse--${dispCopy.tone}`}>
                    <p class="bf-parse__rephrase">"{parse.rephrased_for_confirmation}"</p>
                    <p class="bf-parse__meta">
                        {parse.trigger_type} · {Math.round(parse.parse_confidence * 100)}% confident
                    </p>
                    <p class="bf-parse__disp">{dispCopy.line}</p>

                    {parse.ambiguities.length > 0 && (
                        <ul class="bf-parse__ambs">
                            {parse.ambiguities.map((a, i) => (
                                <li class="bf-parse__amb" key={i}>
                                    <span class="bf-parse__amb-q">{a.question}</span>
                                    {a.suggested_clarification && (
                                        <span class="bf-parse__amb-fix">
                                            {a.suggested_clarification}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {armable && (
                        <button
                            type="button"
                            class="bf-btn bf-btn--primary"
                            disabled={arming}
                            onClick={() => void handleArm()}
                        >
                            {arming ? "Arming…" : "Arm this trigger"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
