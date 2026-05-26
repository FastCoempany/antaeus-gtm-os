import { describe, it, expect } from "vitest";
import {
    mapSignalToRawItem,
    normalizeSignalSource,
    type SignalConsoleSignal
} from "./signal-console";

function signal(over: Partial<SignalConsoleSignal> = {}): SignalConsoleSignal {
    return {
        id: "sig-1",
        headline: "Rippling sues Deel for corporate espionage",
        source: "Reuters",
        url: "https://reuters.com/x",
        published_date: "2026-04-01T00:00:00Z",
        fetched_at: null,
        captured_at: null,
        signal_type: "legal",
        note: "High-profile suit.",
        confidence: 0.95,
        is_ai: false,
        flagged: false,
        account_name: "Rippling",
        relationship_type: "competitor",
        ...over
    };
}

describe("normalizeSignalSource", () => {
    it("slugs and prefixes editorial sources", () => {
        expect(normalizeSignalSource("TechCrunch")).toBe("sc:techcrunch");
        expect(normalizeSignalSource("The Information")).toBe("sc:the-information");
        expect(normalizeSignalSource("PE Hub")).toBe("sc:pe-hub");
    });
    it("falls back to sc:unknown for empty/missing", () => {
        expect(normalizeSignalSource("")).toBe("sc:unknown");
        expect(normalizeSignalSource(null)).toBe("sc:unknown");
        expect(normalizeSignalSource("   ")).toBe("sc:unknown");
    });
    it("two outlets produce two distinct source ids", () => {
        expect(normalizeSignalSource("Reuters")).not.toBe(normalizeSignalSource("Bloomberg"));
    });
});

describe("mapSignalToRawItem", () => {
    it("maps a signal to a raw item with editorial source_id", () => {
        const item = mapSignalToRawItem(signal());
        expect(item).not.toBeNull();
        expect(item?.source_id).toBe("sc:reuters");
        expect(item?.external_id).toBe("signal:sig-1");
        expect(item?.title).toBe("Rippling sues Deel for corporate espionage");
        expect(item?.url).toBe("https://reuters.com/x");
        expect(item?.published_date).toBe("2026-04-01T00:00:00Z");
        expect(item?.data.account_name).toBe("Rippling");
        expect(item?.data.origin).toBe("signal_console");
    });

    it("embeds account + type context into the body for enrichment", () => {
        const item = mapSignalToRawItem(signal());
        expect(item?.body).toContain("Rippling");
        expect(item?.body).toContain("competitor");
        expect(item?.body).toContain("legal");
        expect(item?.body).toContain("High-profile suit.");
    });

    it("returns null for flagged signals", () => {
        expect(mapSignalToRawItem(signal({ flagged: true }))).toBeNull();
    });

    it("returns null when the headline is empty", () => {
        expect(mapSignalToRawItem(signal({ headline: "" }))).toBeNull();
        expect(mapSignalToRawItem(signal({ headline: null }))).toBeNull();
    });

    it("falls back through published → fetched → captured for the date", () => {
        const item = mapSignalToRawItem(
            signal({ published_date: null, fetched_at: "2026-03-01T00:00:00Z" })
        );
        expect(item?.published_date).toBe("2026-03-01T00:00:00Z");
    });

    it("nulls a blank url", () => {
        const item = mapSignalToRawItem(signal({ url: "   " }));
        expect(item?.url).toBeNull();
    });
});
