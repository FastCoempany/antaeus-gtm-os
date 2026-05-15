import type { JSX } from "preact";

/**
 * Wordmark — global brand chrome.
 *
 * Per canon Part II §1 (bright direction lock) + Part II §2 (typography
 * lock): serif name, mono kicker. Sits in the top-left of every operating
 * room. Click → routes to "/" (the smart router, which sends authenticated
 * users to /dashboard/ and unauthenticated users to /start.html).
 *
 * The optional `kicker` slot names the room context (e.g. "DEAL WORKSPACE",
 * "SIGNAL CONSOLE"). Falls back to "OPERATING ROOM" when omitted — usable
 * for rooms that don't want a category tag.
 *
 * Usage:
 *
 *     <Wordmark kicker="DEAL WORKSPACE" />
 *
 * If a workspace name is known (post-auth), pass it through `workspace`:
 *
 *     <Wordmark kicker="DASHBOARD" workspace="Antaeus" />
 */

export interface WordmarkProps {
    readonly kicker?: string;
    readonly workspace?: string | null;
    /** Override the click destination. Defaults to "/". */
    readonly homeHref?: string;
}

export function Wordmark(props: WordmarkProps): JSX.Element {
    const kicker = props.kicker ?? "OPERATING ROOM";
    const home = props.homeHref ?? "/";
    const workspace = (props.workspace ?? "").trim();

    return (
        <a class="ant-wordmark" href={home} aria-label="Antaeus — home">
            <span class="ant-wordmark__mark">ANTAEUS</span>
            <span class="ant-wordmark__divider" aria-hidden="true">·</span>
            <span class="ant-wordmark__kicker">{kicker}</span>
            {workspace ? (
                <>
                    <span
                        class="ant-wordmark__divider"
                        aria-hidden="true"
                    >
                        ·
                    </span>
                    <span class="ant-wordmark__workspace">{workspace}</span>
                </>
            ) : null}
        </a>
    );
}
