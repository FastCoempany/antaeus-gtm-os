/** Display helpers for research results. */

/** "Oct 3, 2026" from an ISO date or timestamp; "" when unparseable. */
export function formatDate(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** "reuters.com" from a URL, for link text. */
export function linkLabel(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}

export const CONFIDENCE_LABEL: Readonly<Record<"high" | "medium" | "low", string>> = {
    high: "Strong match",
    medium: "Possible match",
    low: "Weak match"
};
