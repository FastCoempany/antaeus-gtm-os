import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "./types";
import {
    enrichAccount,
    enrichmentResponseToAccountPatch,
    enrichmentSignalsToSignals,
    enrichmentSignalToSignal,
    resolveEnrichmentBaseUrl,
    type EnrichmentResponse,
    type EnrichmentSignal
} from "./enrichment";

vi.mock("@/lib/observability", () => ({
    reportError: vi.fn(),
    trackEvent: vi.fn()
}));

vi.mock("@/lib/supabase-client", () => ({
    getSupabaseClient: vi.fn(() => ({
        auth: {
            getSession: vi.fn(async () => ({
                data: { session: { access_token: "test-jwt-abc" } }
            }))
        }
    }))
}));

// ─── resolveEnrichmentBaseUrl ──────────────────────────────────────────

describe("resolveEnrichmentBaseUrl", () => {
    const originalWindow = globalThis.window;

    function mockWindow(props: {
        runtimeOverride?: string;
        localStorageValue?: string | null;
        hostname?: string;
    }): void {
        const store: Record<string, string> = {};
        if (props.localStorageValue !== null && props.localStorageValue !== undefined) {
            store["gtmos_enrichment_base_url"] = props.localStorageValue;
        }
        globalThis.window = {
            ...(props.runtimeOverride
                ? { __ANTAEUS_ENRICHMENT_BASE_URL__: props.runtimeOverride }
                : {}),
            localStorage: {
                getItem: (k: string) => store[k] ?? null,
                setItem: () => undefined,
                removeItem: () => undefined,
                clear: () => undefined,
                key: () => null,
                length: 0
            } as unknown as Storage,
            location: { hostname: props.hostname ?? "antaeus.app" } as Location
        } as unknown as typeof globalThis.window;
    }

    beforeEach(() => {
        globalThis.window = originalWindow;
    });

    it("returns the production default when window is undefined (SSR)", () => {
        // @ts-expect-error force undefined window
        globalThis.window = undefined;
        expect(resolveEnrichmentBaseUrl()).toBe("https://enrich.antaeus.app");
    });

    it("respects window.__ANTAEUS_ENRICHMENT_BASE_URL__ override", () => {
        mockWindow({ runtimeOverride: "https://custom.example.com" });
        expect(resolveEnrichmentBaseUrl()).toBe("https://custom.example.com");
    });

    it("strips trailing slash from override URLs", () => {
        mockWindow({ runtimeOverride: "https://custom.example.com/" });
        expect(resolveEnrichmentBaseUrl()).toBe("https://custom.example.com");
    });

    it("respects localStorage.gtmos_enrichment_base_url override", () => {
        mockWindow({ localStorageValue: "https://stored.example.com" });
        expect(resolveEnrichmentBaseUrl()).toBe("https://stored.example.com");
    });

    it("uses localhost dev URL when hostname is localhost", () => {
        mockWindow({ hostname: "localhost" });
        expect(resolveEnrichmentBaseUrl()).toBe("http://localhost:3001");
    });

    it("uses localhost dev URL when hostname is 127.0.0.1", () => {
        mockWindow({ hostname: "127.0.0.1" });
        expect(resolveEnrichmentBaseUrl()).toBe("http://localhost:3001");
    });

    it("falls back to production for non-localhost hosts", () => {
        mockWindow({ hostname: "antaeus.app" });
        expect(resolveEnrichmentBaseUrl()).toBe("https://enrich.antaeus.app");
    });
});

// ─── enrichmentSignalToSignal ──────────────────────────────────────────

