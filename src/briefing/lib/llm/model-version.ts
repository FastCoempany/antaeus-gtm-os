/**
 * Model version hashing for audit envelopes (B.2a, used by B.6).
 *
 * Every LLM call records a `model_v` hash — a deterministic fingerprint
 * of (model identifier + prompt + system prompt + key parameters) so
 * that two outputs generated under the same conditions share the
 * same model_v, and two outputs generated under different conditions
 * (a tweaked prompt, a new model version, a temperature change) have
 * different model_v values.
 *
 * Why this matters for the Briefing surface:
 *   - B.6 audit envelopes surface model_v alongside each Pattern so
 *     the operator can see exactly which prompt + model produced the
 *     synthesis.
 *   - B.7 evaluation harness uses model_v to mark Patterns whose
 *     model_v is "stale" (an old prompt or model) and worth re-running
 *     to compare quality.
 *   - Future cost optimization can A/B prompt variants by model_v
 *     and roll back to the better-performing variant.
 *
 * The hash itself is SHA-256 of a deterministic string serialization
 * of the inputs. Truncate to 12 hex chars for human-readability in
 * UI; the full 64-char hash is what the column stores.
 */

import { sha256Hex } from "../parsers/html-strip";

export interface ModelVersionInputs {
    /** The Anthropic api_id (e.g. "claude-haiku-4-5-20251001"). */
    readonly model_api_id: string;
    /** Optional system prompt content. */
    readonly system_prompt?: string;
    /** The full user-message prompt body. */
    readonly user_prompt: string;
    /** Sampling parameters that affect output determinism. */
    readonly temperature?: number;
    readonly max_tokens?: number;
    /** Prompt version tag — bump when you change prompt structure. */
    readonly prompt_version: string;
}

/**
 * Serialize the inputs into a deterministic canonical string. Order
 * matters — JSON.stringify with sorted keys would also work but adding
 * delimiters makes the hash boundaries explicit + harder to forge.
 */
function canonicalize(inputs: ModelVersionInputs): string {
    return [
        `model=${inputs.model_api_id}`,
        `prompt_version=${inputs.prompt_version}`,
        `temperature=${inputs.temperature ?? "default"}`,
        `max_tokens=${inputs.max_tokens ?? "default"}`,
        `system_prompt_len=${(inputs.system_prompt ?? "").length}`,
        `system_prompt=${inputs.system_prompt ?? ""}`,
        `user_prompt_len=${inputs.user_prompt.length}`,
        `user_prompt=${inputs.user_prompt}`
    ].join("|");
}

/**
 * Compute the full 64-char SHA-256 hex hash. Suitable for storing in
 * briefing_enriched_items.model_v_hash + briefing_patterns.model_v_hash.
 */
export async function modelVersionHash(
    inputs: ModelVersionInputs
): Promise<string> {
    return sha256Hex(canonicalize(inputs));
}

/**
 * 12-char prefix of the full hash. Suitable for display in audit
 * envelope UIs where the full hash is too long for the layout.
 */
export function shortModelVersion(hash: string): string {
    return hash.slice(0, 12);
}
