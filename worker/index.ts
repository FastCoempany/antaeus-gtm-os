/**
 * Antaeus app gate — Cloudflare Worker middleware.
 *
 * Sits in front of the static-asset binding. Every request hits here
 * first. If the visitor hasn't unlocked the gate, they get bounced to
 * `/coming-soon.html`. Otherwise the request passes through to the
 * existing dist/ assets unchanged.
 *
 * Unlock flow:
 *   1. Visitor submits the code form on coming-soon.html
 *   2. Browser navigates to `/_gate/unlock?code=...&next=...`
 *   3. Worker validates code === GATE_CODE
 *   4. On match: set `antaeus_gate` cookie, redirect to `next` (default /)
 *   5. On miss: redirect back to coming-soon.html with `?error=1`
 *
 * To disable the gate later: set `GATE_ENABLED=false` in wrangler.jsonc
 * `vars` and redeploy. No code change required.
 *
 * To rotate the code: change `GATE_CODE` in wrangler.jsonc `vars` and
 * redeploy. Existing unlocked sessions invalidate immediately (cookie
 * value compared against the new code).
 */

interface Env {
    readonly ASSETS: Fetcher;
    readonly GATE_ENABLED?: string;
    readonly GATE_CODE?: string;
}

const DEFAULT_GATE_CODE = "741407";
const COOKIE_NAME = "antaeus_gate";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const COMING_SOON_PATH = "/coming-soon.html";
const UNLOCK_PATH = "/_gate/unlock";

function isGateEnabled(env: Env): boolean {
    // Default ON. Setting GATE_ENABLED="false" in wrangler vars disables.
    return env.GATE_ENABLED !== "false";
}

function gateCode(env: Env): string {
    return env.GATE_CODE && env.GATE_CODE.length > 0
        ? env.GATE_CODE
        : DEFAULT_GATE_CODE;
}

function parseCookie(header: string | null, name: string): string | null {
    if (!header) return null;
    const parts = header.split(/;\s*/);
    for (const part of parts) {
        const eq = part.indexOf("=");
        if (eq === -1) continue;
        if (part.slice(0, eq).trim() === name) {
            return decodeURIComponent(part.slice(eq + 1));
        }
    }
    return null;
}

function isStaticAssetPath(pathname: string): boolean {
    return (
        pathname.startsWith("/css/") ||
        pathname.startsWith("/js/") ||
        pathname.startsWith("/fonts/") ||
        pathname.startsWith("/assets/") ||
        /\.(?:css|js|map|png|jpe?g|gif|svg|webp|woff2?|ttf|ico|json|txt|xml)$/i.test(
            pathname
        )
    );
}

function isComingSoonPath(pathname: string): boolean {
    return (
        pathname === COMING_SOON_PATH ||
        pathname === "/coming-soon" ||
        pathname === "/coming-soon/"
    );
}

function makeUnlockResponse(
    code: string,
    nextPath: string,
    expectedCode: string,
    origin: string
): Response {
    if (code !== expectedCode) {
        return Response.redirect(`${origin}${COMING_SOON_PATH}?error=1`, 302);
    }
    const headers = new Headers();
    headers.set("Location", `${origin}${nextPath || "/"}`);
    headers.set(
        "Set-Cookie",
        [
            `${COOKIE_NAME}=${encodeURIComponent(expectedCode)}`,
            `Path=/`,
            `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
            `HttpOnly`,
            `SameSite=Lax`,
            `Secure`
        ].join("; ")
    );
    return new Response(null, { status: 302, headers });
}

function isSafeNextPath(next: string): boolean {
    // Only allow relative paths that start with `/` and don't try to
    // escape to another origin. Reject protocol-relative `//evil.com`
    // and absolute URLs.
    if (!next.startsWith("/")) return false;
    if (next.startsWith("//")) return false;
    return true;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // Gate disabled → pass everything through.
        if (!isGateEnabled(env)) {
            return env.ASSETS.fetch(request);
        }

        // Unlock endpoint: validate code, set cookie, redirect.
        if (url.pathname === UNLOCK_PATH) {
            const code = url.searchParams.get("code") ?? "";
            const next = url.searchParams.get("next") ?? "/";
            const safeNext = isSafeNextPath(next) ? next : "/";
            return makeUnlockResponse(code, safeNext, gateCode(env), url.origin);
        }

        // Already unlocked → pass through.
        const cookieHeader = request.headers.get("Cookie");
        const cookieVal = parseCookie(cookieHeader, COOKIE_NAME);
        if (cookieVal === gateCode(env)) {
            return env.ASSETS.fetch(request);
        }

        // Coming-soon page itself + its assets must be reachable when
        // locked — otherwise we'd loop or render a blank page.
        if (isComingSoonPath(url.pathname)) {
            return env.ASSETS.fetch(request);
        }
        if (isStaticAssetPath(url.pathname)) {
            return env.ASSETS.fetch(request);
        }

        // Everything else → bounce to coming-soon with the original path
        // preserved in ?next= for round-trip after unlock.
        const next = encodeURIComponent(url.pathname + url.search);
        return Response.redirect(
            `${url.origin}${COMING_SOON_PATH}?next=${next}`,
            302
        );
    }
};
