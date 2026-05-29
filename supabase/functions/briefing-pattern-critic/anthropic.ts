/**
 * Slim Anthropic wrapper for the critic. Self-contained because
 * Edge Functions deploy independently and can't cross-import from
 * the briefing-pipeline function. Mirrors the relevant subset of
 * briefing-pipeline/llm/anthropic.ts (no extended thinking, no
 * model_v_hash, no audit envelope concerns — the critic doesn't
 * need any of those).
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_TIMEOUT_MS = 60_000;

// Sonnet 4.6 pricing (mirrors briefing-pipeline/llm/_shared.ts at
// time of writing). $3 / 1M input, $15 / 1M output. The critic
// only uses sonnet_4_6 today; widen later if the model registry
// grows.
const SONNET_4_6_PRICING = {
    input_per_million: 3,
    output_per_million: 15
};

export interface CriticAnthropicInputs {
    readonly model_api_id: string;
    readonly system_prompt: string;
    readonly user_prompt: string;
    readonly max_tokens: number;
}

export interface CriticAnthropicResult {
    readonly ok: boolean;
    readonly text: string;
    readonly cost_usd: number;
    readonly usage: {
        readonly input_tokens: number;
        readonly output_tokens: number;
    };
    readonly error: string | null;
    readonly status: number;
}

function computeCost(input_tokens: number, output_tokens: number): number {
    const cost =
        (input_tokens / 1_000_000) * SONNET_4_6_PRICING.input_per_million +
        (output_tokens / 1_000_000) * SONNET_4_6_PRICING.output_per_million;
    return Math.round(cost * 10000) / 10000;
}

export async function callCriticAnthropic(
    inputs: CriticAnthropicInputs
): Promise<CriticAnthropicResult> {
    // @ts-ignore - Deno.env; resolved at deploy time
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    if (apiKey.length === 0) {
        return {
            ok: false,
            text: "",
            cost_usd: 0,
            usage: { input_tokens: 0, output_tokens: 0 },
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
                model: inputs.model_api_id,
                max_tokens: inputs.max_tokens,
                temperature: 0,
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
                error: `HTTP ${response.status}: ${bodyText.slice(0, 400)}`,
                status: response.status
            };
        }

        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(bodyText);
        } catch (_e) {
            return {
                ok: false,
                text: "",
                cost_usd: 0,
                usage: { input_tokens: 0, output_tokens: 0 },
                error: `unparseable response body: ${bodyText.slice(0, 200)}`,
                status: response.status
            };
        }

        const content = parsed["content"];
        let text = "";
        if (Array.isArray(content)) {
            for (const block of content) {
                if (
                    block &&
                    typeof block === "object" &&
                    (block as Record<string, unknown>).type === "text"
                ) {
                    const t = (block as Record<string, unknown>).text;
                    if (typeof t === "string") text += t;
                }
            }
        }

        const usage = parsed["usage"] as Record<string, unknown> | undefined;
        const inputTokens =
            usage && typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
        const outputTokens =
            usage && typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
        return {
            ok: true,
            text,
            cost_usd: computeCost(inputTokens, outputTokens),
            usage: { input_tokens: inputTokens, output_tokens: outputTokens },
            error: null,
            status: response.status
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            ok: false,
            text: "",
            cost_usd: 0,
            usage: { input_tokens: 0, output_tokens: 0 },
            error: `fetch failed: ${message}`,
            status: 0
        };
    } finally {
        clearTimeout(timeoutId);
    }
}
