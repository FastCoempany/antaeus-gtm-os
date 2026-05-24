/**
 * Anthropic API wrapper for the Briefing pipeline (B.2a).
 *
 * Single function: `callAnthropic(...)`. Wraps Anthropic's Messages
 * API via plain HTTPS fetch — no SDK dependency. Returns a result
 * envelope that surfaces text + token usage + the model_v hash for
 * the audit envelope subsystem (B.6).
 *
 * Auth: ANTHROPIC_API_KEY env var. Set via:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *
 * Without the key the function returns an error envelope; the
 * enrich stage records it per-item and continues.
 *
 * Why direct fetch + not the SDK: the SDK pulls in dependencies that
 * inflate the Edge Function bundle. The Messages API is one POST.
 * The cost of writing the call directly is ~30 lines; the cost of
 * the SDK dependency is larger and ongoing.
 *
 * Failure modes handled:
 *   - 401: invalid API key
 *   - 429: rate-limited (no retry yet; future B.7+ work)
 *   - 5xx: upstream error
 *   - timeout: AbortController fires after ANTHROPIC_TIMEOUT_MS
 *   - malformed response body
 *
 * Reference:
 *   https://docs.anthropic.com/en/api/messages
 */

// deno-lint-ignore-file no-explicit-any

import {
    type ModelKey,
    MODELS,
    computeCost,
    modelVersionHash,
    PROMPT_VERSION,
    roundCost
} from "./_shared.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_TIMEOUT_MS = 45_000;

export interface CallAnthropicInputs {
    readonly model: ModelKey;
    readonly system_prompt: string;
    readonly user_prompt: string;
    readonly max_tokens?: number;
    readonly temperature?: number;
}

export interface CallAnthropicResult {
    readonly ok: boolean;
    /** Response text content (concatenation of all text blocks). */
    readonly text: string;
    /** USD cost computed from reported usage; 0 on failure. */
    readonly cost_usd: number;
    /** Reported token usage from the API. */
    readonly usage: {
        readonly input_tokens: number;
        readonly output_tokens: number;
    };
    /** Deterministic hash for the audit envelope subsystem (B.6). */
    readonly model_v_hash: string;
    /** Null on success; populated on failure. */
    readonly error: string | null;
    /** HTTP status when known; 0 on network/timeout/missing-key failure. */
    readonly status: number;
}

export async function callAnthropic(
    inputs: CallAnthropicInputs
): Promise<CallAnthropicResult> {
    const pricing = MODELS[inputs.model];
    const maxTokens = inputs.max_tokens ?? 1024;
    const temperature = inputs.temperature ?? 0;

    // Compute model_v_hash up-front so it's available even on failure.
    // Audit envelopes record attempted calls, not just successful ones.
    const modelVHash = await modelVersionHash({
        model_api_id: pricing.api_id,
        system_prompt: inputs.system_prompt,
        user_prompt: inputs.user_prompt,
        temperature,
        max_tokens: maxTokens,
        prompt_version: PROMPT_VERSION
    });

    // @ts-ignore - Deno.env; resolved at deploy time
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    if (apiKey.length === 0) {
        return {
            ok: false,
            text: "",
            cost_usd: 0,
            usage: { input_tokens: 0, output_tokens: 0 },
            model_v_hash: modelVHash,
            error: "ANTHROPIC_API_KEY env var not set",
            status: 0
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    try {
        const response = await fetch(ANTHROPIC_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": ANTHROPIC_API_VERSION
            },
            body: JSON.stringify({
                model: pricing.api_id,
                max_tokens: maxTokens,
                temperature,
                system: inputs.system_prompt,
                messages: [{ role: "user", content: inputs.user_prompt }]
            }),
            signal: controller.signal
        });
        const bodyText = await response.text();

        if (!response.ok) {
            return {
                ok: false,
                text: "",
                cost_usd: 0,
                usage: { input_tokens: 0, output_tokens: 0 },
                model_v_hash: modelVHash,
                error: shortenForError(bodyText) || `HTTP ${response.status}`,
                status: response.status
            };
        }

        let body: any;
        try {
            body = JSON.parse(bodyText);
        } catch (err) {
            return {
                ok: false,
                text: "",
                cost_usd: 0,
                usage: { input_tokens: 0, output_tokens: 0 },
                model_v_hash: modelVHash,
                error: `response JSON parse failed: ${
                    err instanceof Error ? err.message : String(err)
                }`,
                status: response.status
            };
        }

        const text = extractTextContent(body);
        const inputTokens =
            typeof body?.usage?.input_tokens === "number"
                ? body.usage.input_tokens
                : 0;
        const outputTokens =
            typeof body?.usage?.output_tokens === "number"
                ? body.usage.output_tokens
                : 0;

        const cost = roundCost(
            computeCost(inputs.model, {
                input_tokens: inputTokens,
                output_tokens: outputTokens
            })
        );

        return {
            ok: true,
            text,
            cost_usd: cost,
            usage: { input_tokens: inputTokens, output_tokens: outputTokens },
            model_v_hash: modelVHash,
            error: null,
            status: response.status
        };
    } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        return {
            ok: false,
            text: "",
            cost_usd: 0,
            usage: { input_tokens: 0, output_tokens: 0 },
            model_v_hash: modelVHash,
            error: isAbort
                ? `timeout after ${ANTHROPIC_TIMEOUT_MS}ms`
                : err instanceof Error
                ? err.message
                : String(err),
            status: 0
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Anthropic's response body has content as an array of blocks; we
 * concatenate every block of type=text and ignore other block types
 * (which the Messages API may add in the future).
 */
function extractTextContent(body: any): string {
    if (!body || !Array.isArray(body.content)) return "";
    const parts: string[] = [];
    for (const block of body.content) {
        if (
            block &&
            typeof block === "object" &&
            block.type === "text" &&
            typeof block.text === "string"
        ) {
            parts.push(block.text);
        }
    }
    return parts.join("");
}

/**
 * Truncate long error bodies for log + response surfaces. Full body
 * always available in Edge Function logs.
 */
function shortenForError(text: string, maxLen = 300): string {
    if (!text) return "";
    const compact = text.replace(/\s+/g, " ").trim();
    if (compact.length <= maxLen) return compact;
    return compact.slice(0, maxLen) + "…";
}