describe("enrichmentSignalToSignal", () => {
    const NOW = "2026-05-22T12:00:00Z";

    it("maps server fields to in-memory Signal shape", () => {
        const raw: EnrichmentSignal = {
            id: "enr_123",
            cat: "funding",
            headline: "Acme raised $20M Series B",
            source_name: "TechCrunch",
            url: "https://example.com",
            published_date: "2026-05-15",
            confidence: 0.92,
            is_ai: false,
            status: "unverified",
            fetched_at: NOW
        };
        const sig = enrichmentSignalToSignal(raw, NOW);
        expect(sig.id).toBe("enr_123");
        expect(sig.cat).toBe("funding");
        expect(sig.type).toBe("funding");
        expect(sig.headline).toBe("Acme raised $20M Series B");
        expect(sig.source).toBe("TechCrunch");
        expect(sig.confidence).toBe(0.92);
        expect(sig.status).toBe("unverified");
    });

    it("composes a note from detail + why_it_matters", () => {
        const raw: EnrichmentSignal = {
            id: "enr_1",
            headline: "x",
            detail: "Tier 1 VC participation.",
            why_it_matters: "Hiring spree likely Q3."
        };
        const sig = enrichmentSignalToSignal(raw);
        expect(sig.note).toBe(
            "Tier 1 VC participation. — Hiring spree likely Q3."
        );
    });

    it("does not duplicate when detail and why are identical", () => {
        const raw: EnrichmentSignal = {
            id: "enr_1",
            headline: "x",
            detail: "Same text.",
            why_it_matters: "Same text."
        };
        const sig = enrichmentSignalToSignal(raw);
        expect(sig.note).toBe("Same text.");
    });

    it("falls back to current time when fetched_at missing", () => {
        const sig = enrichmentSignalToSignal({ id: "x", headline: "y" }, NOW);
        expect(sig.fetched_at).toBe(NOW);
    });

    it("falls back to default headline when blank", () => {
        const sig = enrichmentSignalToSignal({ id: "x", headline: "  " });
        expect(sig.headline).toBe("Untitled signal");
    });

    it("preserves is_ai true / drops false-default", () => {
        const aiSig = enrichmentSignalToSignal({
            id: "x",
            headline: "y",
            is_ai: true
        });
        expect(aiSig.is_ai).toBe(true);

        const noAiSig = enrichmentSignalToSignal({
            id: "x",
            headline: "y",
            is_ai: false
        });
        expect("is_ai" in noAiSig).toBe(false);
    });
});

// ─── enrichmentSignalsToSignals ────────────────────────────────────────

describe("enrichmentSignalsToSignals", () => {
    it("maps a batch", () => {
        const raws: EnrichmentSignal[] = [
            { id: "a", headline: "1st" },
            { id: "b", headline: "2nd" }
        ];
        const sigs = enrichmentSignalsToSignals(raws);
        expect(sigs).toHaveLength(2);
        expect(sigs[0]!.id).toBe("a");
        expect(sigs[1]!.id).toBe("b");
    });
});

// ─── enrichmentResponseToAccountPatch ──────────────────────────────────

describe("enrichmentResponseToAccountPatch", () => {
    function makeResponse(
        overrides: Partial<EnrichmentResponse> = {}
    ): EnrichmentResponse {
        return {
            name: "Acme",
            domain: "acme.com",
            info: { industry: "Logistics", employees: "5000", hq: "SF" },
            signals: [],
            heat: 60,
            enrichedAt: "2026-05-22T12:00:00Z",
            ...overrides
        };
    }

    it("emits enrichedAt + populated fields", () => {
        const patch = enrichmentResponseToAccountPatch(makeResponse());
        expect(patch.enrichedAt).toBe("2026-05-22T12:00:00Z");
        expect(patch.domain).toBe("acme.com");
        expect(patch.industry).toBe("Logistics");
        expect(patch.employees).toBe("5000");
        expect(patch.hq).toBe("SF");
    });

    it("skips Unknown sentinel values (preserves operator-entered data)", () => {
        const patch = enrichmentResponseToAccountPatch(
            makeResponse({
                info: {
                    industry: "Unknown",
                    employees: "Unknown",
                    hq: "Unknown"
                }
            })
        );
        expect("industry" in patch).toBe(false);
        expect("employees" in patch).toBe(false);
        expect("hq" in patch).toBe(false);
    });

    it("skips null domain", () => {
        const patch = enrichmentResponseToAccountPatch(
            makeResponse({ domain: null })
        );
        expect("domain" in patch).toBe(false);
    });
});

