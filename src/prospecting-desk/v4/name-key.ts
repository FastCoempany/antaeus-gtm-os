const SUFFIXES = new Set([
    "inc", "incorporated", "llc", "ltd", "limited", "corp", "corporation",
    "co", "company", "plc", "gmbh", "ag", "sa", "nv", "bv", "holdings"
]);

/**
 * Case-, punctuation- and legal-suffix-insensitive company key, matching
 * the Edge Function's normalizeCompanyName, so "Vanta, Inc." and "vanta"
 * count as the same company when checking what is already added.
 */
export function normalizeNameKey(name: string): string {
    const words = name
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    while (words.length > 1 && SUFFIXES.has(words[words.length - 1]!)) words.pop();
    while (words.length > 1 && words[0] === "the") words.shift();
    return words.join(" ");
}
