import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    __resetSupabaseClientForTests,
    getSupabaseClient
} from "./supabase-client";

/**
 * Supabase client factory tests.
 *
 * Primary focus: env-var gating. The client must refuse to construct when
 * VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing, with a helpful
 * error — rooms catching this at boot time need to understand what to fix.
 */

const ORIGINAL_ENV = { ...import.meta.env };

beforeEach(() => {
    __resetSupabaseClientForTests();
});

afterEach(() => {
    __resetSupabaseClientForTests();
    // Restore whatever the test suite started with.
    vi.unstubAllEnvs();
});

describe("getSupabaseClient", () => {
    it("throws a helpful error when VITE_SUPABASE_URL is missing", () => {
        vi.stubEnv("VITE_SUPABASE_URL", "");
        vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");

        expect(() => getSupabaseClient()).toThrowError(
            /VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/
        );
    });

    it("throws a helpful error when VITE_SUPABASE_ANON_KEY is missing", () => {
        vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

        expect(() => getSupabaseClient()).toThrowError(
            /VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/
        );
    });

    it("constructs + memoizes the client when env vars are present", () => {
        vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

        const a = getSupabaseClient();
        const b = getSupabaseClient();
        expect(a).toBe(b);
    });

    it("exposes the original env after tests (sanity)", () => {
        // Not a real assertion — just proves the ORIGINAL_ENV snapshot exists.
        expect(Object.keys(ORIGINAL_ENV)).toBeDefined();
    });
});