// ─── enrichAccount ─────────────────────────────────────────────────────

describe("enrichAccount", () => {
    const account: Account = {
        id: "acc_1",
        name: "Acme Robotics",
        domain: "acme.com",
        signals: []
    };

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    function mockFetchResolvingWith(response: unknown, status = 200): void {
        globalThis.fetch = vi.fn(async () => {
            return {
                ok: status >= 200 && status < 300,
                status,
                statusText: "OK",
                json: async () => response
            } as unknown as Response;
        }) as unknown as typeof fetch;
    }

    function mockFetchRejectingWith(err: Error): void {
        globalThis.fetch = vi.fn(async () => {
            throw err;
        }) as unknown as typeof fetch;
    }

    it("returns ok on a 200 response", async () => {
        mockFetchResolvingWith({
            name: "Acme",
            domain: "acme.com",
            info: {},
            signals: [],
            enrichedAt: "now"
        });
        const result = await enrichAccount(account, {
            baseUrl: "https://test.example.com"
        });
        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            expect(result.response.name).toBe("Acme");
        }
    });

    it("returns error on a non-2xx response", async () => {
        mockFetchResolvingWith(
            { error: "rate limit exceeded" },
            429
        );
        const result = await enrichAccount(account, {
            baseUrl: "https://test.example.com"
        });
        expect(result.status).toBe("error");
        if (result.status === "error") {
            expect(result.message).toBe("rate limit exceeded");
        }
    });

    it("returns aborted when caller cancels", async () => {
        const controller = new AbortController();
        controller.abort();
        globalThis.fetch = vi.fn(async () => {
            throw new DOMException("aborted", "AbortError");
        }) as unknown as typeof fetch;
        const result = await enrichAccount(account, {
            baseUrl: "https://test.example.com",
            signal: controller.signal
        });
        expect(result.status).toBe("aborted");
    });

    it("returns error on a network failure", async () => {
        mockFetchRejectingWith(new Error("fetch boom"));
        const result = await enrichAccount(account, {
            baseUrl: "https://test.example.com"
        });
        expect(result.status).toBe("error");
        if (result.status === "error") {
            expect(result.message).toBe("fetch boom");
        }
    });

    it("includes Authorization header when session has a JWT", async () => {
        let capturedHeaders: Record<string, string> | null = null;
        globalThis.fetch = vi.fn(async (_url, init) => {
            capturedHeaders = (init as RequestInit)
                ?.headers as Record<string, string>;
            return {
                ok: true,
                status: 200,
                statusText: "OK",
                json: async () => ({
                    name: "x",
                    domain: null,
                    info: {},
                    signals: [],
                    enrichedAt: "n"
                })
            } as unknown as Response;
        }) as unknown as typeof fetch;
        await enrichAccount(account, { baseUrl: "https://test.example.com" });
        expect(capturedHeaders).not.toBeNull();
        expect(capturedHeaders!["Authorization"]).toBe("Bearer test-jwt-abc");
    });

    it("posts the account context as JSON body", async () => {
        let capturedBody: string | null = null;
        globalThis.fetch = vi.fn(async (_url, init) => {
            capturedBody = (init as RequestInit)?.body as string;
            return {
                ok: true,
                status: 200,
                statusText: "OK",
                json: async () => ({
                    name: "x",
                    domain: null,
                    info: {},
                    signals: [],
                    enrichedAt: "n"
                })
            } as unknown as Response;
        }) as unknown as typeof fetch;
        await enrichAccount(account, { baseUrl: "https://test.example.com" });
        expect(capturedBody).not.toBeNull();
        const parsed = JSON.parse(capturedBody!);
        expect(parsed.name).toBe("Acme Robotics");
        expect(parsed.domain).toBe("acme.com");
    });
});
