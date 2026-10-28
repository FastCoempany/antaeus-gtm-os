/**
 * The preview lane — friends / engineers / investors who open the app
 * via /preview + a code (worker/index.ts PREVIEW_CODE). The Worker sets
 * a JS-readable `antaeus_mode=preview` cookie (no secret in it); rooms
 * read it to lock the surfaces a preview visitor can't use (onboarding).
 */
export function isPreviewLane(cookie?: string): boolean {
    try {
        const c = cookie ?? (typeof document !== "undefined" ? document.cookie : "");
        return /(?:^|;\s*)antaeus_mode=preview(?:;|$)/.test(c || "");
    } catch {
        return false;
    }
}
