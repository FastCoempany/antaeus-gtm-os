/**
 * Founding GTM cross-room handoff helper.
 *
 * The kit room's HandoffStrip previously wrote raw href strings
 * ("/dashboard/", "/quota-workback/", "/onboarding/") with no continuity
 * plumbing — destinations couldn't render a "Back to Founding GTM"
 * affordance, and fromMode/fromSurface were absent. Every other room
 * threads these per `deliverables/audit/continuity-params-2026-05.md`;
 * this brings Founding GTM in line.
 *
 *   returnTo     = /founding-gtm/
 *   returnLabel  = "Back to Founding GTM"
 *   fromMode     = "room"
 *   fromSurface  = "founding-gtm"
 *
 * Founding GTM's routes are forward navigation out of the terminal kit
 * room (no focusObject — there's no single focused noun to carry), so
 * only the return + provenance params are written.
 */
export function buildFoundingGtmHref(href: string): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    if (!params.get("returnTo")) {
        params.set("returnTo", "/founding-gtm/");
        params.set("returnLabel", "Back to Founding GTM");
        params.set("fromMode", "room");
        params.set("fromSurface", "founding-gtm");
    }
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
}
