/**
 * Anthropic Messages API wrapper with the web_search server tool
 * (ADR-016 PR 2).
 *
 * Single function: `callWithWebSearch(...)`. Plain HTTPS fetch — no
 * SDK dependency (matches the briefing-pipeline wrapper). Enables the
 * server-side `web_search` tool so the model performs real web
 * searches and grounds its answer in live results, then returns the
 * concatenated final text + token usage + web-search count for cost.
 *
 * Auth: ANTHROPIC_API_KEY env var (supabase secrets set ANTHROPIC_API_KEY=...).
 *
 * The web_search tool is a server tool: the model autonomously issues
 * searches (up to max_uses), the API runs them, feeds results back to
 * the model, and the model produces a final text answer. We don't have
 * to implement the search loop — the API handles it. We count
 * server_tool_use blocks for cost telemetry.
 */

// deno-lint-ignore-file no-explicit-any

import {
    computeCost,
    MODELS,
    roundCost,
    WEB_SEARCH_COST_PER_USE_USD,
    type ModelKey
} from "./_shared.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_TIMEOUT_MS = 120_000;
const WEB_SEARCH_TOOL_TYPE = "web_search_20250305";

export interface WebSearchCallInputs {
    readonly model: ModelKey;
    readonly system_prompt: string;
    readonly user_prompt: string;
    readonly max_tokens?: number;
    readonly max_searches?: number;
}

export interface WebSearchCallResult {
    readonly ok: boolean;
    /** Concatenated text content from the final assistant turn. */
    readonly text: string;
    /** Token cost + estimated web-search cost. */
    readonly cost_usd: number;
    readonly usage: {
        readonly input_tokens: number;
        readonly output_tokens: number;
    };
    /** How many web searches the model actually ran. */
    readonly search_count: number;
    readonly error: string | null;
    readonly status: number;
}

export async function callWithWebSearch(
    inputs: WebSearchCallInputs
): Promise<WebSearchCallResult> {
    const empty = {
        ok: false,
        text: "",
        cost_usd: 0,
        usage: { input_tokens: 0, output_tokens: 0 },
        search_count: 0
    };

    // @ts-ignore - Deno.env; resolved at deploy time
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    if (!apiKey) {
        return { ...empty, error: "ANTHROPIC_API_KEY missing", status: 0 };
    }

    const model = MODELS[inputs.model];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    try {
        const res = await fetch(ANTHROPIC_API_URL, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": ANTHROPIC_API_VERSION
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: model.api_id,
                max_tokens: inputs.max_tokens ?? 4096,
                system: inputs.system_prompt,
                tools: [
                    {
                        type: WEB_SEARCH_TOOL_TYPE,
                        name: "web_search",
                        max_uses: inputs.max_searches ?? 6
                    }
                ],
                messages: [
                    { role: "user", content: inputs.user_prompt }
                ]
            })
        });

        if (!res.ok) {
            const bodyText = await res.text().catch(() => "");
            return {
                ...empty,
                error: `HTTP ${res.status}: ${bodyText.slice(0, 300)}`,
                status: res.status
            };
        }

        const data = (await res.json()) as any;
        const content: any[] = Array.isArray(data?.content) ? data.content : [];

        // Concatenate every text block from the final assistant turn.
        const text = content
            .filter((b) => b?.type === "text" && typeof b.text === "string")
            .map((b) => b.text as string)
            .join("\n")
            .trim();

        // Count server_tool_use blocks of type web_search for cost.
        let searchCount = 0;
        for (const b of content) {
            if (b?.type === "server_tool_use" && b?.name === "web_search") {
                searchCount += 1;
            }
        }
        // The API also reports usage.server_tool_use.web_search_requests
        // when present — prefer it.
        const reported =
            data?.usage?.server_tool_use?.web_search_requests;
        if (typeof reported === "number" && reported >= 0) {
            searchCount = reported;
        }

        const usage = {
            input_tokens:
                typeof data?.usage?.input_tokens === "number"
                    ? data.usage.input_tokens
                    : 0,
            output_tokens:
                typeof data?.usage?.output_tokens === "number"
                    ? data.usage.output_tokens
                    : 0
        };

        const cost = roundCost(
            computeCost(inputs.model, usage) +
                searchCount * WEB_SEARCH_COST_PER_USE_USD
        );

        return {
            ok: true,
            text,
            cost_usd: cost,
            usage,
            search_count: searchCount,
            error: null,
            status: res.status
        };
    } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        return {
            ...empty,
            error: isAbort
                ? `Timed out after ${ANTHROPIC_TIMEOUT_MS}ms`
                : err instanceof Error
                ? err.message
                : String(err),
            status: 0
        };
    } finally {
        clearTimeout(timer);
    }
}
