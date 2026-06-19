/**
 * Phase 2.1 Wave — cross-room handoff helpers for Welcome.
 *
 * Welcome is the Threshold room — the on-ramp from setup into the
 * first real operating move. Every action stack CTA fans out into a
 * downstream room, and the destination should land with provenance
 * so the back-affordance + analytics are honest.
 *
 * Per `deliverables/audit/continuity-params-2026-05.md`:
 *   returnTo     = /welcome/
 *   returnLabel  = "Back to setup"
 *   focusRoom    = destination room display label
 *   fromMode     = "threshold"
 *   fromSurface  = "welcome"
 *
 * `focusObject` is intentionally omitted — Welcome's action cards
 * are about *what to do next*, not about a specific focused object.
 * The destination room boots into its default state.
 */

export interface WelcomeHandoffOptions {
    readonly href: string;
    readonly roomLabel: string;
    readonly focusObject?: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildWelcomeHref({
    href,
    roomLabel,
    focusObject,
    extra
}: WelcomeHandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/welcome/");
    params.set("returnLabel", "Back to setup");
    if (focusObject) params.set("focusObject", focusObject);
    if (roomLabel) params.set("focusRoom", roomLabel);
    params.set("fromMode", "threshold");
    params.set("fromSurface", "welcome");
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

/**
 * Convenience builders for the four destinations the Welcome action
 * stack routes to (Phase 2.1 baseline). Additional destinations get
 * added per-need as the action engine evolves.
 */
export function hrefToDealWorkspace(): string {
    return buildWelcomeHref({
        href: "/deal-workspace/",
        roomLabel: "Deal Workspace"
    });
}

export function hrefToOutboundStudio(): string {
    return buildWelcomeHref({
        href: "/outbound-studio/",
        roomLabel: "Outbound Studio"
    });
}

export function hrefToQuotaWorkback(): string {
    return buildWelcomeHref({
        href: "/quota-workback/",
        roomLabel: "Quota Workback"
    });
}

export function hrefToSettings(): string {
    return buildWelcomeHref({
        href: "/settings/",
        roomLabel: "Settings"
    });
}

export function hrefToSignalConsole(): string {
    return buildWelcomeHref({
        href: "/signal-console/",
        roomLabel: "Signal Console"
    });
}

export function hrefToIcpStudio(): string {
    return buildWelcomeHref({
        href: "/icp-studio/",
        roomLabel: "ICP Studio"
    });
}

/**
 * Map a bare destination path to the matching continuity-wrapped href.
 * Used by the action engine so it can stay path-based without each
 * action having to know about continuity.
 */
export function hrefForActionDestination(destPath: string): string {
    const [path, qs] = destPath.split("?");
    // An action may carry its own query (e.g. the named-account outbound
    // move routes `/outbound-studio/?account=Deel`). Preserve it, and
    // mirror the account into focusObject so the back-affordance reads
    // the account name.
    const incoming = new URLSearchParams(qs ?? "");
    const account = incoming.get("account")?.trim() || undefined;
    switch (path) {
        case "/deal-workspace/":
            return hrefToDealWorkspace();
        case "/outbound-studio/":
            return account
                ? buildWelcomeHref({
                      href: destPath,
                      roomLabel: "Outbound Studio",
                      focusObject: account
                  })
                : hrefToOutboundStudio();
        case "/quota-workback/":
            return hrefToQuotaWorkback();
        case "/settings/":
            return hrefToSettings();
        case "/signal-console/":
            return hrefToSignalConsole();
        case "/icp-studio/":
            return hrefToIcpStudio();
        default:
            // Unknown destination — return the path with at least the
            // canonical Welcome continuity params attached.
            return buildWelcomeHref({
                href: destPath,
                roomLabel: ""
            });
    }
}
