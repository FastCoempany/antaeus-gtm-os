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
    /** Investor/friend preview code — demo-seed only, desktop only. Unset = off. */
    readonly PREVIEW_CODE?: string;
}

const DEFAULT_GATE_CODE = "741407";
const COOKIE_NAME = "antaeus_gate";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const COMING_SOON_PATH = "/coming-soon.html";
const UNLOCK_PATH = "/_gate/unlock";

// ── The preview lane ────────────────────────────────────────────────
// A second, narrower key for friends / engineers / investors: it opens
// ONLY the enterprise demo seed, never onboarding or auth, and never on
// a phone or tablet. Separate cookie so rotating PREVIEW_CODE kills
// every preview session without touching the founder gate.
const PREVIEW_COOKIE = "antaeus_preview";
// JS-readable flag (no secret in it) so the client can lock onboarding
// in the Ground and force the demo storage namespace in every tab.
const PREVIEW_FLAG_COOKIE = "antaeus_mode";
const PREVIEW_UNLOCK_PATH = "/_preview/unlock";
const PREVIEW_PAGE_PATHS = ["/preview", "/preview/", "/preview.html"];
const PREVIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const PREVIEW_LANDING =
    "/demo-seed.html?autoseed=ent&return=" +
    encodeURIComponent("/dashboard/?demo=1");
// Paths a preview visitor may never reach — the seeding flow + every
// auth/account surface. They bounce to the demo Dashboard.
const PREVIEW_BLOCKED_PREFIXES = [
    "/onboarding",
    "/app/onboarding",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/",
    "/data-migration"
];

export function isMobileUserAgent(ua: string | null): boolean {
    if (!ua) return false;
    return /Mobi|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|Silk|Kindle/i.test(
        ua
    );
}

function previewCode(env: Env): string | null {
    const c = (env.PREVIEW_CODE ?? "").trim();
    return c.length > 0 ? c : null;
}

function isPreviewBlocked(pathname: string): boolean {
    const p = pathname.toLowerCase();
    return PREVIEW_BLOCKED_PREFIXES.some((pre) => p.startsWith(pre));
}

function makePreviewUnlockResponse(
    code: string,
    expected: string,
    mobile: boolean,
    origin: string
): Response {
    if (mobile) {
        return Response.redirect(`${origin}/preview?error=desktop`, 302);
    }
    if (code.trim().toUpperCase() !== expected.toUpperCase()) {
        return Response.redirect(`${origin}/preview?error=1`, 302);
    }
    const headers = new Headers();
    headers.set("Location", `${origin}${PREVIEW_LANDING}`);
    const common = [
        `Path=/`,
        `Max-Age=${PREVIEW_COOKIE_MAX_AGE_SECONDS}`,
        `SameSite=Lax`,
        `Secure`
    ];
    headers.append(
        "Set-Cookie",
        [`${PREVIEW_COOKIE}=${encodeURIComponent(expected)}`, ...common, "HttpOnly"].join("; ")
    );
    headers.append(
        "Set-Cookie",
        [`${PREVIEW_FLAG_COOKIE}=preview`, ...common].join("; ")
    );
    return new Response(null, { status: 302, headers });
}

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

        const ua = request.headers.get("User-Agent");
        const mobile = isMobileUserAgent(ua);
        const pCode = previewCode(env);

        // The preview page itself is always reachable (it explains the
        // desktop-only rule and takes the code).
        if (pCode && PREVIEW_PAGE_PATHS.includes(url.pathname)) {
            return env.ASSETS.fetch(request);
        }
        if (pCode && url.pathname === PREVIEW_UNLOCK_PATH) {
            const code = url.searchParams.get("code") ?? "";
            return makePreviewUnlockResponse(code, pCode, mobile, url.origin);
        }

        // Already unlocked → pass through. CF's html_handling
        // resolves /coming-soon to coming-soon.html natively; the
        // Worker does NOT rewrite (an earlier rewrite to .html caused
        // a redirect loop with auto-trailing-slash bouncing back to
        // /coming-soon).
        const cookieHeader = request.headers.get("Cookie");
        const cookieVal = parseCookie(cookieHeader, COOKIE_NAME);
        if (cookieVal === gateCode(env)) {
            return env.ASSETS.fetch(request);
        }

        // Preview session: demo only, desktop only, no onboarding/auth.
        const previewVal = parseCookie(cookieHeader, PREVIEW_COOKIE);
        if (pCode && previewVal === pCode) {
            if (isStaticAssetPath(url.pathname)) {
                return env.ASSETS.fetch(request);
            }
            if (mobile) {
                return Response.redirect(`${url.origin}/preview?error=desktop`, 302);
            }
            if (url.pathname === "/" || url.pathname === "/index.html") {
                return Response.redirect(`${url.origin}/dashboard/?demo=1`, 302);
            }
            if (isPreviewBlocked(url.pathname)) {
                return Response.redirect(
                    `${url.origin}/dashboard/?demo=1&locked=onboarding`,
                    302
                );
            }
            return env.ASSETS.fetch(request);
        }

        // Coming-soon page itself must be reachable when locked —
        // otherwise we'd loop. Pass through unchanged; CF's
        // html_handling: "auto-trailing-slash" resolves /coming-soon
        // to coming-soon.html in the dist root.
        if (isComingSoonPath(url.pathname)) {
            return env.ASSETS.fetch(request);
        }
        if (isStaticAssetPath(url.pathname)) {
            return env.ASSETS.fetch(request);
        }

        // Everything else → bounce to coming-soon with the original
        // path preserved in ?next= for round-trip after unlock. We
        // redirect to /coming-soon (without .html) because CF's
        // auto-trailing-slash normalizes .html URLs back to bare
        // paths anyway — sending .html here would force an extra
        // 301 hop in the browser.
        const next = encodeURIComponent(url.pathname + url.search);
        return Response.redirect(
            `${url.origin}/coming-soon?next=${next}`,
            302
        );
    }
};
