/**
 * Gate scan — extraction of t() declarations from source (01 §2.5).
 *
 * Separated from the gate test so the extraction itself is unit-tested.
 * Scans FULL SOURCE, not lines: prettier wraps long t() calls across
 * lines (`t(\n  "...",\n  { class: "body" },\n)`), and a per-line scan
 * silently misses exactly the long strings most worth validating. The
 * adversarial pass of 2026-06-08 caught that; this module is the fix.
 *
 * Contract limits (documented, deliberate):
 * - The first argument must be a single string literal on one line
 *   (prettier never breaks string literals, so wrapped CALLS are
 *   handled; multi-line template literals are not, and the t()
 *   contract forbids them).
 * - t() occurrences inside comments are scanned too; a commented-out
 *   string still has to pass, which is acceptable — dead strings that
 *   fail the voice should not sit in the codebase either.
 * - Strings NOT wrapped in t() escape the gate entirely. Coverage is
 *   the migration's job (scoping doc §3.7); the gate validates what is
 *   declared, review discipline catches what is not.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { StringClass } from "./validator";
import type { VoiceFamily } from "./family-temperatures";

export interface FoundString {
    readonly file: string;
    readonly line: number;
    readonly text: string;
    readonly stringClass: StringClass;
    readonly family: VoiceFamily | undefined;
    readonly waived: boolean;
}

/**
 * t("...") / t('...') / t(`...`) with an optional meta object and an
 * optional trailing comma — `\s` spans newlines so wrapped calls match.
 * The meta object must not contain nested braces (it never does; it is
 * a flat { class, family } literal by contract).
 */
const T_CALL =
    /\bt\(\s*(["'`])((?:\\.|(?!\1).)*?)\1\s*(?:,\s*\{([^}]*)\}\s*)?(?:,\s*)?\)/g;

function parseMeta(meta: string | undefined): {
    stringClass: StringClass;
    family: VoiceFamily | undefined;
} {
    let stringClass: StringClass = "label";
    let family: VoiceFamily | undefined;
    if (meta) {
        const classMatch = meta.match(/class:\s*["'](label|body|authored)["']/);
        if (classMatch) stringClass = classMatch[1] as StringClass;
        const familyMatch = meta.match(/family:\s*["']([a-z-]+)["']/);
        if (familyMatch) family = familyMatch[1] as VoiceFamily;
    }
    return { stringClass, family };
}

/** Extract every t() declaration from one file's source text. */
export function extractStringsFromSource(
    source: string,
    file: string,
): FoundString[] {
    const found: FoundString[] = [];
    const lineStarts: number[] = [0];
    for (let i = 0; i < source.length; i++) {
        if (source[i] === "\n") lineStarts.push(i + 1);
    }
    const lineOf = (offset: number): number => {
        let lo = 0;
        let hi = lineStarts.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineStarts[mid] <= offset) lo = mid;
            else hi = mid - 1;
        }
        return lo + 1; // 1-based
    };
    const lines = source.split("\n");
    const hasWaiver = (lineNumber: number): boolean => {
        const here = lines[lineNumber - 1] ?? "";
        const above = lines[lineNumber - 2] ?? "";
        return (
            /\/\/\s*voice-waiver:/.test(here) ||
            /\/\/\s*voice-waiver:/.test(above)
        );
    };

    T_CALL.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = T_CALL.exec(source)) !== null) {
        const line = lineOf(match.index);
        const raw = match[2].replace(/\\n/g, " ").replace(/\\(["'`])/g, "$1");
        const { stringClass, family } = parseMeta(match[3]);
        found.push({
            file,
            line,
            text: raw,
            stringClass,
            family,
            waived: hasWaiver(line),
        });
    }
    return found;
}

/** Walk a directory for production .ts/.tsx sources (no tests, no d.ts). */
export function walkSources(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            walkSources(full, out);
        } else if (
            /\.(ts|tsx)$/.test(entry) &&
            !/\.test\.(ts|tsx)$/.test(entry) &&
            !/\.d\.ts$/.test(entry)
        ) {
            out.push(full);
        }
    }
    return out;
}

/** Extract from a file on disk. */
export function extractStringsFromFile(
    fullPath: string,
    displayPath: string,
): FoundString[] {
    return extractStringsFromSource(readFileSync(fullPath, "utf8"), displayPath);
}
